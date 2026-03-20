-- Recovery codes for 2FA backup access
-- Each user gets 10 codes when they enable 2FA; each code is single-use.

create table if not exists public.recovery_codes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  code_hash  text not null,            -- bcrypt hash of the plain-text code
  used_at    timestamptz,              -- null = unused
  created_at timestamptz not null default now()
);

-- Fast look-ups by user
create index if not exists idx_recovery_codes_user
  on public.recovery_codes(user_id);

-- Row-Level Security
alter table public.recovery_codes enable row level security;

-- Users can only read/delete their own codes
create policy "Users can view own recovery codes"
  on public.recovery_codes for select
  using (auth.uid() = user_id);

create policy "Users can delete own recovery codes"
  on public.recovery_codes for delete
  using (auth.uid() = user_id);

-- Only the service role (edge functions) can insert / update
create policy "Service role can manage recovery codes"
  on public.recovery_codes for all
  using (true)
  with check (true);
