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

-- Slike stranica (screenshotovi) – trajno, deljeno za ceo tim. Prave se samo prvi put i na „Osveži slike”.
insert into storage.buckets (id, name, public)
values ('shots', 'shots', false)
on conflict (id) do nothing;

drop policy if exists "team shots select" on storage.objects;
drop policy if exists "team shots insert" on storage.objects;
drop policy if exists "team shots update" on storage.objects;
drop policy if exists "team shots delete" on storage.objects;
create policy "team shots select" on storage.objects for select to authenticated using (bucket_id = 'shots');
create policy "team shots insert" on storage.objects for insert to authenticated with check (bucket_id = 'shots');
create policy "team shots update" on storage.objects for update to authenticated using (bucket_id = 'shots') with check (bucket_id = 'shots');
create policy "team shots delete" on storage.objects for delete to authenticated using (bucket_id = 'shots');
