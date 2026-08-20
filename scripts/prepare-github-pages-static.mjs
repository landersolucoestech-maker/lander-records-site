import fs from "node:fs/promises";
import path from "node:path";

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

console.log("GitHub Pages static public snapshot prepared.");
