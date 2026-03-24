-- Active: 1769806382337@@localhost@5433@SENA
-- Migration: Cotizaciones para ramas y áreas
BEGIN;

-- Si las combinaciones pueden repetirse, eliminar los índices UNIQUE existentes
DROP INDEX IF EXISTS ux_cat_ramas_rama_ref_year;
DROP INDEX IF EXISTS ux_cat_areas_area_ref_year;

-- Tabla: catalogo_precios_ramas
CREATE TABLE IF NOT EXISTS catalogo_precios_ramas (
  id_cotizacion_rama SERIAL PRIMARY KEY,
  idramacoti INTEGER REFERENCES ramas(id) ON DELETE CASCADE,
  referencia VARCHAR(255) NOT NULL,
  anio INTEGER NOT NULL DEFAULT extract(year from now())::int,
  descripcion TEXT,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_bilateral NUMERIC(12,2),
  precio_unitario_usd NUMERIC(12,2)
);

-- Ajustar precisión a 21,4 en catalogo_precios_ramas
ALTER TABLE catalogo_precios_ramas
  ALTER COLUMN precio_unitario TYPE NUMERIC(21,4) USING ROUND(precio_unitario::numeric,4),
  ALTER COLUMN precio_bilateral TYPE NUMERIC(21,4) USING ROUND(precio_bilateral::numeric,4),
  ALTER COLUMN precio_unitario_usd TYPE NUMERIC(21,4) USING ROUND(precio_unitario_usd::numeric,4);

CREATE INDEX IF NOT EXISTS idx_cat_ramas_rama ON catalogo_precios_ramas(idramacoti);
CREATE INDEX IF NOT EXISTS idx_cat_ramas_anio ON catalogo_precios_ramas(anio);

-- Tabla: catalogo_precios_areas
CREATE TABLE IF NOT EXISTS catalogo_precios_areas (
  id_cotizacion_area SERIAL PRIMARY KEY,
  idareacoti INTEGER REFERENCES areas(id) ON DELETE CASCADE,
  referencia VARCHAR(255) NOT NULL,
  anio INTEGER NOT NULL DEFAULT extract(year from now())::int,
  descripcion TEXT,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_desc_13 NUMERIC(12,2),
  precio_ensayo_bilateral NUMERIC(12,2),
  precio_desc_16 NUMERIC(12,2),
  precio_desc_19 NUMERIC(12,2),
  precio_usd NUMERIC(12,2),
  precio_usd_desc_19 NUMERIC(12,2)
);

-- Ajustar precisión a 21,4 en catalogo_precios_areas
ALTER TABLE catalogo_precios_areas
  ALTER COLUMN precio_unitario TYPE NUMERIC(21,4) USING ROUND(precio_unitario::numeric,4),
  ALTER COLUMN precio_desc_13 TYPE NUMERIC(21,4) USING ROUND(precio_desc_13::numeric,4),
  ALTER COLUMN precio_ensayo_bilateral TYPE NUMERIC(21,4) USING ROUND(precio_ensayo_bilateral::numeric,4),
  ALTER COLUMN precio_desc_16 TYPE NUMERIC(21,4) USING ROUND(precio_desc_16::numeric,4),
  ALTER COLUMN precio_desc_19 TYPE NUMERIC(21,4) USING ROUND(precio_desc_19::numeric,4),
  ALTER COLUMN precio_usd TYPE NUMERIC(21,4) USING ROUND(precio_usd::numeric,4),
  ALTER COLUMN precio_usd_desc_19 TYPE NUMERIC(21,4) USING ROUND(precio_usd_desc_19::numeric,4);

CREATE INDEX IF NOT EXISTS idx_cat_areas_area ON catalogo_precios_areas(idareacoti);
CREATE INDEX IF NOT EXISTS idx_cat_areas_anio ON catalogo_precios_areas(anio);

-- Reglas de integridad: precios no negativos
ALTER TABLE catalogo_precios_ramas
  ADD CONSTRAINT chk_cat_ramas_prices_nonneg CHECK (
    precio_unitario >= 0
    AND (precio_bilateral IS NULL OR precio_bilateral >= 0)
    AND (precio_unitario_usd IS NULL OR precio_unitario_usd >= 0)
  );

ALTER TABLE catalogo_precios_areas
  ADD CONSTRAINT chk_cat_areas_prices_nonneg CHECK (
    precio_unitario >= 0
    AND (precio_desc_13 IS NULL OR precio_desc_13 >= 0)
    AND (precio_ensayo_bilateral IS NULL OR precio_ensayo_bilateral >= 0)
    AND (precio_desc_16 IS NULL OR precio_desc_16 >= 0)
    AND (precio_desc_19 IS NULL OR precio_desc_19 >= 0)
    AND (precio_usd IS NULL OR precio_usd >= 0)
    AND (precio_usd_desc_19 IS NULL OR precio_usd_desc_19 >= 0)
  );

