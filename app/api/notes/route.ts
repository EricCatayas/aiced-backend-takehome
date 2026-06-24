import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase";

const CreateNoteSchema = z.object({
  group_id: z.string().uuid(),
  body: z.string().min(1),
});

/**
 * GET /api/notes
 * Returns the notes the caller is allowed to see.
 *
 * Uses the caller's session (anon key + their JWT) so the `notes` RLS policy
 * is applied automatically — no tenant filtering in application code.
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("notes")
    .select("id, group_id, author_id, body, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}

/**
 * POST /api/notes
 * Creates a new note. Validates input with zod and relies on RLS to enforce
 * that the caller may only insert into groups they belong to.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createUserClient(req);

  // author_id is not taken from the request body — the RLS policy enforces
  // author_id = auth.uid(), so we let the DB set it via the authenticated user.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      group_id: parsed.data.group_id,
      author_id: user.id,
      body: parsed.data.body,
    })
    .select()
    .single();

  if (error) {
    // RLS violation or FK constraint returns a Postgres error
    const status = error.code === "42501" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
