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

const controlRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bannerSource = await materializeBanner(controlRoot);
const bannerDestination = path.join(siteDir, "public", "lander-records-anuncie-banner.webp");
await fs.mkdir(path.dirname(bannerDestination), { recursive: true });
await fs.copyFile(bannerSource, bannerDestination);

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

console.log("GitHub Pages static public snapshot prepared with supplied banner.");
