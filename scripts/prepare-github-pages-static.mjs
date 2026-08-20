import fs from "node:fs/promises";
import path from "node:path";

const siteDir = process.argv[2];
if (!siteDir) throw new Error("Usage: node prepare-github-pages-static.mjs <site-dir>");

const pagePath = path.join(siteDir, "app/page.tsx");
let page = await fs.readFile(pagePath, "utf8");
const newsMarker = "</div></section>\n        <section className=\"homeBlock\"><div className=\"homeBlockHeader\"><div><p className=\"homePortalLabel\">PORTAL LANDER</p>";
if (!page.includes("lander-records-anuncie-banner.webp")) {
  if (!page.includes(newsMarker)) throw new Error("Home marker for banner insertion was not found.");
  page = page.replace(
    newsMarker,
    `</div></section>\n        <section className=\"homeBlock\" aria-label=\"Publicidade Lander Records\"><img src=\"/lander-records-site/lander-records-anuncie-banner.webp\" alt=\"Anuncie com a Lander Records\" width={1280} height={426} style={{display:\"block\",width:\"100%\",maxWidth:\"100%\",height:\"auto\",objectFit:\"contain\",borderRadius:10}} /></section>\n        <section className=\"homeBlock\"><div className=\"homeBlockHeader\"><div><p className=\"homePortalLabel\">PORTAL LANDER</p>`
  );
}
await fs.writeFile(pagePath, page);

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

console.log("GitHub Pages static public snapshot prepared.");
