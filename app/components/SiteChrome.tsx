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
        <Link href="/sobre-nos">Sobre Nós</Link>
        <Link href="/artistas">Artistas</Link>
        <div className="navDropdown">
          <button type="button">Serviços</button>
          <div className="navDropdownMenu">
            {serviceLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </div>
        <Link href="/noticias">Notícias</Link>
        <Link href="/contato">Contato</Link>
      </nav>
      <Link className="button buttonPrimary headerCta" href="/contato">Quero Contratar</Link>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerMain">
        <div className="footerBrandColumn">
          <Link className="footerBrand" href="/" aria-label="Lander Records">
            <span className="footerBrandName">LANDER</span>
            <span className="footerBrandRecords">RECORDS</span>
          </Link>
          <p>Entre em contato com a gente e vamos fazer o seu projeto acontecer. Contato para parcerias, shows, publicidades ou criar algo novo.</p>
        </div>

        <div className="footerColumn">
          <h3>Mapa do site</h3>
          <Link href="/">› Início</Link>
          <Link href="/sobre-nos">› Sobre</Link>
          <Link href="/artistas">› Artistas</Link>
          <Link href="/servicos/producao-musical">› Serviços</Link>
          <Link href="/noticias">› Notícias</Link>
          <Link href="/contato">› Quero Contratar</Link>
        </div>

        <div className="footerColumn footerContact">
          <h3>Contato</h3>
          <p><strong>Telefone</strong><br/>+55 33 99856 1526</p>
          <p><strong>E-mail</strong><br/>contato@landerrecords.com</p>
          <p><strong>Endereço</strong><br/>Rua Joaquim Pereira Duarte Nº 58 · Vila Império<br/>Governador Valadares · MG · 35050-560</p>
          <p><strong>Horário</strong><br/>Seg–Sex · 08:00–17:00<br/>Fechado aos sábados e domingos</p>
          <h3 className="footerSocialTitle">Redes Sociais</h3>
          <div className="footerSocials">
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="YouTube">YouTube</a>
            <a href="#" aria-label="TikTok">TikTok</a>
            <a href="#" aria-label="Spotify">Spotify</a>
            <a href="#" aria-label="SoundCloud">SoundCloud</a>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        <span>2026 © Produtora em Governador Valadares | Lander Records. Todos os direitos reservados.</span>
        <span>Feito por <strong>Lander</strong></span>
      </div>
    </footer>
  );
}

export { serviceLinks };
