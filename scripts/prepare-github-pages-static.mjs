import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeBanner } from "./materialize-banner.mjs";

const siteDir = process.argv[2];
if (!siteDir) throw new Error("Usage: node prepare-github-pages-static.mjs <site-dir>");

const chromePath = path.join(siteDir, "app/components/SiteChrome.tsx");
let chrome = await fs.readFile(chromePath, "utf8");
chrome = chrome.replace(
  `<Link className="brand" href="/" aria-label="Lander Records">\n        <span className="brandWing">LANDER</span>\n        <span className="brandRecords">RECORDS</span>\n      </Link>`,
  `<Link className="brand" href="/" aria-label="Lander Records">\n        <img src="/lander-records-site/lander-records-logo.webp" alt="Lander Records" style={{display:"block",width:150,height:"auto",objectFit:"contain"}} />\n      </Link>`
);
chrome = chrome.replace(
  `<Link className="footerBrand" href="/" aria-label="Lander Records"><span className="footerBrandName">LANDER</span><span className="footerBrandRecords">RECORDS</span></Link>`,
  `<Link className="footerBrand" href="/" aria-label="Lander Records"><img src="/lander-records-site/lander-records-logo.webp" alt="Lander Records" style={{display:"block",width:190,height:"auto",objectFit:"contain"}} /></Link>`
);
chrome = chrome.replace(
  `<Link href="/">› Início</Link><Link href="/sobre-nos">› Sobre</Link><Link href="/artistas">› Artistas</Link><Link href="/sobre-nos#metodologia">› Metodologia</Link><Link href="/noticias">› Notícias</Link><Link href="/contato">› Quero Contratar</Link>`,
  `<Link href="/">› Início</Link><Link href="/sobre-nos">› Sobre</Link><Link href="/artistas">› Artistas</Link><Link href="/sobre-nos#metodologia">› Metodologia</Link><Link href="/noticias">› Notícias</Link><Link href="/contato">› Quero Contratar</Link><Link href="/politica-de-privacidade">› Política de Privacidade</Link><Link href="/termos-e-condicoes">› Termos e Condições</Link>`
);
if (!chrome.includes("lander-records-logo.webp") || !chrome.includes("/politica-de-privacidade") || !chrome.includes("/termos-e-condicoes")) {
  throw new Error("Static chrome overrides were not applied correctly.");
}
await fs.writeFile(chromePath, chrome);

for (const legalRelativePath of ["app/politica-de-privacidade/page.tsx", "app/termos-e-condicoes/page.tsx"]) {
  const legalPath = path.join(siteDir, legalRelativePath);
  let legalPage = await fs.readFile(legalPath, "utf8");
  legalPage = legalPage.replace(/\nexport const dynamic = "force-dynamic";\n/, "\n");
  if (legalPage.includes('export const dynamic = "force-dynamic"')) {
    throw new Error(`Could not make ${legalRelativePath} static-export compatible.`);
  }
  await fs.writeFile(legalPath, legalPage);
}

const controlRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bannerSource = await materializeBanner(controlRoot);
const bannerDestination = path.join(siteDir, "public", "lander-records-anuncie-banner.webp");
await fs.mkdir(path.dirname(bannerDestination), { recursive: true });
await fs.copyFile(bannerSource, bannerDestination);

const artistWideSource = path.join(controlRoot, "public", "dj-stay-wide.webp");
const artistWideDestination = path.join(siteDir, "public", "dj-stay-wide.webp");
await fs.copyFile(artistWideSource, artistWideDestination);

const homePath = path.join(siteDir, "app/page.tsx");
let home = await fs.readFile(homePath, "utf8");
const newsMarker = `        <section className="homeBlock"><div className="homeBlockHeader"><div><p className="homePortalLabel">PORTAL LANDER</p><h2 className="homeEditorialTitle">ÚLTIMAS <span>NOVIDADES</span></h2></div>`;
const bannerSection = `        <section aria-label="Anuncie com a Lander Records" style={{marginTop:24}}><img src="/lander-records-site/lander-records-anuncie-banner.webp" alt="Anuncie com a gente — Lander Records" width={2048} height={682} style={{display:"block",width:"100%",height:"auto"}} /></section>\n`;

if (!home.includes(newsMarker)) {
  throw new Error("Could not locate the news section in the static Home snapshot.");
}
if (!home.includes("lander-records-anuncie-banner.webp")) {
  home = home.replace(newsMarker, bannerSection + newsMarker);
}
if (!home.includes("lander-records-anuncie-banner.webp")) {
  throw new Error("Static advertising banner was not inserted correctly.");
}
await fs.writeFile(homePath, home);

