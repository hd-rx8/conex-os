# 🗄️ Plano de Otimização do Banco de Dados

## 📊 Estrutura Atual (Problemática)

### ❌ Tabelas Antigas (Sistema Legado - REMOVER)
1. **`projects`** - Sistema antigo de projetos
2. **`tasks`** - Sistema antigo de tarefas
3. **`proposal_services`** - Parece não estar sendo usado

### ✅ Tabelas Novas (Hierarquia - MANTER)
1. **`workspaces`** - Workspace (Setor/Empresa)
2. **`workspace_members`** - Membros do workspace
3. **`spaces`** - Projetos dentro do workspace
4. **`folders`** - Pastas dentro dos projetos (OPCIONAL)
5. **`lists`** - Listas de tarefas
6. **`hierarchy_tasks`** - Tarefas dentro das listas
7. **`subtasks`** - Subtarefas (recursivas)

---

## 🎯 Estrutura Ideal (Simplificada)

```
📦 WORKSPACE (workspace_id)
  └── 📁 PROJETO/SPACE (space_id) ───> workspace_id
       ├── 📂 PASTA/FOLDER (folder_id) ───> space_id [OPCIONAL]
       │    └── 📋 LISTA (list_id) ───> folder_id, space_id
       │         └── ✅ TAREFA (task_id) ───> list_id
       │              └── 🔸 SUBTAREFA (subtask_id) ───> task_id, parent_subtask_id
       │
       └── 📋 LISTA (list_id) ───> space_id (sem folder)
            └── ✅ TAREFA (task_id) ───> list_id
                 └── 🔸 SUBTAREFA (subtask_id) ───> task_id
```

---

## 🔧 Ações de Otimização

### 1️⃣ MIGRAR dados das tabelas antigas
- ✅ `projects` → `spaces` (JÁ FEITO parcialmente)
- ⏳ `tasks` → `hierarchy_tasks` (PENDENTE)

### 2️⃣ REMOVER tabelas desnecessárias
```sql
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS proposal_services CASCADE; -- verificar antes
```

### 3️⃣ RENOMEAR para clareza (OPCIONAL)
```sql
ALTER TABLE hierarchy_tasks RENAME TO tasks;
-- Agora teremos apenas UMA tabela de tarefas
```

### 4️⃣ ADICIONAR constraints faltantes
- Garantir que `list_id` seja NOT NULL em tasks
- Garantir que `workspace_id` seja NOT NULL em spaces
- Adicionar CASCADE em deletes importantes

---

## 📋 Checklist de Execução

### Fase 1: Backup e Análise
- [ ] Fazer backup completo do banco
- [ ] Executar `analyze_database.sql` para mapear estrutura atual
- [ ] Verificar quantos registros existem em cada tabela

### Fase 2: Migração de Dados
- [ ] Migrar `tasks` antiga para `hierarchy_tasks`
- [ ] Verificar integridade dos dados migrados

### Fase 3: Limpeza
- [ ] Remover tabelas antigas (`projects`, `tasks`)
- [ ] Remover tabelas não utilizadas
- [ ] Limpar registros órfãos

### Fase 4: Otimização
- [ ] Renomear `hierarchy_tasks` para `tasks`
- [ ] Adicionar índices necessários
- [ ] Atualizar constraints

### Fase 5: Atualização do Código
- [ ] Atualizar hooks para usar nova estrutura
- [ ] Remover referências a tabelas antigas
- [ ] Testar todas as funcionalidades

---

## ⚠️ Tabelas que Precisam de Análise

1. **`proposal_services`** - Verificar se está em uso
2. **`task_hierarchy`** (view?) - Verificar se é necessária
3. **`list_task_counts`** (view?) - Verificar se é necessária

---

## 🚀 Estrutura Final Esperada

### Core Tables (7 tabelas principais)
1. `workspaces` - Root da hierarquia
2. `workspace_members` - Controle de acesso
3. `spaces` - Projetos (filho de workspace)
4. `folders` - Organização opcional
5. `lists` - Listas de tarefas
6. `tasks` - Tarefas (renomeada de hierarchy_tasks)
7. `subtasks` - Subtarefas infinitas

### Support Tables (outras tabelas do sistema)
- `app_users` - Usuários
- `clients` - Clientes
- `proposals` - Propostas
- `company_settings` - Configurações
- `custom_services` - Serviços customizados
- etc.

---

## 📝 Notas Importantes

1. **RLS**: Deixar para depois da estrutura estável
2. **Índices**: Adicionar após migração completa
3. **Views**: Recriar apenas as necessárias
4. **Triggers**: Manter apenas updated_at e completed_at
