import { Footer, Header } from "../components/SiteChrome";
import { GroupCompaniesTabs } from "./GroupCompaniesTabs";

const values = [
  ["Missão", "Desenvolver artistas e projetos com estrutura, estratégia e visão de longo prazo."],
  ["Visão", "Construir uma operação musical relevante, conectada ao mercado e à cultura."],
  ["Valores", "Transparência, criatividade, disciplina, parceria e compromisso com resultado."],
];

const pillars = [
  ["Artista", "O artista está no centro da operação. Identidade, repertório, posicionamento e objetivos orientam todas as decisões."],
  ["Estratégia", "Planejamento de carreira, lançamentos, público, calendário e oportunidades com visão de curto, médio e longo prazo."],
  ["Produção", "Direção artística, produção musical, audiovisual e conteúdo conectados à proposta de cada projeto."],
  ["Distribuição", "Organização de catálogo, metadados, direitos e presença nas plataformas para ampliar alcance e monetização."],
  ["Conteúdo", "Narrativas, campanhas e formatos pensados para transformar música em presença cultural e relacionamento com audiência."],
  ["Gestão", "Agenda, contratos, operação, parceiros e indicadores acompanhados de forma integrada para sustentar crescimento."],
];

export default function AboutPage() {
  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">LANDER</span>
        <p className="eyebrow">LANDER RECORDS</p>
        <h1>Sobre Nós</h1>
        <p>Uma estrutura criada para desenvolver música, carreira e negócios de forma integrada.</p>
      </section>
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
      <section className="section pillarsSection">
        <div className="sectionHeading compactHeading"><p className="eyebrow dark">NOSSOS PILARES</p><h2>Uma operação <span>360°.</span></h2><p className="sectionLead">Seis frentes que trabalham juntas para transformar música em carreira, catálogo e negócio.</p></div>
        <div className="detailGrid pillarsGrid">
          {pillars.map(([pillar, description], index) => (
            <article className="detailCard pillarCard" key={pillar}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{pillar}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section groupCompaniesSection">
        <div className="sectionHeading compactHeading">
          <p className="eyebrow dark">ECOSSISTEMA LANDER</p>
          <h2>Empresas do <span>Grupo Lander.</span></h2>
          <p className="sectionLead">Conheça as frentes que formam o ecossistema e atuam de forma complementar em música, audiovisual e conteúdo.</p>
        </div>
        <GroupCompaniesTabs />
      </section>
      <Footer />
    </main>
  );
}
