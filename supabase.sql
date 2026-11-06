-- Funnel Dashboard: tabela za dnevnik izmena (merenje pre/posle)
create table if not exists public.changes (
  id uuid primary key default gen_random_uuid(),
  src text not null,                -- URL sajta
  site_name text,
  funnel_id bigint not null,
  funnel_name text,
  step_id bigint not null default 0, -- 0 = ceo funnel
  step_type text,
  step_name text,
  note text not null,
  date date not null,               -- dan izmene
  user_email text,
  created_at timestamptz not null default now()
);

alter table public.changes enable row level security;

-- Pristup imaju samo prijavljeni članovi tima (naloge dodaješ ručno u Authentication → Users).
drop policy if exists "team select" on public.changes;
drop policy if exists "team insert" on public.changes;
drop policy if exists "team delete" on public.changes;
create policy "team select" on public.changes for select to authenticated using (true);
create policy "team insert" on public.changes for insert to authenticated with check (true);
create policy "team delete" on public.changes for delete to authenticated using (true);
