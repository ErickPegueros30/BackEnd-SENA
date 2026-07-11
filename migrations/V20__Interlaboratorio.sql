
CREATE TABLE IF NOT EXISTS interlaboratorio(
    id_interlaboratorio SERIAL PRIMARY KEY,
    referencia VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    anio INTEGER NOT NULL,
    inscripcion_inicio DATE NOT NULL,
    inscripcion_fin DATE NOT NULL,
    fecha_inicio_interlaboratorio DATE NOT NULL,
    fecha_detalle VARCHAR(255),
    disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_interlaboratorio_anio ON interlaboratorio(anio);
CREATE INDEX idx_interlaboratorio_disponible ON interlaboratorio(disponible);

