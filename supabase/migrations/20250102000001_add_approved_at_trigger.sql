-- Create function to automatically set approved_at when status changes to 'Aprovada'
CREATE OR REPLACE FUNCTION update_approved_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'Aprovada' and approved_at is not set
  IF NEW.status = 'Aprovada' AND OLD.status != 'Aprovada' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := NOW();
  END IF;

  -- If status is being changed FROM 'Aprovada' to something else, clear approved_at
  IF OLD.status = 'Aprovada' AND NEW.status != 'Aprovada' THEN
    NEW.approved_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_approved_at ON proposals;
CREATE TRIGGER trigger_update_approved_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_approved_at();

-- Add comment to explain the trigger
COMMENT ON FUNCTION update_approved_at() IS 'Automatically sets approved_at timestamp when proposal status changes to Aprovada';
