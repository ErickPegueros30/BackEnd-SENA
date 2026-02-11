-- Migration: Add Invitado role, inscripciones table and cursos table
BEGIN;

-- Add Invitado role
INSERT INTO roles (id_rol, nombre, prefijo)
VALUES ('I', 'Invitado', 'I')
ON CONFLICT (id_rol) DO NOTHING;

-- Create cursos table (mirror of eventos)
CREATE TABLE IF NOT EXISTS cursos (
  id_curso SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(100),
  ubicacion VARCHAR(255),
  organizador_id VARCHAR(10) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  inicio_fecha TIMESTAMP WITHOUT TIME ZONE,
  fin_fecha TIMESTAMP WITHOUT TIME ZONE,
  inicio_hora TIME,
  fin_hora TIME,
  max_participants INTEGER DEFAULT 0,
  notas TEXT,
  estado VARCHAR(50) DEFAULT 'activo',
  modalidad VARCHAR(50) DEFAULT 'presencial',
  miniatura VARCHAR(512),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cursos_inicio_fecha ON cursos(inicio_fecha);
ALTER TABLE cursos ADD CONSTRAINT chk_curso_estado CHECK (estado IN ('activo','proximo','completado','cancelado'));
CREATE INDEX IF NOT EXISTS idx_cursos_estado ON cursos(estado);

-- Create inscripciones table
CREATE TABLE IF NOT EXISTS inscripciones (
  id_inscripcion SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  correo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  empresa VARCHAR(255),
  cargo VARCHAR(255),
  area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
  subarea_id INTEGER REFERENCES subareas(id) ON DELETE SET NULL,
  rama_id INTEGER REFERENCES ramas(id) ON DELETE SET NULL,
  subrama_id INTEGER REFERENCES subramas(id) ON DELETE SET NULL,
  difusion VARCHAR(100),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('evento','curso')),
  evento_id INTEGER REFERENCES eventos(id_evento) ON DELETE SET NULL,
  curso_id INTEGER REFERENCES cursos(id_curso) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

COMMIT;