const aboutPath = path.join(siteDir, "app/sobre-nos/page.tsx");
let aboutLines = (await fs.readFile(aboutPath, "utf8")).split("\n");
aboutLines = aboutLines.filter((line) => !line.startsWith("const pillars = ") && !line.includes('className="section pillarsSection"'));

const methodologyIndex = aboutLines.findIndex((line) => line.includes('className="section methodologySection"'));
const companiesIndex = aboutLines.findIndex((line) => line.includes('className="section groupCompaniesSection"'));
if (methodologyIndex < 0 || companiesIndex < 0) {
  throw new Error("Could not locate Methodology or Group Companies on the static About snapshot.");
}
if (methodologyIndex > companiesIndex) {
  const [methodologyLine] = aboutLines.splice(methodologyIndex, 1);
  const refreshedCompaniesIndex = aboutLines.findIndex((line) => line.includes('className="section groupCompaniesSection"'));
  aboutLines.splice(refreshedCompaniesIndex, 0, methodologyLine);
}

const about = aboutLines.join("\n");
if (about.includes("NOSSOS PILARES") || about.includes('className="section pillarsSection"')) {
  throw new Error("The Our Pillars section was not removed from the static About snapshot.");
}
if (about.indexOf('className="section methodologySection"') > about.indexOf('className="section groupCompaniesSection"')) {
  throw new Error("Methodology was not moved into the former Our Pillars position.");
}
await fs.writeFile(aboutPath, about);

const artistPath = path.join(siteDir, "app/artistas/[slug]/page.tsx");
let artistPage = await fs.readFile(artistPath, "utf8");

// Remove all previous DJ Stay promo placements so there is only one canonical location.
artistPage = artistPage.replace(/\n\s*\{artist\.slug === "dj-stay" \? \(\n\s*<Link className="artistPromoPoster"[\s\S]*?<\/Link>\n\s*\) : null\}/g, "");
artistPage = artistPage.replace(/\n\s*\{artist\.slug === "dj-stay" \? \(\n\s*<Link className="artistMediaPromo"[\s\S]*?<\/Link>\n\s*\) : null\}/g, "");
artistPage = artistPage.replace(/\n\s*\{artist\.slug === "dj-stay" \? \(\n\s*<section className="artistMediaPromoSection"[\s\S]*?<\/section>\n\s*\) : null\}/g, "");

const profileSectionStart = artistPage.indexOf('<section className="section artistProfileBody">');
const sidebarStart = artistPage.indexOf('<aside className="artistSidebar">', profileSectionStart);
const sidebarClose = "        </aside>";
const sidebarEnd = artistPage.indexOf(sidebarClose, sidebarStart);
const profileSectionClose = "      </section>";
const profileSectionEnd = artistPage.indexOf(profileSectionClose, sidebarEnd);
const embedIndex = artistPage.indexOf('className="embedGrid"', profileSectionStart);

if (profileSectionStart < 0 || sidebarStart < 0 || sidebarEnd < 0 || profileSectionEnd < 0 || embedIndex < 0) {
  throw new Error("Could not locate the full artist media/social section in the static Artist detail snapshot.");
}

const insertAt = profileSectionEnd + profileSectionClose.length;
const djStayWideArtwork = `\n\n      {artist.slug === "dj-stay" ? (\n        <section className="artistMediaPromoSection" aria-label="Contrate DJ Stay">\n          <Link className="artistMediaPromo" href="/contato" aria-label="Contrate DJ Stay">\n            <img src="/lander-records-site/dj-stay-wide.webp" alt="Contrate DJ Stay" width={1200} height={675} />\n          </Link>\n        </section>\n      ) : null}`;

artistPage = artistPage.slice(0, insertAt) + djStayWideArtwork + artistPage.slice(insertAt);

const mediaPromoIndex = artistPage.indexOf('className="artistMediaPromoSection"', insertAt);
const finalSidebarEnd = artistPage.indexOf(sidebarClose, profileSectionStart);
const finalProfileSectionEnd = artistPage.indexOf(profileSectionClose, finalSidebarEnd);
if (
  mediaPromoIndex < 0 ||
  embedIndex < 0 ||
  finalSidebarEnd < 0 ||
  finalProfileSectionEnd < 0 ||
  mediaPromoIndex < finalProfileSectionEnd ||
  !artistPage.includes("dj-stay-wide.webp") ||
  artistPage.includes('className="artistPromoPoster"')
) {
  throw new Error("DJ Stay wide artwork was not placed below the complete Spotify/YouTube and social section.");
}
await fs.writeFile(artistPath, artistPage);

console.log("GitHub Pages static public snapshot prepared with the DJ Stay wide artwork below Spotify, YouTube, and the full social section.");
