begin;

insert into auth.users(id, email)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'proposal-user-a@invalid.example'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'proposal-user-b@invalid.example'
  );

insert into public.app_users(id, name, email)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Proposal User A',
    'proposal-user-a@invalid.example'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Proposal User B',
    'proposal-user-b@invalid.example'
  );

insert into public.clients(id, name, email, created_by)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Client A',
    'client-a@invalid.example',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Client B',
    'client-b@invalid.example',
    '10000000-0000-0000-0000-000000000002'
  );

insert into public.proposals(
  id,
  title,
  amount,
  status,
  owner,
  client_id,
  share_token,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Negotiating A',
    50,
    'Negociando',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '2026-01-01 00:00:00+00',
    '2026-01-02 00:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Approved A',
    75,
    'Aprovada',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '2026-01-01 00:00:00+00',
    '2026-01-02 00:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Negotiating B',
    100,
    'Negociando',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    '2026-01-01 00:00:00+00',
    '2026-01-02 00:00:00+00'
  );

insert into public.proposal_services(
  id,
  proposal_id,
  service_id,
  name,
  base_price,
  quantity,
  billing_type
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'initial-a',
    'Initial A',
    50,
    1,
    'one_time'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'approved-a',
    'Approved A',
    75,
    1,
    'one_time'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'initial-b',
    'Initial B',
    100,
    1,
    'one_time'
  );

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare
  committed record;
begin
  select *
  into committed
  from public.update_editable_proposal(
    '30000000-0000-0000-0000-000000000001',
    '2026-01-02 00:00:00+00',
    jsonb_build_object(
      'title', 'Updated Negotiating A',
      'client_id', '20000000-0000-0000-0000-000000000001',
      'notes', 'Updated safely',
      'payment_type', 'cash',
      'cash_discount_percentage', 10,
      'is_validity_enabled', true,
      'validity_days', 30,
      'proposal_gradient_theme', 'alt1',
      'show_interest_rate', false
    ),
    jsonb_build_array(jsonb_build_object(
      'service_id', 'updated-a',
      'name', 'Updated Service A',
      'description', 'Replacement service',
      'base_price', 120,
      'quantity', 2,
      'custom_price', 120,
      'discount', 20,
      'discount_percentage', 0,
      'discount_type', 'value',
      'features', jsonb_build_array('feature-a'),
      'category', 'Consulting',
      'icon', 'shield',
      'is_custom', true,
      'billing_type', 'one_time'
    ))
  );

  if committed.proposal_id
       is distinct from '30000000-0000-0000-0000-000000000001'::uuid
     or committed.committed_share_token
       is distinct from '40000000-0000-0000-0000-000000000001'::uuid
     or committed.committed_status is distinct from 'Negociando'
     or committed.committed_updated_at
       is not distinct from '2026-01-02 00:00:00+00'::timestamptz then
    raise exception 'edit RPC returned an invalid commit snapshot';
  end if;

  if not exists (
    select 1
    from public.proposals
    where id = '30000000-0000-0000-0000-000000000001'
      and share_token = '40000000-0000-0000-0000-000000000001'
      and owner = '10000000-0000-0000-0000-000000000001'
      and status = 'Negociando'
      and created_at = '2026-01-01 00:00:00+00'
      and title = 'Updated Negotiating A'
      and amount = 198
      and notes = 'Updated safely'
      and client_id = '20000000-0000-0000-0000-000000000001'
      and payment_type = 'cash'
      and cash_discount_percentage = 10
      and is_validity_enabled
      and validity_days = 30
      and proposal_gradient_theme = 'alt1'
      and not show_interest_rate
  ) then
    raise exception 'proposal header update or immutable fields are invalid';
  end if;

  if (select count(*) from public.proposal_services
      where proposal_id = '30000000-0000-0000-0000-000000000001') <> 1
     or not exists (
       select 1
       from public.proposal_services
       where proposal_id = '30000000-0000-0000-0000-000000000001'
         and service_id = 'updated-a'
         and name = 'Updated Service A'
         and base_price = 120
         and quantity = 2
         and custom_price = 120
         and discount = 20
         and billing_type = 'one_time'
     ) then
    raise exception 'proposal service replacement failed';
  end if;
end
$$;

do $$
declare
  before_proposal jsonb;
  after_proposal jsonb;
  before_services jsonb;
  after_services jsonb;
