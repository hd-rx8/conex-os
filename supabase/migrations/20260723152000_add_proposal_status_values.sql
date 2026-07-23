-- proposals.status is a text column. Keep the legacy vocabulary valid while
-- migrating existing rows to the canonical pipeline vocabulary.
alter table public.proposals
  alter column status type text using status::text;

alter table public.proposals
  drop constraint if exists proposals_status_check;

-- The legacy trigger clears approved_at when Aprovada changes to another
-- status, so disable it before translating that status to FECHADO_GANHO.
drop trigger if exists trigger_update_approved_at
  on public.proposals;

update public.proposals
set status = case status
  when 'Rascunho' then 'EM_ELABORACAO'
  when 'Criada' then 'EM_REVISAO'
  when 'Enviada' then 'ENVIADA'
  when 'Negociando' then 'NEGOCIACAO'
  when 'EM_NEGOCIACAO' then 'NEGOCIACAO'
  when 'Aprovada' then 'FECHADO_GANHO'
  when 'Rejeitada' then 'FECHADO_PERDIDO'
  else status
end
where status in (
  'Criada',
  'Rascunho',
  'Enviada',
  'Negociando',
  'EM_NEGOCIACAO',
  'Aprovada',
  'Rejeitada'
);

alter table public.proposals
  add constraint proposals_status_check check (
    status in (
      'Criada',
      'Enviada',
      'Aprovada',
      'Rejeitada',
      'Negociando',
      'Rascunho',
      'QUALIFICACAO',
      'EM_ELABORACAO',
      'EM_REVISAO',
      'ENVIADA',
      'NEGOCIACAO',
      'EM_NEGOCIACAO',
      'FECHADO_GANHO',
      'FECHADO_PERDIDO'
    )
  ) not valid;

alter table public.proposals
  validate constraint proposals_status_check;

