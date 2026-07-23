# Task 8 — Ações de entrada e bloqueios por status

## Implementado

- Dashboard passa a navegar propostas editáveis para `/generator/:id/edit`, preservando `location.state.returnTo`.
- Oportunidades usa `canEditProposal` e `PROPOSAL_STATUSES` canônicos em Kanban, Lista, Tabela e Detalhe.
- Propostas finalizadas mantêm ações de visualizar/duplicar, mas desabilitam edição com a mensagem acessível `Proposta finalizada: duplique para editar`.
- Controles inline, mudança de status e arrastar cartões são bloqueados para propostas finalizadas.

## TDD

- RED confirmado para rota legada do Dashboard e para affordances ausentes/bloqueio de propostas finalizadas.
- GREEN: testes focados cobrem navegação canônica com `returnTo` e ações bloqueadas, preservando visualizar/duplicar.

## Validação

- `pnpm vitest run src/components/Dashboard.test.tsx src/pages/crm/Opportunities.test.tsx` — 4 testes aprovados.
- `pnpm test` — 31 arquivos, 118 testes aprovados.
- `pnpm typecheck:work` — aprovado.
- `pnpm build` — aprovado.
- `pnpm lint` — falha por 103 erros preexistentes fora do escopo; lint direcionado também reporta 9 erros já existentes em `Opportunities.tsx`, sem novos avisos da Task 8.
