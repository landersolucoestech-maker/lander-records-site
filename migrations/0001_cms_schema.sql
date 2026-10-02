BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE admin_role AS ENUM ('owner','admin','editor','viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE content_status AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE media_status AS ENUM ('active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contact_status AS ENUM ('new','processing','exported','spam','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE outbox_status AS ENUM ('pending','delivered','failed','disabled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  password_hash text NOT NULL,
  role admin_role NOT NULL DEFAULT 'editor',
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip_hash varchar(64),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_provider varchar(40) NOT NULL DEFAULT 'local',
  storage_key text NOT NULL UNIQUE,
  url text NOT NULL,
  mime_type varchar(120) NOT NULL,
  byte_size integer NOT NULL,
  width integer,
  height integer,
  alt_text text NOT NULL DEFAULT '',
  original_filename text NOT NULL,
  status media_status NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  show_as_filter boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  slug varchar(200) NOT NULL UNIQUE,
  eyebrow varchar(180) NOT NULL DEFAULT '',
  short_bio text NOT NULL DEFAULT '',
  biography text NOT NULL DEFAULT '',
  card_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  hero_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  feature_on_home boolean NOT NULL DEFAULT false,
  home_position integer NOT NULL DEFAULT 0,
  list_position integer NOT NULL DEFAULT 0,
  seo_title varchar(180) NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS artists_public_idx ON artists(is_published, archived_at, list_position);

CREATE TABLE IF NOT EXISTS artist_category_relations (
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES artist_categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artist_id, category_id)
);

CREATE TABLE IF NOT EXISTS artist_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  kind varchar(40) NOT NULL DEFAULT 'social',
  platform varchar(80) NOT NULL,
  label varchar(120) NOT NULL,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  title varchar(180) NOT NULL DEFAULT '',
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  show_as_filter boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  slug varchar(160) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(240) NOT NULL,
  slug varchar(260) NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content_markdown text NOT NULL DEFAULT '',
  author_name varchar(160) NOT NULL DEFAULT 'Lander Records',
  category_id uuid REFERENCES post_categories(id) ON DELETE SET NULL,
  cover_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  status content_status NOT NULL DEFAULT 'draft',
  featured_on_home boolean NOT NULL DEFAULT false,
  home_position integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  scheduled_at timestamptz,
  archived_at timestamptz,
  seo_title varchar(180) NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_public_idx ON posts(status, published_at, scheduled_at);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(220) NOT NULL,
  slug varchar(240) NOT NULL UNIQUE,
  artist_name varchar(220) NOT NULL,
  release_type varchar(80) NOT NULL DEFAULT 'Single',
  release_date date,
  cover_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  platform varchar(80) NOT NULL DEFAULT 'Spotify',
  platform_url text NOT NULL DEFAULT '',
  external_id varchar(180),
  position integer NOT NULL DEFAULT 0,
  featured_on_home boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(80) NOT NULL UNIQUE,
  title varchar(180) NOT NULL,
  slug varchar(200) NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  seo_title varchar(180) NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key varchar(120) NOT NULL,
  type varchar(80) NOT NULL,
  eyebrow varchar(180) NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, section_key)
);

CREATE TABLE IF NOT EXISTS page_section_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  item_key varchar(120) NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key varchar(80) NOT NULL DEFAULT 'primary',
  parent_id uuid REFERENCES navigation_items(id) ON DELETE CASCADE,
  label varchar(160) NOT NULL,
  url text NOT NULL,
  link_type varchar(20) NOT NULL DEFAULT 'internal',
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  new_tab boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id varchar(40) PRIMARY KEY DEFAULT 'site',
  brand_name varchar(180) NOT NULL DEFAULT 'Lander Records',
  tagline text NOT NULL DEFAULT '',
  contact_email varchar(320) NOT NULL DEFAULT '',
  contact_phone varchar(80) NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT '',
  default_seo_title varchar(180) NOT NULL DEFAULT '',
  default_seo_description text NOT NULL DEFAULT '',
  logo_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  social_image_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform varchar(80) NOT NULL,
  label varchar(120) NOT NULL,
  url text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE,
  saas_type varchar(120) NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(80) NOT NULL DEFAULT '',
  topic_id uuid REFERENCES contact_topics(id) ON DELETE SET NULL,
  message text NOT NULL,
  consent boolean NOT NULL,
  consent_version varchar(40) NOT NULL,
  consent_at timestamptz NOT NULL,
  source varchar(120) NOT NULL DEFAULT 'lander-records-site',
  page_path text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  utm_source text NOT NULL DEFAULT '',
  utm_medium text NOT NULL DEFAULT '',
  utm_campaign text NOT NULL DEFAULT '',
  utm_term text NOT NULL DEFAULT '',
  utm_content text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  ip_hash varchar(64),
  status contact_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_ip_idx ON contact_submissions(ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(160) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status outbox_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text NOT NULL DEFAULT '',
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS integration_outbox_delivery_idx ON integration_outbox(status, next_attempt_at, created_at);

CREATE TABLE IF NOT EXISTS slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(80) NOT NULL,
  old_slug varchar(260) NOT NULL,
  new_slug varchar(260) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, old_slug)
);

COMMIT;
