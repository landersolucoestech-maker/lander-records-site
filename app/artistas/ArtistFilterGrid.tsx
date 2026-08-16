"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { artists } from "../data/site";

const filters = ["Todos", "DJ", "MC", "Pagodão Baiano"] as const;

type Filter = (typeof filters)[number];

export function ArtistFilterGrid() {
  const [active, setActive] = useState<Filter>("Todos");
  const filtered = useMemo(
    () => active === "Todos" ? artists : artists.filter((artist) => artist.category === active),
    [active],
  );

  return (
    <>
      <div className="filterRow" role="tablist" aria-label="Filtrar artistas por categoria">
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
        <div className="artistGrid">
          {filtered.map((artist) => (
            <Link className="artistTile" key={artist.slug} href={`/artistas/${artist.slug}`}>
              <div
                className="artistTileImage"
                style={artist.slug === "dj-stay" ? {
                  backgroundImage: "url('/dj-stay-home-card.webp')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                } : undefined}
                role="img"
                aria-label={artist.name}
              />
              <div className="artistTileBody">
                <p>{artist.genre}</p>
                <h2>{artist.name}</h2>
                <span>Ver perfil completo →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="filterEmptyState">
          <strong>Nenhum artista nesta categoria ainda.</strong>
          <p>Quando um novo nome for cadastrado nessa categoria, ele aparecerá aqui automaticamente.</p>
        </div>
      )}
    </>
  );
}
