const navItems = ["Início", "Sobre Nós", "Artistas", "Serviços", "Notícias", "Contato"];

const services = [
  ["Agenciamento e Gestão", "Estratégia, negociação e desenvolvimento de carreira."],
  ["Produção Musical", "Criação, gravação, mixagem, masterização e suporte autoral."],
  ["Edição e Distribuição", "Registro, direitos, licenciamento e distribuição digital."],
  ["Produção Audiovisual", "Conceito, produção e finalização de videoclipes e conteúdos."],
  ["Marketing Artístico", "Campanhas, conteúdo, mídia e posicionamento para lançamentos."],
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#inicio" aria-label="Lander Records">
          <span className="brandWing">LANDER</span>
          <span className="brandRecords">RECORDS</span>
        </a>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-").replace("ó", "o").replace("í", "i")}`}>{item}</a>
          ))}
        </nav>
        <a className="button buttonPrimary headerCta" href="#contato">Quero Contratar</a>
      </header>

      <section className="hero" id="inicio">
        <div className="heroGlow" />
        <div className="heroContent">
          <p className="eyebrow">LANDER RECORDS · BRASIL</p>
          <h1>Onde talento vira <span>carreira.</span></h1>
          <p className="heroCopy">Gravadora, produtora musical e gestão artística 360° para artistas que querem construir relevância, catálogo e futuro.</p>
          <div className="heroActions">
            <a className="button buttonPrimary" href="#artistas">Conheça nossos artistas</a>
            <a className="button buttonGhost" href="#servicos">Explore nossos serviços</a>
          </div>
        </div>
        <div className="heroRail" aria-hidden="true">LANDER · MUSIC · CULTURE · BUSINESS · LANDER · MUSIC · CULTURE · BUSINESS ·</div>
      </section>

      <section className="section intro" id="sobre-nos">
        <div className="sectionHeading">
          <p className="eyebrow dark">SOBRE A LANDER</p>
          <h2>Uma estrutura para transformar <span>música em movimento.</span></h2>
        </div>
        <div className="splitFeature">
          <div className="studioVisual"><div className="visualBadge">ESTÚDIO · PRODUÇÃO · ESTRATÉGIA</div></div>
          <div className="redPanel">
            <h3>Produtora artística e gravadora musical</h3>
            <p>A Lander Records atua no desenvolvimento de projetos artísticos com estratégia, produção, distribuição, conteúdo e gestão integrados em uma única operação.</p>
            <a href="#servicos">Conheça nossa estrutura →</a>
          </div>
        </div>
      </section>

      <section className="section darkSection" id="artistas">
        <div className="sectionHeading inverse">
          <p className="eyebrow">CASTING</p>
          <h2>Nossos <span>artistas.</span></h2>
          <p>Perfis completos, lançamentos, vídeos, plataformas e métricas sociais em um só lugar.</p>
        </div>
        <article className="artistCard">
          <div className="artistImage" />
          <div className="artistMeta">
            <p className="artistTag">DJ · PRODUTOR MUSICAL</p>
            <h3>DJ Stay</h3>
            <p>Funk, produção e identidade artística conectadas em uma carreira construída para crescer.</p>
            <div className="metrics"><span>Instagram <strong>Sincronizado</strong></span><span>YouTube <strong>Sincronizado</strong></span></div>
            <a href="#">Ver perfil completo →</a>
          </div>
        </article>
      </section>

      <section className="section" id="servicos">
        <div className="sectionHeading">
          <p className="eyebrow dark">GESTÃO ARTÍSTICA 360°</p>
          <h2>Estrutura para cada etapa da <span>carreira.</span></h2>
        </div>
        <div className="serviceGrid">
          {services.map(([title, text], index) => (
            <article className="serviceCard" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="#">Saiba mais →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="ctaSection" id="contato">
        <p className="eyebrow">PRÓXIMO PASSO</p>
        <h2>Seu projeto pode ser o próximo a ganhar <span>estrutura.</span></h2>
        <a className="button buttonLight" href="mailto:contato@landerrecords.com">Fale com a Lander</a>
      </section>

      <footer>
        <div><strong>LANDER RECORDS</strong><p>Gravadora · Produtora Musical · Gestão Artística</p></div>
        <div><p>Governador Valadares · MG</p><p>contato@landerrecords.com</p></div>
        <div><p>Instagram · YouTube · TikTok · Spotify · SoundCloud</p></div>
      </footer>
    </main>
  );
}
