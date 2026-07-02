-- Migration: Convert organizador_id from VARCHAR to INTEGER and add FK
BEGIN;

-- Add temporary integer column
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS organizador_id_int INTEGER;

-- Populate integer column when current organizador_id contains only digits
UPDATE cursos SET organizador_id_int = (CASE WHEN organizador_id ~ '^[0-9]+$' THEN organizador_id::integer ELSE NULL END);

-- Attempt to drop possible existing FK constraint (name may differ; IF EXISTS avoids error)
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_organizador_id_fkey;

-- Drop old varchar column (data already copied to organizador_id_int when numeric)
ALTER TABLE cursos DROP COLUMN IF EXISTS organizador_id CASCADE;

-- Rename temporary column to organizador_id
ALTER TABLE cursos RENAME COLUMN organizador_id_int TO organizador_id;

-- Add FK constraint to usuarios(id_usuario)
ALTER TABLE cursos ADD CONSTRAINT fk_cursos_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id_usuario);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cursos_organizador_id ON cursos(organizador_id);

COMMIT;