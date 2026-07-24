# Novo Fluxo de Exclusão (Projetos e Pastas)

Adicionamos a funcionalidade que permite excluir facilmente pastas e projetos diretamente pela barra lateral do sistema.

## O que foi implementado

### UI da Barra Lateral (`SpacesTreeNav.tsx`)
1. **Dropdown Menu Oculto (Hover):** Ao passar o cursor (hover) por cima de uma Pasta ou um Projeto na barra lateral, um botão de reticências `...` aparecerá sutilmente.
2. **Menu Contextual:** Clicar no botão abrirá um menu dropdown exibindo a opção "Excluir", utilizando um ícone de lixeira (vermelho) para sinalizar a gravidade da ação.
3. **Modal de Confirmação (`AlertDialog`):**
   - **Para Pastas:** Um modal avisa que "os projetos contidos nesta pasta serão mantidos e movidos para a raiz do workspace". Isso reflete a ação do banco (`ON DELETE SET NULL`) para o campo `workspace_folder_id`, oferecendo uma exclusão de organização segura.
   - **Para Projetos:** Um modal adverte que "esta ação é permanente e excluirá todas as listas, pastas e tarefas contidas nele". Isso espelha a ação do banco (`ON DELETE CASCADE`), garantindo que o usuário entenda o impacto antes de confirmar.

### Lógica de Rotas e Dependências
1. **Redirecionamento Automático:** Caso o usuário possua a página do projeto (ex: `/work/project/123...`) aberta e exclua o exato projeto ativo pela barra lateral, a aplicação detecta essa dependência e redireciona automaticamente para a tela principal (`/work`), evitando que ele fique em uma "página vazia" com erro de "Projeto não encontrado".
2. **Uso de Transações no Hook:** Integramos os hooks `useSpaces` e `useWorkspaceFolders` já existentes, onde a exclusão propaga-se de imediato para a API Supabase, e logo em seguida o Toast (`sonner`) notifica o sucesso ou falha, refletindo a estrutura limpa automaticamente.

## Como Testar
1. Abra a aplicação (recarregue se necessário).
2. Na barra lateral (PROJETOS), passe o mouse em cima de uma Pasta.
3. Note o surgimento do botão `...` à direita. Clique e escolha "Excluir".
4. Leia o alerta da Pasta confirmando o comportamento de Set Null. Confirme ou cancele a exclusão.
5. Repita o teste para um Projeto e leia o alerta de exclusão permanente (Cascade).
