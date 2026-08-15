"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { news } from "../data/news";

const filters = ["Todos", "Bastidores", "Lançamentos", "Notícias", "Entretenimento", "Mercado"] as const;
type Filter = (typeof filters)[number];

export function NewsFilterGrid() {
  const [active, setActive] = useState<Filter>("Todos");
  const filtered = useMemo(
    () => active === "Todos" ? news : news.filter((item) => item.category === active),
    [active],
  );

  return (
    <>
      <div className="filterRow" role="tablist" aria-label="Filtrar notícias por categoria">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={active === filter ? "active" : ""}
            aria-pressed={active === filter}
            onClick={() => setActive(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="newsGrid">
          {filtered.map((item, index) => (
            <Link className={`newsCard ${index === 0 ? "newsCardFeatured" : ""}`} href={`/noticias/${item.slug}`} key={item.slug}>
              <div className="newsImage"><span>{item.category}</span></div>
              <div className="newsCardBody">
                <p className="newsMeta">{item.category} · {item.date}</p>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <strong>Ler matéria →</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="filterEmptyState">
          <strong>Nenhuma publicação nesta categoria ainda.</strong>
          <p>Novos conteúdos aparecem aqui automaticamente quando forem publicados nessa categoria.</p>
        </div>
      )}
    </>
  );
}
