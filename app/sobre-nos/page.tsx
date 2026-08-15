import { Footer, Header } from "../components/SiteChrome";

const values = [
  ["Missão", "Desenvolver artistas e projetos com estrutura, estratégia e visão de longo prazo."],
  ["Visão", "Construir uma operação musical relevante, conectada ao mercado e à cultura."],
  ["Valores", "Transparência, criatividade, disciplina, parceria e compromisso com resultado."],
];

const pillars = ["Artista", "Estratégia", "Produção", "Distribuição", "Conteúdo", "Gestão"];

export default function AboutPage() {
  return (
    <main>
      <Header />
      <section className="pageHero"><p className="eyebrow">LANDER RECORDS</p><h1>Sobre Nós</h1><p>Uma estrutura criada para desenvolver música, carreira e negócios de forma integrada.</p></section>
      <section className="section">
        <div className="splitFeature">
          <div className="redPanel"><p className="eyebrow">NOSSA HISTÓRIA</p><h3>Da produção à gestão artística.</h3><p>A Lander Records nasceu para reunir criação, operação e estratégia em torno do desenvolvimento de artistas e projetos musicais.</p></div>
          <div className="studioVisual"><div className="visualBadge">LANDER RECORDS · BRASIL</div></div>
        </div>
      </section>
      <section className="section darkSection">
        <div className="sectionHeading inverse compactHeading"><p className="eyebrow">IDENTIDADE</p><h2>Missão, visão e <span>valores.</span></h2></div>
        <div className="detailGrid">{values.map(([title, text], index) => <article className="aboutValueCard" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="section">
        <div className="sectionHeading compactHeading"><p className="eyebrow dark">NOSSOS PILARES</p><h2>Uma operação <span>360°.</span></h2></div>
        <div className="detailGrid">{pillars.map((pillar, index) => <article className="detailCard" key={pillar}><span>0{index + 1}</span><h3>{pillar}</h3></article>)}</div>
      </section>
      <Footer />
    </main>
  );
}
