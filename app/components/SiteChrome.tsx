import Link from "next/link";

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg>;
}
function YouTubeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg>; }
function TikTokIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v10.2a4.2 4.2 0 1 1-3.2-4.1v2.7a1.8 1.8 0 1 0 .8 1.5V3h2.4c.5 2.1 1.8 3.4 4 3.9v2.5A7.2 7.2 0 0 1 14 7.8"/></svg>; }
function SpotifyIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.2c4.7-1.5 9.8-1.2 14.1.9"/><path d="M6.3 13c3.8-1.1 7.9-.8 11.4.8"/><path d="M7.5 16.5c3-.8 6.1-.5 8.9.6"/></svg>; }
function SoundCloudIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15v2M5.3 13.5v5M7.6 12v7M10 10.5v8.5"/><path d="M11.8 18.8h6.3a3.2 3.2 0 0 0 .3-6.4 5.3 5.3 0 0 0-10-1.4"/></svg>; }

export function Header() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label="Lander Records"><span className="brandWing">LANDER</span><span className="brandRecords">RECORDS</span></Link>
      <nav aria-label="Navegação principal">
        <Link href="/">Início</Link><Link href="/sobre-nos">Sobre Nós</Link><Link href="/artistas">Artistas</Link><Link href="/noticias">Notícias</Link><Link href="/contato">Contato</Link>
      </nav>
      <Link className="button buttonPrimary headerCta" href="/contato">Quero Contratar</Link>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerMain">
        <div className="footerBrandColumn"><Link className="footerBrand" href="/" aria-label="Lander Records"><span className="footerBrandName">LANDER</span><span className="footerBrandRecords">RECORDS</span></Link><p>Entre em contato com a gente e vamos fazer o seu projeto acontecer. Contato para parcerias, shows, publicidades ou criar algo novo.</p></div>
        <div className="footerColumn"><h3>Mapa do site</h3><Link href="/">› Início</Link><Link href="/sobre-nos">› Sobre</Link><Link href="/artistas">› Artistas</Link><Link href="/sobre-nos#metodologia">› Metodologia</Link><Link href="/noticias">› Notícias</Link><Link href="/contato">› Quero Contratar</Link></div>
        <div className="footerColumn footerContact"><h3>Contato</h3><p><strong>Telefone</strong><br/>+55 33 99856 1526</p><p><strong>E-mail</strong><br/>contato@landerrecords.com</p><p><strong>Endereço</strong><br/>Rua Joaquim Pereira Duarte Nº 58 · Vila Império<br/>Governador Valadares · MG · 35050-560</p><p><strong>Horário</strong><br/>Seg–Sex · 08:00–17:00<br/>Fechado aos sábados e domingos</p><h3 className="footerSocialTitle">Redes Sociais</h3><div className="footerSocials footerSocialIcons"><a href="#" aria-label="Instagram" title="Instagram"><InstagramIcon /></a><a href="#" aria-label="YouTube" title="YouTube"><YouTubeIcon /></a><a href="#" aria-label="TikTok" title="TikTok"><TikTokIcon /></a><a href="#" aria-label="Spotify" title="Spotify"><SpotifyIcon /></a><a href="#" aria-label="SoundCloud" title="SoundCloud"><SoundCloudIcon /></a></div></div>
      </div>
      <div className="footerBottom"><span>2026 © Produtora em Governador Valadares | Lander Records. Todos os direitos reservados.</span><span>Feito por <strong>Lander</strong></span></div>
    </footer>
  );
}
