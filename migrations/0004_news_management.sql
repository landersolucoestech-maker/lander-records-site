BEGIN;

CREATE TABLE IF NOT EXISTS post_profiles (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  author_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  publication_link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_links (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform varchar(80) NOT NULL,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, platform)
);

INSERT INTO post_profiles (post_id, publication_link)
SELECT id, '/noticias/' || slug
FROM posts
ON CONFLICT (post_id) DO NOTHING;

COMMIT;
