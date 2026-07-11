alter table public.profiles
  add column is_active boolean not null default true,
  add column deactivated_at timestamptz;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.get_my_review_assignments()
returns table (
  id uuid, applicant_name text, category_name text, category_instructions text,
  category_sort_order integer, status public.assignment_status, score smallint,
  comment text, assigned_at timestamptz, submitted_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select a.id, p.applicant_name, c.name, c.instructions, c.sort_order,
    a.status, a.score, a.comment, a.assigned_at, a.submitted_at
  from public.evaluation_assignments a
  join public.applications p on p.id = a.application_id
  join public.evaluation_categories c on c.id = a.category_id
  join public.profiles reviewer on reviewer.id = a.reviewer_id
  where a.reviewer_id = auth.uid() and reviewer.is_active
  order by (a.status = 'pending') desc, c.sort_order, p.applicant_name;
$$;

create or replace function public.submit_evaluation(p_assignment_id uuid, p_score smallint, p_comment text)
returns public.evaluation_assignments language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  if p_score not between 0 and 10 then raise exception 'Score must be between 0 and 10' using errcode = '22023'; end if;
  update public.evaluation_assignments
  set score = p_score, comment = coalesce(p_comment, ''), status = 'completed', submitted_at = now()
  where id = p_assignment_id and reviewer_id = auth.uid() and status = 'pending'
    and exists (select 1 from public.profiles where id = auth.uid() and is_active)
  returning * into result;
  if result.id is null then raise exception 'Assignment is unavailable' using errcode = 'P0001'; end if;
  return result;
end;
$$;

drop function public.admin_list_reviewers();

create function public.admin_list_reviewers()
returns table (id uuid, email text, display_name text, role public.app_role, is_active boolean, pending_count bigint, completed_count bigint)
language sql stable security definer set search_path = public
as $$
  select p.id, p.email, p.display_name, p.role, p.is_active,
    count(a.id) filter (where a.status = 'pending'), count(a.id) filter (where a.status = 'completed')
  from public.profiles p left join public.evaluation_assignments a on a.reviewer_id = p.id
  group by p.id, p.email, p.display_name, p.role, p.is_active
  having public.is_admin()
  order by p.is_active desc, p.role, coalesce(p.display_name, p.email), p.email;
$$;

create or replace function public.admin_create_assignment(p_application_id uuid, p_category_id uuid, p_reviewer_id uuid)
returns public.evaluation_assignments language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  perform public.require_admin();
  if not exists (select 1 from public.applications where id = p_application_id and delivery_status = 'sent') then raise exception 'Application is not available for assignment' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.evaluation_categories where id = p_category_id and is_active) then raise exception 'Category is not active' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_reviewer_id and role = 'reviewer' and is_active) then raise exception 'Reviewer is not available' using errcode = 'P0001'; end if;
  insert into public.evaluation_assignments (application_id, category_id, reviewer_id) values (p_application_id, p_category_id, p_reviewer_id) returning * into result;
  return result;
end;
$$;

create or replace function public.admin_reassign_assignment(p_assignment_id uuid, p_reviewer_id uuid)
returns public.evaluation_assignments language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  perform public.require_admin();
  if not exists (select 1 from public.profiles where id = p_reviewer_id and role = 'reviewer' and is_active) then raise exception 'Reviewer is not available' using errcode = 'P0001'; end if;
  update public.evaluation_assignments set reviewer_id = p_reviewer_id where id = p_assignment_id and status = 'pending' returning * into result;
  if result.id is null then raise exception 'Pending assignment is unavailable' using errcode = 'P0001'; end if;
  return result;
end;
$$;

create function public.admin_deactivate_profile(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare target_role public.app_role;
begin
  perform public.require_admin();
  select role into target_role from public.profiles where id = p_profile_id and is_active;
  if target_role is null then raise exception 'Active profile is unavailable' using errcode = 'P0001'; end if;
  if target_role = 'admin' and (select count(*) from public.profiles where role = 'admin' and is_active) <= 1 then raise exception 'At least one active admin is required' using errcode = 'P0001'; end if;
  update public.profiles set is_active = false, deactivated_at = now() where id = p_profile_id;
end;
$$;

revoke all on function public.admin_deactivate_profile(uuid) from public;
grant execute on function public.admin_deactivate_profile(uuid) to authenticated;
