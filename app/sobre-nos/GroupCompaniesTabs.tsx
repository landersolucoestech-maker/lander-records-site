"use client";

import { useState } from "react";

const basePath = "/lander-records-site";

const companies = [
  {
    id: "records",
    label: "Lander Records",
    kicker: "LANDER RECORDS · GRAVADORA · PRODUTORA",
    text: "Gravadora e produtora musical dedicada ao desenvolvimento artístico, produção, lançamentos, distribuição, conteúdo e gestão de carreira.",
    brand: "records",
  },
  {
    id: "cine",
    label: "Lander Cine",
    kicker: "LANDER CINE · AUDIOVISUAL",
    text: "Frente audiovisual do grupo voltada a videoclipes, campanhas, conteúdos digitais, direção criativa e produção de imagem para artistas e marcas.",
    brand: "cine",
  },
  {
    id: "portal",
    label: "Portal Lander",
    kicker: "PORTAL LANDER · MÍDIA · CONTEÚDO",
    text: "Plataforma editorial do ecossistema Lander para notícias, lançamentos, bastidores, entretenimento e cobertura do mercado musical.",
    brand: "portal",
  },
] as const;

function CompanyLogo({ brand, compact = false }: { brand: (typeof companies)[number]["brand"]; compact?: boolean }) {
  if (brand === "records") {
    return (
      <div className={`ecosystemLogo ecosystemLogoRecords${compact ? " compact" : ""}`}>
        <img src={`${basePath}/lander-records-logo.webp`} alt="Lander Records" />
      </div>
    );
  }

  return (
    <div className={`ecosystemLogo ecosystemWordmark ecosystemWordmark-${brand}${compact ? " compact" : ""}`} aria-label={brand === "cine" ? "Lander Cine" : "Portal Lander"}>
      <span>LANDER</span>
      <strong>{brand === "cine" ? "CINE" : "PORTAL"}</strong>
    </div>
  );
}

export function GroupCompaniesTabs() {
  const [activeId, setActiveId] = useState<(typeof companies)[number]["id"]>("records");
  const active = companies.find((company) => company.id === activeId) ?? companies[0];

  return (
    <div className="groupCompaniesTabs ecosystemTabs">
      <div className="groupCompaniesNav ecosystemNav" role="tablist" aria-label="Empresas do Grupo Lander">
        {companies.map((company, index) => (
          <button
            key={company.id}
            type="button"
            role="tab"
            aria-selected={active.id === company.id}
            className={active.id === company.id ? "active" : ""}
            onClick={() => setActiveId(company.id)}
          >
            <span className="ecosystemIndex">0{index + 1}</span>
            <CompanyLogo brand={company.brand} compact />
            <strong className="ecosystemNavLabel">{company.label}</strong>
          </button>
        ))}
      </div>

      <div className="groupCompaniesPanel ecosystemPanel ecosystemPanelSimplified" role="tabpanel" key={active.id}>
        <div className="ecosystemPanelCopy">
          <p className="eyebrow dark ecosystemCompanyHeading">{active.kicker}</p>
          <p>{active.text}</p>
        </div>
      </div>
    </div>
  );
}
