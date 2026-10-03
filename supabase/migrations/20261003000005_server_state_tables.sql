-- Server-side state written only by the backend over a direct Postgres connection.
-- RLS on with no policies = invisible to the public API.
create table if not exists public.game_sessions (
  id varchar(64) primary key,
  user_id varchar(64),
  data text not null,
  created_at double precision not null,
  updated_at double precision not null
);
create index if not exists ix_game_sessions_user_id on public.game_sessions (user_id);
create index if not exists ix_game_sessions_created_at on public.game_sessions (created_at);
alter table public.game_sessions enable row level security;

create table if not exists public.classrooms (
  code varchar(12) primary key,
  name varchar(80) not null,
  teacher_token varchar(64) not null,
  seed integer not null,
  created_at double precision not null
);
alter table public.classrooms enable row level security;

create table if not exists public.classroom_results (
  id serial primary key,
  code varchar(12) not null,
  game_id varchar(64) not null unique,
  student varchar(40) not null,
  profit bigint not null,
  invested bigint not null,
  deals json not null,
  created_at double precision not null
);
create index if not exists ix_classroom_results_code on public.classroom_results (code);
alter table public.classroom_results enable row level security;
