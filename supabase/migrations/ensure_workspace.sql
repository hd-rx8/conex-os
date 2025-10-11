-- Script para garantir que existe pelo menos um workspace
-- Execute isto se você não conseguir criar projetos/tarefas

DO $$
DECLARE
  user_id UUID;
  workspace_count INTEGER;
BEGIN
  -- Buscar o primeiro usuário
  SELECT id INTO user_id FROM app_users LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. Faça login primeiro!';
  END IF;

  -- Verificar se já existe workspace para este usuário
  SELECT COUNT(*) INTO workspace_count
  FROM workspaces
  WHERE owner = user_id;

  IF workspace_count = 0 THEN
    -- Criar workspace padrão
    INSERT INTO workspaces (name, description, icon, color, owner)
    VALUES (
      'Workspace Principal',
      'Workspace padrão do sistema',
      '🏢',
      '#3B82F6',
      user_id
    );

    RAISE NOTICE 'Workspace criado com sucesso para o usuário %', user_id;
  ELSE
    RAISE NOTICE 'Usuário já possui % workspace(s)', workspace_count;
  END IF;
END $$;

-- Mostrar workspaces existentes
SELECT
  w.id,
  w.name,
  w.icon,
  u.name as owner_name,
  u.email as owner_email,
  (SELECT COUNT(*) FROM spaces WHERE workspace_id = w.id) as total_projetos
FROM workspaces w
LEFT JOIN app_users u ON w.owner = u.id;
