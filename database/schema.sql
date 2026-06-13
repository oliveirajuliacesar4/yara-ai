create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  prompt text not null,
  reply text not null,
  model text,
  tokens_input integer default 0,
  tokens_output integer default 0,
  estimated_cost numeric(12, 4) default 0,
  created_at timestamptz not null default now()
);

create table if not exists atlas_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  progress integer not null default 0,
  deadline text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  priority text default 'Média',
  status text default 'backlog',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  type text default 'Agenda',
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  period text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  gateway text,
  gateway_customer_id text,
  gateway_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  gateway text not null,
  plan text not null,
  amount numeric(12, 2) not null,
  status text not null,
  gateway_payment_id text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_user_created on ai_messages(user_id, created_at desc);
create index if not exists idx_atlas_records_user_type on atlas_records(user_id, type);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
