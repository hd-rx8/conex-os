-- Migration corretiva: ajusta a tabela company_settings já existente
-- Usa ALTER TABLE para ser segura com dados existentes

-- 1. Adiciona as colunas que faltam (IF NOT EXISTS é seguro)
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS cnpj       text,
  ADD COLUMN IF NOT EXISTS phone      text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS website    text,
  ADD COLUMN IF NOT EXISTS address    text,
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS state      text,
  ADD COLUMN IF NOT EXISTS zip_code   text,
  ADD COLUMN IF NOT EXISTS logo_url   text;

-- 2. Torna company_name nullable (já que o app salva campos opcionais)
ALTER TABLE public.company_settings
  ALTER COLUMN company_name DROP NOT NULL;

-- 3. Garante que user_id não seja nulo
ALTER TABLE public.company_settings
  ALTER COLUMN user_id SET NOT NULL;

-- 4. Adiciona a constraint UNIQUE em user_id (necessária para o upsert)
--    Usando bloco DO para verificar antes de criar (evita erro se já existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_settings_user_id_key'
      AND conrelid = 'public.company_settings'::regclass
  ) THEN
    ALTER TABLE public.company_settings
      ADD CONSTRAINT company_settings_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- 5. Garante que RLS está ativo
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 6. Recria as políticas (remove primeiro para ser idempotente)
DROP POLICY IF EXISTS "Users can view their own company settings"   ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete their own company settings" ON public.company_settings;

CREATE POLICY "Users can view their own company settings"
  ON public.company_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
  ON public.company_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON public.company_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings"
  ON public.company_settings FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Função e trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_settings_updated_at ON public.company_settings;

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_settings_updated_at();
