import { AdminIcon } from "../../../components/AdminIcon";
import {
  createMediaKitItem,
  createMediaKitSection,
  deleteMediaKitItem,
  deleteMediaKitSection,
  updateMediaKitItem,
  updateMediaKitSection,
  updateMediaKitSettings,
} from "../actions";
import styles from "../MediaKit.module.css";

type MediaOption = {
  id: string;
  url: string;
  altText: string;
  originalFilename: string;
};

type MediaKitItemRow = {
  id: string;
  sectionId: string;
  kind: string;
  title: string;
  subtitle: string;
  body: string;
  label: string;
  value: string;
  url: string;
  sourceKey: string;
  icon: string;
  mediaId: string | null;
  position: number;
  enabled: boolean;
};

type MediaKitSectionRow = {
  id: string;
  type: string;
  theme: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  mediaId: string | null;
  position: number;
  enabled: boolean;
  items: MediaKitItemRow[];
};

type SettingsRow = {
  documentTitle: string;
  edition: string;
  footerWebsite: string;
  showPageNumbers: boolean;
};

const sectionTypes = [
  ["cover", "Capa / Hero"],
  ["editorial", "Editorial / Sobre"],
  ["metrics", "KPIs / Números"],
  ["audience", "Audiência / Dados"],
  ["cards", "Cards / Serviços / Parcerias"],
  ["artists", "Artistas / Lançamentos"],
  ["contact", "Contato / CTA"],
  ["custom", "Conteúdo livre"],
] as const;

const itemKinds = [
  ["metric", "Métrica"],
  ["card", "Card"],
  ["bullet", "Lista / bullet"],
  ["contact", "Contato"],
  ["text", "Texto"],
  ["release", "Lançamento"],
] as const;

const sourceKeys = [
  ["static", "Manual"],
  ["artists_total", "Total real de artistas"],
  ["releases_total", "Total real de lançamentos"],
  ["posts_total", "Total real de publicações"],
  ["media_total", "Total real de mídias"],
  ["contact_email", "E-mail institucional"],
  ["contact_phone", "Telefone institucional"],
  ["location", "Localização institucional"],
  ["instagram", "Instagram"],
  ["website", "Website"],
] as const;

const icons = ["document", "artists", "media", "posts", "chart", "users", "target", "smartphone", "mail", "calendar", "activity", "external", "plus", "pages"] as const;

function MediaSelect({ name, value, media }: { name: string; value: string | null; media: MediaOption[] }) {
  return <select name={name} defaultValue={value || ""}>
    <option value="">Sem imagem</option>
    {media.map((item) => <option key={item.id} value={item.id}>{item.altText || item.originalFilename}</option>)}
  </select>;
}

function MediaImageFields({
  value,
  media,
  label = "Imagem",
}: {
  value: string | null;
  media: MediaOption[];
  label?: string;
}) {
  const current = value ? media.find((item) => item.id === value) : null;
  return <div className={styles.builderImageFields}>
    <div className={styles.builderImageHeading}>
      <div><strong>{label}</strong><span>Escolha da biblioteca ou envie uma imagem nova.</span></div>
      {current ? <span className={styles.builderImageBadge}>Imagem vinculada</span> : <span className={styles.builderImageBadgeEmpty}>Sem imagem</span>}
    </div>
    {current ? <div className={styles.builderImageCurrent}><img src={current.url} alt={current.altText || current.originalFilename}/><div><strong>{current.altText || current.originalFilename}</strong><small>{current.originalFilename}</small></div></div> : null}
    <div className={styles.builderImageGrid}>
      <Field label="Imagem da biblioteca"><MediaSelect name="mediaId" value={value} media={media}/></Field>
      <Field label="Enviar nova imagem"><input type="file" name="imageFile" accept="image/*"/></Field>
      <Field label="Texto alternativo da nova imagem" wide><input name="imageAltText" maxLength={500} placeholder="Descreva a imagem para acessibilidade"/></Field>
    </div>
    <p className={styles.builderImageHelp}>Se você enviar um arquivo novo, ele substitui a seleção da biblioteca e já fica vinculado ao conteúdo. Para remover a imagem, escolha “Sem imagem”, não envie arquivo e salve.</p>
  </div>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? styles.builderWide : undefined}><span>{label}</span>{children}</label>;
}

