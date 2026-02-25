-- Migration: Add document (CPF/CNPJ) field to clients table
-- Date: 2026-02-24

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS document TEXT NULL;

COMMENT ON COLUMN clients.document IS 'CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) do cliente';