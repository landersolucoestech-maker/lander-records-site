import fs from "node:fs/promises";
import postgres from "postgres";

const envText = await fs.readFile(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const requiredColumns = {
  posts: ["id", "title", "slug", "category_id", "cover_media_id", "og_media_id", "status"],
  post_categories: ["id", "name", "slug", "active"],
  media_assets: ["id", "url", "status", "storage_provider"],
  artists: ["id", "name", "slug", "is_published"],
  artist_links: ["id", "artist_id", "platform", "url"],
  artist_embeds: ["id", "artist_id", "type", "url"],
};

try {
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const rows = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = ${table}
    `;
    const actual = new Set(rows.map((row) => row.column_name));
    const missing = columns.filter((column) => !actual.has(column));
    if (missing.length) throw new Error(`${table} missing columns: ${missing.join(",")}`);
  }
  console.log("SCHEMA_VALIDATION:PASS");

  const joinedPosts = await sql`
    select p.id, p.slug, pc.slug as category_slug, ma.url as cover_url
    from posts p
    left join post_categories pc on pc.id = p.category_id
    left join media_assets ma on ma.id = p.cover_media_id
    where p.status = 'published' and p.archived_at is null
    order by p.published_at desc nulls last, p.created_at desc
  `;
  console.log(`GET_PUBLISHED_POSTS:PASS count=${joinedPosts.length}`);
  console.log(`GET_PUBLISHED_POSTS_FIRST=${joinedPosts[0]?.slug || "none"}`);

  const counts = await sql`
    select
      (select count(*)::int from posts) as posts,
      (select count(*)::int from artists) as artists,
      (select count(*)::int from pages) as pages,
      (select count(*)::int from site_settings) as site_settings,
      (select count(*)::int from navigation_items) as navigation_items,
      (select count(*)::int from social_links) as social_links,
      (select count(*)::int from contact_topics) as contact_topics
  `;
  console.log(`INITIAL_CONTENT_COUNTS=${JSON.stringify(counts[0])}`);
  for (const field of ["posts", "artists", "pages", "site_settings", "navigation_items", "social_links", "contact_topics"]) {
    if (counts[0][field] < 1) throw new Error(`initial content missing: ${field}`);
  }
  console.log("INITIAL_CONTENT:PASS");
} finally {
  await sql.end({ timeout: 5 });
}
