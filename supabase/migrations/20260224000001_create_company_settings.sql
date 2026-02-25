-- Migration: create company_settings table
-- Each user has one company profile (1:1 with auth.users)

CREATE TABLE IF NOT EXISTS public.company_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  text,
  cnpj          text,
  phone         text,
  email         text,
  website       text,
  address       text,
  city          text,
  state         text,
  zip_code      text,
  logo_url      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own company settings
CREATE POLICY "Users can view their own company settings"
  ON public.company_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
  ON public.company_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON public.company_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings"
  ON public.company_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_settings_updated_at();
