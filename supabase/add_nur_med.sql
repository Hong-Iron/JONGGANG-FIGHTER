-- 간호대·의대 추가 (2026-10-19). Supabase SQL Editor에서 한 번 실행한다. 다시 실행해도 안전하다.
insert into public.jg_college (code, name, sort) values
  ('nur', '간호대학', 6), ('med', '의과대학', 7)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;
