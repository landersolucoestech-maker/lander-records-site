"use client";

import { useState } from "react";

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
  const active = companies.find((company) => company.id === activeId) ?? companies[0];
  if (!active) return null;

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
            <span className="ecosystemIndex">{String(index + 1).padStart(2, "0")}</span>
            <strong className="ecosystemNavLabel">{company.label || company.title}</strong>
          </button>
        ))}
      </div>
      <div className="groupCompaniesPanel ecosystemPanel ecosystemPanelSimplified" role="tabpanel" key={active.id}>
        <div className="ecosystemPanelCopy">
          <p className="eyebrow dark ecosystemCompanyHeading">{active.subtitle}</p>
          <p>{active.body}</p>
        </div>
      </div>
    </div>
  );
}
