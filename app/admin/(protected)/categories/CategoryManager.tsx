"use client";

import { useState } from "react";
import { deleteArtistCategory, deletePostCategory, upsertArtistCategory, upsertPostCategory } from "../../actions";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "./CategoryManager.module.css";

type ArtistCategory = { id: string; name: string; slug: string; description: string; position: number; active: boolean; showAsFilter: boolean };
type PostCategory = { id: string; name: string; slug: string; position: number; active: boolean; showAsFilter: boolean };
type Tab = "artists" | "news";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}>
    <span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span>
    <div className="adminMetricCopy"><span>{label}</span><strong>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div>
    <span className={styles.metricTail} aria-hidden="true"><AdminIcon name={icon} size={18} /></span>
  </article>;
}

function Toggle({ checked, disabled, label, name }: { checked: boolean; disabled?: boolean; label: string; name: string }) {
  return <label className={styles.toggle}><input defaultChecked={checked} disabled={disabled} name={name} type="checkbox" /><span aria-hidden="true" /><b>{label}</b></label>;
}

export default function CategoryManager({ artistCategories, canDelete, canEdit, postCategories }: { artistCategories: ArtistCategory[]; canDelete: boolean; canEdit: boolean; postCategories: PostCategory[] }) {
  const [tab, setTab] = useState<Tab>("artists");
  const current = tab === "artists" ? artistCategories : postCategories;
  const activeCount = current.filter((category) => category.active).length;
  const filterCount = current.filter((category) => category.showAsFilter).length;
  const tabLabel = tab === "artists" ? "Artistas" : "Notícias";
  const confirmDelete = (name: string) => window.confirm(`Excluir a categoria “${name}”?`);

  return <div className={styles.manager} data-testid="categories-manager">
    <div className={styles.tabs} role="tablist" aria-label="Tipo de categoria">
      <button className={tab === "artists" ? styles.activeTab : ""} onClick={() => setTab("artists")} role="tab" aria-selected={tab === "artists"} type="button"><AdminIcon name="artists" size={15} />Artistas</button>
      <button className={tab === "news" ? styles.activeTab : ""} onClick={() => setTab("news")} role="tab" aria-selected={tab === "news"} type="button"><AdminIcon name="posts" size={15} />Notícias</button>
    </div>

    <section className="adminMetricGrid" aria-label={`Resumo das categorias de ${tabLabel.toLowerCase()}`}>
      <Metric accent="red" icon="tags" label="Categorias" value={current.length} hint={`em ${tabLabel.toLowerCase()}`} />
      <Metric accent="green" icon="check" label="Ativas" value={activeCount} hint="disponíveis para uso" />
      <Metric accent="blue" icon="sliders" label="Filtros públicos" value={filterCount} hint="visíveis no site" />
      <Metric accent="orange" icon="audit" label="Inativas" value={current.length - activeCount} hint="fora de circulação" />
    </section>

    <section className={`adminDashboardPanel ${styles.catalogPanel}`}>
      <div className="adminAnalyticsPanelHeading">
        <div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="tags" size={20} /></span><div><h2>Categorias de {tabLabel.toLowerCase()}</h2><p>Edite nomenclatura, ordem e visibilidade sem misturar as taxonomias.</p></div></div>
        <div className={styles.resultBadge}><strong>{current.length}</strong><span>{current.length === 1 ? "categoria" : "categorias"}</span></div>
      </div>

      {current.length ? <div className={styles.categoryList} role="table" aria-label={`Categorias de ${tabLabel.toLowerCase()}`}>
        {tab === "artists" ? <div className={`${styles.tableHead} ${styles.artistGrid}`} role="row"><span>Nome</span><span>Slug</span><span>Descrição</span><span>Ordem</span><span>Ativa</span><span>Filtro</span><span>Ação</span><span /></div> : <div className={`${styles.tableHead} ${styles.newsGrid}`} role="row"><span>Nome</span><span>Slug</span><span>Ordem</span><span>Ativa</span><span>Filtro</span><span>Ação</span><span /></div>}

        {tab === "artists" ? artistCategories.map((category) => <div className={styles.rowWrap} key={category.id} role="row">
          <form action={upsertArtistCategory} className={`${styles.categoryForm} ${styles.artistGrid}`}>
            <input type="hidden" name="id" value={category.id} />
            <input aria-label={`Nome de ${category.name}`} disabled={!canEdit} name="name" defaultValue={category.name} required />
            <input aria-label={`Slug de ${category.name}`} disabled={!canEdit} name="slug" defaultValue={category.slug} required />
            <input aria-label={`Descrição de ${category.name}`} disabled={!canEdit} name="description" defaultValue={category.description} />
            <input aria-label={`Ordem de ${category.name}`} disabled={!canEdit} name="position" type="number" defaultValue={category.position} />
            <Toggle checked={category.active} disabled={!canEdit} label="Ativa" name="active" />
            <Toggle checked={category.showAsFilter} disabled={!canEdit} label="Filtro" name="showAsFilter" />
            {canEdit ? <button className={styles.saveButton} type="submit"><AdminIcon name="check" size={14} />Salvar</button> : <span className="adminBadge">Somente leitura</span>}
            <span />
          </form>
          {canDelete ? <form action={deleteArtistCategory} className={styles.deleteForm} onSubmit={(event) => { if (!confirmDelete(category.name)) event.preventDefault(); }}><input type="hidden" name="id" value={category.id} /><button aria-label={`Excluir ${category.name}`} className={styles.deleteButton} type="submit"><AdminIcon name="trash" size={15} /></button></form> : null}
        </div>) : postCategories.map((category) => <div className={styles.rowWrap} key={category.id} role="row">
          <form action={upsertPostCategory} className={`${styles.categoryForm} ${styles.newsGrid}`}>
            <input type="hidden" name="id" value={category.id} />
            <input aria-label={`Nome de ${category.name}`} disabled={!canEdit} name="name" defaultValue={category.name} required />
            <input aria-label={`Slug de ${category.name}`} disabled={!canEdit} name="slug" defaultValue={category.slug} required />
            <input aria-label={`Ordem de ${category.name}`} disabled={!canEdit} name="position" type="number" defaultValue={category.position} />
            <Toggle checked={category.active} disabled={!canEdit} label="Ativa" name="active" />
            <Toggle checked={category.showAsFilter} disabled={!canEdit} label="Filtro" name="showAsFilter" />
            {canEdit ? <button className={styles.saveButton} type="submit"><AdminIcon name="check" size={14} />Salvar</button> : <span className="adminBadge">Somente leitura</span>}
            <span />
          </form>
          {canDelete ? <form action={deletePostCategory} className={styles.deleteForm} onSubmit={(event) => { if (!confirmDelete(category.name)) event.preventDefault(); }}><input type="hidden" name="id" value={category.id} /><button aria-label={`Excluir ${category.name}`} className={styles.deleteButton} type="submit"><AdminIcon name="trash" size={15} /></button></form> : null}
        </div>)}
      </div> : <div className={styles.empty}><span><AdminIcon name="tags" size={20} /></span><strong>Nenhuma categoria cadastrada</strong><p>Crie a primeira categoria para organizar {tabLabel.toLowerCase()}.</p></div>}
    </section>

    {canEdit ? <section className={`adminDashboardPanel ${styles.createPanel}`}>
      <div className="adminAnalyticsPanelHeading">
        <div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20} /></span><div><h2>Nova categoria de {tab === "artists" ? "artista" : "notícia"}</h2><p>Cadastre somente os campos realmente suportados por esta taxonomia.</p></div></div>
      </div>
      {tab === "artists" ? <form action={upsertArtistCategory} className={styles.createForm}>
        <label>Nome<input name="name" required /></label><label>Slug<input name="slug" /></label><label className={styles.wideField}>Descrição<input name="description" /></label><label>Ordem<input name="position" type="number" defaultValue={0} /></label><Toggle checked label="Ativa" name="active" /><Toggle checked label="Filtro público" name="showAsFilter" /><button className="adminPrimaryCompact" type="submit"><AdminIcon name="plus" size={14} />Criar categoria</button>
      </form> : <form action={upsertPostCategory} className={styles.createForm}>
        <label>Nome<input name="name" required /></label><label>Slug<input name="slug" /></label><label>Ordem<input name="position" type="number" defaultValue={0} /></label><Toggle checked label="Ativa" name="active" /><Toggle checked label="Filtro público" name="showAsFilter" /><button className="adminPrimaryCompact" type="submit"><AdminIcon name="plus" size={14} />Criar categoria</button>
      </form>}
      <div className={styles.safetyNote}><AdminIcon name="shield" size={16} /><span><strong>Exclusão segura.</strong> Categorias em uso continuam protegidas pelas regras do backend até que suas relações sejam removidas.</span></div>
    </section> : null}
  </div>;
}