-- Trigger: actualizar `updated_at` automáticamente en UPDATE
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_catalogo_precios_ramas
BEFORE UPDATE ON catalogo_precios_ramas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_set_updated_at_catalogo_precios_areas
BEFORE UPDATE ON catalogo_precios_areas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Ejemplos de INSERTs: de ramas
INSERT INTO catalogo_precios_ramas (idramacoti, referencia, anio, descripcion, precio_unitario, precio_bilateral, precio_unitario_usd) VALUES											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Potencial de Hidrógeno (pH).',6665.3475,19996.0425,357.3912),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Conductividad Eléctrica (CE).',6665.3475,19996.0425,357.3912),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Sólidos Suspendidos Totales (SST).',10182.6585,30547.9755,545.9870),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Sólidos Totales (ST).',6665.3475,19996.0425,357.3912),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Grasas y Aceites (G y A).',8053.5,24160.5,431.8231),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Demanda Química de Oxígeno (DQO).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Demanda Bioquímica de Oxígeno (DBO).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Nitrógeno Amoniacal (N-NH3).',6665.3475,19996.0425,357.3912),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Dureza Total (DT).',6665.3475,19996.0425,357.3912),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cloruros (Cl-).',6804.2835,20412.8505,364.8409),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cianuros (CN-).',8126.622,24379.866,435.7438),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Fluoruros (F-).',8126.622,24379.866,435.7438),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Fósforo Total (PT).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cromo Hexavalente (Cr VI).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Nitrógeno de Nitratos como N (N-NO3).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Nitrógeno de Nitritos como N (N-NO2).',7464.849,22394.547,400.26),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Aluminio (Al).',7881.657,23644.971,422.6089),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Arsénico (As).',7881.657,23644.971,422.6089),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cadmio (Cd).',7485.5655,22456.6965,401.3708),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cromo (Cr).',7485.5655,22456.6965,401.3708),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Cobre (Cu).',7485.5655,22456.6965,401.3708),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Níquel (Ni).',7485.5655,22456.6965,401.3708),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Zinc (Zn).',7485.5655,22456.6965,401.3708),											
(1, 'SENA-AGUA-01-2026', 2026, 'Ensayo de aptitud SENA-AGUA-01-2026 Plomo (Pb).',7485.5655,22456.6965,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Potencial de Hidrógeno (pH).',6665.3475,8203.5,357.3913),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Conductividad Eléctrica (CE).',6665.3475,5469,357.3913),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Sólidos Totales (ST).',6665.3475,5469,357.3913),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Cloruros (CI-).',6804.2835,5583,364.8409),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Nitrógeno Amoniacal (N-NH3).',6665.3475,5469,357.3913),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Dureza Total (DT).',6665.3475,5469,357.3913),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Cianuros (CN-).',8126.622,6668,435.7438),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Fluoruros (F-).',8126.622,6668,435.7438),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Fósforo Total (PT).',7464.849,6125,400.26),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Nitrógeno de Nitratos como N (N-NO3).',7464.849,6125,400.26),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Nitrógeno de Nitritos como N (N-NO2).',7464.849,6125,400.26),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Aluminio (Al).',7881.657,6467,422.6089),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Arsénico (As).',7881.657,6467,422.6089),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Cadmio (Cd).',7485.5655,6142,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Cromo (Cr).',7485.5655,6142,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Cobre (Cu).',7485.5655,6142,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Níquel (Ni).',7485.5655,6142,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Zinc (Zn).',7485.5655,6142,401.3708),											
(2, 'SENA-ALIM-01-2026', 2026, 'Ensayo de aptitud SENA-ALIM-01-2026 Plomo (Pb).',7485.5655,6142,401.3708);