function ItemEditor({ item, media }: { item: MediaKitItemRow; media: MediaOption[] }) {
  return <details className={styles.builderItem}>
    <summary>
      <span className={styles.builderItemIdentity}><AdminIcon name="document" size={15}/><strong>{item.title || item.label || "Item sem título"}</strong><small>{item.kind} · posição {item.position}</small></span>
      <span className={item.enabled ? styles.builderStatusOn : styles.builderStatusOff}>{item.enabled ? "Ativo" : "Oculto"}</span>
    </summary>
    <form action={updateMediaKitItem} className={styles.builderItemForm}>
      <input type="hidden" name="id" value={item.id}/>
      <input type="hidden" name="sectionId" value={item.sectionId}/>
      <div className={styles.builderGrid}>
        <Field label="Tipo">
          <select name="kind" defaultValue={item.kind}>{itemKinds.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <Field label="Fonte do valor">
          <select name="sourceKey" defaultValue={item.sourceKey}>{sourceKeys.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <Field label="Ícone">
          <select name="icon" defaultValue={item.icon || "document"}>{icons.map((icon)=><option key={icon} value={icon}>{icon}</option>)}</select>
        </Field>
        <Field label="Posição"><input name="position" type="number" min="0" max="9999" defaultValue={item.position}/></Field>
        <Field label="Título"><input name="title" defaultValue={item.title}/></Field>
        <Field label="Subtítulo"><input name="subtitle" defaultValue={item.subtitle}/></Field>
        <Field label="Label"><input name="label" defaultValue={item.label}/></Field>
        <Field label="Valor manual"><input name="value" defaultValue={item.value}/></Field>
        <Field label="URL"><input name="url" defaultValue={item.url} placeholder="https://, /rota, mailto: ou tel:"/></Field>
        <MediaImageFields value={item.mediaId} media={media} label="Imagem do item"/>
        <Field label="Conteúdo" wide><textarea name="body" rows={3} defaultValue={item.body}/></Field>
      </div>
      <div className={styles.builderActions}>
        <label className={styles.builderToggle}><input type="checkbox" name="enabled" defaultChecked={item.enabled}/><span>Exibir item</span></label>
        <div>
          <button className="adminButton secondary" type="submit">Salvar item</button>
          <button className={styles.dangerButton} type="submit" formAction={deleteMediaKitItem}>Excluir item</button>
        </div>
      </div>
    </form>
  </details>;
}

function NewItemForm({ sectionId, media }: { sectionId: string; media: MediaOption[] }) {
  return <details className={styles.builderNewItem}>
    <summary><AdminIcon name="plus" size={15}/>Adicionar conteúdo nesta seção</summary>
    <form action={createMediaKitItem} className={styles.builderItemForm}>
      <input type="hidden" name="sectionId" value={sectionId}/>
      <div className={styles.builderGrid}>
        <Field label="Tipo">
          <select name="kind" defaultValue="card">{itemKinds.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <Field label="Fonte do valor">
          <select name="sourceKey" defaultValue="static">{sourceKeys.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <Field label="Ícone">
          <select name="icon" defaultValue="document">{icons.map((icon)=><option key={icon} value={icon}>{icon}</option>)}</select>
        </Field>
        <Field label="Título"><input name="title" placeholder="Título do item"/></Field>
        <Field label="Subtítulo"><input name="subtitle"/></Field>
        <Field label="Label"><input name="label"/></Field>
        <Field label="Valor manual"><input name="value"/></Field>
        <Field label="URL"><input name="url" placeholder="https://, /rota, mailto: ou tel:"/></Field>
        <MediaImageFields value={null} media={media} label="Imagem do novo item"/>
        <Field label="Conteúdo" wide><textarea name="body" rows={3}/></Field>
      </div>
      <div className={styles.builderActions}><span/><button className="adminButton primary" type="submit">Adicionar item</button></div>
    </form>
  </details>;
}

function SectionEditor({ section, media, canDeleteSections }: { section: MediaKitSectionRow; media: MediaOption[]; canDeleteSections: boolean }) {
  return <article className={styles.builderSection}>
    <header className={styles.builderSectionHeader}>
      <div><span>SEÇÃO {section.position}</span><strong>{section.title || "Sem título"}</strong><small>{sectionTypes.find(([value])=>value===section.type)?.[1] || section.type}</small></div>
      <span className={section.enabled ? styles.builderStatusOn : styles.builderStatusOff}>{section.enabled ? "Visível" : "Oculta"}</span>
    </header>

    <form action={updateMediaKitSection} className={styles.builderSectionForm}>
      <input type="hidden" name="id" value={section.id}/>
      <div className={styles.builderGrid}>
        <Field label="Layout">
          <select name="type" defaultValue={section.type}>{sectionTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <Field label="Tema">
          <select name="theme" defaultValue={section.theme}><option value="light">Claro</option><option value="dark">Escuro</option></select>
        </Field>
        <Field label="Posição"><input name="position" type="number" min="0" max="9999" defaultValue={section.position}/></Field>
        <Field label="Eyebrow"><input name="eyebrow" defaultValue={section.eyebrow}/></Field>
        <Field label="Título" wide><input name="title" defaultValue={section.title}/></Field>
        <Field label="Subtítulo" wide><input name="subtitle" defaultValue={section.subtitle}/></Field>
        <Field label="Texto / conteúdo" wide><textarea name="body" rows={5} defaultValue={section.body}/></Field>
        <Field label="CTA"><input name="ctaLabel" defaultValue={section.ctaLabel}/></Field>
        <Field label="Destino do CTA"><input name="ctaUrl" defaultValue={section.ctaUrl} placeholder="https://, /rota, mailto: ou tel:"/></Field>
        <MediaImageFields value={section.mediaId} media={media} label="Imagem principal da seção"/>
      </div>
      <div className={styles.builderActions}>
        <label className={styles.builderToggle}><input type="checkbox" name="enabled" defaultChecked={section.enabled}/><span>Exibir seção no Mídia Kit</span></label>
        <div>
          <button className="adminButton primary" type="submit">Salvar seção</button>
          {canDeleteSections ? <button className={styles.dangerButton} type="submit" formAction={deleteMediaKitSection}>Excluir seção</button> : null}
        </div>
      </div>
    </form>

    <div className={styles.builderItems}>
      <div className={styles.builderItemsTitle}><strong>Conteúdo da seção</strong><span>{section.items.length} {section.items.length === 1 ? "item" : "itens"}</span></div>
      {section.items.map((item)=><ItemEditor key={item.id} item={item} media={media}/>)}
      <NewItemForm sectionId={section.id} media={media}/>
    </div>
  </article>;
}

export function MediaKitBuilder({
  settings,
  sections,
  media,
  canDeleteSections,
}: {
  settings: SettingsRow;
  sections: MediaKitSectionRow[];
  media: MediaOption[];
  canDeleteSections: boolean;
}) {
  return <div className={styles.builder} data-testid="media-kit-builder">
    <section className="adminDashboardPanel">
      <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="document" size={20}/></span><div><h2>Documento</h2><p>Configurações globais do Mídia Kit.</p></div></div></div>
      <form action={updateMediaKitSettings} className={styles.builderDocumentForm}>
        <div className={styles.builderGrid}>
          <Field label="Título do documento"><input name="documentTitle" defaultValue={settings.documentTitle}/></Field>
          <Field label="Edição / ano"><input name="edition" defaultValue={settings.edition}/></Field>
          <Field label="Website do rodapé" wide><input name="footerWebsite" defaultValue={settings.footerWebsite}/></Field>
        </div>
        <div className={styles.builderActions}>
          <label className={styles.builderToggle}><input type="checkbox" name="showPageNumbers" defaultChecked={settings.showPageNumbers}/><span>Exibir números de página</span></label>
          <button className="adminButton primary" type="submit">Salvar documento</button>
        </div>
      </form>
    </section>

    <section className="adminDashboardPanel">
      <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20}/></span><div><h2>Adicionar seção</h2><p>Crie uma nova página e escolha o layout visual.</p></div></div></div>
      <form action={createMediaKitSection} className={styles.builderDocumentForm}>
        <div className={styles.builderGrid}>
          <Field label="Layout">
            <select name="type" defaultValue="custom">{sectionTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
          </Field>
          <Field label="Tema"><select name="theme" defaultValue="light"><option value="light">Claro</option><option value="dark">Escuro</option></select></Field>
          <Field label="Eyebrow"><input name="eyebrow" placeholder="Ex.: INSTITUCIONAL"/></Field>
          <Field label="Título"><input name="title" placeholder="Título da nova seção"/></Field>
          <Field label="Subtítulo" wide><input name="subtitle"/></Field>
          <Field label="Texto inicial" wide><textarea name="body" rows={3}/></Field>
          <Field label="CTA"><input name="ctaLabel"/></Field>
          <Field label="Destino do CTA"><input name="ctaUrl"/></Field>
          <MediaImageFields value={null} media={media} label="Imagem principal da nova seção"/>
        </div>
        <div className={styles.builderActions}><span/><button className="adminButton primary" type="submit">Criar seção</button></div>
      </form>
    </section>

    {sections.length ? sections.map((section)=><SectionEditor key={section.id} section={section} media={media} canDeleteSections={canDeleteSections}/>) : <section className={styles.builderEmpty}><AdminIcon name="document" size={24}/><strong>Nenhuma seção cadastrada</strong><span>Crie a primeira seção para iniciar o Mídia Kit.</span></section>}
  </div>;
}
