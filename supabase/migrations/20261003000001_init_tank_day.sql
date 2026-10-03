-- Player profiles (public display names for the leaderboard)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Auto-create a profile on sign-up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    left(regexp_replace(split_part(coalesce(new.email, 'shark'), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 16)
      || '_' || substr(replace(new.id::text, '-', ''), 1, 4)
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Pitch content. Outcome data is only readable by the service role (RLS, no policies).
create table public.pitches (
  id text primary key,
  data jsonb not null,
  reactions jsonb not null,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.pitches enable row level security;

-- Finished runs. Written only by the backend (service role); readable by everyone for leaderboards.
create table public.game_runs (
  id uuid primary key default gen_random_uuid(),
  game_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  daily_date date,
  pitch_ids text[] not null,
  invested bigint not null,
  net_worth bigint not null,
  return_pct numeric(10, 2) not null,
  deals int not null,
  created_at timestamptz not null default now()
);
create index game_runs_user_idx on public.game_runs (user_id);
create index game_runs_daily_idx on public.game_runs (daily_date, net_worth desc);
alter table public.game_runs enable row level security;
create policy "runs are public" on public.game_runs
  for select to anon, authenticated using (true);

create table public.game_deals (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.game_runs (id) on delete cascade,
  round int not null,
  pitch_id text not null,
  investor text not null,
  amount bigint not null,
  equity numeric(6, 4) not null,
  stake_value bigint not null
);
create index game_deals_run_idx on public.game_deals (run_id);
alter table public.game_deals enable row level security;
create policy "users read deals of their runs" on public.game_deals
  for select to authenticated using (
    exists (select 1 from public.game_runs r where r.id = run_id and r.user_id = (select auth.uid()))
  );

-- Leaderboards (security_invoker so RLS of the base tables applies)
create view public.leaderboard_all_time with (security_invoker = true) as
select distinct on (r.user_id)
  r.user_id, p.username, r.net_worth, r.return_pct, r.deals, r.created_at
from public.game_runs r
join public.profiles p on p.id = r.user_id
order by r.user_id, r.net_worth desc;

create view public.leaderboard_daily with (security_invoker = true) as
select distinct on (r.daily_date, r.user_id)
  r.daily_date, r.user_id, p.username, r.net_worth, r.return_pct, r.deals, r.created_at
from public.game_runs r
join public.profiles p on p.id = r.user_id
where r.daily_date is not null
order by r.daily_date, r.user_id, r.net_worth desc;

grant select on public.leaderboard_all_time, public.leaderboard_daily to anon, authenticated;
