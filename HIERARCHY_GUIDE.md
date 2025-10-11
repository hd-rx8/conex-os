# 📚 Guia de Hierarquia Organizacional - 6 Níveis

## 🎯 Visão Geral

Sistema completo de hierarquia organizacional com 6 níveis flexíveis:

```
Workspace (🏢)
└── Space (📁)
    ├── Folder (📂) [OPCIONAL]
    │   └── List (📋)
    │       └── Task (✅)
    │           └── Subtask (↳) [INFINITO]
    └── List (📋) [Direto no Space]
        └── Task (✅)
            └── Subtask (↳)
```

## 📊 Estrutura dos Níveis

### 1. **Workspace** 🏢
- **Descrição**: Organização completa
- **Características**:
  - Usuários podem ter acesso a múltiplos workspaces
  - Sistema de membros com roles: `owner`, `admin`, `member`, `viewer`
  - Personalização: nome, descrição, ícone, cor

**Exemplo de uso:**
```typescript
import { useWorkspaces } from '@/hooks/useWorkspaces';

const { workspaces, createWorkspace } = useWorkspaces();

await createWorkspace({
  name: "Minha Empresa",
  description: "Workspace principal",
  icon: "🏢",
  color: "#3B82F6",
  owner: userId
});
```

---

### 2. **Space** 📁
- **Descrição**: Departamentos/Equipes
- **Características**:
  - Pertence a um Workspace
  - Define `custom_statuses` (herdáveis)
  - Posicionamento com `position`

**Exemplo de uso:**
```typescript
import { useSpaces } from '@/hooks/useSpaces';

const { spaces, createSpace } = useSpaces(workspaceId);

await createSpace({
  workspace_id: workspaceId,
  name: "Desenvolvimento",
  icon: "💻",
  custom_statuses: [
    { name: "Em Análise", color: "#FFA500" },
    { name: "Em Desenvolvimento", color: "#0000FF" },
    { name: "Em Testes", color: "#FFFF00" }
  ]
});
```

---

### 3. **Folder** 📂
- **Descrição**: Agrupador OPCIONAL de projetos
- **Características**:
  - Pertence a um Space
  - **OPCIONAL** - Lists podem estar direto no Space
  - Pode herdar ou sobrescrever `custom_statuses`

**Exemplo de uso:**
```typescript
import { useFolders } from '@/hooks/useSpaces';

const { folders, createFolder } = useFolders(spaceId);

await createFolder({
  space_id: spaceId,
  name: "Projetos 2025",
  icon: "📂",
  custom_statuses: null // herda do Space
});
```

---

### 4. **List** 📋
- **Descrição**: Lista de tarefas similares
- **Características**:
  - **DEVE** estar em um Space
  - **PODE** estar em um Folder (opcional)
  - Herda `custom_statuses` do Folder ou Space

**Exemplo de uso:**
```typescript
import { useLists } from '@/hooks/useSpaces';

// Lista direto no Space
const { lists, createList } = useLists(spaceId);

await createList({
  space_id: spaceId,
  folder_id: null, // sem folder
  name: "Backlog Sprint 1"
});

// Lista dentro de um Folder
await createList({
  space_id: spaceId,
  folder_id: folderId,
  name: "Features"
});
```

---

### 5. **Task** ✅
- **Descrição**: Tarefa individual
- **Características**:
  - **SÓ** existe dentro de Lists
  - Campos completos: título, descrição, status, prioridade, datas, assignee
  - Tags, estimativa de horas, horas reais
  - Trigger automático para `completed_at`

**Exemplo de uso:**
```typescript
import { useHierarchyTasks } from '@/hooks/useHierarchyTasks';

const { tasks, createTask } = useHierarchyTasks(listId);

await createTask({
  list_id: listId,
  title: "Implementar login",
  description: "Sistema de autenticação com JWT",
  status: "Pendente",
  priority: "Alta",
  due_date: "2025-01-15",
  assignee_id: userId,
  creator_id: currentUserId,
  tags: ["backend", "auth"],
  estimated_hours: 8
});
```

---

### 6. **Subtask** ↳
- **Descrição**: Decomposição de tarefa (aninhamento infinito)
- **Características**:
  - Pertence a uma Task
  - Pode ter `parent_subtask_id` (aninhamento infinito!)
  - Sistema de árvore recursiva

**Exemplo de uso:**
```typescript
import { useSubtasks } from '@/hooks/useHierarchyTasks';

const { subtasks, createSubtask } = useSubtasks(taskId);

// Subtask nível 1
const { data: subtask1 } = await createSubtask({
  task_id: taskId,
  title: "Criar schema do banco",
  creator_id: userId
});

// Subtask nível 2 (filha da anterior)
await createSubtask({
  task_id: taskId,
  parent_subtask_id: subtask1.id,
  title: "Adicionar índices",
  creator_id: userId
});
```

---

## 🔐 Sistema de Permissões

### Roles de Workspace

| Role | Visualizar | Criar | Editar | Deletar | Gerenciar Membros |
|------|-----------|-------|--------|---------|-------------------|
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **member** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

**Uso:**
```typescript
import { getPermissionsByRole } from '@/types/hierarchy';

const permissions = getPermissionsByRole('member');
// { canView: true, canCreate: true, canEdit: true, canDelete: false, canManageMembers: false }
```

---

## 🎨 Herança de Configurações

