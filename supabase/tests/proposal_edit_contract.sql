do $$
declare
  policy_spec record;
  required_status text;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'proposals'
      and column_name = 'show_interest_rate'
      and is_nullable = 'NO'
      and column_default in ('true', 'true::boolean')
  ) then
    raise exception 'proposals.show_interest_rate contract is missing';
  end if;

  if to_regclass('public.proposal_services_proposal_id_idx') is null then
    raise exception 'proposal_services proposal index is missing';
  end if;

  if to_regclass('public.clients_created_by_idx') is null then
    raise exception 'clients owner index is missing';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Public read access for clients (temporary debug)'
  ) then
    raise exception 'temporary public clients policy is still active';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Owners can view their clients'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual like '%auth.uid()%created_by%'
  ) then
    raise exception 'owner-scoped clients SELECT policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Owners can update their clients'
      and cmd = 'UPDATE'
      and roles = array['authenticated']::name[]
      and qual like '%auth.uid()%created_by%'
      and with_check like '%auth.uid()%created_by%'
  ) then
    raise exception 'owner-scoped clients UPDATE policy is incomplete';
  end if;

  for policy_spec in
    select *
    from (values
      ('Allow read access to proposal services for proposal owner', 'SELECT'),
      ('Allow insert access to proposal services for proposal owner', 'INSERT'),
      ('Allow update access to proposal services for proposal owner', 'UPDATE'),
      ('Allow delete access to proposal services for proposal owner', 'DELETE')
    ) as expected(policyname, cmd)
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'proposal_services'
        and policyname = policy_spec.policyname
        and cmd = policy_spec.cmd
        and roles = array['authenticated']::name[]
    ) then
      raise exception 'authenticated proposal-services policy is missing: %',
        policy_spec.policyname;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure(
      'public.update_editable_proposal(uuid,timestamp with time zone,jsonb,jsonb,jsonb)'
    )
      and not prosecdef
  ) then
    raise exception 'edit RPC is missing or is not SECURITY INVOKER';
  end if;

  if has_function_privilege(
    'anon',
    'public.update_editable_proposal(uuid,timestamp with time zone,jsonb,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'anon can execute edit RPC';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.update_editable_proposal(uuid,timestamp with time zone,jsonb,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'authenticated cannot execute edit RPC';
  end if;

  if not exists (
    select 1
    from pg_proc
    where oid = to_regprocedure(
      'public.get_public_proposal_by_token(uuid)'
    )
      and prosecdef
  ) then
    raise exception 'public-token RPC is missing or is not SECURITY DEFINER';
  end if;

  if exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(
      coalesce(p.proacl, acldefault('f', p.proowner))
    ) acl
    where p.oid = to_regprocedure(
      'public.get_public_proposal_by_token(uuid)'
    )
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC retains default execution on public-token RPC';
  end if;

  if not has_function_privilege(
    'anon',
    'public.get_public_proposal_by_token(uuid)',
    'execute'
  ) then
    raise exception 'anon cannot execute public-token RPC';
  end if;

  foreach required_status in array array[
    'Criada',
    'Enviada',
    'Aprovada',
    'Rejeitada',
    'Negociando',
    'Rascunho'
  ]
  loop
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.proposals'::regclass
        and conname = 'proposals_status_check'
        and pg_get_constraintdef(oid) like '%' || required_status || '%'
    ) then
      raise exception 'proposal status contract is missing: %', required_status;
    end if;
  end loop;
end
$$;
