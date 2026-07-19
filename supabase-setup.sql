-- Hikari Lounge setup. Run this in the Supabase SQL editor (once).

create table if not exists lounge_posts (
  id bigint generated always as identity primary key,
  author text not null,
  avatar text,
  text text not null default '',
  image_url text,
  show_id text,
  show_name text,
  created_at timestamptz not null default now()
);

-- The app talks to Supabase with the service-role key from the server only,
-- so lock the table down for anonymous/authenticated clients.
alter table lounge_posts enable row level security;

-- Public bucket for post images.
insert into storage.buckets (id, name, public)
values ('lounge', 'lounge', true)
on conflict (id) do nothing;
