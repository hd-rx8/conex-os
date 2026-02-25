# CONEX.HUB — Sistema de Proposta

> Plataforma web completa para gestão de propostas comerciais, CRM e gerenciamento de projetos.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Executando Localmente](#executando-localmente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Segurança](#segurança)

---

## Visão Geral

O **CONEX.HUB** é um sistema de gestão comercial voltado para empresas que precisam gerenciar clientes, oportunidades, propostas comerciais e projetos internos em um só lugar. A plataforma é dividida em dois módulos principais:

- **Módulo CRM** — Gestão de clientes, oportunidades e propostas comerciais
- **Módulo Work** — Gerenciamento de projetos, tarefas e workspaces

---

## Funcionalidades

### 🧭 Dashboard
- Visão geral das métricas comerciais (propostas enviadas, aprovadas, taxa de conversão, receita estimada)
- Gráfico de propostas por mês (barras)
- Funil de vendas visual com distribuição por status
- Tabela de propostas recentes com status e valor

### 👥 Módulo CRM

#### Clientes (`/clients`)
- Cadastro completo de clientes com nome, e-mail, telefone, empresa e CPF/CNPJ
- Listagem com busca e filtros
- Edição e exclusão de clientes
- Painel de detalhes lateral com histórico do cliente

#### Oportunidades & Propostas (`/opportunities`)
- Pipeline visual de propostas em estilo kanban
- Visualização em tabela com ordenação por colunas
- Filtros por status: Rascunho, Enviada, Em Negociação, Aprovada, Rejeitada, Expirada
- Criação e edição de propostas com gerador de cotação integrado
- Geração de link público para envio de proposta ao cliente (`/p/:share_token`)
- Impressão de proposta em PDF (`/proposals/:id/print`)

#### Gerador de Cotação (`/generator`)
- Assistente em etapas (wizard) para criação de propostas:
  1. **Seleção de Cliente** — busca e seleção do cliente existente ou criação inline
  2. **Informações da Proposta** — título, validade, moeda
  3. **Itens e Serviços** — adição de produtos/serviços com quantidade e valor unitário
  4. **Revisão e Envio** — resumo completo antes de salvar

### 🗂️ Módulo Work (Gestão de Projetos)

#### Work Management (`/work`)
- Estrutura hierárquica: **Workspaces → Projetos → Listas → Tarefas → Subtarefas**
- Navegação em painel lateral com workspaces e projetos organizados

#### Projetos (`/work/project/:id`)
- Visualização de detalhes do projeto
- Gestão de tarefas com status, prioridade e responsáveis
- Drag-and-drop para reordenação de tarefas

#### Listas (`/work/list/:listId`)
- Visualização de tarefas por lista
- Filtros por status e prioridade
- Criação rápida de tarefas

#### Configurações de Workspace (`/work/workspaces`)
- Criação e edição de workspaces
- Gerenciamento de membros e permissões

### ⚙️ Configurações (`/settings`)
- **Aparência:** Alternância entre modo claro/escuro
- **Temas de Gradiente:** Andromeda, Nebula e Quasar
- **Preferências Regionais:** Seleção de moeda padrão (BRL, USD, EUR, GBP, etc.)

### 👤 Usuários e Autenticação
- Login e cadastro com e-mail/senha via Supabase Auth
- Recuperação de senha por e-mail
- Gerenciamento de usuários do sistema (`/users`)
- Sessão persistente com refresh automático de token

---

## Stack Tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | 18.x | Framework de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Vite** | 5.x | Bundler e dev server |
| **Tailwind CSS** | 3.x | Estilização utilitária |
| **shadcn/ui** | — | Componentes de interface |
| **Supabase** | 2.x | Backend, Auth e Banco de Dados |
| **TanStack Query** | 5.x | Cache e fetching de dados |
| **React Router** | 6.x | Roteamento SPA |
| **React Hook Form** | 7.x | Gerenciamento de formulários |
| **Recharts** | 2.x | Gráficos e dashboards |
| **DND Kit** | 6.x | Drag-and-drop |
| **jsPDF + html2canvas** | — | Exportação para PDF |
| **Zod** | 3.x | Validação de esquemas |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) **v18** ou superior
- [npm](https://npmjs.com/) **v9** ou superior (ou `pnpm`)
- Uma conta no [Supabase](https://supabase.com/) (gratuita)

---

## Configuração do Ambiente

### 1. Clone o repositório

```bash
git clone https://github.com/hd-rx8/SISTEMA-DE-PROPOSTA.git
cd SISTEMA-DE-PROPOSTA
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie um novo projeto
2. Após criar o projeto, vá em **Project Settings → API**
3. Copie os seguintes valores:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project ID** → `VITE_SUPABASE_PROJECT_ID`
   - **anon / public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

> ⚠️ **Nunca use a `service_role` key no frontend!** Ela dá acesso administrativo total e deve ficar apenas em servidores seguros.

### 3. Crie o arquivo `.env`

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id_aqui"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key_aqui"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

### 4. Instale as dependências

```bash
npm install
# ou com pnpm:
pnpm install
```

### 5. Execute as migrations do banco de dados

As migrations estão na pasta `supabase/migrations/`. Para aplicá-las, utilize o [Supabase CLI](https://supabase.com/docs/guides/cli) ou execute os scripts SQL manualmente via **SQL Editor** no dashboard do Supabase.

---

## Executando Localmente

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera o build de produção em `/dist` |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa o ESLint para verificar o código |

---

## Estrutura do Projeto

```
SISTEMA-DE-PROPOSTA/
├── public/                  # Assets estáticos (favicon, imagens)
├── src/
│   ├── components/          # Componentes reutilizáveis da UI
│   │   └── ui/              # Componentes base do shadcn/ui
│   ├── context/             # Contextos React globais
│   │   ├── AppModuleContext  # Controle do módulo ativo (CRM/Work)
│   │   ├── CurrencyContext   # Preferências de moeda
│   │   ├── GradientThemeContext # Temas visuais
│   │   └── QuoteWizardContext   # Estado do gerador de cotação
│   ├── hooks/               # Custom hooks
│   │   ├── useClients.ts    # CRUD de clientes
│   │   ├── useProposals.ts  # CRUD de propostas
│   │   ├── useQuoteGenerator.ts # Lógica do gerador de cotação
│   │   ├── useWorkspaces.ts # Gestão de workspaces
│   │   ├── useProjects.ts   # Gestão de projetos
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Cliente do Supabase (usa variáveis de ambiente)
│   │       └── types.ts     # Tipos gerados automaticamente do banco
│   ├── pages/               # Páginas da aplicação
│   │   ├── crm/             # Páginas do módulo CRM
│   │   ├── work/            # Páginas do módulo Work
│   │   ├── projects/        # Páginas de projetos
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── Settings.tsx
│   └── App.tsx              # Roteamento principal
├── supabase/
│   └── migrations/          # Migrations do banco de dados
├── .env                     # ⚠️ NÃO commitar — credenciais locais
├── .env.example             # Template de variáveis de ambiente
├── .gitignore
└── package.json
```

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/pública do Supabase | ✅ Sim |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | ✅ Sim |

---

## Segurança

- O arquivo `.env` está no `.gitignore` e **nunca deve ser commitado**
- Todas as credenciais do Supabase são carregadas via `import.meta.env` (Vite)
- Apenas a chave `anon/publishable` é usada no frontend
- As políticas de Row Level Security (RLS) do Supabase protegem os dados por usuário
- Autenticação gerenciada inteiramente pelo Supabase Auth com refresh token automático

---

## 📄 Licença

Este projeto é privado e de uso interno. Todos os direitos reservados © 2026 CONEX.HUB.
