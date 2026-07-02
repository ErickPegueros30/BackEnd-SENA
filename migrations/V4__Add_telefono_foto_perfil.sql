-- Agrega columnas 'telefono' y 'foto_perfil' a la tabla 'usuarios' y/o 'credenciales' según diseño
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);

-- Guardaremos la ruta relativa de la foto en la tabla usuarios como foto_perfil
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);
