-- New auth user for testing purposes in postman
insert into users (id, email)
values ('442cf39c-9014-4642-88ef-75a83b57d938', 'alice-auth@acme.test')
on conflict (id) do nothing;

insert into memberships (user_id, group_id)
values ('442cf39c-9014-4642-88ef-75a83b57d938', '11111111-1111-1111-1111-111111111111')
on conflict (user_id, group_id) do nothing;