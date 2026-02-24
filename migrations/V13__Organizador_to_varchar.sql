-- Migration: Ensure cursos.organizador_id is VARCHAR(10) and FK matches usuarios(id_usuario)
BEGIN;

-- Drop existing FK if present (name may differ)
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS fk_cursos_organizador;

-- Convert column to text/varchar safely (works if currently integer or varchar)
ALTER TABLE cursos ALTER COLUMN organizador_id TYPE VARCHAR(10) USING organizador_id::text;

-- Add FK constraint referencing usuarios(id_usuario)
ALTER TABLE cursos ADD CONSTRAINT fk_cursos_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_cursos_organizador_id ON cursos(organizador_id);

COMMIT;
