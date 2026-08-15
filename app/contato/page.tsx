import { Footer, Header } from "../components/SiteChrome";

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
            <div><span>E-mail</span><strong>contato@landerrecords.com</strong></div>
            <div><span>Localização</span><strong>Governador Valadares · MG</strong></div>
            <div className="contactSocialRow">
              <span>Redes</span>
              <strong className="contactSocialIcons" aria-label="Redes sociais">
                <a href="#" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg></a>
                <a href="#" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg></a>
                <a href="#" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3v11.2a4.6 4.6 0 1 1-3.8-4.53v3.1a1.7 1.7 0 1 0 .8 1.43V3h3c.35 2 1.55 3.45 3.5 4v3.05A7.5 7.5 0 0 1 15 8.7V3z"/></svg></a>
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