### Custom Statuses (Cascata)

O sistema usa herança inteligente:

1. **List** verifica se tem `custom_statuses`
2. Se não tiver → herda do **Folder** (se existir)
3. Se ainda não tiver → herda do **Space**

**Função auxiliar no banco:**
```sql
SELECT * FROM get_inherited_statuses('list_id_aqui');
```

**No código:**
```typescript
import { useInheritedStatuses } from '@/hooks/useHierarchyTasks';

const { statuses } = useInheritedStatuses(listId);
// Retorna os status herdados automaticamente
```

---

## 🌳 Componente de Navegação

Use o `HierarchyNavigator` para mostrar a estrutura completa:

```typescript
import HierarchyNavigator from '@/components/HierarchyNavigator';
import { useWorkspaces } from '@/hooks/useWorkspaces';

function MyComponent() {
  const { getWorkspaceTree } = useWorkspaces();
  const [workspaceTree, setWorkspaceTree] = useState(null);

  useEffect(() => {
    const loadTree = async () => {
      const tree = await getWorkspaceTree(workspaceId);
      setWorkspaceTree(tree);
    };
    loadTree();
  }, [workspaceId]);

  return (
    <HierarchyNavigator
      workspace={workspaceTree}
      selectedListId={currentListId}
      onSelectList={(listId) => setCurrentListId(listId)}
      onCreateSpace={(wId) => handleCreateSpace(wId)}
      onCreateFolder={(sId) => handleCreateFolder(sId)}
      onCreateList={(sId, fId) => handleCreateList(sId, fId)}
    />
  );
}
```

---

## 🚀 Como Começar

### 1. Rodar a Migration

```bash
# Na pasta do projeto
cd "C:\Users\PICHAU\OneDrive\Documentos\sistema de proposta"
npx supabase db push
```

### 2. Criar seu Primeiro Workspace

```typescript
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSession } from '@/hooks/useSession';

function CreateWorkspace() {
  const { user } = useSession();
  const { createWorkspace } = useWorkspaces();

  const handleCreate = async () => {
    await createWorkspace({
      name: "Meu Workspace",
      owner: user.id
    });
  };

  return <button onClick={handleCreate}>Criar</button>;
}
```

### 3. Adicionar Spaces, Folders e Lists

Siga a hierarquia de cima para baixo:
1. Workspace (já criado)
2. Space
3. Folder (opcional) ou List direta
4. Tasks
5. Subtasks

---

## 📋 Exemplos Práticos

### Exemplo 1: Software House

```
🏢 Workspace: "Tech Solutions"
  📁 Space: "Desenvolvimento"
    📂 Folder: "Projetos Ativos"
      📋 List: "Sistema ERP - Cliente X"
        ✅ Task: "Módulo Financeiro"
          ↳ Subtask: "CRUD de Contas a Pagar"
          ↳ Subtask: "Relatório de Fluxo de Caixa"
    📋 List: "Backlog Geral" (sem folder)
  📁 Space: "Design"
    📋 List: "UI/UX Sprint 1"
```

### Exemplo 2: Agência de Marketing

```
🏢 Workspace: "Marketing Pro"
  📁 Space: "Campanhas 2025"
    📂 Folder: "Cliente A"
      📋 List: "Instagram"
      📋 List: "Google Ads"
    📂 Folder: "Cliente B"
      📋 List: "Facebook"
```

---

## 🔍 Queries Úteis

### Ver hierarquia completa de uma task
```typescript
const { data } = await supabase
  .from('task_hierarchy')
  .select('*')
  .eq('task_id', taskId);
```

### Contar tarefas por lista
```typescript
const { data } = await supabase
  .from('list_task_counts')
  .select('*');
```

---

## ⚠️ Regras Importantes

1. ✅ **Folders são OPCIONAIS** - Lists podem estar direto em Spaces
2. ✅ **Tasks SÓ existem em Lists** - não podem estar soltas
3. ✅ **Subtasks podem ter infinitos níveis** - use `parent_subtask_id`
4. ✅ **Custom statuses são herdados** - defina no nível mais alto possível
5. ✅ **RLS está ativo** - apenas membros do workspace veem os dados

---

## 🛠️ Troubleshooting

### Erro: "List must have space"
- **Causa**: Tentou criar List sem `space_id`
- **Solução**: Sempre passe `space_id` ao criar uma List

### Erro: "Permission denied"
- **Causa**: Usuário não é membro do workspace
- **Solução**: Adicione o usuário como membro:
```typescript
const { addMember } = useWorkspaceMembers(workspaceId);
await addMember({
  workspace_id: workspaceId,
  user_id: userId,
  role: 'member'
});
```

---

## 📦 Arquivos Criados

- ✅ `supabase/migrations/20250103000000_create_organizational_hierarchy.sql`
- ✅ `src/types/hierarchy.ts`
- ✅ `src/hooks/useWorkspaces.ts`
- ✅ `src/hooks/useSpaces.ts`
- ✅ `src/hooks/useHierarchyTasks.ts`
- ✅ `src/components/HierarchyNavigator.tsx`

---

## 🎓 Próximos Passos

1. Rodar a migration no banco
2. Criar página de gerenciamento de Workspaces
3. Implementar drag-and-drop para reordenar
4. Adicionar filtros e buscas avançadas
5. Dashboard com métricas por Space/Folder/List

Boa sorte! 🚀
