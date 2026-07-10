begin;

select plan(1);

select has_table('public', 'applications', 'applications table exists');

select * from finish();

rollback;
