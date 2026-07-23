-- Align the proposal date contract safely with the dashboard filters.
alter table public.proposals
  add column if not exists approved_at timestamp with time zone;

update public.proposals
set approved_at = updated_at
where status = 'Aprovada'
  and approved_at is null;

create index if not exists proposals_owner_idx
  on public.proposals(owner);

create index if not exists proposals_approved_at_idx
  on public.proposals(approved_at)
  where approved_at is not null;

create or replace function public.update_approved_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'Aprovada'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from 'Aprovada'
     )
     and new.approved_at is null then
    new.approved_at := now();
  elsif new.status is distinct from 'Aprovada' then
    new.approved_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_update_approved_at
  on public.proposals;

create trigger trigger_update_approved_at
before insert or update of status
on public.proposals
for each row
execute function public.update_approved_at();

alter table public.proposals enable row level security;

drop policy if exists "Public read access for proposals (temporary debug)"
  on public.proposals;
drop policy if exists "Owners can view their proposals"
  on public.proposals;
drop policy if exists "Owners can insert their proposals"
  on public.proposals;
drop policy if exists "Owners can update their proposals"
  on public.proposals;
drop policy if exists "Owners can delete their proposals"
  on public.proposals;

create policy "Owners can view their proposals"
on public.proposals
for select
to authenticated
using ((select auth.uid()) = owner);

create policy "Owners can insert their proposals"
on public.proposals
for insert
to authenticated
with check ((select auth.uid()) = owner);

create policy "Owners can update their proposals"
on public.proposals
for update
to authenticated
using ((select auth.uid()) = owner)
with check ((select auth.uid()) = owner);

create policy "Owners can delete their proposals"
on public.proposals
for delete
to authenticated
using ((select auth.uid()) = owner);

-- The frontend now derives dashboard analytics from its owner-scoped proposal
-- query. Revoke the old SECURITY DEFINER RPCs so callers cannot choose another
-- user's UUID and bypass RLS.
do $$
begin
  if to_regprocedure(
    'public.dashboard_values_by_month(uuid,timestamp with time zone,timestamp with time zone)'
  ) is not null then
    revoke execute on function public.dashboard_values_by_month(
      uuid,
      timestamp with time zone,
      timestamp with time zone
    ) from public, anon, authenticated;
  end if;

  if to_regprocedure(
    'public.proposals_aggregate(uuid,timestamp with time zone,timestamp with time zone,text)'
  ) is not null then
    revoke execute on function public.proposals_aggregate(
      uuid,
      timestamp with time zone,
      timestamp with time zone,
      text
    ) from public, anon, authenticated;
  end if;
end
$$;
