-- Migration: Clean invalid organizador_id values in cursos (set to NULL when no matching usuarios)
BEGIN;

-- Set organizador_id to NULL for any non-null value that does not match usuarios.id_usuario
-- Works whether usuarios.id_usuario is text or integer by comparing as text
UPDATE cursos
SET organizador_id = NULL
WHERE organizador_id IS NOT NULL
  AND NOT EXISTS (
    -- comparar ambos como texto para evitar errores si una columna es integer y la otra text
    SELECT 1 FROM usuarios u WHERE u.id_usuario::text = cursos.organizador_id::text
  );

COMMIT;