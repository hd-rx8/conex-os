-- Migrate old projects table to new spaces hierarchy system (FIXED)
-- This ensures all old projects are preserved and properly linked to workspaces

DO $$
DECLARE
  default_workspace_id UUID;
  projects_migrated INTEGER := 0;
  project_record RECORD;
BEGIN
  -- Get or create a default workspace for migration
  SELECT id INTO default_workspace_id
  FROM workspaces
  WHERE name = 'Projetos Migrados'
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    -- Create migration workspace if it doesn't exist
    INSERT INTO workspaces (name, description, icon, color, owner)
    VALUES (
      'Projetos Migrados',
      'Projetos migrados do sistema antigo',
      '📦',
      '#6B7280',
      (SELECT id FROM app_users ORDER BY created_at ASC LIMIT 1)
    )
    RETURNING id INTO default_workspace_id;

    RAISE NOTICE 'Created migration workspace with ID: %', default_workspace_id;
  END IF;

  -- Migrate projects from old table to spaces
  FOR project_record IN
    SELECT p.*
    FROM projects p
    WHERE NOT EXISTS (
      -- Check if already migrated (by title)
      SELECT 1
      FROM spaces s
      WHERE s.name = p.title
    )
  LOOP
    -- Insert into spaces table
    INSERT INTO spaces (
      workspace_id,
      name,
      description,
      icon,
      color,
      position,
      created_at,
      updated_at
    )
    VALUES (
      default_workspace_id,
      project_record.title,
      COALESCE(project_record.description, NULL),
      '📁', -- Default icon for migrated projects
      '#3B82F6', -- Default blue color for migrated projects
      0, -- Default position
      COALESCE(project_record.created_at, NOW()),
      COALESCE(project_record.updated_at, NOW())
    );

    projects_migrated := projects_migrated + 1;
  END LOOP;

  RAISE NOTICE 'Migrated % projects from old table to spaces', projects_migrated;

  -- Fix any remaining orphan spaces
  UPDATE spaces
  SET workspace_id = default_workspace_id
  WHERE workspace_id IS NULL;

  RAISE NOTICE 'Fixed orphan spaces';

END $$;

-- Verify migration results
SELECT
  w.name as workspace,
  w.icon as workspace_icon,
  COUNT(s.id) as project_count,
  STRING_AGG(s.name, ', ' ORDER BY s.name) as projects
FROM workspaces w
LEFT JOIN spaces s ON s.workspace_id = w.id
GROUP BY w.id, w.name, w.icon
ORDER BY w.created_at;

-- Show all spaces with their workspace
SELECT
  s.name as space_name,
  s.description,
  s.icon,
  s.color,
  w.name as workspace_name,
  s.created_at
FROM spaces s
LEFT JOIN workspaces w ON s.workspace_id = w.id
ORDER BY s.created_at DESC;
