import { describe, it, expect, afterAll } from "vitest";
import { asUser, asOwner, pool, ALICE, BOB, CAROL, ACME, GLOBEX } from "./helpers";

/**
 * Tests to verify if `notes` RLS policies enforce tenant isolation.
 *
 * Seeded users:
 *   ALICE → Acme only
 *   BOB   → Globex only
 *   CAROL → Acme + Globex (both)
 */
describe("notes — tenant isolation", () => {
  it("alice can insert and read notes in her own group (Acme)", async () => {
    const rows = await asUser(ALICE, async (q) => {
      await q(
        "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
        [ACME, ALICE, "Alice's Acme note"]
      );
      return (await q("select body from notes where group_id = $1", [ACME])).rows;
    });
    expect(rows.some((r) => r.body === "Alice's Acme note")).toBe(true);
  });

  it("bob cannot read Acme notes", async () => {
    // Seed as owner (bypasses RLS) so the row is committed and visible
    await asOwner(
      "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
      [ACME, ALICE, "Acme secret — bob should not see this"]
    );

    const rows = await asUser(BOB, async (q) =>
      (await q("select body from notes where group_id = $1", [ACME])).rows
    );
    expect(rows).toHaveLength(0);

    await asOwner("delete from notes where body = $1", [
      "Acme secret — bob should not see this",
    ]);
  });

  it("bob cannot insert a note into Acme", async () => {
    await expect(
      asUser(BOB, async (q) =>
        q(
          "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
          [ACME, BOB, "Bob sneaking into Acme"]
        )
      )
    ).rejects.toThrow();
  });

  it("bob cannot use alice credentials when inserting into Globex", async () => {
    await expect(
      asUser(BOB, async (q) =>
        q(
          "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
          [GLOBEX, ALICE, "Bob using Alice's credentials to sneak into Globex"]
        )
      )
    ).rejects.toThrow();
  });

  it("carol can read notes from both Acme and Globex", async () => {
    await asOwner(
      "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
      [ACME, ALICE, "Acme note visible to carol"]
    );
    await asOwner(
      "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
      [GLOBEX, BOB, "Globex note visible to carol"]
    );

    const rows = await asUser(CAROL, async (q) =>
      (await q("select body from notes")).rows
    );

    expect(rows.some((r) => r.body === "Acme note visible to carol")).toBe(true);
    expect(rows.some((r) => r.body === "Globex note visible to carol")).toBe(true);

    await asOwner(
      "delete from notes where body in ($1, $2)",
      ["Acme note visible to carol", "Globex note visible to carol"]
    );
  });

  it("alice cannot read Globex notes", async () => {
    await asOwner(
      "insert into notes (group_id, author_id, body) values ($1, $2, $3)",
      [GLOBEX, BOB, "Globex secret — alice should not see this"]
    );

    const rows = await asUser(ALICE, async (q) =>
      (await q("select body from notes where group_id = $1", [GLOBEX])).rows
    );
    expect(rows).toHaveLength(0);

    await asOwner("delete from notes where body = $1", [
      "Globex secret — alice should not see this",
    ]);
  });

  afterAll(async () => {
    await pool.end();
  });
});
