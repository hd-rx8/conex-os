# Walkthrough: Importação e Exportação de Dados

Implementamos com sucesso a funcionalidade de backup e migração de dados do sistema!

## 1. Onde Acessar
Acesse as configurações globais (botão ⚙️ Configurações na barra lateral esquerda). Role para baixo na coluna da direita e você encontrará o novo card **"Backup e Migração"** logo abaixo das configurações de Segurança.

## 2. Exportação (Backup)
Ao clicar no botão **Exportar Dados (.json)**:
- O sistema consulta toda a base de dados em nuvem (`workspaces`, `workspace_folders`, `spaces`, `folders`, `lists`, `tasks`).
- Um arquivo chamado `conex-backup-YYYY-MM-DD.json` será automaticamente baixado no seu navegador contendo todo o estado atual, perfeitamente estruturado.
- Um indicador visual (spinner de carregamento) garante que o usuário saiba que os dados estão sendo processados.

## 3. Importação (Migração Inteligente)
Ao clicar no botão **Importar Dados**:
- Um seletor de arquivos é aberto, filtrando nativamente por `.json`.
- Ao escolher o arquivo, o sistema efetua a **Migração Inteligente**:
  - Valida rigorosamente a estrutura usando a biblioteca `Zod`, prevenindo corrompimentos.
  - Gera **novos UUIDs dinâmicos** para todos os workspaces, projetos e tarefas, garantindo que não colidam com dados existentes no banco.
  - Reconecta inteligentemente as Chaves Estrangeiras (ex: vinculando as tarefas aos seus novos projetos/listas).
  - Altera a autoria do projeto para você (quem está importando) e limpa os campos de "responsável" (`assignee_id`) para evitar referências a usuários inexistentes.
- Uma vez inseridos de forma correta e semântica no banco de dados, você receberá um Toast de Sucesso indicando para recarregar a página e ver os novos workspaces duplicados e prontos para uso.
