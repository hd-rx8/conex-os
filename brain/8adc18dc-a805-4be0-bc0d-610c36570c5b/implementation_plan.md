# Plano de Implementação: Importação e Exportação de Dados

Esta funcionalidade permitirá que os usuários façam backup e migrem seus dados (workspaces, projetos, pastas, listas e tarefas) através de arquivos JSON, garantindo a integridade dos relacionamentos.

## Visão Geral

1. **Exportação**: Iremos gerar um JSON com a estrutura normalizada de todas as tabelas relevantes da hierarquia (`workspaces`, `workspace_folders`, `spaces`, `folders`, `lists`, `tasks`).
2. **Importação**: Leremos o arquivo JSON, validaremos com `Zod`, geraremos novos UUIDs para todos os registros (para evitar colisão) e inseriremos no Supabase em ordem hierárquica.
3. **Interface**: Adicionaremos um novo Card "Backup e Migração" na tela de Configurações de Workspace (`WorkspaceSettings.tsx`), com botões para Exportar e Importar, e feedbacks visuais (Loading, Erro, Sucesso).

## Estrutura do JSON (Schema)

O arquivo exportado terá o seguinte formato:
```json
{
  "version": "1.0",
  "workspaces": [...],
  "workspace_folders": [...],
  "spaces": [...],
  "folders": [...],
  "lists": [...],
  "tasks": [...]
}
```

> [!NOTE]
> Optamos por manter o JSON normalizado (arrays separados por entidade) ao invés de uma árvore profunda, pois isso facilita imensamente o mapeamento de IDs e inserções em lote no banco de dados.

## Lógica de Importação (Frontend -> Supabase REST)

A importação será processada no lado do cliente (`browser`), usando a SDK do Supabase, da seguinte forma:

1. **Validação**: O arquivo será validado através de um schema `Zod`.
2. **Mapeamento de IDs (ID Mapping)**: Um dicionário `idMap: Record<string, string>` será criado para armazenar o de-para de IDs antigos para novos UUIDs gerados na hora (`crypto.randomUUID()`).
3. **Substituição de Chaves Estrangeiras**:
   - `workspace_id`, `workspace_folder_id`, `space_id`, `folder_id`, `list_id` serão atualizados usando o `idMap`.
4. **Tratamento de Usuários**:
   - O `owner` dos novos workspaces e o `creator_id` das tarefas serão definidos para o ID do usuário logado que está realizando a importação.
   - `assignee_id` será definido como `null` para evitar referências a usuários inexistentes no novo ambiente (ou mantidos caso queira-se correr o risco, mas o ideal é resetar).
5. **Inserção em Lote**:
   - Usaremos `supabase.from('table').insert(array)` para inserir as entidades em lotes, respeitando a ordem de dependência (Workspaces -> Pastas de Workspace -> Projetos -> Pastas -> Listas -> Tarefas).

> [!IMPORTANT]
> **Prevenção de Erros de Banco de Dados**: A geração de novos IDs no frontend e a inserção ordenada garantem que não haverá erro de `Unique Constraint Violation` ou `Foreign Key Constraint Violation`. 

## Componentes a Modificar / Criar

### 1. `src/features/settings/api/importExportApi.ts` [NOVO]
- Funções `exportData(supabase, userId)` e `importData(supabase, userId, jsonData)`.
- Schemas Zod para validação.

### 2. `src/features/settings/components/ImportExportCard.tsx` [NOVO]
- Componente de UI (Card) com botão "Exportar Dados" e "Importar Dados".
- `<input type="file" accept=".json" />` invisível acionado pelo botão de importação.
- Estados de loading (`isExporting`, `isImporting`).

### 3. `src/pages/work/WorkspaceSettings.tsx` [MODIFICAR]
- Incluir o componente `ImportExportCard` na interface.

## Perguntas em Aberto

Nenhuma dúvida bloqueante. A abordagem normalizada com substituição de UUIDs é a mais segura e eficaz para o modelo atual.

## Plano de Teste (Verification Plan)
1. **Automático**: (Se houvesse, rodar testes unitários para a função de mapeamento de IDs).
2. **Manual**:
   - Clicar em "Exportar", verificar se o download do arquivo `conex-backup.json` inicia corretamente e se o conteúdo possui as listas esperadas.
   - Apagar um espaço/projeto para simular perda de dados.
   - Clicar em "Importar", selecionar o JSON.
   - Verificar se o Loading aparece.
   - Verificar se os dados (projetos, tarefas) retornam no frontend com novos IDs, sem sobrepor os antigos.
