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
