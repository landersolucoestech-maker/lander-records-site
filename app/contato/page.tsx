import { Footer, Header } from "../components/SiteChrome";

export default function ContactPage() {
  return (
    <main>
      <Header />
      <section className="pageHero"><p className="eyebrow">CONTATO</p><h1>Entre em contato</h1><p>Contratação, produção musical, distribuição, audiovisual, marketing ou parcerias.</p></section>
      <section className="section contactSection">
        <div className="contactInfo">
          <p className="eyebrow dark">LANDER RECORDS</p>
          <h2>Vamos falar sobre o seu projeto.</h2>
          <div className="contactLines">
            <div><span>E-mail</span><strong>contato@landerrecords.com</strong></div>
            <div><span>Localização</span><strong>Governador Valadares · MG</strong></div>
            <div><span>Redes</span><strong>Instagram · YouTube · TikTok</strong></div>
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
