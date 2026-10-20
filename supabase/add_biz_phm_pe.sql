-- 경영대·약대·체대 추가 (2026-10-20). Supabase SQL Editor에서 한 번 실행한다. 다시 실행해도 안전하다.
insert into public.jg_college (code, name, sort) values
  ('biz', '경영대학', 10), ('phm', '약학대학', 11), ('pe', '체육대학', 12)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;