-- INSERTS de Areas 
INSERT INTO catalogo_precios_areas (idareacoti, referencia, anio, descripcion, precio_unitario, precio_desc_13, precio_ensayo_bilateral, precio_desc_16, precio_desc_19, precio_usd, precio_usd_desc_19) VALUES
(2, 'SENA-TEMPERATURA-01-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-01-2026-TLD para la calibración de un Indicador digital con resolución de 0,01 C con sensor de resistencia de platino de 4 hilos en el intervalo de medición de: - 20 °C a 250 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-02-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-02-2026-TLD para la calibración de un Indicador digital con resolución de 0,1 °C con sensor termopar tipo K, intervalo de medición de: - 30 °C a 200 °C, resolución: 0,1 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-03-2026-TLV', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-03-2026-TLV para la calibración de un Termómetro de líquido en vidrio de inmersión total, tipo ASTM serie C del 62 al 68. Intervalo de medición: -20 °C a 120 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-04-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-04-2026-TLD para la calibración de un Indicador digital con sensor termopar tipo K, intervalo de medición de -30 °C a 200 °C, resolución de 0,1 °C. ', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-05-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-05-2026-TLD para la calibración de un Indicador digital con resolución de 0,01 °C con sensor de resistencia de platino de 4 hilos en el intervalo de medición de: - 10 °C a 150 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-06-2026-TLV', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-06-2026-TLV para la calibración de Termómetro de líquido en vidrio de inmersión total, tipo ASTM serie C del 62 al 67. Intervalo de medición -20 °C a 150 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-07-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-07-2026-TLD para la calibración de un Indicador digital con resolución de 0,001 °C con dos Sensores de resistencia de platino de 4 hilos, intervalo de medición de: - 20 °C a 400 °C.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-08-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-08-2026-TLD para la calibración de un Indicador digital con resolución de 0,01 °C con sensor de resistencia de platino en el intervalo de medición de: -20 °C a 150 °C', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-09-2026-TRP', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-09-2026-TRP para la calibración de sensor de resistencia de platino PT100 de 4 hilos, intervalo de medición de -20 °C a 420 °C. Determinación de la función de desviación(△W) EIT-90 VS Temperatura.', 0, 0, 0, 0, 0, 0, 0),
(2, 'SENA-TEMPERATURA-10-2026-TLV', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-10-2026-TLV para la calibración de un termómetro de líquido en vidrio de inmersión total, tipo ASTM serie C del 62 al 68. Intervalo de medición -20 °C a 200 °C.', 20597.0688, 17919.4498, 27188.1308, 17301.5377, 16683.6257, 980.8128, 794.4583),
(2, 'SENA-TEMPERATURA-11-2026-TLD', 2026, 'Ensayo de aptitud SENA-TEMPERATURA-11-2026-TLD para la calibración de un Indicador digital con resolución de 0,1 °C con sensor de resistencia de platino en el intervalo de medición de: - 10 °C a 200 °C.', 20597.0688, 17919.4498, 27188.1308, 17301.5377, 16683.6257, 980.8128, 794.4583),
(1, 'SENA-MASA-01-2026-MOS', 2026, 'Ensayo de aptitud SENA-MASA-01-2026-MOS  para la determinación de masa convencional de un objeto sólido no normalizado, <4 kg.', 12190.0016, 10605.3013, 16090.8021, 10239.6013, 9873.9012, 580.4762, 470.1857),
(1, 'SENA-MASA-02-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-02-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 16 kg, resolución del indicador de 0,1 g, 10 cargas de prueba.', 12014.464, 10452.5836, 15859.0924, 10092.1497, 9731.7158, 572.1173, 463.4150),
(1, 'SENA-MASA-03-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-03-2026-CP  para la calibración de pesa paralepípeda, clase de exactitud M1 de 5 kg.', 19712, 0, 0, 0, 0, 0, 0),
(1, 'SENA-MASA-04-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-04-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 220 g, resolución del indicador de 1 mg, 10 cargas de prueba.', 12014.464, 10452.5836, 15859.0924, 10092.1497, 9731.7158, 572.1173, 463.4150),
(1, 'SENA-MASA-05-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-05-2026-CP  para la calibración de una pesa paralelepípeda clase de exactitud M1 de 20 kg.', 12190.0016, 10605.3013, 16090.8021, 10239.6013, 9873.9012, 580.4762, 470.1857),
(1, 'SENA-MASA-06-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-06-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 300 kg, resolución del indicador de 50 g, 10 cargas de prueba.', 12190.0016, 10605.3013, 16090.8021, 10239.6013, 9873.9012, 580.4762, 470.1857),
(1, 'SENA-MASA-07-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-07-2026-CP  para la calibración de una pesa paralelepípeda, clase de exactitud M1 de 20 kg.', 12190.0016, 10605.3013, 16090.8021, 10239.6013, 9873.9012, 580.4762, 470.1857),
(1, 'SENA-MASA-08-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-08-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático(pesa bebes), capacidad máxima 20 kg, resolución del indicador de 5 g., 10 cargas de prueba.', 12014.464, 10452.5836, 15859.0924, 10092.1497, 9731.7158, 572.1173, 463.4150),
(1, 'SENA-MASA-09-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-09-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 1 000 kg, resolución del indicador de 0,1 kg, 5 cargas de prueba.', 0, 0, 0, 0, 0, 0, 0),
(1, 'SENA-MASA-10-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-10-2026-CP para la calibración de una pesa clase de exactitud F2 de 50 g, 200 g y 500 g. Calibrar 3 pesas.', 12190.0016, 10605.3013, 16090.8021, 10239.6013, 9873.9012, 580.4762, 470.1857),
(1, 'SENA-MASA-11-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-11-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 220 g, resolución del indicador de 1 mg, 10 cargas de prueba.', 12014.464, 10452.5836, 15859.0924, 10092.1497, 9731.7158, 572.1173, 463.4150),
(1, 'SENA-MASA-12-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-12-2026-CP para la calibración de pesas de la clase de exactitud F1 en un alcance de 10 g, 500 g, 1000 g, calibrar 3 pesas. ', 17740.8, 15434.496, 23417.856, 14902.272, 14370.048, 844.8, 684.288),
(1, 'SENA-MASA-13-2026-CP', 2026, 'Ensayo de aptitud SENA-MASA-13-2026-CP para la calibración de una pesa paralelepípeda clase de exactitud M1 de 20 kg.', 0, 0, 0, 0, 0, 0, 0),
(1, 'SENA-MASA-14-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-14-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 200 kg, resolución del indicador de 50 g, 10 cargas de prueba.', 1, 0.87, 1.32, 0.84, 0.81, 0.0476, 0.0386),
(1, 'SENA-MASA-15-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-15-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 30 kg, resolución del indicador de 0,1 g, 10 cargas de prueba.', 2, 1.74, 2.64, 1.68, 1.62, 0.0952, 0.0771),
(1, 'SENA-MASA-16-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-16-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, Alto alcance 80 Ton, 5 cargas de prueba.', 3, 2.61, 3.96, 2.52, 2.43, 0.1429, 0.1157),
(1, 'SENA-MASA-17-2026-IPFNA', 2026, 'Ensayo de aptitud SENA-MASA-17-2026-IPFNA para la calibración de un instrumento para pesar de funcionamiento no automático, capacidad máxima 220 g, resolución del indicador de 1 mg, 10 cargas de prueba.', 4, 3.48, 5.28, 3.36, 3.24, 0.1904, 0.1542),
(1, 'SENA-MASA-18-2026-MOS', 2026, 'Ensayo de aptitud SENA-MASA-18-2026-MOS  para la determinación de masa convencional de un objeto sólido no normalizado, <4 kg.', 5, 4.35, 6.6, 4.2, 4.05, 0.2380, 0.1928),
(3, 'SENA-VOLUMEN-01-2026-VM', 2026, 'Ensayo de aptitud SENA-VOLUMEN-01-2026-VM  para la calibración de una Medida volumétrica modelo MV 10 material acero inoxidable, volumen nominal 20 L, tubo capilar de vidrio Pyrex, división mínima 10 mL.
Método: Gravimétrico.
Modalidad: Entregar.', 14303.0272, 12443.6336, 18879.9959, 12014.5428, 11585.4520, 681.0965, 551.6881),
(3, 'SENA-VOLUMEN-02-2026-MV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-02-2026-MV para la calibración de una pipeta de pistón de volumen fijo de 1 000 µL. Método gravimétrico.', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-03-2026-MV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-03-2026-MV para la calibración de una pipeta de pistón de volumen variable de 100 µL a 1 000 µL. Método gravimétrico.', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-04-2026-CTH', 2026, 'Ensayo de aptitud SENA-VOLUMEN-04-2026-CTH para la calibración de un tanque cilíndrico horizontal por el método geométrico medición interna. Capacidad hasta 300 000 L.', 14303.0272, 12443.6336, 18879.9959, 12014.5428, 11585.4520, 681.0965, 551.6881),
(3, 'SENA-VOLUMEN-05-2026-VM', 2026, 'Ensayo de aptitud SENA-VOLUMEN-05-2026-VM  para la calibración de una Medida volumétrica modelo MV 10 material acero inoxidable, volumen nominal 5 L, tubo capilar de vidrio Pyrex, división mínima 10 mL.
Método: Gravimétrico.
Modalidad: Entregar.', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-06-2026-PV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-06-2026-PV para la calibración de un de una Bureta Digital 50 mL. Método: Gravimétrico.', 54102.03, 47068.7661, 71414.6796, 45445.7052, 43822.6443, 2576.2871, 2086.7925),
(3, 'SENA-VOLUMEN-07-2026-CTV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-07-2026-CTV para la calibración de un tanque cilíndrico vertical por el método geométrico medición interna.', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-08-2026-MV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-08-2026-MV para la calibración de una pipeta de pistón de volumen fijo de 1 000 µL. Método gravimétrico.', 14303.0272, 12443.6336, 18879.9959, 12014.5428, 11585.4520, 681.0965, 551.6881),
(3, 'SENA-VOLUMEN-09-2026-PV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-09-2026-PV para la calibración de un Matraz volumétrico 2 L. Modalidad: Entregar.', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-10-2026-VM', 2026, 'Ensayo de aptitud SENA-VOLUMEN-10-2026-VM  para la calibración de una Medida volumétrica modelo MV 10 material acero inoxidable, volumen nominal 10 L, tubo capilar de vidrio Pyrex, división mínima 10 mL. Método: Gravimétrico. Modalidad: Entregar.', 14303.0272, 12443.6336, 18879.9959, 12014.5428, 11585.4520, 681.0965, 551.6881),
(3, 'SENA-VOLUMEN-11-2026-CAT', 2026, 'Ensayo de aptitud SENA-VOLUMEN-11-2026-CAT para la calibración de una autotanque 120 000 L. ', 11442.816, 9955.2499, 15104.5171, 9611.9654, 9268.6809, 544.896, 441.3657),
(3, 'SENA-VOLUMEN-12-2026-PV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-12-2026-MV para la calibración de una Probeta para entregar 1 000 mL.', 15442.816, 13435.2499, 20384.5171, 12971.9654, 12508.6809, 735.3721, 595.6514),
(3, 'SENA-VOLUMEN-13-2026-CTH', 2026, 'Ensayo de aptitud SENA-VOLUMEN-13-2026-CTH  para la Calibración de un tanque cilíndrico horizontal por el método volumétrico. Hasta 80 000 L.', 14303.0272, 12443.6336, 18879.9959, 12014.5428, 11585.4520, 681.0965, 551.6881),
(3, 'SENA-VOLUMEN-14-2026-MV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-14-2026-MV para la calibración de una Medida volumétrica de 2 700 L.', 0, 0, 0, 0, 0, 0, 0),
(3, 'SENA-VOLUMEN-15-2026-MV', 2026, 'Ensayo de aptitud SENA-VOLUMEN-15-2026-MV para la calibración de una pipeta de pistón de volumen fijo de 1 000 µL. Método gravimétrico.', 0, 0, 0, 0, 0, 0, 0),
(5, 'SENA-PRESIÓN-01-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-01-2026-CM  para la Manómetro digital con intervalo de (0 psi a 5 000 psi) con las siguientes características:
Exactitud: 0,25 % ET.
Resolución: 0,1 psi, 1 kPa.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-02-2026-CV', 2026, 'Ensayo de aptitud SENA-PRESIÓN-02-2026-CV  para la calibración de un Vacuómetro digital con intervalo de (-15 psi a 30 psi) con las siguientes características:
Exactitud: 0,05 % ET.
Resolución: 0,001 psi, 0,01 kPa', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-03-2026-CTP', 2026, 'Ensayo de aptitud SENA-PRESIÓN-03-2026-CTP  para la calibración de un Transmisor de presión con intervalo de (0 psi a 500 psi) con las siguientes características:
Exactitud: 0,031 psi, 0.21 kPa.
Resolución: 0,3 % ET.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-04-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-04-2026-CM para la calibración de un Manómetro digital con intervalo de (0 psi a 300 psi) con las siguientes características:
Exactitud: 0,25 % ET.
Resolución: 0,01 psi, 0,1 kPa.', 13445.056, 11697.1987, 24201.1008, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-05-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-05-2026-CM  para la calibración de un manómetro digital con intervalo de (0 psi a 1 000 psi) con las siguientes características:
Exactitud: 0,25 % ET
Resolución: 0,1 psi, 0,1 kPa.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-06-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-06-2026-CM  para la calibración de un Manómetro Asociado a un Esfigmomanómetro con intervalo de (0 mmHg a 300 mmHg) con las siguientes características:
Exactitud: 0,6 % ET.
Resolución: 2 mmHg.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-07-2026-CV', 2026, 'Ensayo de aptitud SENA-PRESIÓN-07-2026-CV  para la calibración de un Manómetro digital con intervalo de (0 psi a 3 000 psi) con las siguientes características:
Exactitud: 0,05 % ET.
Resolución: 1 kPa.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-08-2026-CTP', 2026, 'Ensayo de aptitud SENA-PRESIÓN-08-2026-CTP  para la calibración de un Transmisor de presión con intervalo de (0 psi a 500 psi) con las siguientes características:
Exactitud: 0,031 psi, 0.21 kPa.
Resolución: 0,3 % ET.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-09-2026-CV', 2026, 'Ensayo de aptitud SENA-PRESIÓN-09-2026-CV  para la calibración de un Manovacuómetro digital con intervalo de (-14.5 psi a 30 psi) con las siguientes características:
Exactitud: 0,25 % ET (E.T = -14.5 psi)
Resolución: 0,001, 0,01 kPa.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-10-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-10-2026-CM  para la calibración de un Manómetro digital con intervalo de (0 psi a 10 000 psi) psi con las siguientes características:
Exactitud: 0,25 % ET.
Resolución: 1 psi, 1 kPa.', 13445.056, 11697.1987, 20167.584, 11293.8470, 10890.4953, 640.2407, 518.5950),
(5, 'SENA-PRESIÓN-11-2026-CM', 2026, 'Ensayo de aptitud SENA-PRESIÓN-11-2026-CM  para la calibración de un Manómetro digital con intervalo de (0 psi a 300 psi) psi con las siguientes características:
Exactitud: 0,05 % ET.
Resolución: 0,01 psi, 0,1 kPa.', 0, 0, 0, 0, 0, 0, 0),
(4, 'SENA-DENSIDAD-01-2026-DI', 2026, 'Ensayo de aptitud SENA-DENSIDAD-01-2026-DI para la calibración de un densímetro de inmersión, densidades a calibrar en el intervalo nominal de (0,900  a 0,950) D. Rel. a 15,56 °C/15,56 °C, resolución 0,000 5 D Rel. a 15,56 °C/15,56 °C. 3 densidades a calibrar.', 24640, 21436.8, 32524.8, 20697.6, 19958.4, 1173.3333, 950.4),
(4, 'SENA-DENSIDAD-02-2026-DL', 2026, 'Ensayo de aptitud SENA-DENSIDAD-02-2026-DL para la medición de densidad de líquidos en el intervalo de 600 kg/m3 a 2 000 kg/m3, con densímetro digital con resolución 0,01 kg/m3, 2 densidades a medir. ', 13933.1248, 12121.8185, 18391.7247, 11703.8248, 11285.8310, 663.4821, 537.4205),
(4, 'SENA-DENSIDAD-03-2026-DI', 2026, 'Ensayo de aptitud SENA-DENSIDAD-03-2026-DI para la calibración de un densímetro de inmersión, densidades a calibrar en el intervalo nominal de (1,000  a 1,050) D Rel. a 15,56 °C/15,56 °C, resolución 0,000 5 D Rel. a 15,56 °C/15,56 °C. 3 densidades a calibrar.', 24640, 21436.8, 32524.8, 20697.6, 19958.4, 1173.3333, 950.4),
(7, 'SENA-ELÉCTRICA-01-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-01-2026-ME para la calibración de un multímetro en función de indicador de temperatura para sensor de resistencia de platino. Medición de simulación de temperatura para sensores PT100, con resistencia nominal de 100 Ω, en el intervalo de -200 °C a 650 °C, técnica de medición 4 hilos, alfa 385.', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-02-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-02-2026-ME para la calibración de un multímetro digital de 4 ½ y 5 ½ dígitos.                                                                                                                                                      
Tensión eléctrica continua                                                                                                                                   
1 V, 10 V
Tensión eléctrica alterna
1 V @ 50 Hz, 1 V @1 kHz
100 V @ 50 Hz, 100 V @ 1 kHz
Resistencia
100 Ω , 10 k Ω , 10 M Ω
Corriente eléctrica continua
10 mA, 1 A
Corriente eléctrica alterna
10 mA @ 50 Hz, 10 mA @ 1 kHz
1 A @ 50 Hz, 1 A @ 1 kHz', 11053.28, 9616.3536, 14590.3296, 9284.7552, 8953.1568, 526.3466, 426.3408),
(7, 'SENA-ELÉCTRICA-03-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-03-2026-ME para la calibración de un multímetro digital de 3 ¾ dígitos.
Tensión eléctrica continua                                                                                                                                   
1 V, 10 V
Tensión eléctrica alterna
1 V @ 50 Hz,
100 V @ 50 Hz,
Resistencia
100 Ω , 10 k Ω , 10 M Ω
Corriente eléctrica continua
10 mA, 1 A
Corriente eléctrica alterna
10 mA @ 50 Hz,
1 A @ 50 Hz,', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-04-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-04-2026-ME para la calibración de un multímetro en función de indicador de temperatura para sensor de resistencia de platino. Medición de simulación de temperatura para sensores PT100, con resistencia nominal de 100 Ω, en el intervalo de -200 °C a 650 °C, técnica de medición 4 hilos, alfa 385.', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-05-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-05-2026-ME para la calibración de un multímetro digital de 4 ½ y 5 ½ dígitos.
Capacitancia                                                                                                                                  
•	1nF a 1 nF
•	1 µF a 10 µF
•	10 µF a 100 µF', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-06-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-06-2026-ME para la calibración de un indicador de temperatura para sensor termopar. Calibración de un indicador de temperatura para sensores termopar por simulación eléctrica:
Tipo E, en los siguientes valores de temperatura:
-150 °C a 1 000 °C
Tipo K, en los siguientes valores de temperatura:
-100 °C a 1 200 °C. 
Tipo J, en los siguientes valores de temperatura: 
-30 °C a 1 200 °C.
Tipo T, en los siguientes valores de temperatura:
-250 °C a 400 °C.', 11053.28, 9616.3536, 14590.3296, 9284.7552, 8953.1568, 526.3466, 426.3408),
(7, 'SENA-ELÉCTRICA-07-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-07-2026-ME para la calibración de un multímetro digital de 3 ¾ dígitos.
Tensión eléctrica continua                                                                                                                                   
1 V, 10 V
Tensión eléctrica alterna
1 V @ 50 Hz,
100 V @ 50 Hz,
Resistencia
100 Ω , 10 k Ω , 10 M Ω
Corriente eléctrica continua
10 mA, 1 A
Corriente eléctrica alterna
10 mA @ 50 Hz,
1 A @ 50 Hz,', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-08-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-08-2026-ME para la calibración de un multímetro digital de 4 ½ y 5 ½ dígitos.                                                                                                                                                      Tensión eléctrica continua                                                                                                                                   
1 V, 10 V
Tensión eléctrica alterna
1 V @ 50 Hz, 1 V @1 kHz
100 V @ 50 Hz, 100 V @ 1 kHz
Resistencia
100 Ω , 10 k Ω , 10 M Ω
Corriente eléctrica continua
10 mA, 1 A
Corriente eléctrica alterna
10 mA @ 50 Hz, 10 mA @ 1 kHz
1 A @ 50 Hz, 1 A @ 1 kHz', 0, 0, 0, 0, 0, 0, 0),
(7, 'SENA-ELÉCTRICA-09-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-09-2026-ME Calibración de un indicador de temperatura para sensores termopar.
Calibración de un indicador de temperatura para sensores termopar por simulación eléctrica:
Tipo E, en los siguientes valores de temperatura:
-150 °C a 1000 °C.
Tipo K, en los siguientes valores de temperatura:
-100 °C a 1 200 °C. 
Tipo J, en los siguientes valores de temperatura: 
-30 °C a 1 200 °C.
Tipo T, en los siguientes valores de temperatura:
-250 °C a 400 °C.', 11053.28, 9616.3536, 14590.3296, 9284.7552, 8953.1568, 526.3466, 426.3408),
(7, 'SENA-ELÉCTRICA-10-2026-ME', 2026, 'Ensayo de aptitud SENA-ELÉCTRICA-10-2026-ME Medidor de potencia eléctrica monofásica (magnitud potencia eléctrica alterna activa y reactiva).
Factor de Cresta: 3
Potencia: 15 W a 24 kW
Tensión: 15 V a 600 V
Corriente: 1 A a 40 A
Diferencia de fase: 0 a ±180°', 0, 0, 0, 0, 0, 0, 0),
(11, 'SENA-HUMEDAD-01-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-01-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 80 %H.R., resolución de 0,1 % H.R. Tres valores a calibrar.', 13731.3792, 11946.2999, 18125.4205, 11534.3585, 11122.4171, 653.8752, 529.6389),
(11, 'SENA-HUMEDAD-02-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-02-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 90 %H.R., resolución de 0,01 % H.R. Tres valores a calibrar.', 13731.3792, 11946.2999, 18125.4205, 11534.3585, 11122.4171, 653.8752, 529.6389),
(11, 'SENA-HUMEDAD-03-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-03-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 70 %H.R., resolución de 0,1 % H.R. Tres valores a calibrar.', 13731.3792, 11946.2999, 18125.4205, 11534.3585, 11122.4171, 653.8752, 529.6389),
(11, 'SENA-HUMEDAD-04-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-04-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 80 %H.R., resolución de 0,01 % H.R. Tres valores a calibrar.', 0, 0, 0, 0, 0, 0, 0),
(11, 'SENA-HUMEDAD-05-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-05-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 90 %H.R., resolución de 0,1 % H.R. Tres valores a calibrar.', 0, 0, 0, 0, 0, 0, 0),
(11, 'SENA-HUMEDAD-06-2026-SH', 2026, 'Ensayo de aptitud SENA-HUMEDAD-06-2026-SH calibración de higrómetro con alcance nominal de 10 %H.R. a 70 %H.R., resolución de 0,1 % H.R. Tres valores a calibrar.', 13731.3792, 11946.2999, 18125.4205, 11534.3585, 11122.4171, 653.8752, 529.6389),
(6, 'SENA-DIMENSIONAL-01-2026-ClnV​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-01-2026-CInV para la calibración de un indicador de vástago recto, resolución 0,01 mm, intervalo nominal de 0 mm a 10 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-02-2026-CMi​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-02-2026-CMi para la calibración de un micrómetro para medición de exteriores, resolución de 0,01 mm, en intervalo nominal de 0 mm a 25 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-03-2026-CMi​P', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-03-2026-CMiP para la calibración de un micrómetro de profundidad análogico, resolución de 0,01 mm, en el intervalo nominal de 0 mm a 25 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-04-2026-CC', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-04-2026-CC para la calibración de un vernier para medición de exteriores e interiores, resolución de 0,01 mm, en el intervalo nominal de 0 mm a 150 mm. Calibrar en 10 (diez) longitudes.', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-05-2026-CMP​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-05-2026-CMP​​ para la determinación de la desviación de planitud y clasificación de la mesa. Resolución 1 mm.', 31781, 0, 0, 0, 0, 0, 0),
(6, 'SENA-DIMENSIONAL-06-2026-CMA​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-06-2026-CMA​ para la calibración de un medidor de alturas, resolución de 0,01 mm en el intervalo nominal de  0 mm a 200 mm. Calibrar en 10 (diez) longitudes.', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-07-2026-CR', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-07-2026-CR para la calibración de una regla semiflexible de acero, resolución de 1 mm, en el intervalo nominal de 0 m a 1 m. Calibrar en 10 (diez) longitudes. ', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-08-2026-CMN', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-08-2026-CMN para la calibración de un medidor de nivel en el intervalo nominal 0 a 20 m, 1 longitud por calibrar.', 0, 0, 0, 0, 0, 0, 0),
(6, 'SENA-DIMENSIONAL-09-2026-CTO', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-09-2026-CTO para la calibración de una estación total calibrada como teodolito en el intervalo de 0° a 360 º, resolución 0,01 mm.', 37228.15, 0, 49141.158, 0, 0, 0, 0),
(6, 'SENA-DIMENSIONAL-10-2026-CMi', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-10-2026-CMi para la calibración de un micrómetro para medición de exteriores, resolución de 0,01 mm, en el intervalo nominal de 25 mm a 50 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-11-2026-CC', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-11-2026-CC para la calibración de un vernier para medición de exteriores e interiores, resolución de 0,01 mm, en el intervalo nominal de 0 mm a 150 mm. Calibrar en 10 (diez) longitudes. ', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-12-2026-CF', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-12-2026-CF para la calibración de un flexómetro, resolución de 0,01 mm, en el intervalo nominal de 0 m a 3 m. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-13-2026-CC', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-13-2026-CC para la calibración de un vernier para medición de exteriores e interiores, resolución de 0,02 mm, en el intervalo nominal de 0 mm a 150 mm. Calibrar en 10 (diez) longitudes.', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-14-2026-CCM​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-14-2026-CCM​ para la calibración de una cinta métrica, resolución de 1 mm, en el intervalo nominal de 0 m a 10 m. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-15-2026-CMi', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-15-2026-CMi para la calibración de un micrómetro para medición de exteriores, resolución de 0,01 mm, en el intervalo nominal de 75 mm a 100 mm. Calibrar en 10 (diez) longitudes. ', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-16-2026-CF', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-16-2026-CF para la calibración de un flexómetro, resolución de 1 mm, en el intervalo nominal de 0 m a 3 m. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-17-2026-CCM', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-17-2026-CCM para la calibración de una cinta métrica, resolución de 1 mm, en el intervalo nominal de 0 m a 30 m. Calibrar en 10 (diez) longitudes. ', 10402.56, 9050.2272, 20805.12, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-18-2026-ClnV​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-18-2026-CInV para la calibración de un indicador de vástago recto, resolución 0,01 mm, intervalo nominal de 0 mm a 10 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-19-2026-CMi', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-19-2026-CMi para la calibración de un micrómetro para medición de exteriores, resolución de 0,01 mm, en el intervalo nominal de 0 mm a 25 mm. Calibrar en 10 (diez) longitudes. ', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-20-2026-CMi​P', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-20-2026-CMiP para la calibración de un micrómetro de profundidad análogico, resolución de 0,01 mm, en el intervalo nominal de 0 mm a 25 mm. Calibrar en 10 (diez) longitudes.', 10402.56, 9050.2272, 13731.3792, 8738.1504, 8426.0736, 495.36, 401.2416),
(6, 'SENA-DIMENSIONAL-21-2026-CC', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-21-2026-CC para la calibración de un vernier para medición de exteriores e interiores,  resolución de 0,01 mm, en el intervalo nominal de 0 mm a 600 mm. Calibrar en 10 (diez) longitudes.', 13003.2, 11312.784, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(6, 'SENA-DIMENSIONAL-22-2026-CMP​', 2026, 'Ensayo de aptitud SENA-DIMENSIONAL-22-2026-CMP​​ para la determinación de la desviación de planitud y clasificación de la mesa. Resolución 1 mm.', 31781, 0, 0, 0, 0, 0, 0),
(9, 'SENA-MEDICIONES ESPECIALES-01-2026-COpH', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-01-2026-COpH, elemento de ensayo: Medidor de potencial de hidrógeno. Alcance 2 pH a 10 pH. ', 27649.5, 0, 36497.34, 23225.58, 22396.095, 1316.6428, 1066.4807),
(9, 'SENA-MEDICIONES ESPECIALES-02-2026-CMH', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-02-2026-CMH, elemento de ensayo: Horno con bloque igualador. Alcance 100 °C.', 14092.9, 0, 18602.628, 11838.036, 11415.249, 671.0904, 543.5832),
(9, 'SENA-MEDICIONES ESPECIALES-03-2026-COCE', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-03-2026-COCE, elemento de ensayo: Medidor de conductividad electrolítica. Alcance 150 a 1410 μs/cm-1.', 0, 0, 0, 0, 0, 0, 0),
(9, 'SENA-MEDICIONES ESPECIALES-04-2026-CMB', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-04-2026-CMB, elemento de ensayo: Baño líquido. Alcance 50 °C y 100 °C.', 27649.5, 0, 36497.34, 23225.58, 22396.095, 1316.6428, 1066.4807),
(9, 'SENA-MEDICIONES ESPECIALES-05-2026-COpH', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-05-2026-COpH, elemento de ensayo: Medidor de potencial de hidrógeno. Alcance 2 pH a 10 pH. ', 14092.9, 0, 18602.628, 11838.036, 11415.249, 671.0904, 543.5832),
(9, 'SENA-MEDICIONES ESPECIALES-06-2026-CMC', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-06-2026-CMC, elemento de ensayo:  Cámara climática sin carga. Alcance 50 °C, 100 °C y 230 °C.', 27649.5, 0, 36497.34, 23225.58, 22396.095, 1316.6428, 1066.4807),
(9, 'SENA-MEDICIONES ESPECIALES-07-2026-CMH', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-07-2026-CMH, elemento de ensayo: Horno con bloque igualador. Alcance -8 °C, 50 °C y 100 °C.', 0, 0, 0, 0, 0, 0, 0),
(9, 'SENA-MEDICIONES ESPECIALES-08-2026-COpH', 2026, 'Ensayo de aptitud Mediciones especiales SENA-MEDICIONES ESPECIALES-08-2026-COpH, elemento de ensayo: Medidor de potencial de hidrógeno. Alcance 2 pH a 10 pH. ', 0, 0, 0, 0, 0, 0, 0),
(8, 'SENA-FLUJO-01-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-01-2026-CFV para la calibración de un Medidor de flujo de líquido tipo Coriolis, intervalo de medición de 100 L/min a 3 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 550 L/min a 3 000 L/min.', 28350, 0, 37422, 23814, 22963.5, 1350, 1093.5),
(8, 'SENA-FLUJO-02-2026-CFM', 2026, 'Ensayo de aptitud SENA-FLUJO-02-2026-CFM para la calibración de un Medidor de flujo de líquido tipo Coriolis, intervalo de medición: 100 kg/min a 2 000 kg/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 550 kg/min a 2 000 kg/min.', 18900, 0, 24948, 15876, 15309, 900, 729),
(8, 'SENA-FLUJO-03-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-03-2026-CFV para la calibración de un Medidor de flujo de líquidos de desplazamiento positivo, 100 L/min a 1 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 100 L/min a 1 000 L/min.', 0, 0, 0, 0, 0, 0, 0),
(8, 'SENA-FLUJO-04-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-04-2026-CFV para la calibración de un Medidor de flujo de líquido tipo Coriolis, intervalo de medición de 100 L/min a 3 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 550 L/min a 2 000 L/min.', 28350, 0, 37422, 23814, 22963.5, 1350, 1093.5),
(8, 'SENA-FLUJO-05-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-05-2026-CFV para la calibración de un Medidor de flujo de líquido tipo Coriolis, intervalo de medición de 100 L/min a 3 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 550 L/min a 3 000 L/min.', 18900, 0, 24948, 15876, 15309, 900, 729),
(8, 'SENA-FLUJO-06-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-06-2026-CFV para la calibración de un Medidor de flujo de líquidos de desplazamiento positivo, 100 L/min a 1 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 100 L/min a 1 000 L/min.', 18900, 0, 24948, 15876, 15309, 900, 729),
(8, 'SENA-FLUJO-07-2026-CFV', 2026, 'Ensayo de aptitud SENA-FLUJO-07-2026-CFM para la calibración de un Medidor de flujo de líquidos tipo Coriolis, 100 L/min a 1 000 L/min, comparación estática arranque y paro, fluido de referencia agua. Se deberá calibrar en 4 flujos en el alcance de 100 L/min a 1 000 L/min.', 0, 0, 0, 0, 0, 0, 0),
(2, ' SENA-TEMPERATURA & HUMEDAD-01-2024-CTH', 2026, 'Ensayo de aptitud modalidad bilateral SENA-TEMPERATURA & HUMEDAD-01-2024-CTH, para la calibración de tres temperaturas y tres humedades en un termohigrometro. ', 13003.2, 0, 17164.224, 10922.688, 10532.592, 619.2, 501.552),
(11, ' SENA-TEMPERATURA & HUMEDAD-01-2024-CTH', 2026, 'Ensayo de aptitud modalidad bilateral SENA-TEMPERATURA & HUMEDAD-01-2024-CTH, para la calibración de tres temperaturas y tres humedades en un termohigrometro. ', 13003.2, 0, 17164.224, 10922.688, 10532.592, 619.2, 501.552);
COMMIT;
