-- Migration: Tabla cotizaciones
BEGIN;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id_cotizacion SERIAL PRIMARY KEY,
  usuario_id VARCHAR(10) NOT NULL,
  nombre_cliente VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL,
  telefono VARCHAR(100) NOT NULL,
  empresa VARCHAR(255),
  direccion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  vencimiento TIMESTAMP WITHOUT TIME ZONE,
  subtotal NUMERIC(21,4) DEFAULT 0,
  iva NUMERIC(21,4) DEFAULT 0,
  total NUMERIC(21,4) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_precio ON cotizaciones(precio_tipo, precio_id);

-- Items asociados a una cotización: referencia a área o rama (una de las dos)
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id_item SERIAL PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion) ON DELETE CASCADE,
  area_id INTEGER REFERENCES catalogo_precios_areas(id_cotizacion_area) ON DELETE SET NULL,
  rama_id INTEGER REFERENCES catalogo_precios_ramas(id_cotizacion_rama) ON DELETE SET NULL,
  descripcion TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(21,4) NOT NULL,
  subtotal NUMERIC(21,4) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  CONSTRAINT ck_item_area_rama CHECK ((area_id IS NOT NULL) OR (rama_id IS NOT NULL))
);

COMMIT;
