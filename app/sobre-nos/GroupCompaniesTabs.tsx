"use client";

import { useState } from "react";

const companies = [
  {
    id: "records",
    label: "Lander Records",
    kicker: "GRAVADORA · PRODUTORA",
    title: "Lander Records",
    text: "Gravadora e produtora musical dedicada ao desenvolvimento artístico, produção, lançamentos, distribuição, conteúdo e gestão de carreira.",
    items: ["Produção musical", "Gestão artística", "Distribuição", "Marketing e conteúdo"],
  },
  {
    id: "cine",
    label: "Lander Cine",
    kicker: "AUDIOVISUAL",
    title: "Lander Cine",
    text: "Frente audiovisual do grupo voltada a videoclipes, campanhas, conteúdos digitais, direção criativa e produção de imagem para artistas e marcas.",
    items: ["Videoclipes", "Campanhas", "Conteúdo digital", "Direção e pós-produção"],
  },
  {
    id: "portal",
    label: "Portal Lander",
    kicker: "MÍDIA · CONTEÚDO",
    title: "Portal Lander",
    text: "Plataforma editorial do ecossistema Lander para notícias, lançamentos, bastidores, entretenimento e cobertura do mercado musical.",
    items: ["Notícias", "Lançamentos", "Bastidores", "Mercado e entretenimento"],
  },
] as const;

export function GroupCompaniesTabs() {
  const [activeId, setActiveId] = useState<(typeof companies)[number]["id"]>("records");
  const active = companies.find((company) => company.id === activeId) ?? companies[0];

  return (
    <div className="groupCompaniesTabs">
      <div className="groupCompaniesNav" role="tablist" aria-label="Empresas do Grupo Lander">
        {companies.map((company, index) => (
          <button
            key={company.id}
            type="button"
            role="tab"
            aria-selected={active.id === company.id}
            className={active.id === company.id ? "active" : ""}
            onClick={() => setActiveId(company.id)}
          >
            <span>0{index + 1}</span>
            <strong>{company.label}</strong>
          </button>
        ))}
      </div>

      <div className="groupCompaniesPanel" role="tabpanel" key={active.id}>
        <p className="eyebrow dark">{active.kicker}</p>
        <h3>{active.title}</h3>
        <p>{active.text}</p>
        <div className="groupCompaniesItems">
          {active.items.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </div>
  );
}
