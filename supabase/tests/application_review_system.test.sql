begin;

select plan(6);

select has_table('public', 'applications', 'applications table exists');
select has_column('public', 'profiles', 'is_active', 'profiles store access activity');
select has_table('public', 'application_attachments', 'application attachments table exists');
select has_column('public', 'application_attachments', 'storage_path', 'attachments store private object paths');
select has_function('public', 'admin_get_application_export', array['uuid'], 'admin export function exists');
select is(
  (select public from storage.buckets where id = 'application-attachments'),
  false,
  'application attachment bucket is private'
);

select * from finish();

rollback;
