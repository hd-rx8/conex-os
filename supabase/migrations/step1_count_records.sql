-- Verificar quantos registros serão afetados
SELECT 'workspaces' as table_name, COUNT(*) as total FROM workspaces
UNION ALL
SELECT 'workspace_members', COUNT(*) FROM workspace_members
UNION ALL
SELECT 'spaces', COUNT(*) FROM spaces
UNION ALL
SELECT 'folders', COUNT(*) FROM folders
UNION ALL
SELECT 'lists', COUNT(*) FROM lists
UNION ALL
SELECT 'hierarchy_tasks', COUNT(*) FROM hierarchy_tasks
UNION ALL
SELECT 'subtasks', COUNT(*) FROM subtasks
UNION ALL
SELECT 'projects (OLD)', COUNT(*) FROM projects
UNION ALL
SELECT 'tasks (OLD)', COUNT(*) FROM tasks
UNION ALL
SELECT 'proposal_services', COUNT(*) FROM proposal_services
ORDER BY table_name;
