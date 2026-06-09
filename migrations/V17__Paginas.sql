-- Active: 1769806382337@@localhost@5433@SENA
-- V17__Paginas.sql
-- Tablas para la gestión de páginas (módulo "paginas"), enfocadas en `home`.

BEGIN;

-- Tabla principal para secciones de la página Home
CREATE TABLE IF NOT EXISTS p_home (
  id_home SERIAL PRIMARY KEY,
  seccion VARCHAR(150) NOT NULL,
  contenido TEXT,
  usuario_cambio VARCHAR(10)
);

-- Carrousel / galería asociado a p_home
CREATE TABLE IF NOT EXISTS p_home_carrusel (
  id_carrusel SERIAL PRIMARY KEY,
  id_home INT NOT NULL REFERENCES p_home(id_home) ON DELETE CASCADE,
  ubicacion VARCHAR(1024) NOT NULL,
  estatus BOOLEAN NOT NULL DEFAULT true,
  orden INT DEFAULT 0
);

-- Bitácora de cambios (puede referenciar a p_home)
CREATE TABLE IF NOT EXISTS p_bitacora (
  id SERIAL PRIMARY KEY,
  id_pagina INT REFERENCES p_home(id_home) ON DELETE SET NULL,
  nombre VARCHAR(200),
  modificacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_cambio VARCHAR(10)
);

-- Añadir FK a usuarios si la tabla usuarios existe
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    ALTER TABLE IF EXISTS p_home
      ADD CONSTRAINT fk_p_home_usuario_cambio FOREIGN KEY (usuario_cambio) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

    ALTER TABLE IF EXISTS p_bitacora
      ADD CONSTRAINT fk_p_bitacora_usuario FOREIGN KEY (usuario_cambio) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'Tabla usuarios no encontrada; las FK a usuarios no fueron creadas.';
  END IF;
END
$$;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_p_home_seccion ON p_home (seccion);
CREATE INDEX IF NOT EXISTS idx_p_home_carrusel_home ON p_home_carrusel (id_home);
CREATE INDEX IF NOT EXISTS idx_p_bitacora_pagina ON p_bitacora (id_pagina);

COMMIT;
