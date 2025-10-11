-- Remove the old check constraint
ALTER TABLE public.proposals DROP CONSTRAINT proposals_status_check;

-- Add the new check constraint with the 'Negociando' status
ALTER TABLE public.proposals ADD CONSTRAINT proposals_status_check 
CHECK (status IN ('Criada', 'Enviada', 'Aprovada', 'Rejeitada', 'Negociando', 'Rascunho'));
