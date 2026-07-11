create or replace function public.admin_create_assignment(p_application_id uuid, p_category_id uuid, p_reviewer_id uuid)
returns public.evaluation_assignments language plpgsql security definer set search_path = public
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
  if not exists (select 1 from public.profiles where id = p_reviewer_id and is_active) then
    raise exception 'Reviewer is not available' using errcode = 'P0001';
  end if;
  insert into public.evaluation_assignments (application_id, category_id, reviewer_id)
  values (p_application_id, p_category_id, p_reviewer_id)
  returning * into result;
  return result;
end;
$$;

create or replace function public.admin_reassign_assignment(p_assignment_id uuid, p_reviewer_id uuid)
returns public.evaluation_assignments language plpgsql security definer set search_path = public
as $$
declare result public.evaluation_assignments;
begin
  perform public.require_admin();
  if not exists (select 1 from public.profiles where id = p_reviewer_id and is_active) then
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

revoke all on function public.admin_create_assignment(uuid, uuid, uuid) from public;
revoke all on function public.admin_reassign_assignment(uuid, uuid) from public;
grant execute on function public.admin_create_assignment(uuid, uuid, uuid) to authenticated;
grant execute on function public.admin_reassign_assignment(uuid, uuid) to authenticated;
