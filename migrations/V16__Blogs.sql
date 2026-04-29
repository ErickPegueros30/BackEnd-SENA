-- Active: 1769806382337@@localhost@5433@postgres
-- V16__Blogs.sql
-- Tablas para el módulo de Blog / Investigaciones

BEGIN;

-- ─── Categorías de blog ───────────────────────────────────────────────
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#1E9E4A',
  icon VARCHAR(50) DEFAULT 'bi-folder',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Semilla inicial de categorías
INSERT INTO blog_categories (name, slug, color, icon, description) VALUES
  ('Metrología',    'metrologia',    '#2196F3', 'bi-rulers',             'Medición y calibración'),
  ('Calidad',       'calidad',       '#FF9800', 'bi-award',              'Normas y estándares'),
  ('Laboratorio',   'laboratorio',   '#1E9E4A', 'bi-microscope',         'Prácticas y técnicas'),
  ('Acreditación',  'acreditacion',  '#9C27B0', 'bi-file-earmark-check', 'Certificaciones'),
  ('Normativas',    'normativas',    '#607D8B', 'bi-journal-text',       'Regulaciones y leyes'),
  ('Tecnología',    'tecnologia',    '#795548', 'bi-cpu',                'Innovación en laboratorios');

-- ─── Posts (artículos / investigaciones) ──────────────────────────────
-- Crear `blog_posts` condicionalmente: si existe la tabla `usuarios` crear FK, si no, crear sin FK
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    -- usuarios existe -> crear tabla con FK
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        id_usuario VARCHAR(10) NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        category_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image VARCHAR(1024),
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        featured BOOLEAN NOT NULL DEFAULT false,
        views INT NOT NULL DEFAULT 0,
        likes INT NOT NULL DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        reading_time INT DEFAULT 0,
        tags TEXT[] DEFAULT '{}',
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    $sql$;
  ELSE
    -- usuarios NO existe -> crear tabla sin FK para evitar fallo; se puede añadir FK más tarde
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        id_usuario VARCHAR(10) NOT NULL,
        category_id INT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image VARCHAR(1024),
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        featured BOOLEAN NOT NULL DEFAULT false,
        views INT NOT NULL DEFAULT 0,
        likes INT NOT NULL DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        reading_time INT DEFAULT 0,
        tags TEXT[] DEFAULT '{}',
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    $sql$;
    RAISE NOTICE 'Tabla usuarios no encontrada; blog_posts creada sin la FK a usuarios. Añade la FK manualmente cuando corresponda.';
  END IF;
END
$$;

-- ─── Comentarios (opcional, para futura expansión) ────────────────────
-- Crear `blog_comments` condicionalmente: si existe `usuarios` poner FK, si no crear sin FK
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS blog_comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        id_usuario VARCHAR(10) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
        author_name VARCHAR(200),
        content TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT false,
        parent_id INT REFERENCES blog_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS blog_comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL,
        id_usuario VARCHAR(10),
        author_name VARCHAR(200),
        content TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT false,
        parent_id INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    $sql$;
    RAISE NOTICE 'Tabla usuarios no encontrada; blog_comments creada sin la FK a usuarios. Añade la FK manualmente cuando corresponda.';
  END IF;
END
$$;

-- ─── Índices ──────────────────────────────────────────────────────────
CREATE INDEX idx_blog_posts_usuario    ON blog_posts (id_usuario);
CREATE INDEX idx_blog_posts_category   ON blog_posts (category_id);
CREATE INDEX idx_blog_posts_status     ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_posts_featured   ON blog_posts (featured) WHERE featured = true;
CREATE INDEX idx_blog_posts_tags       ON blog_posts USING GIN (tags);
CREATE INDEX idx_blog_comments_post    ON blog_comments (post_id);

COMMIT;