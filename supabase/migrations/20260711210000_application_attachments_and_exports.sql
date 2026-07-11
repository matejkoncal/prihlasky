create table public.application_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null check (kind in ('cv', 'motivation_letter')),
  original_filename text not null check (length(trim(original_filename)) between 1 and 200),
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 3145728),
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  created_at timestamptz not null default now(),
  unique (application_id, kind)
);

alter table public.application_attachments enable row level security;
revoke all on table public.application_attachments from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-attachments',
  'application-attachments',
  false,
  3145728,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop function public.admin_list_applications();

create function public.admin_list_applications()
returns table (
  id uuid,
  applicant_name text,
  class_name text,
  field_of_study text,
  submitted_at timestamptz,
  attachments jsonb,
  categories jsonb
)
language sql stable security definer set search_path = public
as $$
  select p.id,
    p.applicant_name,
    coalesce(
      nullif(p.form_data ->> 'className', ''),
      split_part(p.form_data ->> 'classField', ' – ', 1)
    ) as class_name,
    coalesce(
      nullif(p.form_data ->> 'fieldOfStudy', ''),
      case
        when strpos(p.form_data ->> 'classField', ' – ') > 0
          then substr(
            p.form_data ->> 'classField',
            strpos(p.form_data ->> 'classField', ' – ') + length(' – ')
          )
        else ''
      end
    ) as field_of_study,
    p.submitted_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', attachment.kind,
        'original_filename', attachment.original_filename
      ) order by attachment.kind)
      from public.application_attachments attachment
      where attachment.application_id = p.id
    ), '[]'::jsonb) as attachments,
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
    ) order by c.sort_order) as categories
  from public.applications p
  cross join public.evaluation_categories c
  left join public.evaluation_assignments a
    on a.application_id = p.id and a.category_id = c.id
  left join public.profiles r on r.id = a.reviewer_id
  where p.delivery_status = 'sent' and c.is_active
  group by p.id, p.applicant_name, p.form_data, p.submitted_at
  having public.is_admin()
  order by p.submitted_at desc;
$$;

create function public.admin_get_application_export(p_application_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  application_record public.applications;
  completed_count integer;
  result jsonb;
begin
  perform public.require_admin();

  select * into application_record
  from public.applications
  where id = p_application_id and delivery_status = 'sent';

  if application_record.id is null then
    raise exception 'Application is unavailable' using errcode = 'P0001';
  end if;

  select count(*) into completed_count
  from public.evaluation_assignments assignment
  join public.evaluation_categories category on category.id = assignment.category_id
  where assignment.application_id = p_application_id
    and assignment.status = 'completed'
    and category.is_active;

  if completed_count <> 5 then
    raise exception 'Application evaluation is incomplete' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'applicantName', application_record.applicant_name,
    'className', coalesce(
      nullif(application_record.form_data ->> 'className', ''),
      split_part(application_record.form_data ->> 'classField', ' – ', 1)
    ),
    'fieldOfStudy', coalesce(
      nullif(application_record.form_data ->> 'fieldOfStudy', ''),
      case
        when strpos(application_record.form_data ->> 'classField', ' – ') > 0
          then substr(
            application_record.form_data ->> 'classField',
            strpos(application_record.form_data ->> 'classField', ' – ') + length(' – ')
          )
        else ''
      end
    ),
    'categories', jsonb_agg(jsonb_build_object(
      'categoryName', category.name,
      'reviewerName', coalesce(nullif(reviewer.display_name, ''), reviewer.email),
      'score', assignment.score,
      'comment', assignment.comment
    ) order by category.sort_order)
  ) into result
  from public.evaluation_assignments assignment
  join public.evaluation_categories category on category.id = assignment.category_id
  join public.profiles reviewer on reviewer.id = assignment.reviewer_id
  where assignment.application_id = p_application_id
    and assignment.status = 'completed'
    and category.is_active;

  return result;
end;
$$;

revoke all on function public.admin_list_applications() from public;
revoke all on function public.admin_get_application_export(uuid) from public;
grant execute on function public.admin_list_applications() to authenticated;
grant execute on function public.admin_get_application_export(uuid) to authenticated;
