-- Query para verificar projetos (spaces) e seus workspaces
SELECT
  s.id,
  s.name as space_name,
  s.description,
  s.icon,
  s.color,
  s.workspace_id,
  w.name as workspace_name,
  w.icon as workspace_icon,
  s.created_at
FROM spaces s
LEFT JOIN workspaces w ON s.workspace_id = w.id
ORDER BY s.created_at DESC;
