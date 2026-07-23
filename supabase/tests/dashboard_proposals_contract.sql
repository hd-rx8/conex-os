do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'proposals'
      and column_name = 'approved_at'
      and data_type = 'timestamp with time zone'
  ) then
    raise exception 'proposals.approved_at is missing';
  end if;

  if to_regclass('public.proposals_owner_idx') is null then
    raise exception 'proposals owner index is missing';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'proposals'
      and policyname = 'Public read access for proposals (temporary debug)'
  ) then
    raise exception 'temporary cross-tenant proposals policy is still active';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'proposals'
      and policyname = 'Owners can view their proposals'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual like '%auth.uid()%owner%'
  ) then
    raise exception 'owner-scoped proposals select policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'proposals'
      and policyname = 'Owners can update their proposals'
      and cmd = 'UPDATE'
      and with_check like '%auth.uid()%owner%'
  ) then
    raise exception 'proposals update policy has no owner WITH CHECK';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.proposals'::regclass
      and tgname = 'trigger_update_approved_at'
      and not tgisinternal
  ) then
    raise exception 'approved_at maintenance trigger is missing';
  end if;

  if exists (
    select 1
    from public.proposals
    where status = 'Aprovada'
      and approved_at is null
  ) then
    raise exception 'approved proposals were not backfilled';
  end if;

  if has_function_privilege(
    'anon',
    'public.dashboard_values_by_month(uuid,timestamp with time zone,timestamp with time zone)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.dashboard_values_by_month(uuid,timestamp with time zone,timestamp with time zone)',
    'execute'
  ) then
    raise exception 'legacy dashboard_values_by_month RPC is still exposed';
  end if;

  if has_function_privilege(
    'anon',
    'public.proposals_aggregate(uuid,timestamp with time zone,timestamp with time zone,text)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.proposals_aggregate(uuid,timestamp with time zone,timestamp with time zone,text)',
    'execute'
  ) then
    raise exception 'legacy proposals_aggregate RPC is still exposed';
  end if;
end
$$;
