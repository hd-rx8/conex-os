-- Add approved_at column to proposals table to track when proposals are approved
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on approved_at
CREATE INDEX IF NOT EXISTS idx_proposals_approved_at ON proposals(approved_at);

-- Add comment to explain the column
COMMENT ON COLUMN proposals.approved_at IS 'Timestamp when the proposal was approved (status changed to Aprovada)';
