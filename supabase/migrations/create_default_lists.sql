-- Script para criar listas padrão em todos os projetos (spaces) que não têm listas
-- Execute isto para permitir a criação de tarefas

DO $$
DECLARE
  space_record RECORD;
  lists_created INTEGER := 0;
  user_id UUID;
BEGIN
  -- Buscar o primeiro usuário para ser o criador
  SELECT id INTO user_id FROM app_users LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. Faça login primeiro!';
  END IF;

  -- Para cada projeto (space) que não tem listas
  FOR space_record IN
    SELECT s.id, s.name
    FROM spaces s
    WHERE NOT EXISTS (
      SELECT 1 FROM lists WHERE space_id = s.id
    )
  LOOP
    -- Criar lista padrão
    INSERT INTO lists (space_id, name, description, position)
    VALUES (
      space_record.id,
      'Tarefas',
      'Lista padrão de tarefas',
      0
    );

    lists_created := lists_created + 1;
    RAISE NOTICE 'Lista criada para o projeto: %', space_record.name;
  END LOOP;

  RAISE NOTICE '==================================';
  RAISE NOTICE 'Total de listas criadas: %', lists_created;
  RAISE NOTICE '==================================';
END $$;

-- Mostrar resultado: projetos e suas listas
SELECT
  s.name as projeto,
  s.icon,
  COUNT(l.id) as total_listas,
  STRING_AGG(l.name, ', ') as listas
FROM spaces s
LEFT JOIN lists l ON l.space_id = s.id
GROUP BY s.id, s.name, s.icon
ORDER BY s.name;
