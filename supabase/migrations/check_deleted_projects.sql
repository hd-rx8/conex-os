-- Verificar projetos que foram "excluídos"
SELECT
  id,
  title,
  status,
  created_at,
  updated_at
FROM projects
WHERE title = 'Teste' OR title = 'teste'
ORDER BY created_at DESC;

-- Ver todos os status possíveis
SELECT DISTINCT status FROM projects;

-- Ver se o projeto foi deletado das spaces (nova hierarquia)
SELECT
  id,
  name,
  workspace_id,
  created_at
FROM spaces
WHERE LOWER(name) = 'teste'
ORDER BY created_at DESC;
