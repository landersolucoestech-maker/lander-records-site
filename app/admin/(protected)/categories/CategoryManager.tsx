"use client";

import { useState } from "react";
import { deleteArtistCategory, deletePostCategory, upsertArtistCategory, upsertPostCategory } from "../../actions";

type ArtistCategory = { id: string; name: string; slug: string; description: string; position: number; active: boolean; showAsFilter: boolean };
type PostCategory = { id: string; name: string; slug: string; position: number; active: boolean; showAsFilter: boolean };

export default function CategoryManager({ artistCategories, postCategories }: { artistCategories: ArtistCategory[]; postCategories: PostCategory[] }) {
  const [tab, setTab] = useState<"artists" | "news">("artists");
  return (
    <>
      <div className="adminActions" role="tablist" aria-label="Tipos de categoria">
        <button className={`adminButton ${tab === "artists" ? "primary" : ""}`} type="button" role="tab" aria-selected={tab === "artists"} onClick={() => setTab("artists")}>Artistas</button>
        <button className={`adminButton ${tab === "news" ? "primary" : ""}`} type="button" role="tab" aria-selected={tab === "news"} onClick={() => setTab("news")}>Notícias</button>
      </div>

      {tab === "artists" ? (
        <>
          <section className="adminPanel adminStack">
            <h2>Categorias de artistas</h2>
            {artistCategories.length ? artistCategories.map((category) => <form action={upsertArtistCategory} className="adminInlineForm" key={category.id}><input type="hidden" name="id" value={category.id}/><input name="name" defaultValue={category.name} required aria-label="Nome"/><input name="slug" defaultValue={category.slug} required aria-label="Slug"/><input name="description" defaultValue={category.description} aria-label="Descrição"/><input name="position" type="number" defaultValue={category.position} aria-label="Ordem"/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={category.active}/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked={category.showAsFilter}/> Filtro</label><button className="adminButton" type="submit">Salvar</button></form>) : <div className="adminEmpty">Nenhuma categoria de artista cadastrada.</div>}
          </section>
          <section className="adminPanel"><h2>Nova categoria de artista</h2><form action={upsertArtistCategory} className="adminForm"><div className="adminFormGrid"><label>Nome<input name="name" required/></label><label>Slug<input name="slug"/></label><label>Descrição<input name="description"/></label><label>Ordem<input name="position" type="number" defaultValue={0}/></label><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked/> Exibir no filtro público</label></div><button className="adminButton primary" type="submit">Criar categoria</button></form></section>
          <section className="adminPanel"><h2>Exclusão segura</h2><p>Categorias associadas a artistas não podem ser excluídas até que as relações sejam removidas.</p><div className="adminActions">{artistCategories.map((category) => <form action={deleteArtistCategory} key={category.id}><input type="hidden" name="id" value={category.id}/><button className="adminButton danger" type="submit">Excluir {category.name}</button></form>)}</div></section>
        </>
      ) : (
        <>
          <section className="adminPanel adminStack">
            <h2>Categorias de notícias</h2>
            {postCategories.length ? postCategories.map((category) => <form action={upsertPostCategory} className="adminInlineForm" key={category.id}><input type="hidden" name="id" value={category.id}/><input name="name" defaultValue={category.name} required aria-label="Nome"/><input name="slug" defaultValue={category.slug} required aria-label="Slug"/><input name="position" type="number" defaultValue={category.position} aria-label="Ordem"/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={category.active}/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked={category.showAsFilter}/> Filtro</label><span/><button className="adminButton" type="submit">Salvar</button></form>) : <div className="adminEmpty">Nenhuma categoria de notícia cadastrada.</div>}
          </section>
          <section className="adminPanel"><h2>Nova categoria de notícia</h2><form action={upsertPostCategory} className="adminForm"><div className="adminFormGrid"><label>Nome<input name="name" required/></label><label>Slug<input name="slug"/></label><label>Ordem<input name="position" type="number" defaultValue={0}/></label><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked/> Exibir no filtro público</label></div><button className="adminButton primary" type="submit">Criar categoria</button></form></section>
          <section className="adminPanel"><h2>Exclusão segura</h2><p>Categorias utilizadas por notícias não podem ser excluídas até que o conteúdo seja reclassificado.</p><div className="adminActions">{postCategories.map((category) => <form action={deletePostCategory} key={category.id}><input type="hidden" name="id" value={category.id}/><button className="adminButton danger" type="submit">Excluir {category.name}</button></form>)}</div></section>
        </>
      )}
    </>
  );
}
