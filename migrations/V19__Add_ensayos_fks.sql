-- Añade constraints FK para ensayos después de que existan las tablas referenciadas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='ensayos' AND relkind='r') THEN
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
  END IF;
END$$;
