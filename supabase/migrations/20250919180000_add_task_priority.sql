-- Add priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority TEXT NOT NULL DEFAULT 'Media' 
CHECK (priority IN ('Baixa', 'Media', 'Alta', 'Urgente'));

-- Update existing tasks to have default priority
UPDATE public.tasks SET priority = 'Media' WHERE priority IS NULL;

-- Add priority to the task_priority enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('Baixa', 'Media', 'Alta', 'Urgente');
    END IF;
END $$;