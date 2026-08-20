import assert from "node:assert/strict";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");

const sql = postgres(databaseUrl, { max: 1 });
const suffix = randomUUID().slice(0, 8);

try {
  const seededArtist = await sql`SELECT id, is_published FROM artists WHERE slug = 'dj-stay'`;
  assert.equal(seededArtist.length, 1, "DJ Stay must be migrated");
  assert.equal(seededArtist[0].is_published, true);

  const seededProfile = await sql`SELECT is_active, page_link FROM artist_profiles WHERE artist_id = ${seededArtist[0].id}`;
  assert.equal(seededProfile.length, 1, "Existing artists must receive an artist profile");
  assert.equal(seededProfile[0].is_active, true);
  assert.equal(seededProfile[0].page_link, "/artistas/dj-stay");

  const seededRole = await sql`SELECT id FROM artist_roles WHERE slug='dj-produtor' AND active=true`;
  const seededGenre = await sql`SELECT id FROM music_genres WHERE slug='funk' AND active=true`;
  assert.equal(seededRole.length, 1, "DJ / Produtor role must be seeded");
  assert.equal(seededGenre.length, 1, "Funk genre must be seeded");

  const destinationRows = await sql`SELECT id, key FROM artist_publication_destinations WHERE key IN ('home_artists','artists_index') ORDER BY key`;
  assert.equal(destinationRows.length, 2, "Both initial artist publication destinations must exist");
  const destinations = Object.fromEntries(destinationRows.map((row) => [row.key, row.id]));
  const seededIndexPlacement = await sql`SELECT artist_id FROM artist_publication_placements WHERE artist_id=${seededArtist[0].id} AND destination_id=${destinations.artists_index} AND enabled=true`;
  assert.equal(seededIndexPlacement.length, 1, "Published migrated artist must keep /artistas placement");

  const category = await sql`
    INSERT INTO artist_categories (name, slug, position, active, show_as_filter)
    VALUES ('Trap Test', ${`trap-test-${suffix}`}, 99, true, true)
    RETURNING id, slug
  `;

  const artist = await sql`
    INSERT INTO artists (name, slug, short_bio, biography, is_published, published_at, feature_on_home)
    VALUES ('Integration Artist', ${`integration-artist-${suffix}`}, 'Resumo', 'Biografia', true, now(), false)
    RETURNING id, slug
  `;
  await sql`
    INSERT INTO artist_profiles (artist_id, is_active, page_link, hire_title, hire_text, hire_button_label)
    VALUES (${artist[0].id}, true, ${`/artistas/${artist[0].slug}`}, 'Contrate', 'Texto comercial', 'Quero contratar')
  `;
  await sql`
    INSERT INTO artist_category_relations (artist_id, category_id, is_primary, position)
    VALUES (${artist[0].id}, ${category[0].id}, true, 0)
  `;
  await sql`INSERT INTO artist_role_relations (artist_id, role_id, position) VALUES (${artist[0].id}, ${seededRole[0].id}, 0)`;
  await sql`INSERT INTO artist_genre_relations (artist_id, genre_id, position) VALUES (${artist[0].id}, ${seededGenre[0].id}, 0)`;
  await sql`INSERT INTO artist_metrics (artist_id, platform, value) VALUES (${artist[0].id}, 'instagram', 12345), (${artist[0].id}, 'spotify', 67890)`;
  await sql`
    INSERT INTO artist_publication_placements (artist_id, destination_id, enabled, position)
    VALUES (${artist[0].id}, ${destinations.artists_index}, true, 25)
  `;
  await sql`INSERT INTO artist_links (artist_id, kind, platform, label, url, position, active) VALUES (${artist[0].id}, 'social', 'instagram', 'Instagram', 'https://example.com/instagram', 0, true)`;
  await sql`INSERT INTO artist_embeds (artist_id, type, title, url, position, active, featured) VALUES (${artist[0].id}, 'youtube', 'Vídeo', 'https://youtube.com/watch?v=test', 0, true, true)`;

  const filteredArtist = await sql`
    SELECT a.id
    FROM artists a
    JOIN artist_profiles p ON p.artist_id = a.id AND p.is_active = true
    JOIN artist_category_relations r ON r.artist_id = a.id
    JOIN artist_categories c ON c.id = r.category_id
    JOIN artist_publication_placements pp ON pp.artist_id = a.id AND pp.enabled = true
    JOIN artist_publication_destinations pd ON pd.id = pp.destination_id AND pd.key = 'artists_index'
    WHERE a.is_published = true AND a.archived_at IS NULL AND c.slug = ${category[0].slug}
  `;
  assert.equal(filteredArtist.length, 1, "Dynamic artist category filter must respect publication destinations");

  let homeArtist = await sql`
    SELECT a.id FROM artists a
    JOIN artist_profiles p ON p.artist_id=a.id AND p.is_active=true
    JOIN artist_publication_placements pp ON pp.artist_id=a.id AND pp.enabled=true
    JOIN artist_publication_destinations pd ON pd.id=pp.destination_id AND pd.key='home_artists'
    WHERE a.id=${artist[0].id} AND a.is_published=true AND a.archived_at IS NULL
  `;
  assert.equal(homeArtist.length, 0, "An artist published in /artistas must not automatically appear on Home");

  await sql`
    INSERT INTO artist_publication_placements (artist_id, destination_id, enabled, position)
    VALUES (${artist[0].id}, ${destinations.home_artists}, true, 10)
  `;
  homeArtist = await sql`
    SELECT a.id FROM artists a
    JOIN artist_profiles p ON p.artist_id=a.id AND p.is_active=true
    JOIN artist_publication_placements pp ON pp.artist_id=a.id AND pp.enabled=true
    JOIN artist_publication_destinations pd ON pd.id=pp.destination_id AND pd.key='home_artists'
    WHERE a.id=${artist[0].id} AND a.is_published=true AND a.archived_at IS NULL
  `;
  assert.equal(homeArtist.length, 1, "Home placement must be independently selectable");

  const artistRelations = await sql`
    SELECT
      (SELECT count(*)::int FROM artist_role_relations WHERE artist_id=${artist[0].id}) AS roles,
      (SELECT count(*)::int FROM artist_genre_relations WHERE artist_id=${artist[0].id}) AS genres,
      (SELECT count(*)::int FROM artist_metrics WHERE artist_id=${artist[0].id}) AS metrics,
      (SELECT count(*)::int FROM artist_links WHERE artist_id=${artist[0].id}) AS links,
      (SELECT count(*)::int FROM artist_embeds WHERE artist_id=${artist[0].id}) AS embeds,
      (SELECT count(*)::int FROM artist_publication_placements WHERE artist_id=${artist[0].id}) AS placements
  `;
  assert.equal(artistRelations[0].roles, 1);
  assert.equal(artistRelations[0].genres, 1);
  assert.equal(artistRelations[0].metrics, 2);
  assert.equal(artistRelations[0].links, 1);
  assert.equal(artistRelations[0].embeds, 1);
  assert.equal(artistRelations[0].placements, 2);

  await sql`UPDATE artists SET name='Integration Artist Updated', updated_at=now() WHERE id=${artist[0].id}`;
  const updatedArtist = await sql`SELECT name FROM artists WHERE id=${artist[0].id}`;
  assert.equal(updatedArtist[0].name, "Integration Artist Updated", "Artist edits must persist");

  const postCategory = await sql`SELECT id FROM post_categories WHERE active=true ORDER BY position LIMIT 1`;
  const post = await sql`
    INSERT INTO posts (title, slug, excerpt, content_markdown, author_name, category_id, status)
    VALUES ('Integration Post', ${`integration-post-${suffix}`}, 'Resumo', 'Conteúdo', 'CI', ${postCategory[0].id}, 'draft')
    RETURNING id
  `;
  let publicPost = await sql`SELECT id FROM posts WHERE id = ${post[0].id} AND status = 'published'`;
  assert.equal(publicPost.length, 0, "Draft posts must not be public");
  await sql`UPDATE posts SET status='published', published_at=now() WHERE id=${post[0].id}`;
  publicPost = await sql`SELECT id FROM posts WHERE id=${post[0].id} AND status='published' AND published_at <= now()`;
  assert.equal(publicPost.length, 1, "Published posts must be queryable");

  const topic = await sql`SELECT id FROM contact_topics WHERE slug='outro' LIMIT 1`;
  const idempotencyKey = randomUUID();
  const contact = await sql`
    INSERT INTO contact_submissions (
      idempotency_key,name,email,phone,topic_id,message,consent,consent_version,consent_at,source,ip_hash
    ) VALUES (
      ${idempotencyKey},'Integration Lead','ci@example.com','',${topic[0].id},'Mensagem de integração',
      true,'test',now(),'lander-records-site','test-ip-hash'
    ) RETURNING id
  `;
  await sql`
    INSERT INTO integration_outbox (event_type,aggregate_type,aggregate_id,payload)
    VALUES ('site.contact.submitted','contact_submission',${contact[0].id},${sql.json({ contactSubmissionId: contact[0].id })})
  `;
  const outbox = await sql`SELECT id FROM integration_outbox WHERE aggregate_id=${contact[0].id}`;
  assert.equal(outbox.length, 1, "Contact submission must create a durable outbox event");

  let duplicateRejected = false;
  try {
    await sql`
      INSERT INTO contact_submissions (
        idempotency_key,name,email,phone,topic_id,message,consent,consent_version,consent_at,source
      ) VALUES (
        ${idempotencyKey},'Duplicate','duplicate@example.com','',${topic[0].id},'Duplicate',
        true,'test',now(),'lander-records-site'
      )
    `;
  } catch {
    duplicateRejected = true;
  }
  assert.equal(duplicateRejected, true, "Contact idempotency key must be unique");

  await sql`DELETE FROM artists WHERE id=${artist[0].id}`;
  const cascaded = await sql`
    SELECT
      (SELECT count(*)::int FROM artist_profiles WHERE artist_id=${artist[0].id}) AS profiles,
      (SELECT count(*)::int FROM artist_metrics WHERE artist_id=${artist[0].id}) AS metrics,
      (SELECT count(*)::int FROM artist_publication_placements WHERE artist_id=${artist[0].id}) AS placements
  `;
  assert.equal(cascaded[0].profiles, 0, "Artist delete must cascade profile data");
  assert.equal(cascaded[0].metrics, 0, "Artist delete must cascade metrics");
  assert.equal(cascaded[0].placements, 0, "Artist delete must cascade publication placements");

  await sql`DELETE FROM artist_categories WHERE id=${category[0].id}`;
  await sql`DELETE FROM posts WHERE id=${post[0].id}`;
  await sql`DELETE FROM integration_outbox WHERE aggregate_id=${contact[0].id}`;
  await sql`DELETE FROM contact_submissions WHERE id=${contact[0].id}`;

  console.log("Integration checks passed: artist model/CRUD, independent publication destinations, category filters, metrics/platform relations, post publication, contact outbox/idempotency.");
} finally {
  await sql.end({ timeout: 5 });
}
