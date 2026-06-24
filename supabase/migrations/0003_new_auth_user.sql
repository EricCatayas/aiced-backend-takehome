-- New auth user for testing purposes in postman
insert into users (id, email)
values ('new-auth-id', 'alice-auth@acme.test')
on conflict (id) do nothing;

insert into memberships (user_id, group_id)
values ('new-auth-id', '11111111-1111-1111-1111-111111111111')
on conflict (user_id, group_id) do nothing;