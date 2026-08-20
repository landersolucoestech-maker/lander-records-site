import fs from "node:fs/promises";
import path from "node:path";

const siteDir = process.argv[2];
if (!siteDir) throw new Error("Usage: node fix-dj-stay-poster-order.mjs <site-dir>");

const artistPath = path.join(siteDir, "app/artistas/[slug]/page.tsx");
let artistPage = await fs.readFile(artistPath, "utf8");

const djStayPoster = `
          {artist.slug === "dj-stay" ? (
            <Link className="artistPromoPoster" href="/contato" aria-label="Contrate DJ Stay">
              <img src={djStayBanner} alt="Contrate DJ Stay" />
            </Link>
          ) : null}`;

if (!artistPage.includes(djStayPoster)) {
  throw new Error("Could not locate the injected DJ Stay poster.");
}

// Remove the poster from the old position first. It was previously injected
// immediately after the upper social/metrics block, which placed it ABOVE
// the user-facing 'SIGA E OUÇA' frame.
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

// Make the poster the LAST item of artistSidebar. This guarantees that it is
// rendered below every sidebar frame, including 'SIGA E OUÇA'.
artistPage =
  artistPage.slice(0, sidebarEnd) +
  djStayPoster +
  "\n" +
  artistPage.slice(sidebarEnd);

const posterIndex = artistPage.indexOf('className="artistPromoPoster"', sidebarStart);
const closingIndex = artistPage.indexOf(sidebarClose, sidebarStart);
if (posterIndex < 0 || closingIndex < 0 || posterIndex > closingIndex) {
  throw new Error("DJ Stay poster was not moved to the end of artistSidebar.");
}

await fs.writeFile(artistPath, artistPage);
console.log("DJ Stay poster forced to the final position below all artist sidebar frames.");
