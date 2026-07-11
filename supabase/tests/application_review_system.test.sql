begin;

select plan(2);

select has_table('public', 'applications', 'applications table exists');
select has_column('public', 'profiles', 'is_active', 'profiles store access activity');

select * from finish();

rollback;
