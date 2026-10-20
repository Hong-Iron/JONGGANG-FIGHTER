-- 종강 파이터 단과대 대항 랭킹: Supabase SQL Editor에 붙여 넣고 한 번 실행한다.
-- SMASH와 같은 프로젝트를 쓰고, 이름은 모두 jg_로 시작한다. 다시 실행해도 안전하다(표는 지우지 않는다).
-- 브라우저(공개 키, anon 역할)는 표를 직접 읽거나 쓰지 못하고, 아래 두 함수만 부를 수 있다.

-- 단과대 목록. 목록에 없는 코드로 보낸 기록은 버린다.
create table if not exists public.jg_college (
  code text primary key,
  name text not null,
  sort int not null default 0
);
insert into public.jg_college (code, name, sort) values
  ('eng', '공과대학', 1), ('hum', '인문대학', 2), ('soc', '사회과학대학', 3), ('sci', '자연과학대학', 4), ('art', '예술대학', 5),
  ('nur', '간호대학', 6), ('med', '의과대학', 7), ('law', '법과대학', 8), ('edu', '사범대학', 9),
  ('biz', '경영대학', 10), ('phm', '약학대학', 11), ('pe', '체육대학', 12)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;

-- 날짜(한국 시간)별 단과대 합계: 쓰러뜨린 교수님 수, 그날 최고 연승, 도전한 판 수(첫 승을 거둔 도전)
create table if not exists public.jg_daily (
  day date not null,
  code text not null references public.jg_college (code) on delete cascade,
  wins bigint not null default 0,
  best int not null default 0,
  runs int not null default 0,
  primary key (day, code)
);

-- 같은 IP에서 너무 자주 보내는지 세는 임시 표. IP는 날짜와 섞은 해시로만 두고 2분 뒤 지운다.
create unlogged table if not exists public.jg_throttle (
  k text not null,
  at timestamptz not null default now()
);
create index if not exists jg_throttle_k_at on public.jg_throttle (k, at);
create index if not exists jg_throttle_at on public.jg_throttle (at);

alter table public.jg_college enable row level security;
alter table public.jg_daily enable row level security;
alter table public.jg_throttle enable row level security;
revoke all on public.jg_college, public.jg_daily, public.jg_throttle from anon, authenticated;

-- 교수님을 한 명 이길 때마다 게임이 부르는 함수: 내 단과대, 이번 도전의 연승 수(1이면 새 도전)
create or replace function public.jg_add(p_code text, p_streak int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Seoul')::date;
  v_hdr json;
  v_ip text;
  v_key text;
  v_cnt int;
begin
  if not exists (select 1 from jg_college c where c.code = p_code) then return; end if;
  -- 한 판에 적어도 수십 초가 걸리고 난이도가 계속 오르므로, 300연승을 넘는 기록은 믿지 않는다
  if p_streak is null or p_streak < 1 or p_streak > 300 then return; end if;

  begin
    v_hdr := current_setting('request.headers', true)::json;
  exception when others then
    v_hdr := null;
  end;
  v_ip := coalesce(v_hdr ->> 'cf-connecting-ip', nullif(split_part(coalesce(v_hdr ->> 'x-forwarded-for', ''), ',', 1), ''), v_hdr ->> 'x-real-ip');
  if v_ip is not null then
    v_key := md5('jg|' || v_ip || '|' || v_day::text);
    delete from jg_throttle t where t.at < now() - interval '2 minutes';
    select count(*) into v_cnt from jg_throttle t where t.k = v_key and t.at > now() - interval '1 minute';
    -- 한 사람은 1분에 많아야 3~4판을 이긴다. 학교 와이파이처럼 IP 하나를 여럿이 쓰는 경우를 생각해 넉넉하게 둔다
    if v_cnt >= 40 then return; end if;
    insert into jg_throttle (k) values (v_key);
  end if;

  insert into jg_daily as d (day, code, wins, best, runs)
  values (v_day, p_code, 1, p_streak, case when p_streak = 1 then 1 else 0 end)
  on conflict (day, code) do update
    set wins = d.wins + 1,
        best = greatest(d.best, excluded.best),
        runs = d.runs + excluded.runs;
end;
$$;

-- 게임이 읽는 순위표: 단과대마다 오늘(한국 시간)과 전체의 격파 수·최고 연승·도전 수
drop function if exists public.jg_board();
create or replace function public.jg_board()
returns table (code text, name text, sort int, today_wins bigint, today_best int, today_runs bigint, total_wins bigint, best_ever int, total_runs bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.name, c.sort,
    coalesce(sum(d.wins) filter (where d.day = (now() at time zone 'Asia/Seoul')::date), 0)::bigint,
    coalesce(max(d.best) filter (where d.day = (now() at time zone 'Asia/Seoul')::date), 0)::int,
    coalesce(sum(d.runs) filter (where d.day = (now() at time zone 'Asia/Seoul')::date), 0)::bigint,
    coalesce(sum(d.wins), 0)::bigint,
    coalesce(max(d.best), 0)::int,
    coalesce(sum(d.runs), 0)::bigint
  from jg_college c
  left join jg_daily d on d.code = c.code
  group by c.code, c.name, c.sort;
$$;

revoke all on function public.jg_add(text, int) from public;
revoke all on function public.jg_board() from public;
grant execute on function public.jg_add(text, int) to anon, authenticated;
grant execute on function public.jg_board() to anon, authenticated;
