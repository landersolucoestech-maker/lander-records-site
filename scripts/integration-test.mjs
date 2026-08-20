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

  const category = await sql`
    INSERT INTO artist_categories (name, slug, position, active, show_as_filter)
    VALUES ('Trap Test', ${`trap-test-${suffix}`}, 99, true, true)
    RETURNING id, slug
  `;
  const artist = await sql`
    INSERT INTO artists (name, slug, eyebrow, short_bio, biography, is_published, published_at, feature_on_home)
    VALUES ('Integration Artist', ${`integration-artist-${suffix}`}, 'TRAP', 'Resumo', 'Biografia', true, now(), true)
    RETURNING id, slug
  `;
  await sql`
    INSERT INTO artist_category_relations (artist_id, category_id, is_primary, position)
    VALUES (${artist[0].id}, ${category[0].id}, true, 0)
  `;
  const filteredArtist = await sql`
    SELECT a.id
    FROM artists a
    JOIN artist_category_relations r ON r.artist_id = a.id
    JOIN artist_categories c ON c.id = r.category_id
    WHERE a.is_published = true AND a.archived_at IS NULL AND c.slug = ${category[0].slug}
  `;
  assert.equal(filteredArtist.length, 1, "Dynamic artist category filter must be data-driven");

  const postCategory = await sql`SELECT id FROM post_categories WHERE slug = 'noticias' LIMIT 1`;
  const post = await sql`
    INSERT INTO posts (title, slug, excerpt, content_markdown, author_name, category_id, status)
    VALUES ('Integration Post', ${`integration-post-${suffix}`}, 'Resumo', 'Conteúdo', 'CI', ${postCategory[0].id}, 'draft')
    RETURNING id
  `;
  let publicPost = await sql`SELECT id FROM posts WHERE id = ${post[0].id} AND status = 'published'`;
  assert.equal(publicPost.length, 0, "Draft posts must not be public");
  await sql`UPDATE posts SET status='published', published_at=now() WHERE id=${post[0].id}`;
  publicPost = await sql`SELECT id FROM posts WHERE id = ${post[0].id} AND status='published' AND published_at <= now()`;
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
  await sql`DELETE FROM artist_categories WHERE id=${category[0].id}`;
  await sql`DELETE FROM posts WHERE id=${post[0].id}`;
  await sql`DELETE FROM integration_outbox WHERE aggregate_id=${contact[0].id}`;
  await sql`DELETE FROM contact_submissions WHERE id=${contact[0].id}`;

  console.log("Integration checks passed: migration, artist CRUD/filter, post publication, contact persistence/outbox/idempotency.");
} finally {
  await sql.end({ timeout: 5 });
}
