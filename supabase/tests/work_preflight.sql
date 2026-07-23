do $$
declare
  unexpected_priority text;
  unexpected_status text;
begin
  if to_regclass('public.projects') is null or to_regclass('public.tasks') is null then
    raise exception 'legacy projects/tasks schema is not available';
  end if;

  if to_regclass('public.workspaces') is not null
     or to_regclass('public.spaces') is not null
     or to_regclass('public.lists') is not null then
    raise exception 'canonical schema already exists; stop and re-audit before migrating';
  end if;

  select priority into unexpected_priority
  from public.tasks
  where priority not in ('Baixa', 'Media', 'Média', 'Alta', 'Urgente')
  limit 1;

  if unexpected_priority is not null then
    raise exception 'unsupported legacy priority: %', unexpected_priority;
  end if;

  select status into unexpected_status
  from public.tasks
  where status not in ('Pendente', 'Em Progresso', 'Concluída')
  limit 1;

  if unexpected_status is not null then
    raise exception 'unsupported legacy task status: %', unexpected_status;
  end if;

  raise exception 'RED: canonical Work schema is missing as expected';
end
$$;
