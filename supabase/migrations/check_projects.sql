-- 1. Verificar TODOS os projetos (spaces) existentes
SELECT * FROM spaces ORDER BY created_at DESC;

-- 2. Verificar TODOS os workspaces
SELECT * FROM workspaces ORDER BY created_at DESC;

-- 3. Verificar projetos SEM workspace (problema!)
SELECT * FROM spaces WHERE workspace_id IS NULL;
