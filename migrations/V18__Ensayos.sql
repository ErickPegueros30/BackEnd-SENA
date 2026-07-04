-- Active: 1783187924679@@127.0.0.1@5433@SENA
-- Tabla de ensayos de aptitud
CREATE TABLE IF NOT EXISTS ensayos (
    id_ensayo SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    ciclo VARCHAR(20) NOT NULL, 
    anio INTEGER NOT NULL,                
    id_subarea INTEGER,
    area_id INTEGER,
    rama_id INTEGER,
    subrama_id INTEGER,
    inscripcion_inicio DATE NOT NULL,
    inscripcion_fin DATE NOT NULL,
    fecha_inicio_ensayo DATE NOT NULL,
    fecha_detalle VARCHAR(255),            
    disponible BOOLEAN NOT NULL DEFAULT TRUE
    ,created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Índices para búsquedas y filtros frecuentes
CREATE INDEX idx_ensayos_anio ON ensayos(anio);
CREATE INDEX idx_ensayos_subarea ON ensayos(id_subarea);
CREATE INDEX idx_ensayos_disponible ON ensayos(disponible);
CREATE INDEX idx_ensayos_codigo ON ensayos(codigo);
CREATE INDEX idx_ensayos_area ON ensayos(area_id);
CREATE INDEX idx_ensayos_rama ON ensayos(rama_id);
CREATE INDEX idx_ensayos_subrama ON ensayos(subrama_id);

-- Crear trigger para actualizar updated_at sólo si la función existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_timestamp') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_ensayos') THEN
            EXECUTE 'CREATE TRIGGER trg_set_updated_at_ensayos BEFORE UPDATE ON ensayos FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()';
        END IF;
    END IF;
END$$;

-- Crear constraints FK sólo si las tablas referenciadas ya existen (evita errores si se ejecuta fuera de orden)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname='subareas' AND relkind='r') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_ensayos_subareas') THEN
            EXECUTE 'ALTER TABLE ensayos ADD CONSTRAINT fk_ensayos_subareas FOREIGN KEY (id_subarea) REFERENCES subareas(id) ON DELETE RESTRICT';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname='areas' AND relkind='r') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_ensayos_areas') THEN
            EXECUTE 'ALTER TABLE ensayos ADD CONSTRAINT fk_ensayos_areas FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname='ramas' AND relkind='r') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_ensayos_ramas') THEN
            EXECUTE 'ALTER TABLE ensayos ADD CONSTRAINT fk_ensayos_ramas FOREIGN KEY (rama_id) REFERENCES ramas(id) ON DELETE RESTRICT';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname='subramas' AND relkind='r') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_ensayos_subramas') THEN
            EXECUTE 'ALTER TABLE ensayos ADD CONSTRAINT fk_ensayos_subramas FOREIGN KEY (subrama_id) REFERENCES subramas(id) ON DELETE RESTRICT';
        END IF;
    END IF;
END$$;

ALTER TABLE ensayos ALTER COLUMN id_subarea DROP NOT NULL;