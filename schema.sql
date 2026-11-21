-- Sổ Lộ Trình Học Sinh – Supabase schema (chạy một lần trong SQL Editor)
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists docs_student_idx on public.docs ((data->>'studentId'));
create table if not exists public.teachers (
  uid uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.docs enable row level security;
alter table public.teachers enable row level security;

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where uid = auth.uid());
$$;

drop policy if exists "teacher full access" on public.docs;
create policy "teacher full access" on public.docs for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher reads self" on public.teachers;
create policy "teacher reads self" on public.teachers for select to authenticated using (uid = auth.uid());

-- Tài khoản đăng nhập đầu tiên gọi hàm này sẽ thành giáo viên; sau đó không ai khác nhận được quyền.
create or replace function public.claim_teacher() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.teachers where uid = auth.uid()) then return true; end if;
  if exists (select 1 from public.teachers) then return false; end if;
  insert into public.teachers(uid) values (auth.uid());
  return true;
end $$;

-- ===== Học sinh: chỉ truy cập qua mã, thông qua các hàm dưới đây =====
create or replace function public._student_id(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select id from public.docs
  where col = 'students' and upper(data->>'code') = upper(trim(coalesce(p_code, '')))
    and coalesce((data->>'archived')::boolean, false) = false
  limit 1;
$$;

create or replace function public._lesson_visible(d jsonb, sid text) returns boolean
language sql immutable as $$
  select case when jsonb_typeof(d->'studentIds') = 'array' and jsonb_array_length(d->'studentIds') > 0
              then (d->'studentIds') ? sid else true end
$$;

create or replace function public.student_bundle(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare sid text;
begin
  sid := public._student_id(p_code);
  if sid is null then perform pg_sleep(0.6); return null; end if;
  return jsonb_build_object(
    'students', (select jsonb_object_agg(id, data - 'note') from public.docs where col = 'students' and id = sid),
    'tasks',    coalesce((select jsonb_object_agg(id, data) from public.docs where col = 'tasks' and data->>'studentId' = sid), '{}'::jsonb),
    'sessions', coalesce((select jsonb_object_agg(id, data - 'note') from public.docs where col = 'sessions' and data->>'studentId' = sid), '{}'::jsonb),
    'notes',    coalesce((select jsonb_object_agg(id, data) from public.docs where col = 'notes' and data->>'studentId' = sid), '{}'::jsonb),
    'subs',     coalesce((select jsonb_object_agg(s.id, s.data) from public.docs s
                  join public.docs t on t.col = 'tasks' and t.id = s.id and t.data->>'studentId' = sid
                  where s.col = 'subs'), '{}'::jsonb),
    'weekly',   coalesce((select jsonb_object_agg(id, data) from public.docs
                  where col = 'weekly' and data->>'weekStart' <= to_char((now() at time zone 'Asia/Bangkok')::date, 'YYYY-MM-DD')), '{}'::jsonb),
    'lessons',  coalesce((select jsonb_object_agg(id, (data - 'pages') || jsonb_build_object('pageCount', case when jsonb_typeof(data->'pages') = 'array' then jsonb_array_length(data->'pages') else 0 end))
                  from public.docs where col = 'lessons' and public._lesson_visible(data, sid)), '{}'::jsonb)
  );
end $$;

create or replace function public.student_lesson(p_code text, p_id text, p_since timestamptz default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare sid text; r record;
begin
  sid := public._student_id(p_code);
  if sid is null then perform pg_sleep(0.6); return null; end if;
  select data, updated_at into r from public.docs where col = 'lessons' and id = p_id and public._lesson_visible(data, sid);
  if not found then return null; end if;
  if p_since is not null and r.updated_at <= p_since then return jsonb_build_object('u', r.updated_at); end if;
  return jsonb_build_object('u', r.updated_at, 'data', r.data);
end $$;

create or replace function public.student_submit(p_code text, p_task text, p_text text, p_score int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare sid text;
begin
  sid := public._student_id(p_code);
  if sid is null then perform pg_sleep(0.6); return false; end if;
  if not exists (select 1 from public.docs where col = 'tasks' and id = p_task and data->>'studentId' = sid) then return false; end if;
  if length(coalesce(p_text, '')) > 50000 then return false; end if;
  insert into public.docs(col, id, data, updated_at)
  values ('subs', p_task, jsonb_build_object('text', coalesce(p_text, ''), 'score', p_score,
          'submittedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'source', 'student'), now())
  on conflict (col, id) do update set data = excluded.data, updated_at = now();
  return true;
end $$;

create or replace function public.student_note_save(p_code text, p_id text, p_data jsonb) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare sid text; existing jsonb;
begin
  sid := public._student_id(p_code);
  if sid is null then perform pg_sleep(0.6); return false; end if;
  if p_id !~ '^[A-Za-z0-9_-]{1,64}$' or length(p_data::text) > 100000 then return false; end if;
  select data into existing from public.docs where col = 'notes' and id = p_id;
  if existing is not null and existing->>'studentId' is distinct from sid then return false; end if;
  insert into public.docs(col, id, data, updated_at)
  values ('notes', p_id, jsonb_build_object(
      'studentId', sid,
      'date', p_data->>'date', 'title', coalesce(p_data->>'title', ''), 'body', coalesce(p_data->>'body', ''),
      'skill', coalesce(p_data->>'skill', ''), 'by', coalesce(existing->>'by', 'student'),
      'createdAt', coalesce(existing->>'createdAt', p_data->>'createdAt'), 'updatedAt', p_data->>'updatedAt'), now())
  on conflict (col, id) do update set data = excluded.data, updated_at = now();
  return true;
end $$;

create or replace function public.student_note_delete(p_code text, p_id text) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare sid text;
begin
  sid := public._student_id(p_code);
  if sid is null then return false; end if;
  delete from public.docs where col = 'notes' and id = p_id and data->>'studentId' = sid;
  return true;
end $$;

revoke all on function public._student_id(text) from public, anon, authenticated;
revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.claim_teacher() to authenticated;
grant execute on function public.student_bundle(text) to anon, authenticated;
grant execute on function public.student_lesson(text, text, timestamptz) to anon, authenticated;
grant execute on function public.student_submit(text, text, text, int) to anon, authenticated;
grant execute on function public.student_note_save(text, text, jsonb) to anon, authenticated;
grant execute on function public.student_note_delete(text, text) to anon, authenticated;

-- Realtime cho trang giáo viên
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- File nghe / video (public đọc, chỉ giáo viên tải lên)
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do nothing;
drop policy if exists "teacher uploads media" on storage.objects;
create policy "teacher uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_teacher());
drop policy if exists "teacher updates media" on storage.objects;
create policy "teacher updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_teacher());
drop policy if exists "teacher deletes media" on storage.objects;
create policy "teacher deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_teacher());
