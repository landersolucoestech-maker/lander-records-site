import { Footer, Header } from "../components/SiteChrome";
import siteContent from "../content/site.json";

const contactSocials = [
  ["Instagram", siteContent.socials.instagram, <svg key="instagram" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg>],
  ["YouTube", siteContent.socials.youtube, <svg key="youtube" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg>],
  ["TikTok", siteContent.socials.tiktok, <svg key="tiktok" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3v11.2a4.6 4.6 0 1 1-3.8-4.53v3.1a1.7 1.7 0 1 0 .8 1.43V3h3c.35 2 1.55 3.45 3.5 4v3.05A7.5 7.5 0 0 1 15 8.7V3z"/></svg>],
] as const;

export default function ContactPage() {
  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">CONTATO</span>
        <p className="eyebrow">CONTATO</p>
        <h1>Entre em contato</h1>
        <p>Contratação, produção musical, distribuição, audiovisual, marketing ou parcerias.</p>
      </section>
      <section className="section contactSection">
        <div className="contactInfo">
          <p className="eyebrow dark">LANDER RECORDS</p>
          <h2>Vamos falar sobre o seu projeto.</h2>
          <div className="contactLines">
            <div><span>E-mail</span><strong>{siteContent.contact.email}</strong></div>
            <div><span>Localização</span><strong>{siteContent.contact.location}</strong></div>
            <div className="contactSocialRow">
              <span>Redes</span>
              <strong className="contactSocialIcons" aria-label="Redes sociais">
                {contactSocials.map(([label, href, icon]) => href ? (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>{icon}</a>
                ) : (
                  <span key={label} className="contactSocialDisabled" aria-label={`${label} ainda não configurado`} title={`${label} ainda não configurado`}>{icon}</span>
                ))}
              </strong>
            </div>
          </div>
        </div>
        <form className="contactForm">
          <label>Nome<input name="name" placeholder="Seu nome" /></label>
          <label>E-mail<input name="email" type="email" placeholder="voce@email.com" /></label>
          <label>Telefone<input name="phone" placeholder="(00) 00000-0000" /></label>
          <label>Assunto<select name="subject" defaultValue=""><option value="" disabled>Selecione</option><option>Contratação de artista</option><option>Produção musical</option><option>Edição e distribuição</option><option>Produção audiovisual</option><option>Marketing artístico</option><option>Parceria</option><option>Imprensa</option><option>Outro</option></select></label>
          <label className="fullField">Mensagem<textarea name="message" rows={6} placeholder="Conte um pouco sobre o projeto" /></label>
          <button className="button buttonPrimary" type="button">Enviar mensagem</button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
