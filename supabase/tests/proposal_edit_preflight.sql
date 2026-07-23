do $$
begin
  if (select count(*) from public.clients where created_by is null) <> 0 then
    raise exception 'clients without owner prevent policy tightening';
  end if;

  if (select count(*) from public.proposals where client_id is null) <> 0 then
    raise exception 'proposals without client require product review';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.proposals'::regclass
      and conname = 'proposals_status_check'
      and pg_get_constraintdef(oid) like '%Negociando%'
  ) then
    raise exception 'proposal status contract does not include Negociando';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Public read access for clients (temporary debug)'
  ) then
    raise exception 'expected temporary client policy was not found';
  end if;
end
$$;
