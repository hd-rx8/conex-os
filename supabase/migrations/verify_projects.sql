-- 1. Ver TODOS os projetos da tabela antiga
SELECT id, title, description, status, color, created_at FROM projects ORDER BY created_at DESC;

-- 2. Contar quantos projetos existem
SELECT COUNT(*) as total_projects FROM projects;

-- 3. Ver quais projetos AINDA NÃO foram migrados para spaces
SELECT p.id, p.title, p.description, p.status
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM spaces s WHERE LOWER(s.name) = LOWER(p.title)
);

-- 4. Ver estrutura completa: Workspaces -> Spaces
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  w.icon as workspace_icon,
  COUNT(s.id) as total_spaces,
  STRING_AGG(s.name, ', ' ORDER BY s.name) as space_names
FROM workspaces w
LEFT JOIN spaces s ON s.workspace_id = w.id
GROUP BY w.id, w.name, w.icon
ORDER BY w.created_at;
