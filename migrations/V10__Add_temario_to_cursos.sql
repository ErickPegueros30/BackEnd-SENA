-- Migration: Add temario JSONB field to cursos
BEGIN;

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS temario JSONB DEFAULT '[]'::jsonb;

COMMIT;