begin
  select to_jsonb(p)
  into before_proposal
  from public.proposals p
  where id = '30000000-0000-0000-0000-000000000001';

  select coalesce(jsonb_agg(to_jsonb(ps) order by ps.id), '[]'::jsonb)
  into before_services
  from public.proposal_services ps
  where proposal_id = '30000000-0000-0000-0000-000000000001';

  begin
    perform public.update_editable_proposal(
      '30000000-0000-0000-0000-000000000001',
      '2026-01-02 00:00:00+00',
      jsonb_build_object(
        'title', 'Stale overwrite',
        'client_id', '20000000-0000-0000-0000-000000000001'
      ),
      jsonb_build_array(jsonb_build_object(
        'service_id', 'stale',
        'name', 'Stale',
        'base_price', 1,
        'quantity', 1,
        'billing_type', 'one_time'
      ))
    );
    raise exception 'stale update unexpectedly succeeded';
  exception
    when sqlstate '40001' then
      if sqlerrm <> 'proposal_conflict' then
        raise exception 'unexpected conflict message: %', sqlerrm;
      end if;
  end;

  select to_jsonb(p)
  into after_proposal
  from public.proposals p
  where id = '30000000-0000-0000-0000-000000000001';

  select coalesce(jsonb_agg(to_jsonb(ps) order by ps.id), '[]'::jsonb)
  into after_services
  from public.proposal_services ps
  where proposal_id = '30000000-0000-0000-0000-000000000001';

  if before_proposal is distinct from after_proposal
     or before_services is distinct from after_services then
    raise exception 'stale update changed proposal state';
  end if;
end
$$;

do $$
begin
  begin
    perform public.update_editable_proposal(
      '30000000-0000-0000-0000-000000000002',
      '2026-01-02 00:00:00+00',
      jsonb_build_object(
        'title', 'Locked overwrite',
        'client_id', '20000000-0000-0000-0000-000000000001'
      ),
      jsonb_build_array(jsonb_build_object(
        'service_id', 'locked',
        'name', 'Locked',
        'base_price', 1,
        'quantity', 1,
        'billing_type', 'one_time'
      ))
    );
    raise exception 'approved proposal unexpectedly updated';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'proposal_locked' then
        raise exception 'unexpected locked message: %', sqlerrm;
      end if;
  end;
end
$$;

do $$
begin
  begin
    perform public.update_editable_proposal(
      '30000000-0000-0000-0000-000000000003',
      '2026-01-02 00:00:00+00',
      jsonb_build_object(
        'title', 'Cross-owner overwrite',
        'client_id', '20000000-0000-0000-0000-000000000001'
      ),
      jsonb_build_array(jsonb_build_object(
        'service_id', 'cross-owner',
        'name', 'Cross owner',
        'base_price', 1,
        'quantity', 1,
        'billing_type', 'one_time'
      ))
    );
    raise exception 'cross-owner proposal unexpectedly updated';
  exception
    when sqlstate 'P0002' then
      if sqlerrm <> 'proposal_not_found' then
        raise exception 'unexpected cross-owner message: %', sqlerrm;
      end if;
  end;
end
$$;

do $$
begin
  begin
    perform public.update_editable_proposal(
      '30000000-0000-0000-0000-000000000001',
      (
        select updated_at
        from public.proposals
        where id = '30000000-0000-0000-0000-000000000001'
      ),
      jsonb_build_object(
        'title', 'Invalid service attempt',
        'payment_type', 'cash'
      ),
      jsonb_build_array(jsonb_build_object(
        'service_id', 'invalid-features',
        'name', 'Invalid features',
        'base_price', 1,
        'quantity', 1,
        'features', 'not-an-array',
        'billing_type', 'one_time'
      )),
      jsonb_build_object(
        'name', 'Must Roll Back',
        'email', 'must-rollback@invalid.example'
      )
    );
    raise exception 'invalid service unexpectedly succeeded';
  exception
    when invalid_text_representation then
      null;
  end;

  if exists (
    select 1
    from public.clients
    where email = 'must-rollback@invalid.example'
  ) then
    raise exception 'new client survived invalid service rollback';
  end if;
end
$$;

reset role;

do $$
begin
  if not exists (
    select 1
    from public.proposals
    where id = '30000000-0000-0000-0000-000000000003'
      and title = 'Negotiating B'
      and amount = 100
  ) then
    raise exception 'user B proposal changed during cross-owner attempt';
  end if;
end
$$;

set local role anon;
select set_config('request.jwt.claims', '{}', true);

do $$
declare
  payload jsonb;
  payload_keys text[];
begin
  select public.get_public_proposal_by_token(
    '40000000-0000-0000-0000-000000000001'
  )
  into payload;

  if payload is null
     or payload->>'id' <> '30000000-0000-0000-0000-000000000001'
     or payload->>'title' <> 'Updated Negotiating A'
     or payload->'client'->>'id'
       <> '20000000-0000-0000-0000-000000000001'
     or jsonb_array_length(payload->'proposal_services') <> 1 then
    raise exception 'valid public token returned an invalid payload';
  end if;

  select array_agg(key order by key)
  into payload_keys
  from jsonb_object_keys(payload) key;

  if payload_keys <> array[
    'amount',
    'cash_discount_percentage',
    'client',
    'created_at',
    'id',
    'installment_number',
    'installment_value',
    'is_validity_enabled',
    'manual_installment_total',
    'notes',
    'payment_type',
    'proposal_gradient_theme',
    'proposal_logo_url',
    'proposal_services',
    'show_interest_rate',
    'status',
    'title',
    'updated_at',
    'validity_days'
  ]::text[] then
    raise exception 'public payload exposes an unexpected top-level contract';
  end if;

  if public.get_public_proposal_by_token(
    '40000000-0000-0000-0000-000000000099'
  ) is not null then
    raise exception 'random public token returned a proposal';
  end if;
end
$$;

reset role;
rollback;
