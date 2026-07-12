alter table public.evaluation_assignments
  drop constraint evaluation_assignments_application_id_fkey,
  add constraint evaluation_assignments_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade;

create function public.admin_reactivate_profile(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform public.require_admin();

  update public.profiles
  set is_active = true, deactivated_at = null
  where id = p_profile_id and not is_active;

  if not found then
    raise exception 'Inactive profile is unavailable' using errcode = 'P0001';
  end if;
end;
$$;

create function public.admin_delete_application(p_application_id uuid)
returns text[] language plpgsql security definer set search_path = public
as $$
declare
  attachment_paths text[];
begin
  perform public.require_admin();

  select coalesce(array_agg(storage_path order by storage_path), array[]::text[])
  into attachment_paths
  from public.application_attachments
  where application_id = p_application_id;

  delete from public.applications where id = p_application_id;

  if not found then
    raise exception 'Application is unavailable' using errcode = 'P0001';
  end if;

  return attachment_paths;
end;
$$;

revoke all on function public.admin_reactivate_profile(uuid) from public;
revoke all on function public.admin_delete_application(uuid) from public;
grant execute on function public.admin_reactivate_profile(uuid) to authenticated;
grant execute on function public.admin_delete_application(uuid) to authenticated;
