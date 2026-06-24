-- ===========================================================================
-- Migration 0002: notes table with tenant-scoped RLS
--
-- A user may read and create notes ONLY for groups they belong to.
-- This is enforced entirely in the RLS policies via the `memberships` table.
-- ===========================================================================

create table notes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert on notes to authenticated;

alter table notes enable row level security;

-- SELECT: a user may only see notes that belong to a group they are a member of.
create policy "members can only read their group notes"
  on notes for select
  to authenticated
  using (
    exists (
      select 1 from memberships
      where memberships.user_id  = auth.uid()
        and memberships.group_id = notes.group_id
    )
  );

-- INSERT: a user may only create notes in groups they belong to,
-- and must be the author (prevents writing on behalf of another user).
create policy "members can only insert notes into their groups"
  on notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from memberships
      where memberships.user_id  = auth.uid()
        and memberships.group_id = notes.group_id
    )
  );
