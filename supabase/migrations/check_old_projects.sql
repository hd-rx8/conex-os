-- 1. Verificar estrutura da tabela projects antiga
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Verificar todos os projetos na tabela antiga
SELECT * FROM projects ORDER BY created_at DESC;

-- 3. Verificar projetos que NÃO estão em spaces
SELECT p.*
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM spaces s WHERE s.name = p.title OR s.id::text = p.id::text
);
