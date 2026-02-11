-- Active: 1769806382337@@localhost@5433@SENA
-- Migration: Create events table and participants link table
CREATE TABLE IF NOT EXISTS eventos (
  id_evento SERIAL PRIMARY KEY,
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_eventos_inicio_fecha ON eventos(inicio_fecha);
-- Restrict estado to a known set
ALTER TABLE eventos ADD CONSTRAINT chk_evento_estado CHECK (estado IN ('activo','proximo','completado','cancelado'));
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
