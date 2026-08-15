import Link from "next/link";

const serviceLinks = [
  ["Agenciamento e Gestão", "/servicos/agenciamento-e-gestao"],
  ["Produção Musical", "/servicos/producao-musical"],
  ["Edição e Distribuição", "/servicos/edicao-e-distribuicao"],
  ["Produção Audiovisual", "/servicos/producao-audiovisual"],
  ["Marketing Artístico", "/servicos/marketing-artistico"],
];

export function Header() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label="Lander Records">
        <span className="brandWing">LANDER</span>
        <span className="brandRecords">RECORDS</span>
      </Link>
      <nav aria-label="Navegação principal">
        <Link href="/">Início</Link>
        <Link href="/#sobre">Sobre Nós</Link>
        <Link href="/artistas">Artistas</Link>
        <div className="navDropdown">
          <button type="button">Serviços</button>
          <div className="navDropdownMenu">
            {serviceLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </div>
        <Link href="/#noticias">Notícias</Link>
        <Link href="/#contato">Contato</Link>
      </nav>
      <Link className="button buttonPrimary headerCta" href="/#contato">Quero Contratar</Link>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div><strong>LANDER RECORDS</strong><p>Gravadora · Produtora Musical · Gestão Artística</p></div>
      <div><p>Governador Valadares · MG</p><p>contato@landerrecords.com</p></div>
      <div><p>Instagram · YouTube · TikTok · Spotify · SoundCloud</p></div>
    </footer>
  );
}

export { serviceLinks };
