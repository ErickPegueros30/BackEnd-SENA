-- Agrega la columna 'activo' a la tabla 'credenciales' para persistir estado de usuario
ALTER TABLE credenciales
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Asegurar que filas existentes se consideren activas por defecto
UPDATE credenciales SET activo = TRUE WHERE activo IS NULL;