-- Preserve the security, ownership and optimistic-concurrency behavior of the
-- existing edit RPC, changing only the set of statuses that remain editable.
create or replace function public.update_editable_proposal(
  p_proposal_id uuid,
  p_expected_updated_at timestamptz,
  p_proposal jsonb,
  p_services jsonb,
  p_new_client jsonb default null
)
returns table (
  proposal_id uuid,
  committed_updated_at timestamptz,
  committed_share_token uuid,
  committed_status text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_proposal public.proposals%rowtype;
  v_client_id uuid;
  v_payment_type text := coalesce(p_proposal->>'payment_type', 'cash');
  v_cash_discount numeric := coalesce((p_proposal->>'cash_discount_percentage')::numeric, 0);
  v_installment_number integer := coalesce((p_proposal->>'installment_number')::integer, 2);
  v_installment_value numeric := coalesce((p_proposal->>'installment_value')::numeric, 0);
  v_manual_total numeric := nullif(p_proposal->>'manual_installment_total', '')::numeric;
  v_validity_enabled boolean := coalesce((p_proposal->>'is_validity_enabled')::boolean, false);
  v_validity_days integer := coalesce((p_proposal->>'validity_days')::integer, 0);
  v_subtotal numeric;
  v_amount numeric;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select *
  into v_proposal
  from public.proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'proposal_not_found';
  end if;

  if v_proposal.status not in (
    'Rascunho',
    'Criada',
    'Enviada',
    'Negociando',
    'QUALIFICACAO',
    'EM_ELABORACAO',
    'EM_REVISAO',
    'ENVIADA',
    'NEGOCIACAO',
    'EM_NEGOCIACAO'
  ) then
    raise exception using errcode = 'P0001', message = 'proposal_locked';
  end if;

  if v_proposal.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'proposal_conflict';
  end if;

  if nullif(btrim(p_proposal->>'title'), '') is null then
    raise exception using errcode = '22023', message = 'title_required';
  end if;

  if jsonb_typeof(p_services) is distinct from 'array'
     or jsonb_array_length(p_services) = 0 then
    raise exception using errcode = '22023', message = 'services_required';
  end if;

  if v_payment_type not in ('cash', 'installment')
     or v_cash_discount < 0 or v_cash_discount > 100
     or v_installment_value < 0
     or coalesce(v_manual_total, 0) < 0
     or coalesce(p_proposal->>'proposal_gradient_theme', 'conexhub')
        not in ('conexhub', 'alt1', 'alt2')
     or (v_payment_type = 'installment' and (
       v_cash_discount <> 0
       or v_installment_number not between 2 and 12
       or (v_installment_value <= 0 and coalesce(v_manual_total, 0) <= 0)
     ))
     or (v_validity_enabled and v_validity_days < 1) then
    raise exception using errcode = '22023', message = 'invalid_payment_or_validity';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_services) as s(
      service_id text,
      name text,
      base_price numeric,
      quantity integer,
      custom_price numeric,
      discount numeric,
      discount_percentage numeric,
      discount_type text,
      billing_type text
    )
    where nullif(btrim(s.service_id), '') is null
       or nullif(btrim(s.name), '') is null
       or s.base_price is null
       or s.base_price < 0
       or coalesce(s.custom_price, s.base_price) < 0
       or s.quantity is null
       or s.quantity < 1
       or coalesce(s.discount, 0) < 0
       or coalesce(s.discount, 0) > coalesce(s.custom_price, s.base_price) * s.quantity
       or coalesce(s.discount_percentage, 0) not between 0 and 100
       or coalesce(s.discount_type, 'percentage') not in ('percentage', 'value')
       or s.billing_type is null
       or s.billing_type not in ('one_time', 'monthly')
  ) then
    raise exception using errcode = '22023', message = 'invalid_service';
  end if;

  if p_new_client is not null then
    if nullif(btrim(p_new_client->>'name'), '') is null then
      raise exception using errcode = '22023', message = 'client_name_required';
    end if;

    insert into public.clients(name, email, company, phone, created_by)
    values (
      btrim(p_new_client->>'name'),
      nullif(btrim(p_new_client->>'email'), ''),
      nullif(btrim(p_new_client->>'company'), ''),
      nullif(btrim(p_new_client->>'phone'), ''),
      (select auth.uid())
    )
    returning id into v_client_id;
  else
    begin
      v_client_id := (p_proposal->>'client_id')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'invalid_client';
    end;

    perform 1 from public.clients
    where id = v_client_id and created_by = (select auth.uid());
    if not found then
      raise exception using errcode = 'P0002', message = 'client_not_found';
    end if;
  end if;

  select coalesce(sum(
    (coalesce(s.custom_price, s.base_price) * s.quantity)
    - coalesce(s.discount, 0)
  ), 0)
  into v_subtotal
  from jsonb_to_recordset(p_services) as s(
    base_price numeric,
    quantity integer,
    custom_price numeric,
    discount numeric
  );

  v_amount := round(
    case
      when v_payment_type = 'cash'
        then v_subtotal * (1 - v_cash_discount / 100)
      when coalesce(v_manual_total, 0) > 0
        then v_manual_total
      else v_installment_value * v_installment_number
    end,
    2
  );

  update public.proposals
  set title = btrim(p_proposal->>'title'),
      amount = v_amount,
      client_id = v_client_id,
      notes = nullif(p_proposal->>'notes', ''),
      payment_type = v_payment_type,
      cash_discount_percentage = v_cash_discount,
      installment_number = v_installment_number,
      installment_value = v_installment_value,
      manual_installment_total = v_manual_total,
      is_validity_enabled = v_validity_enabled,
      validity_days = v_validity_days,
      proposal_logo_url = nullif(p_proposal->>'proposal_logo_url', ''),
      proposal_gradient_theme = coalesce(nullif(p_proposal->>'proposal_gradient_theme', ''), 'conexhub'),
      show_interest_rate = coalesce((p_proposal->>'show_interest_rate')::boolean, true)
  where id = p_proposal_id;

  delete from public.proposal_services as ps
  where ps.proposal_id = p_proposal_id;

  insert into public.proposal_services(
    proposal_id, service_id, name, description, base_price, quantity,
    custom_price, discount, discount_percentage, discount_type, features,
    category, icon, is_custom, billing_type
  )
  select
    p_proposal_id, s.service_id, s.name, s.description, s.base_price,
    s.quantity, s.custom_price, coalesce(s.discount, 0),
    coalesce(s.discount_percentage, 0),
    coalesce(s.discount_type, 'percentage'), coalesce(s.features, array[]::text[]),
    s.category, s.icon, coalesce(s.is_custom, false),
    s.billing_type::public.billing_type
  from jsonb_to_recordset(p_services) as s(
    service_id text,
    name text,
    description text,
    base_price numeric,
    quantity integer,
    custom_price numeric,
    discount numeric,
    discount_percentage numeric,
    discount_type text,
    features text[],
    category text,
    icon text,
    is_custom boolean,
    billing_type text
  );

  return query
  select p.id, p.updated_at, p.share_token, p.status
  from public.proposals p
  where p.id = p_proposal_id;
end;
$$;

revoke all on function public.update_editable_proposal(
  uuid, timestamptz, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.update_editable_proposal(
  uuid, timestamptz, jsonb, jsonb, jsonb
) to authenticated;

-- Treat the legacy and canonical won statuses equivalently. The backfill only
-- fills missing timestamps and never clears an existing historical timestamp.
create or replace function public.update_approved_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('Aprovada', 'FECHADO_GANHO')
     and (
       tg_op = 'INSERT'
       or old.status not in ('Aprovada', 'FECHADO_GANHO')
     )
     and new.approved_at is null then
    new.approved_at := now();
  elsif tg_op = 'UPDATE'
        and old.status in ('Aprovada', 'FECHADO_GANHO')
        and new.status not in ('Aprovada', 'FECHADO_GANHO') then
    new.approved_at := null;
  end if;

  return new;
end;
$$;

update public.proposals
set approved_at = coalesce(updated_at, created_at)
where status in ('Aprovada', 'FECHADO_GANHO')
  and approved_at is null;

create trigger trigger_update_approved_at
before insert or update of status
on public.proposals
for each row
execute function public.update_approved_at();
