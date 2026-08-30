import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteChrome } from "@/modules/pages";

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg>;
}
function YouTubeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg>; }
function TikTokIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v10.2a4.2 4.2 0 1 1-3.2-4.1v2.7a1.8 1.8 0 1 0 .8 1.5V3h2.4c.5 2.1 1.8 3.4 4 3.9v2.5A7.2 7.2 0 0 1 14 7.8"/></svg>; }
function SpotifyIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.2c4.7-1.5 9.8-1.2 14.1.9"/><path d="M6.3 13c3.8-1.1 7.9-.8 11.4.8"/><path d="M7.5 16.5c3-.8 6.1-.5 8.9.6"/></svg>; }
function SoundCloudIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15v2M5.3 13.5v5M7.6 12v7M10 10.5v8.5"/><path d="M11.8 18.8h6.3a3.2 3.2 0 0 0 .3-6.4 5.3 5.3 0 0 0-10-1.4"/></svg>; }

const iconByPlatform: Record<string, ReactNode> = {
  instagram: <InstagramIcon />,
  youtube: <YouTubeIcon />,
  tiktok: <TikTokIcon />,
  spotify: <SpotifyIcon />,
  soundcloud: <SoundCloudIcon />,
};

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function SiteLink({ href, children, newTab = false, className }: { href: string; children: ReactNode; newTab?: boolean; className?: string }) {
  if (isExternal(href)) {
    return <a className={className} href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noreferrer" : undefined}>{children}</a>;
  }
  return <Link className={className} href={href}>{children}</Link>;
}

function SocialIcon({ label, href, icon }: { label: string; href: string; icon: ReactNode }) {
  if (!href) {
    return <span className="socialIconDisabled" aria-label={`${label} ainda não configurado`} title={`${label} ainda não configurado`}>{icon}</span>;
  }
  return <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>{icon}</a>;
}

export async function Header() {
  const { settings, navigation } = await getSiteChrome();
  const primary = navigation.filter((item) => item.menuKey === "primary" && !item.parentId);

  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label={settings.brandName}>
        <Image src="/lander-records-brand.svg" alt={settings.brandName} width={170} height={46} style={{ maxWidth: 170, maxHeight: 46, width: "auto", height: "auto" }} />
      </Link>

      <nav className="desktopNav" aria-label="Navegação principal">
        {primary.map((item) => <SiteLink key={item.id} href={item.url} newTab={item.newTab}>{item.label}</SiteLink>)}
      </nav>

      <div className="headerActions">
        <details className="mobileNav">
          <summary aria-label="Abrir menu de navegação"><span>Menu</span><i aria-hidden="true" /></summary>
          <nav aria-label="Navegação mobile">
            {primary.map((item) => <SiteLink key={item.id} href={item.url} newTab={item.newTab}>{item.label}</SiteLink>)}
            <Link className="mobileNavCta" href="/contato">Quero Contratar</Link>
          </nav>
        </details>
        <Link className="button buttonPrimary headerCta" href="/contato">Quero Contratar</Link>
      </div>
    </header>
  );
}

export async function Footer() {
  const { settings, navigation, socials } = await getSiteChrome();
  const footerLinks = navigation.filter((item) => item.menuKey === "footer" && !item.parentId);

  return (
    <footer className="siteFooter">
      <div className="footerMain">
        <div className="footerBrandColumn">
          <Link className="footerBrand" href="/" aria-label={settings.brandName}><Image src="/lander-records-brand.svg" alt={settings.brandName} width={220} height={70} style={{ maxWidth: 220, maxHeight: 70, width: "auto", height: "auto" }} /></Link>
          <p>Entre em contato com a gente e vamos fazer o seu projeto acontecer. Contato para parcerias, shows, publicidades ou criar algo novo.</p>
        </div>
        <div className="footerColumn">
          <h3>Mapa do site</h3>
          {footerLinks.map((item) => <SiteLink key={item.id} href={item.url} newTab={item.newTab}>› {item.label}</SiteLink>)}
          <Link href="/politica-de-privacidade">› Política de Privacidade</Link>
          <Link href="/termos-e-condicoes">› Termos e Condições</Link>
        </div>
        <div className="footerColumn footerContact">
          <h3>Contato</h3>
          {settings.contactPhone ? <p><strong>Telefone</strong><br/>{settings.contactPhone}</p> : null}
          {settings.contactEmail ? <p><strong>E-mail</strong><br/>{settings.contactEmail}</p> : null}
          {settings.address ? <p><strong>Endereço</strong><br/>{settings.address}</p> : null}
          {settings.hours ? <p><strong>Horário</strong><br/>{settings.hours}<br/>Fechado aos sábados e domingos</p> : null}
          <h3 className="footerSocialTitle">Redes Sociais</h3>
          <div className="footerSocials footerSocialIcons">
            {socials.map((social) => <SocialIcon key={social.id} label={social.label} href={social.url} icon={iconByPlatform[social.platform.toLowerCase()] ?? <span aria-hidden="true">↗</span>} />)}
          </div>
        </div>
      </div>
      <div className="footerBottom"><span>2026 © Produtora em Governador Valadares | Lander Records. Todos os direitos reservados.</span><span>Feito por <strong>Lander</strong></span></div>
    </footer>
  );
}
