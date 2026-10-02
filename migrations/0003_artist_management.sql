BEGIN;

CREATE TABLE IF NOT EXISTS artist_profiles (
  artist_id uuid PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  page_link text NOT NULL DEFAULT '',
  hire_title varchar(180) NOT NULL DEFAULT 'Contrate',
  hire_text text NOT NULL DEFAULT '',
  hire_button_label varchar(120) NOT NULL DEFAULT 'Quero contratar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(140) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_role_relations (
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES artist_roles(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artist_id, role_id)
);

CREATE TABLE IF NOT EXISTS music_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(140) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_genre_relations (
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES music_genres(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artist_id, genre_id)
);

CREATE TABLE IF NOT EXISTS artist_metrics (
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform varchar(80) NOT NULL,
  value bigint NOT NULL DEFAULT 0 CHECK (value >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, platform)
);

CREATE TABLE IF NOT EXISTS artist_publication_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL UNIQUE,
  label varchar(180) NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_publication_placements (
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES artist_publication_destinations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, destination_id)
);

INSERT INTO artist_roles (name, slug, position, active)
VALUES
  ('DJ / Produtor', 'dj-produtor', 10, true),
  ('Compositor / Autor', 'compositor-autor', 20, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, active = true, updated_at = now();

INSERT INTO music_genres (name, slug, position, active)
VALUES ('Funk', 'funk', 10, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, active = true, updated_at = now();

INSERT INTO artist_publication_destinations (key, label, description, position, active)
VALUES
  ('home_artists', 'Seção de Artistas da Home Page', 'Exibe o artista na seção de artistas da página inicial.', 10, true),
  ('artists_index', 'Página geral de Artistas', 'Exibe o artista na listagem pública /artistas.', 20, true)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, position = EXCLUDED.position, active = true, updated_at = now();

INSERT INTO artist_profiles (artist_id, is_active, page_link, hire_title, hire_text, hire_button_label)
SELECT id, archived_at IS NULL, '/artistas/' || slug, 'Contrate', '', 'Quero contratar'
FROM artists
ON CONFLICT (artist_id) DO NOTHING;

INSERT INTO artist_publication_placements (artist_id, destination_id, enabled, position)
SELECT a.id, d.id, true, a.list_position
FROM artists a
JOIN artist_publication_destinations d ON d.key = 'artists_index'
WHERE a.is_published = true AND a.archived_at IS NULL
ON CONFLICT (artist_id, destination_id) DO UPDATE SET enabled = true, position = EXCLUDED.position, updated_at = now();

INSERT INTO artist_publication_placements (artist_id, destination_id, enabled, position)
SELECT a.id, d.id, true, a.home_position
FROM artists a
JOIN artist_publication_destinations d ON d.key = 'home_artists'
WHERE a.feature_on_home = true AND a.is_published = true AND a.archived_at IS NULL
ON CONFLICT (artist_id, destination_id) DO UPDATE SET enabled = true, position = EXCLUDED.position, updated_at = now();

INSERT INTO artist_role_relations (artist_id, role_id, position)
SELECT a.id, r.id, 0
FROM artists a
JOIN artist_roles r ON r.slug = 'dj-produtor'
WHERE a.slug = 'dj-stay'
ON CONFLICT (artist_id, role_id) DO NOTHING;

INSERT INTO artist_genre_relations (artist_id, genre_id, position)
SELECT a.id, g.id, 0
FROM artists a
JOIN music_genres g ON g.slug = 'funk'
WHERE a.slug = 'dj-stay'
ON CONFLICT (artist_id, genre_id) DO NOTHING;

COMMIT;
