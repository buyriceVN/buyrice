-- Âm thanh game nhập vai (trang "🎵 Âm thanh game"): cho học sinh đọc được bảng âm thanh giáo viên tải lên.
-- Chạy MỘT LẦN trong Supabase → SQL Editor → New query → dán toàn bộ file này → Run.
-- File âm thanh nằm trong bucket "media" (thư mục rpg-sounds/), bucket này đã public và chỉ giáo viên được tải lên (xem schema.sql).
-- Bảng ánh xạ key → { url, path, volume, loop, label } nằm trong bảng docs với col = 'rpgsounds'.

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
                  from public.docs where col = 'lessons' and public._lesson_visible(data, sid)), '{}'::jsonb),
    'wordsets', coalesce((select jsonb_object_agg(id, data) from public.docs where col = 'wordsets'), '{}'::jsonb),
    'rpgsounds', coalesce((select jsonb_object_agg(id, data) from public.docs where col = 'rpgsounds'), '{}'::jsonb)
  );
end $$;

grant execute on function public.student_bundle(text) to anon, authenticated;
