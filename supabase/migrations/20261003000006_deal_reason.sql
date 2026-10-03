alter table public.game_deals add column if not exists reason text check (reason in ('team','product','price','gut'));
