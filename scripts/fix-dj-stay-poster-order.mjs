import fs from "node:fs/promises";
import path from "node:path";

const siteDir = process.argv[2];
if (!siteDir) throw new Error("Usage: node fix-dj-stay-poster-order.mjs <site-dir>");

const artistPath = path.join(siteDir, "app/artistas/[slug]/page.tsx");
let artistPage = await fs.readFile(artistPath, "utf8");

const djStayPoster = `
          {artist.slug === "dj-stay" ? (
            <Link className="artistPromoPoster" href="/contato" aria-label="Contrate DJ Stay">
              <img src="/lander-records-site/dj-stay-promo.webp" alt="Contrate DJ Stay" width={350} height={622} />
            </Link>
          ) : null}`;

if (!artistPage.includes(djStayPoster)) {
  throw new Error("Could not locate the injected DJ Stay poster.");
}

artistPage = artistPage.replace(djStayPoster, "");

const sidebarStart = artistPage.indexOf('<aside className="artistSidebar">');
if (sidebarStart < 0) {
  throw new Error("Could not locate artistSidebar.");
}

const sidebarClose = "        </aside>";
const sidebarEnd = artistPage.indexOf(sidebarClose, sidebarStart);
if (sidebarEnd < 0) {
  throw new Error("Could not locate the closing artistSidebar tag.");
}

artistPage =
  artistPage.slice(0, sidebarEnd) +
  djStayPoster +
  "\n" +
  artistPage.slice(sidebarEnd);

const posterIndex = artistPage.indexOf('className="artistPromoPoster"', sidebarStart);
const closingIndex = artistPage.indexOf(sidebarClose, sidebarStart);
const promoAssetIndex = artistPage.indexOf("/lander-records-site/dj-stay-promo.webp", sidebarStart);
if (posterIndex < 0 || promoAssetIndex < 0 || closingIndex < 0 || posterIndex > closingIndex) {
  throw new Error("DJ Stay poster was not moved to the end of artistSidebar with the real promo asset.");
}

await fs.writeFile(artistPath, artistPage);
console.log("DJ Stay promo image forced to the final position below all artist sidebar frames.");
