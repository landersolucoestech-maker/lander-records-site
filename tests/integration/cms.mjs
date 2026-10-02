import assert from "node:assert/strict";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");

const client = postgres(databaseUrl, { max: 1 });
const suffix = randomUUID().slice(0, 8);
const rollback = new Error("ROLLBACK_INTEGRATION_TEST");

try {
  await client.begin(async (sql) => {
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

  const seededPostProfiles = await sql`SELECT count(*)::int AS count FROM post_profiles`;
  const seededPostCount = await sql`SELECT count(*)::int AS count FROM posts`;
  assert.equal(seededPostProfiles[0].count, seededPostCount[0].count, "Existing news must receive publication profiles");

  const postCategory = await sql`SELECT id FROM post_categories WHERE active=true ORDER BY position LIMIT 1`;
  const seededMedia = await sql`SELECT id FROM media_assets WHERE status='active' ORDER BY created_at LIMIT 1`;
  assert.equal(seededMedia.length, 1, "A seeded media asset is required for news image reuse test");

  const post = await sql`
    INSERT INTO posts (
      title, slug, excerpt, content_markdown, author_name, category_id, status,
      cover_media_id, og_media_id, featured_on_home, home_position
    ) VALUES (
      'Integration Post', ${`integration-post-${suffix}`}, 'Resumo', 'Conteúdo completo', 'CI', ${postCategory[0].id}, 'draft',
      ${seededMedia[0].id}, ${seededMedia[0].id}, true, 90
    )
    RETURNING id, slug, cover_media_id, og_media_id
  `;
  assert.equal(post[0].cover_media_id, post[0].og_media_id, "News main image must also be its social/OG image by default");

  await sql`
    INSERT INTO post_profiles (post_id, author_media_id, publication_link)
    VALUES (${post[0].id}, ${seededMedia[0].id}, ${`/noticias/${post[0].slug}`})
  `;
  await sql`
    INSERT INTO post_links (post_id, platform, url) VALUES
      (${post[0].id}, 'facebook', 'https://example.com/facebook'),
      (${post[0].id}, 'instagram', 'https://example.com/instagram'),
      (${post[0].id}, 'youtube', 'https://example.com/youtube'),
      (${post[0].id}, 'tiktok', 'https://example.com/tiktok')
  `;

  const postRelations = await sql`
    SELECT
      p.publication_link,
      p.author_media_id,
      (SELECT count(*)::int FROM post_links l WHERE l.post_id=${post[0].id}) AS links
    FROM post_profiles p WHERE p.post_id=${post[0].id}
  `;
  assert.equal(postRelations.length, 1, "News publication profile must persist");
  assert.equal(postRelations[0].publication_link, `/noticias/${post[0].slug}`);
  assert.equal(postRelations[0].author_media_id, seededMedia[0].id);
  assert.equal(postRelations[0].links, 4, "News social links must persist separately from content");

  let publicPost = await sql`SELECT id FROM posts WHERE id = ${post[0].id} AND status = 'published'`;
  assert.equal(publicPost.length, 0, "Draft posts must not be public");
  await sql`UPDATE posts SET title='Integration Post Updated', status='published', published_at=now(), updated_at=now() WHERE id=${post[0].id}`;
  await sql`UPDATE post_profiles SET publication_link=${`/noticias/${post[0].slug}?updated=1`}, updated_at=now() WHERE post_id=${post[0].id}`;
  publicPost = await sql`SELECT id, title FROM posts WHERE id=${post[0].id} AND status='published' AND published_at <= now()`;
  assert.equal(publicPost.length, 1, "Published posts must be queryable");
  assert.equal(publicPost[0].title, "Integration Post Updated", "News edits must persist");
  const updatedPublicationProfile = await sql`SELECT publication_link FROM post_profiles WHERE post_id=${post[0].id}`;
  assert.equal(updatedPublicationProfile[0].publication_link, `/noticias/${post[0].slug}?updated=1`, "Publication link edits must persist");

  const definitions = await sql`SELECT id, key, type FROM section_definitions WHERE key IN ('hero','news_list','artist_list') AND active=true`;
  assert.ok(definitions.length >= 3, "Permanent section definitions must exist");
  const newsListDefinition = definitions.find((row) => row.key === "news_list");
  assert.ok(newsListDefinition, "News list section definition must exist");

  const seededBindings = await sql`
    SELECT ps.id, ps.section_key, b.definition_id
    FROM page_sections ps
    JOIN page_section_bindings b ON b.page_section_id=ps.id
    WHERE ps.section_key IN ('hero','news_list','artist_list')
  `;
  assert.ok(seededBindings.length >= 3, "Existing public sections must be explicitly bound to permanent definitions");

  const testPage = await sql`
    INSERT INTO pages (key, title, slug, enabled, seo_title, seo_description)
    VALUES (${`integration-page-${suffix}`}, 'Integration Page', ${`integration-page-${suffix}`}, true, 'Integration Page', 'Integration page test')
    RETURNING id, slug
  `;
  const testSection = await sql`
    INSERT INTO page_sections (page_id, section_key, type, title, position, enabled)
    VALUES (${testPage[0].id}, ${newsListDefinition.key}, ${newsListDefinition.type}, 'Listagem', 1, true)
    RETURNING id
  `;
  await sql`
    INSERT INTO page_section_bindings (page_section_id, definition_id)
    VALUES (${testSection[0].id}, ${newsListDefinition.id})
  `;
  const boundSection = await sql`
    SELECT p.id AS page_id, ps.id AS section_id, ps.section_key, sd.id AS definition_id, sd.key AS definition_key
    FROM pages p
    JOIN page_sections ps ON ps.page_id=p.id
    JOIN page_section_bindings b ON b.page_section_id=ps.id
    JOIN section_definitions sd ON sd.id=b.definition_id
    WHERE p.id=${testPage[0].id}
  `;
  assert.equal(boundSection.length, 1, "Page must bind to a selectable permanent section definition");
  assert.equal(boundSection[0].definition_key, "news_list");
  assert.equal(boundSection[0].section_key, "news_list");

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
  assert.equal(outbox.length, 1, "Public contact submission must create a durable outbox event for the external SaaS");

  let duplicateRejected = false;
  try {
    await sql.savepoint((savepoint) => savepoint`
        INSERT INTO contact_submissions (
          idempotency_key,name,email,phone,topic_id,message,consent,consent_version,consent_at,source
        ) VALUES (
          ${idempotencyKey},'Duplicate','duplicate@example.com','',${topic[0].id},'Duplicate',
          true,'test',now(),'lander-records-site'
        )
      `);
  } catch {
    duplicateRejected = true;
  }
  assert.equal(duplicateRejected, true, "Contact idempotency key must be unique");

  await sql`DELETE FROM artists WHERE id=${artist[0].id}`;
  const cascadedArtist = await sql`
    SELECT
      (SELECT count(*)::int FROM artist_profiles WHERE artist_id=${artist[0].id}) AS profiles,
      (SELECT count(*)::int FROM artist_metrics WHERE artist_id=${artist[0].id}) AS metrics,
      (SELECT count(*)::int FROM artist_publication_placements WHERE artist_id=${artist[0].id}) AS placements
  `;
  assert.equal(cascadedArtist[0].profiles, 0, "Artist delete must cascade profile data");
  assert.equal(cascadedArtist[0].metrics, 0, "Artist delete must cascade metrics");
  assert.equal(cascadedArtist[0].placements, 0, "Artist delete must cascade publication placements");
  await sql`DELETE FROM artist_categories WHERE id=${category[0].id}`;

  await sql`DELETE FROM posts WHERE id=${post[0].id}`;
  const cascadedPost = await sql`
    SELECT
      (SELECT count(*)::int FROM post_profiles WHERE post_id=${post[0].id}) AS profiles,
      (SELECT count(*)::int FROM post_links WHERE post_id=${post[0].id}) AS links
  `;
  assert.equal(cascadedPost[0].profiles, 0, "News delete must cascade publication profile");
  assert.equal(cascadedPost[0].links, 0, "News delete must cascade social links");

  await sql`DELETE FROM pages WHERE id=${testPage[0].id}`;
  const cascadedPage = await sql`
    SELECT
      (SELECT count(*)::int FROM page_sections WHERE id=${testSection[0].id}) AS sections,
      (SELECT count(*)::int FROM page_section_bindings WHERE page_section_id=${testSection[0].id}) AS bindings
  `;
  assert.equal(cascadedPage[0].sections, 0, "Page delete must cascade section instances");
  assert.equal(cascadedPage[0].bindings, 0, "Page delete must cascade section bindings");

  await sql`DELETE FROM integration_outbox WHERE aggregate_id=${contact[0].id}`;
  await sql`DELETE FROM contact_submissions WHERE id=${contact[0].id}`;

  console.log("Integration checks passed: artist CRUD/publication destinations, news CRUD/main-image reuse, page/section registry bindings, and public contact outbox/idempotency.");
  throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await client.end({ timeout: 5 });
}
