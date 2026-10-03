-- Each day starts with its own bankroll; store it so a lifetime portfolio can be summed up.
alter table public.game_runs add column bankroll bigint not null default 1000000;
