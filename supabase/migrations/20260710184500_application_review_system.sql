create type public.app_role as enum ('admin', 'reviewer');
create type public.application_delivery_status as enum ('pending', 'sent', 'failed');
create type public.assignment_status as enum ('pending', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.app_role not null default 'reviewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null check (length(trim(applicant_name)) > 0),
  form_data jsonb not null,
  delivery_status public.application_delivery_status not null default 'pending',
  delivery_error text,
  submitted_at timestamptz not null default now(),
  email_sent_at timestamptz,
  check ((delivery_status = 'sent') = (email_sent_at is not null)),
  check (delivery_status <> 'sent' or delivery_error is null)
);

create table public.evaluation_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(trim(name)) > 0),
  instructions text not null default '',
  sort_order integer not null unique check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.evaluation_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  category_id uuid not null references public.evaluation_categories(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  status public.assignment_status not null default 'pending',
  score smallint,
  comment text not null default '',
  assigned_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, category_id),
  check (score is null or score between 0 and 10),
  check (
    (status = 'pending' and score is null and submitted_at is null)
    or (status = 'completed' and score is not null and submitted_at is not null)
  )
);

insert into public.evaluation_categories (slug, name, instructions, sort_order)
values
  ('category-1', 'Kategória 1', '', 1),
  ('category-2', 'Kategória 2', '', 2),
  ('category-3', 'Kategória 3', '', 3),
  ('category-4', 'Kategória 4', '', 4),
  ('category-5', 'Kategória 5', '', 5);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_evaluation_assignments_updated_at
before update on public.evaluation_assignments
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.evaluation_categories enable row level security;
alter table public.evaluation_assignments enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Admins can read profiles"
on public.profiles for select to authenticated
using (public.is_admin());

create policy "Admins can read applications"
on public.applications for select to authenticated
using (public.is_admin());

create policy "Admins can read categories"
on public.evaluation_categories for select to authenticated
using (public.is_admin());

create policy "Reviewers can read own assignments"
on public.evaluation_assignments for select to authenticated
using (reviewer_id = auth.uid());

create policy "Admins can read assignments"
on public.evaluation_assignments for select to authenticated
using (public.is_admin());

create function public.get_my_review_assignments()
returns table (
  id uuid,
  applicant_name text,
  category_name text,
  category_instructions text,
  category_sort_order integer,
  status public.assignment_status,
  score smallint,
  comment text,
  assigned_at timestamptz,
  submitted_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select a.id, p.applicant_name, c.name, c.instructions, c.sort_order,
    a.status, a.score, a.comment, a.assigned_at, a.submitted_at
  from public.evaluation_assignments a
  join public.applications p on p.id = a.application_id
  join public.evaluation_categories c on c.id = a.category_id
  where a.reviewer_id = auth.uid()
  order by (a.status = 'pending') desc, c.sort_order, p.applicant_name;
$$;

create function public.submit_evaluation(
  p_assignment_id uuid,
  p_score smallint,
  p_comment text
)
returns public.evaluation_assignments
language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  if p_score not between 0 and 10 then
    raise exception 'Score must be between 0 and 10' using errcode = '22023';
  end if;

  update public.evaluation_assignments
  set score = p_score,
    comment = coalesce(p_comment, ''),
    status = 'completed',
    submitted_at = now()
  where id = p_assignment_id
    and reviewer_id = auth.uid()
    and status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'Assignment is unavailable' using errcode = 'P0001';
  end if;

  return result;
end;
$$;

create function public.require_admin()
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_list_applications()
returns table (
  id uuid,
  applicant_name text,
  submitted_at timestamptz,
  categories jsonb
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.applicant_name, p.submitted_at,
    jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'instructions', c.instructions,
      'sort_order', c.sort_order,
      'assignment_id', a.id,
      'reviewer_id', a.reviewer_id,
      'reviewer_name', r.display_name,
      'reviewer_email', r.email,
      'status', a.status,
      'score', a.score,
      'comment', a.comment,
      'submitted_at', a.submitted_at
    ) order by c.sort_order)
  from public.applications p
  cross join public.evaluation_categories c
  left join public.evaluation_assignments a on a.application_id = p.id and a.category_id = c.id
  left join public.profiles r on r.id = a.reviewer_id
  where p.delivery_status = 'sent' and c.is_active
  group by p.id, p.applicant_name, p.submitted_at
  having public.is_admin()
  order by p.submitted_at desc;
$$;

create function public.admin_list_reviewers()
returns table (
  id uuid,
  email text,
  display_name text,
  pending_count bigint,
  completed_count bigint
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.email, p.display_name,
    count(a.id) filter (where a.status = 'pending'),
    count(a.id) filter (where a.status = 'completed')
  from public.profiles p
  left join public.evaluation_assignments a on a.reviewer_id = p.id
  where p.role = 'reviewer'
  group by p.id, p.email, p.display_name
  having public.is_admin()
  order by coalesce(p.display_name, p.email), p.email;
$$;

create function public.admin_create_assignment(
  p_application_id uuid,
  p_category_id uuid,
  p_reviewer_id uuid
)
returns public.evaluation_assignments
language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  perform public.require_admin();
  if not exists (select 1 from public.applications where id = p_application_id and delivery_status = 'sent') then
    raise exception 'Application is not available for assignment' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.evaluation_categories where id = p_category_id and is_active) then
    raise exception 'Category is not active' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_reviewer_id and role = 'reviewer') then
    raise exception 'Reviewer is not available' using errcode = 'P0001';
  end if;
  insert into public.evaluation_assignments (application_id, category_id, reviewer_id)
  values (p_application_id, p_category_id, p_reviewer_id)
  returning * into result;
  return result;
end;
$$;

create function public.admin_reassign_assignment(
  p_assignment_id uuid,
  p_reviewer_id uuid
)
returns public.evaluation_assignments
language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  perform public.require_admin();
  if not exists (select 1 from public.profiles where id = p_reviewer_id and role = 'reviewer') then
    raise exception 'Reviewer is not available' using errcode = 'P0001';
  end if;
  update public.evaluation_assignments
  set reviewer_id = p_reviewer_id
  where id = p_assignment_id and status = 'pending'
  returning * into result;
  if result.id is null then
    raise exception 'Pending assignment is unavailable' using errcode = 'P0001';
  end if;
  return result;
end;
$$;

create function public.admin_remove_assignment(p_assignment_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform public.require_admin();
  delete from public.evaluation_assignments
  where id = p_assignment_id and status = 'pending';
  if not found then
    raise exception 'Pending assignment is unavailable' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.require_admin() from public;
revoke all on function public.get_my_review_assignments() from public;
revoke all on function public.submit_evaluation(uuid, smallint, text) from public;
revoke all on function public.admin_list_applications() from public;
revoke all on function public.admin_list_reviewers() from public;
revoke all on function public.admin_create_assignment(uuid, uuid, uuid) from public;
revoke all on function public.admin_reassign_assignment(uuid, uuid) from public;
revoke all on function public.admin_remove_assignment(uuid) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_my_review_assignments() to authenticated;
grant execute on function public.submit_evaluation(uuid, smallint, text) to authenticated;
grant execute on function public.admin_list_applications() to authenticated;
grant execute on function public.admin_list_reviewers() to authenticated;
grant execute on function public.admin_create_assignment(uuid, uuid, uuid) to authenticated;
grant execute on function public.admin_reassign_assignment(uuid, uuid) to authenticated;
grant execute on function public.admin_remove_assignment(uuid) to authenticated;
