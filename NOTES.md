# Notes

## RLS Approach

The `notes` table has Row-Level Security enabled as per requirement.
The `SELECT` policy uses an `EXISTS` subquery in the `memberships` table, checking that `auth.uid()` has a row matching the note's `group_id`.
This means a user can only see notes to groups they are a member of.
The `INSERT` policy applies the same membership check via `WITH CHECK`, and compares if the note's author is the authorized user (i.e.`author_id = auth.uid()`).
The `author_id` is resolved server-side from `supabase.getUser()` function rather than taken from the request body for security.
Zod validates the request body on `POST`, returning a `400` error response if `group_id` is not a valid UUID or `body` is empty.


## How I Used AI

I started with asking ChatGPT what RLS is and how Supabase can support RLS.
I used GitHub Copilot as a pair programmer throughout this task. I shared the README and asked it to walk me through the step-by-step approach before writing any code, which helped me gain an overview of the task implementation.
After I created a Supabase account, I then proceeded to the implementation of the tasks step-by-step. From the creating new SQL migration scripts, to the API route implementation, to setting up PostMan requests to test the notes api, and finally writing the test cases.


## Call the notes route:
Step 1: Start the dev server
Step 2: Create a test user in Supabase Auth
Then run this SQL in Supabase's SQL editor to add them to memberships with their real auth UID:
```sql
-- Replace <real-auth-uid> with the UUID from the Auth dashboard
insert into users (id, email) values ('<real-auth-uid>', 'alice-auth@acme.test')
  on conflict do nothing;
insert into memberships (user_id, group_id) values
  ('<real-auth-uid>', '11111111-1111-1111-1111-111111111111');
```
Step 3 Get a JWT Token by making a POST to Supabase's auth endpoint:
POST https://<your-project-ref>.supabase.co/auth/v1/token?grant_type=password
Headers:
apikey: <your-anon-key>
Content-Type: application/json
Body:
{
  "email": "alice-auth@acme.test",
  "password": "yourpassword"
}
Step 4: Call your notes:
GET http://localhost:3000/api/notes
Authorization: Bearer <access_token>

POST /api/notes
POST http://localhost:3000/api/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "group_id": "11111111-1111-1111-1111-111111111111",
  "body": "My first note"
}