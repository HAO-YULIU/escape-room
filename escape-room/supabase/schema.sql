-- 已套用到 Supabase 專案 escape-room，這裡留作紀錄
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 20),
  avatar_url text,
  appearance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  cover_url text,
  difficulty int not null default 3 check (difficulty between 1 and 5),
  duration_min int default 30,
  min_players int default 1,
  max_players int default 1,
  tags text[] default '{}',
  status text not null default 'coming_soon' check (status in ('available','coming_soon')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.play_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  status text not null default 'started' check (status in ('started','cleared')),
  clear_time_sec int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS：所有人可讀 profiles / games；玩家只能改自己的 profile 與紀錄
-- Storage：avatars bucket（公開讀取，只能寫入自己的 <user_id>/ 資料夾）
-- 完整 policy 請見 Supabase Dashboard → Database → Migrations
