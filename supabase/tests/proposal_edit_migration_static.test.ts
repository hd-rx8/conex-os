import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260723141714_secure_proposal_editing.sql',
  ),
  'utf8',
);

const fixtureSql = readFileSync(
  resolve(process.cwd(), 'supabase/tests/proposal_edit_rls.sql'),
  'utf8',
);

const supabaseTypes = readFileSync(
  resolve(process.cwd(), 'src/integrations/supabase/types.ts'),
  'utf8',
);

const statusMigrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260723152000_add_proposal_status_values.sql',
);
const statusMigrationBytes = readFileSync(statusMigrationPath);
const statusMigrationSql = new TextDecoder('utf-8', { fatal: true }).decode(
  statusMigrationBytes,
);
const normalizedStatusMigrationSql = statusMigrationSql
  .replace(/--.*$/gm, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const statusEditFunctionStart = normalizedStatusMigrationSql.indexOf(
  'create or replace function public.update_editable_proposal(',
);
const statusEditFunctionEnd = normalizedStatusMigrationSql.indexOf(
  'revoke all on function public.update_editable_proposal(',
  statusEditFunctionStart,
);
const statusEditFunctionSql = normalizedStatusMigrationSql.slice(
  statusEditFunctionStart,
  statusEditFunctionEnd,
);
const editableStatusGuard = statusEditFunctionSql.match(
  /if v_proposal\.status not in \((.*?)\) then/,
)?.[1];

const normalizedSql = migrationSql
  .replace(/--.*$/gm, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const functionStart = normalizedSql.indexOf(
  'create or replace function public.update_editable_proposal(',
);
const functionEnd = normalizedSql.indexOf(
  'revoke all on function public.update_editable_proposal(',
  functionStart,
);

if (functionStart < 0 || functionEnd < 0) {
  throw new Error('update_editable_proposal definition is missing');
}

const editFunctionSql = normalizedSql.slice(functionStart, functionEnd);
const validationStart = editFunctionSql.indexOf(
  "if v_payment_type not in ('cash', 'installment')",
);
const validationEnd = editFunctionSql.indexOf(
  "raise exception using errcode = '22023', message = 'invalid_payment_or_validity';",
  validationStart,
);

if (validationStart < 0 || validationEnd < 0) {
  throw new Error('payment validation block is missing');
}

const paymentValidationSql = editFunctionSql.slice(
  validationStart,
  validationEnd,
);
const amountAssignments = [...editFunctionSql.matchAll(/v_amount := .*?;/g)]
  .map(([assignment]) => assignment);

describe('secure proposal editing migration payment contract', () => {
  it('qualifies the deleted proposal_services proposal_id against the output column', () => {
    expect(editFunctionSql).toContain(
      'delete from public.proposal_services as ps where ps.proposal_id = p_proposal_id;',
    );
    expect(editFunctionSql).not.toContain(
      'delete from public.proposal_services where proposal_id = p_proposal_id;',
    );
  });

  it('rejects cash discounts inside the installment validation branch', () => {
    expect(paymentValidationSql).toContain(
      "or (v_payment_type = 'installment' and ( " +
      'v_cash_discount <> 0 ' +
      'or v_installment_number not between 2 and 12 ' +
      'or (v_installment_value <= 0 and coalesce(v_manual_total, 0) <= 0) ))',
    );
  });

  it('derives amount from the selected payment method and installment total', () => {
    expect(amountAssignments).toEqual([
      "v_amount := round( case when v_payment_type = 'cash' " +
      'then v_subtotal * (1 - v_cash_discount / 100) ' +
      'when coalesce(v_manual_total, 0) > 0 then v_manual_total ' +
      'else v_installment_value * v_installment_number end, 2 );',
    ]);
  });
});

describe('proposal edit RLS fixture bootstrap', () => {
  it('creates matching auth users before app users and clients inside a rollback-only transaction', () => {
    const authUsersStart = fixtureSql.indexOf('insert into auth.users');
    const appUsersStart = fixtureSql.indexOf('insert into public.app_users');
    const clientsStart = fixtureSql.indexOf('insert into public.clients');
    const authUsersSql = fixtureSql.slice(authUsersStart, appUsersStart);

    expect(authUsersStart).toBeGreaterThanOrEqual(0);
    expect(authUsersStart).toBeLessThan(appUsersStart);
    expect(appUsersStart).toBeLessThan(clientsStart);
    expect(authUsersSql).toContain("'10000000-0000-0000-0000-000000000001'");
    expect(authUsersSql).toContain("'10000000-0000-0000-0000-000000000002'");
    expect(authUsersSql).toContain('proposal-user-a@invalid.example');
    expect(authUsersSql).toContain('proposal-user-b@invalid.example');
    expect(fixtureSql).toMatch(/^begin;/i);
    expect(fixtureSql).not.toMatch(/\bcommit\s*;/i);
    expect(fixtureSql.trim()).toMatch(/rollback;$/i);
  });
});

describe('proposal status migration contract', () => {
  it('is UTF-8 SQL for a text column instead of a fictitious enum', () => {
    expect(statusMigrationBytes.subarray(0, 2)).not.toEqual(
      Buffer.from([0xff, 0xfe]),
    );
    expect(normalizedStatusMigrationSql).not.toMatch(/\balter type\b/i);
    expect(normalizedStatusMigrationSql).toMatch(
      /alter table public\.proposals alter column status type text using status::text/i,
    );
  });

  it('keeps legacy statuses while accepting every canonical status', () => {
    for (const status of [
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
      'FECHADO_PERDIDO',
    ]) {
      expect(normalizedStatusMigrationSql).toContain(`'${status}'`);
    }
    expect(normalizedStatusMigrationSql).toContain(
      'constraint proposals_status_check check',
    );
    expect(normalizedStatusMigrationSql).toContain(
      'validate constraint proposals_status_check',
    );
  });

  it('backfills legacy values explicitly without deleting proposal rows', () => {
    expect(normalizedStatusMigrationSql).toContain(
      'update public.proposals set status = case status',
    );
    expect(normalizedStatusMigrationSql).toContain(
      "when 'Criada' then 'EM_REVISAO'",
    );
    expect(normalizedStatusMigrationSql).toContain(
      "when 'EM_NEGOCIACAO' then 'NEGOCIACAO'",
    );
    expect(normalizedStatusMigrationSql).toContain(
      "when 'Aprovada' then 'FECHADO_GANHO'",
    );
    expect(normalizedStatusMigrationSql).toContain(
      "when 'Rejeitada' then 'FECHADO_PERDIDO'",
    );
    expect(normalizedStatusMigrationSql).toContain('else status end');
    expect(normalizedStatusMigrationSql).not.toMatch(
      /\bdelete\s+from\s+public\.proposals\b/i,
    );
  });

  it('preserves the edit RPC security and concurrency checks while recognizing active statuses', () => {
    expect(statusEditFunctionSql).toContain(
      'language plpgsql security invoker',
    );
    expect(statusEditFunctionSql).toContain("set search_path = ''");
    expect(statusEditFunctionSql).toContain(
      'where id = p_proposal_id for update',
    );
    expect(statusEditFunctionSql).toContain(
      'v_proposal.updated_at is distinct from p_expected_updated_at',
    );
    expect(statusEditFunctionSql).toContain(
      'where id = v_client_id and created_by = (select auth.uid())',
    );
    expect(normalizedStatusMigrationSql).toContain(
      'from public, anon',
    );
    expect(normalizedStatusMigrationSql).toContain('to authenticated');

    for (const status of [
      'Rascunho',
      'Criada',
      'Enviada',
      'Negociando',
      'QUALIFICACAO',
      'EM_ELABORACAO',
      'EM_REVISAO',
      'ENVIADA',
      'NEGOCIACAO',
      'EM_NEGOCIACAO',
    ]) {
      expect(editableStatusGuard).toContain(`'${status}'`);
    }
    for (const status of [
      'Aprovada',
      'Rejeitada',
      'FECHADO_GANHO',
      'FECHADO_PERDIDO',
    ]) {
      expect(editableStatusGuard).not.toContain(`'${status}'`);
    }
  });

  it('maintains approved_at for both legacy and canonical won statuses', () => {
    expect(normalizedStatusMigrationSql).toContain(
      "new.status in ('Aprovada', 'FECHADO_GANHO')",
    );
    expect(normalizedStatusMigrationSql).toContain(
      "status in ('Aprovada', 'FECHADO_GANHO') and approved_at is null",
    );
    expect(normalizedStatusMigrationSql).toContain(
      'create trigger trigger_update_approved_at',
    );
  });

  it('keeps workspace folder types without publishing a proposal enum for a text column', () => {
    expect(supabaseTypes).toContain('workspace_folders: {');
    expect(supabaseTypes).not.toMatch(/^\s+proposal_status:/m);
  });
});
