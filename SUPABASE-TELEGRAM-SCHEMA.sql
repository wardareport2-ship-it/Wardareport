-- Stock Book: Supabase stores Telegram settings and prepared daily report snapshots only.
-- Firebase remains the source of truth for the main Stock Book catalog, inventory and app data.
create table if not exists public.stock_book_telegram_settings (
  id text primary key check (id = 'default'),
  chat_id text not null,
  enabled boolean not null default true,
  timezone text not null default 'Asia/Tashkent',
  daily_time text not null default '22:30',
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_book_daily_reports (
  report_date date primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.stock_book_telegram_settings enable row level security;
alter table public.stock_book_daily_reports enable row level security;
-- No anon/authenticated policies: only the server-side service-role key may access these tables.
revoke all on public.stock_book_telegram_settings from anon, authenticated;
revoke all on public.stock_book_daily_reports from anon, authenticated;
grant all on public.stock_book_telegram_settings to service_role;
grant all on public.stock_book_daily_reports to service_role;

-- Chats the bot has seen (lets "Find groups" work while the bot menu webhook is active).
create table if not exists public.stock_book_telegram_chats (
  chat_id text primary key,
  title text not null default '',
  chat_type text not null default 'chat',
  seen_at timestamptz not null default now()
);
alter table public.stock_book_telegram_chats enable row level security;
revoke all on public.stock_book_telegram_chats from anon, authenticated;
grant all on public.stock_book_telegram_chats to service_role;

-- Cache for 7-day / last-month reports and the "monthly report sent" marker.
create table if not exists public.stock_book_range_cache (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.stock_book_range_cache enable row level security;
revoke all on public.stock_book_range_cache from anon, authenticated;
grant all on public.stock_book_range_cache to service_role;


-- Individually invited Telegram users. The permanent Telegram user ID is linked
-- only after the invited person opens the bot and presses /start.
create table if not exists public.stock_book_telegram_users (
  username text primary key,
  telegram_user_id text unique,
  first_name text not null default '',
  last_name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'active')),
  added_by_uid text not null default '',
  created_at timestamptz not null default now(),
  linked_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists stock_book_telegram_users_status_idx
  on public.stock_book_telegram_users (status, telegram_user_id);
alter table public.stock_book_telegram_users enable row level security;
revoke all on public.stock_book_telegram_users from anon, authenticated;
grant all on public.stock_book_telegram_users to service_role;
