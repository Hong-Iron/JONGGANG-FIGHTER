-- 법대·사범대 추가 (2026-10-20). Supabase SQL Editor에서 한 번 실행한다. 다시 실행해도 안전하다.
insert into public.jg_college (code, name, sort) values
  ('law', '법과대학', 8), ('edu', '사범대학', 9)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;
