"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Category = { id: string; name: string; slug: string };
type Artist = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  cardImage: string;
  categories: Array<{ id: string; name: string; slug: string; isPrimary: boolean }>;
};

export function ArtistFilterGrid({ artists, categories, showFilters = true, showList = true }: { artists: Artist[]; categories: Category[]; showFilters?: boolean; showList?: boolean }) {
  const [active, setActive] = useState("all");
  const filtered = useMemo(
    () => active === "all" ? artists : artists.filter((artist) => artist.categories.some((category) => category.slug === active)),
    [active, artists],
  );

  return (
    <>
      {showFilters ? <div className="filterRow" role="tablist" aria-label="Filtrar artistas por categoria">
        <button type="button" className={active === "all" ? "active" : ""} aria-pressed={active === "all"} onClick={() => setActive("all")}>Todos</button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={active === category.slug ? "active" : ""}
            aria-pressed={active === category.slug}
            onClick={() => setActive(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div> : null}

      {showList ? (filtered.length > 0 ? (
        <div className="artistGrid">
          {filtered.map((artist) => (
            <Link className="artistTile" key={artist.id} href={`/artistas/${artist.slug}`}>
              <div className="artistTileImage">
                {artist.cardImage ? <Image className="artistTileRealImage" src={artist.cardImage} alt={artist.name} width={800} height={800} unoptimized /> : null}
              </div>
              <div className="artistTileBody">
                <p>{artist.eyebrow || artist.categories.map((category) => category.name).join(" · ")}</p>
                <h2>{artist.name}</h2>
                <span>Ver perfil completo →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="filterEmptyState">
          <strong>Nenhum artista nesta categoria ainda.</strong>
          <p>Quando um artista publicado for associado a essa categoria, ele aparecerá aqui automaticamente.</p>
        </div>
      )) : null}
    </>
  );
}
