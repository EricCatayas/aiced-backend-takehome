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


