-- Create app_users table
CREATE TABLE public.app_users (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_users
CREATE POLICY "Users can view all profiles" 
ON public.app_users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.app_users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.app_users 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.app_users 
FOR DELETE 
USING (auth.uid() = id);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'Criada' CHECK (status IN ('Criada', 'Enviada', 'Aprovada', 'Rejeitada')),
  owner UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for proposals
CREATE POLICY "Users can view all proposals" 
ON public.proposals 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert proposals" 
ON public.proposals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update all proposals" 
ON public.proposals 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete all proposals" 
ON public.proposals 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();