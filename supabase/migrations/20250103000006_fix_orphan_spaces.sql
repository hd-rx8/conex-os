-- Fix orphan spaces (projects without workspace_id)
-- This migration assigns orphan spaces to a default workspace or the first available workspace

DO $$
DECLARE
  default_workspace_id UUID;
  orphan_count INTEGER;
BEGIN
  -- Count orphan spaces
  SELECT COUNT(*) INTO orphan_count FROM spaces WHERE workspace_id IS NULL;

  RAISE NOTICE 'Found % orphan spaces', orphan_count;

  IF orphan_count > 0 THEN
    -- Try to get the first workspace
    SELECT id INTO default_workspace_id FROM workspaces ORDER BY created_at ASC LIMIT 1;

    IF default_workspace_id IS NOT NULL THEN
      -- Assign orphan spaces to the first workspace
      UPDATE spaces
      SET workspace_id = default_workspace_id
      WHERE workspace_id IS NULL;

      RAISE NOTICE 'Assigned % orphan spaces to workspace %', orphan_count, default_workspace_id;
    ELSE
      -- No workspace exists, create a default one
      INSERT INTO workspaces (name, description, icon, color, owner)
      VALUES (
        'Default Workspace',
        'Workspace padrão criado automaticamente',
        '🏢',
        '#3B82F6',
        (SELECT id FROM app_users ORDER BY created_at ASC LIMIT 1)
      )
      RETURNING id INTO default_workspace_id;

      -- Assign orphan spaces to the new default workspace
      UPDATE spaces
      SET workspace_id = default_workspace_id
      WHERE workspace_id IS NULL;

      RAISE NOTICE 'Created default workspace and assigned % orphan spaces', orphan_count;
    END IF;
  ELSE
    RAISE NOTICE 'No orphan spaces found';
  END IF;
END $$;

-- Verificar resultado
SELECT
  s.id,
  s.name as space_name,
  s.workspace_id,
  w.name as workspace_name
FROM spaces s
LEFT JOIN workspaces w ON s.workspace_id = w.id
ORDER BY s.created_at DESC;
