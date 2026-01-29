-- Agrega la columna 'ultima_actividad' a la tabla 'credenciales' para registrar el último inicio
ALTER TABLE credenciales
ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMP WITH TIME ZONE NULL;

-- No establecer valor por defecto; se actualizará al iniciar sesión o desde la app
