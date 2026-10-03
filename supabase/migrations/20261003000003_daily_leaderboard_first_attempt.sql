-- Daily challenge: only a player's FIRST run of the day counts (no replaying with hindsight).
create or replace view public.leaderboard_daily with (security_invoker = true) as
select distinct on (r.daily_date, r.user_id)
  r.daily_date, r.user_id, p.username, r.net_worth, r.return_pct, r.deals, r.created_at
from public.game_runs r
join public.profiles p on p.id = r.user_id
where r.daily_date is not null
order by r.daily_date, r.user_id, r.created_at asc;
