# Documentação: Sistema de Navegação por Módulos

## Visão Geral

Este documento descreve a implementação do sistema de navegação por módulos no CONEX.HUB, que permite alternar entre os módulos CRM e Work Management com uma navegação lateral (sidebar) específica para cada módulo.

## Funcionalidades Implementadas

### 1. Módulos Separados

O sistema agora suporta dois módulos distintos:

- **CRM**: Gerenciamento de propostas, pipeline e clientes
- **Work Management**: Gerenciamento de projetos e tarefas

### 2. Navegação Contextual

- A sidebar exibe apenas os itens relevantes para o módulo ativo
- Itens de navegação específicos para cada módulo:
  - **CRM**: Dashboard, Gerador, Propostas, Pipeline, Clientes, Configurações
  - **Work Management**: Projetos (Visão Geral, Minhas Tarefas, Quadro Kanban), Configurações

### 3. App Switcher

- Ícone de grid (9 pontos) para alternar entre módulos
- Modal com opções de módulos disponíveis
- Indicação visual do módulo ativo
- Opção "Descobrir" (desabilitada) para futuros módulos

### 4. Proteção de Rotas

- Rotas protegidas por módulo (ex: rotas de CRM só são acessíveis no módulo CRM)
- Redirecionamento automático para a rota principal do módulo correto

### 5. Persistência de Estado

- O módulo ativo é salvo no localStorage
- O estado do sidebar (expandido/colapsado) é persistido separadamente
- Restauração automática do estado ao recarregar a página

## Componentes Principais

### AppModuleContext

Contexto global para gerenciar o módulo ativo:

```tsx
// src/context/AppModuleContext.tsx
export type AppModuleType = 'crm' | 'work';

interface AppModuleContextType {
  activeModule: AppModuleType;
  setActiveModule: (module: AppModuleType) => void;
  switchToModule: (module: AppModuleType) => void;
}
```

### NavigationSidebar

Sidebar responsiva que exibe itens com base no módulo ativo:

```tsx
// src/components/NavigationSidebar.tsx
// Definição dos itens de navegação para o módulo CRM
const NAV_CRM: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  // ...outros itens
];

// Definição dos itens de navegação para o módulo Work Management
const NAV_WORK: NavigationItem[] = [
  {
    id: 'projects',
    label: 'Projetos',
    icon: FolderOpen,
    children: [
      // ...itens filhos
    ]
  },
  // ...outros itens
];
```

### ModuleProtectedRoute

Componente para proteger rotas com base no módulo ativo:

```tsx
// src/components/ModuleProtectedRoute.tsx
const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  children,
  requiredModule,
  redirectTo = '/'
}) => {
  const { activeModule } = useAppModule();

  if (activeModule !== requiredModule) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
```

### AppSwitcher

Componente para alternar entre módulos:

```tsx
// src/components/AppSwitcher.tsx
const AppSwitcher = () => {
  // ...
  const { activeModule, switchToModule } = useAppModule();
  
  const apps: AppOption[] = [
    {
      id: 'crm',
      name: 'CRM',
      // ...
    },
    {
      id: 'work',
      name: 'Work Management',
      // ...
    },
  ];
  
  const handleSelectApp = (moduleId: AppModuleType, path: string) => {
    switchToModule(moduleId);
    setOpen(false);
  };
  
  // ...
};
```

## Fluxo de Navegação

1. O usuário acessa o sistema e o módulo salvo é restaurado do localStorage
2. A sidebar exibe apenas os itens de navegação do módulo ativo
3. O usuário pode alternar entre módulos através do AppSwitcher
4. Ao trocar de módulo:
   - O novo módulo é salvo no localStorage
   - O usuário é redirecionado para a página principal do módulo
   - A sidebar é atualizada para mostrar os itens relevantes

## Proteção de Rotas

As rotas são protegidas com base no módulo ativo:

```tsx
// src/App.tsx
<Route 
  path="/clients"
  element={
    user ? (
      <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
        <Clients />
      </ModuleProtectedRoute>
    ) : <Navigate to="/login" replace />
  } 
/>

<Route 
  path="/projects"
  element={
    user ? (
      <ModuleProtectedRoute requiredModule="work" redirectTo="/">
        <ProjectsOverview />
      </ModuleProtectedRoute>
    ) : <Navigate to="/login" replace />
  } 
/>
```

## Acessibilidade

- Todos os botões possuem `aria-label` para leitores de tela
- Tooltips para ícones quando o sidebar está colapsado
- Navegação por teclado suportada em todos os componentes
- Contraste adequado para todos os elementos visuais

## Responsividade

- Sidebar colapsável para economizar espaço em telas menores
- Versão mobile com drawer lateral e botão de toggle
- Layout adaptativo para diferentes tamanhos de tela

## Extensibilidade

O sistema foi projetado para ser facilmente extensível:

1. Para adicionar um novo módulo:
   - Adicione um novo tipo ao `AppModuleType`
   - Crie um novo array de itens de navegação para o módulo
   - Adicione o módulo ao `AppSwitcher`

2. Para adicionar novos itens de navegação:
   - Adicione o item ao array correspondente ao módulo
   - Se necessário, proteja as rotas com `ModuleProtectedRoute`

## Considerações de Performance

- Uso de `useMemo` para evitar recálculos desnecessários
- Lazy loading de componentes para melhorar o tempo de carregamento
- Persistência eficiente no localStorage

## Tecnologias Utilizadas

- React Context API para gerenciamento de estado global
- React Router para navegação e proteção de rotas
- localStorage para persistência de estado
- Shadcn UI para componentes de interface
- Lucide React para ícones consistentes
