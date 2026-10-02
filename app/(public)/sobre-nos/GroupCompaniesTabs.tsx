"use client";

import { useRef, useState } from "react";

type Company = {
  id: string;
  itemKey: string;
  title: string;
  subtitle: string;
  body: string;
  label: string;
};

export function GroupCompaniesTabs({ companies }: { companies: Company[] }) {
  const [activeId, setActiveId] = useState(companies[0]?.id || "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = companies.find((company) => company.id === activeId) ?? companies[0];
  if (!active) return null;

  function selectTab(index: number) {
    const company = companies[index];
    if (!company) return;
    setActiveId(company.id);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") selectTab((index + 1) % companies.length);
    else if (event.key === "ArrowLeft") selectTab((index - 1 + companies.length) % companies.length);
    else if (event.key === "Home") selectTab(0);
    else if (event.key === "End") selectTab(companies.length - 1);
    else return;
    event.preventDefault();
  }

  return (
    <div className="groupCompaniesTabs ecosystemTabs">
      <div className="groupCompaniesNav ecosystemNav" role="tablist" aria-label="Empresas do Grupo Lander">
        {companies.map((company, index) => (
          <button
            key={company.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`company-tab-${company.id}`}
            type="button"
            role="tab"
            aria-selected={active.id === company.id}
            aria-controls={`company-panel-${company.id}`}
            tabIndex={active.id === company.id ? 0 : -1}
            className={active.id === company.id ? "active" : ""}
            onClick={() => setActiveId(company.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="ecosystemIndex">{String(index + 1).padStart(2, "0")}</span>
            <strong className="ecosystemNavLabel">{company.label || company.title}</strong>
          </button>
        ))}
      </div>
      <div className="groupCompaniesPanel ecosystemPanel ecosystemPanelSimplified" role="tabpanel" id={`company-panel-${active.id}`} aria-labelledby={`company-tab-${active.id}`} key={active.id}>
        <div className="ecosystemPanelCopy">
          <p className="eyebrow dark ecosystemCompanyHeading">{active.subtitle}</p>
          <p>{active.body}</p>
        </div>
      </div>
    </div>
  );
}
