-- Agregar columna 'tipo' a la tabla ensayos
ALTER TABLE ensayos
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'principal';

-- Opcional: crear índice para búsquedas rápidas por tipo
CREATE INDEX IF NOT EXISTS idx_ensayos_tipo ON ensayos(tipo);
 