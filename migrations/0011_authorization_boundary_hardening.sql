BEGIN;

-- Defense in depth for the CMS database boundary.
-- Application authorization remains enforced server-side; this migration prevents
-- accidental PostgreSQL PUBLIC privileges from becoming an alternate write path.
-- It intentionally does not create deployment-specific LOGIN roles or credentials.

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC;

COMMIT;
