-- Active: 1769806382337@@localhost@5433@SENA
BEGIN;

-- TABLAS PARA RAMAS / SUBRAMAS (sin `descripcion` ni `creado_at`)
CREATE TABLE IF NOT EXISTS ramas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subramas (
    id SERIAL PRIMARY KEY,
    rama_id INTEGER NOT NULL REFERENCES ramas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    UNIQUE (rama_id, nombre)
);

-- TABLAS PARA AREAS / SUBAREAS (sin `descripcion` ni `creado_at`)
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subareas (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    UNIQUE (area_id, nombre)
);
-- INSERCIONES: RAMAS y SUBRAMAS
INSERT INTO ramas (nombre) VALUES
('Agua'),
('Alimentos')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO subramas (rama_id, nombre) VALUES
((SELECT id FROM ramas WHERE nombre='Agua'), 'Espectrofotometría de Absorción Atómica'),
((SELECT id FROM ramas WHERE nombre='Agua'), 'Espectrofotométricos UV/VIS/IR'),
((SELECT id FROM ramas WHERE nombre='Agua'), 'Mediciones Directas y Fisicoquímicos en agua residual'),
((SELECT id FROM ramas WHERE nombre='Agua'), 'Espectrofotometría de emisión por plasma'),
((SELECT id FROM ramas WHERE nombre='Alimentos'), 'Espectrofotometría de Absorción Atómica'),
((SELECT id FROM ramas WHERE nombre='Alimentos'), 'Espectrofotométricos UV/VIS/IR'),
((SELECT id FROM ramas WHERE nombre='Alimentos'), 'Fisicoquímicos'),
((SELECT id FROM ramas WHERE nombre='Alimentos'), 'Espectrofotometría de emisión por plasma')
ON CONFLICT (rama_id, nombre) DO NOTHING;

-- INSERCIONES: AREAS y SUBAREAS
INSERT INTO areas (nombre) VALUES
('Masa'),
('Temperatura'),
('Volumen'),
('Densidad'),
('Presión'),
('Dimensional'),
('Eléctrica'),
('Flujo'),
('Mediciones especiales')
ON CONFLICT (nombre) DO NOTHING;

-- Subáreas para Masa
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Masa'), 'Instrumentos para pesar de Funcionamiento No Automático (IPFNA)'),
((SELECT id FROM areas WHERE nombre='Masa'), 'Calibración de Pesas'),
((SELECT id FROM areas WHERE nombre='Masa'), 'Objeto sólido no normalizado'),
((SELECT id FROM areas WHERE nombre='Masa'), 'Instrumentos para pesar de funcionamiento no automático (alto alcance)')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Temperatura
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Temperatura'), 'Termómetros de lectura directa (TLD)'),
((SELECT id FROM areas WHERE nombre='Temperatura'), 'Termómetros de resistencia (TRP)'),
((SELECT id FROM areas WHERE nombre='Temperatura'), 'Termómetro de radiación'),
((SELECT id FROM areas WHERE nombre='Temperatura'), 'Fuente radiante'),
((SELECT id FROM areas WHERE nombre='Temperatura'), 'Termómetros de liquido en vidrio (TLV)')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Volumen
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Volumen'), 'Recipientes volumétricos'),
((SELECT id FROM areas WHERE nombre='Volumen'), 'Medidas Volumétricas'),
((SELECT id FROM areas WHERE nombre='Volumen'), 'Tanques cilíndricos horizontales'),
((SELECT id FROM areas WHERE nombre='Volumen'), 'Autotanques y Carrotanques'),
((SELECT id FROM areas WHERE nombre='Volumen'), 'Tanques fijos horizontales y verticales')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Densidad
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Densidad'), 'Densímetros de inmersión'),
((SELECT id FROM areas WHERE nombre='Densidad'), 'Determinación de densidad de líquidos')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Presión
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Presión'), 'Manómetros'),
((SELECT id FROM areas WHERE nombre='Presión'), 'Vacuómetros')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Dimensional
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Calibración de trasmisores'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Cintas graduadas y flexómetros'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Reglas graduadas'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Indicador de tipo palanca'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Indicador de vástago recto'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Micrómetro de exteriores con bloques patrón'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Calibrador con bloques patrón'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Micrómetro de profundidad con bloques patrón'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Calibrador de profundidad (medidor de profundidad)'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Calibrador de altura (medidor de alturas)'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Medidor de Altura'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Mesa de planitud'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Medidor automático de nivel (tipo radar, radar de onda guiada, flotador, laser, ultrasonidos, magnetostrictivos)'),
((SELECT id FROM areas WHERE nombre='Dimensional'), 'Estación total calibrada como teodolito')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Eléctrica
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Multímetros de 4 1/2 y 5 1/2 dígitos'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Calibradores, simulación RTD por resistencia de eléctrica'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Multímetro digital (magnitud: Capacitancia)'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Medidor de potencia eléctrica monofásico (magnitud: potencia eléctrica alterna reactiva)'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Medidor de Energía eléctrica monofásico (magnitud: energía eléctrica activa)'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Indicadores, registradores simulación de termopares por tensión eléctrica'),
((SELECT id FROM areas WHERE nombre='Eléctrica'), 'Sensores de humedad (Termo hidrógeno)')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Flujo
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Flujo'), 'Medidores de flujo de líquidos de desplazamiento positivo'),
((SELECT id FROM areas WHERE nombre='Flujo'), 'Medidores de flujo de líquidos (tipo Coriolis)'),
((SELECT id FROM areas WHERE nombre='Flujo'), 'Medidor de flujo de gas tipo masico'),
((SELECT id FROM areas WHERE nombre='Flujo'), 'Medidor de gas tipo diafragma'),
((SELECT id FROM areas WHERE nombre='Flujo'), 'Fugas patrón')
ON CONFLICT (area_id, nombre) DO NOTHING;

-- Subáreas para Mediciones especiales
INSERT INTO subareas (area_id, nombre) VALUES
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Medidor de potencial de hidrógeno'),
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Medidor de conductividad electrolítica'),
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Medios Isotermos (horno de pozo seco)'),
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Cámara climática sin carga'),
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Cámara climática con carga'),
((SELECT id FROM areas WHERE nombre='Mediciones especiales'), 'Baños líquidos')
ON CONFLICT (area_id, nombre) DO NOTHING;

COMMIT;