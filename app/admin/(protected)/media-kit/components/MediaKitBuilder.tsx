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
import { MEDIA_FIT_VALUES, MEDIA_POSITION_VALUES, mediaFit, mediaPosition } from "../media-kit-contract";
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
  metadata: Record<string, unknown>;
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
  settings: Record<string, unknown>;
  items: MediaKitItemRow[];
};

type SettingsRow = {
  documentTitle: string;
  edition: string;
  footerWebsite: string;
  showPageNumbers: boolean;
};

const sectionTypes = [
  ["cover", "01 · Capa / Hero"],
  ["editorial", "02 · Sobre / Institucional"],
  ["metrics", "02 · KPIs / Números"],
  ["audience", "03 · Nossa audiência"],
  ["cards", "04 · Formatos de publicidade"],
  ["application", "05 · Exemplo de aplicação"],
  ["artists", "Extra · Artistas & destaques"],
  ["contact", "06 · Contato / Próximos passos"],
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
      <div><strong>{label}</strong><span>Escolha da biblioteca ou envie uma imagem nova. O template controla onde ela pode aparecer.</span></div>
      {current ? <span className={styles.builderImageBadge}>Imagem vinculada</span> : <span className={styles.builderImageBadgeEmpty}>Sem imagem</span>}
    </div>
    {current ? <div className={styles.builderImageCurrent}><img src={current.url} alt={current.altText || current.originalFilename}/><div><strong>{current.altText || current.originalFilename}</strong><small>{current.originalFilename}</small></div></div> : null}
    <div className={styles.builderImageGrid}>
      <Field label="Imagem da biblioteca"><MediaSelect name="mediaId" value={value} media={media}/></Field>
      <Field label="Enviar nova imagem"><input type="file" name="imageFile" accept="image/*"/></Field>
      <Field label="Texto alternativo da nova imagem" wide><input name="imageAltText" maxLength={500} placeholder="Descreva a imagem para acessibilidade"/></Field>
    </div>
    <p className={styles.builderImageHelp}>Se você enviar um arquivo novo, ele substitui a seleção da biblioteca. A imagem nunca é replicada automaticamente em outros blocos. Para remover, escolha “Sem imagem”, não envie arquivo e salve.</p>
  </div>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? styles.builderWide : undefined}><span>{label}</span>{children}</label>;
}

function recordText(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function recordNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function sectionImageLabel(type: string) {
  if (type === "cover") return "Imagem de fundo da capa";
  if (type === "editorial" || type === "metrics") return "Imagem editorial lateral";
  if (type === "application") return "Imagem da aplicação / tela demonstrativa";
  if (type === "artists") return "Imagem do card de artista em destaque";
  if (type === "contact") return "Imagem de apoio do painel Próximos Passos";
  return "Imagem editorial da seção";
}

function SectionMediaControls({ section }: { section: MediaKitSectionRow }) {
  return <>
    <div className={styles.builderTemplateTitle}>
      <strong>Tratamento da imagem</strong>
      <span>A imagem fica restrita ao slot do template. Só a capa permite fotografia como fundo integral.</span>
    </div>
    <Field label="Enquadramento">
      <select name="mediaFit" defaultValue={mediaFit(section.settings)}>
        {MEDIA_FIT_VALUES.map((value) => <option key={value} value={value}>{value === "cover" ? "Preencher / recortar" : "Conter / sem recorte"}</option>)}
      </select>
    </Field>
    <Field label="Foco da imagem">
      <select name="mediaPosition" defaultValue={mediaPosition(section.settings)}>
        {MEDIA_POSITION_VALUES.map((value) => <option key={value} value={value}>{value === "center" ? "Centro" : value === "top" ? "Topo" : "Base"}</option>)}
      </select>
    </Field>
  </>;
}

function SectionTemplateFields({ section }: { section: MediaKitSectionRow }) {
  const settings = section.settings || {};
  if (section.type === "cover") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição da capa</strong><span>Campos específicos do layout 01 da referência.</span></div>
    <Field label="Frase do topo / lateral"><input name="coverSideNote" defaultValue={recordText(settings,"coverSideNote")} placeholder="O SOM DE NOVAS POSSIBILIDADES."/></Field>
    <Field label="Texto do mockup"><input name="mockupLabel" defaultValue={recordText(settings,"mockupLabel")} placeholder="MÚSICA MOVE PESSOAS."/></Field>
  </>;
  if (section.type === "editorial" || section.type === "metrics") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição Sobre + KPIs</strong><span>Painel lateral e banner inferior da página 02.</span></div>
    <Field label="Headline do painel lateral" wide><textarea name="sideTitle" rows={3} defaultValue={recordText(settings,"sideTitle")}/></Field>
    <Field label="Legenda do painel lateral"><input name="sideCaption" defaultValue={recordText(settings,"sideCaption")}/></Field>
    <Field label="Headline do banner inferior" wide><textarea name="bannerTitle" rows={2} defaultValue={recordText(settings,"bannerTitle")}/></Field>
    <Field label="Nota do banner"><input name="bannerNote" defaultValue={recordText(settings,"bannerNote")}/></Field>
  </>;
  if (section.type === "audience") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição de audiência</strong><span>Os itens abaixo podem ser classificados em perfil, faixa etária, interesses e cidades.</span></div>
    <Field label="Nota / fonte dos dados" wide><input name="dataNote" defaultValue={recordText(settings,"dataNote")} placeholder="DADOS REFERENTES A..."/></Field>
  </>;
  if (section.type === "cards") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição de publicidade</strong><span>Os itens desta seção aparecem em um grid 3 × 2 como na página 04 da referência.</span></div>
    <Field label="Texto do rodapé" wide><input name="footerNote" defaultValue={recordText(settings,"footerNote")} placeholder="FORMATOS COMERCIAIS"/></Field>
  </>;
  if (section.type === "application") return <>
    <div className={styles.builderTemplateTitle}><strong>Exemplo de aplicação</strong><span>Use a imagem principal como tela demonstrativa e até quatro itens como chamadas ao redor da aplicação.</span></div>
    <Field label="Texto do rodapé" wide><input name="footerNote" defaultValue={recordText(settings,"footerNote")} placeholder="APLICAÇÃO COMERCIAL"/></Field>
  </>;
  if (section.type === "artists") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição Artistas & Destaques</strong><span>Destaque central, oportunidades e depoimento inferior.</span></div>
    <Field label="Rótulo do artista em destaque"><input name="featuredLabel" defaultValue={recordText(settings,"featuredLabel")} placeholder="ARTISTA EM DESTAQUE"/></Field>
    <Field label="Texto do rodapé"><input name="footerNote" defaultValue={recordText(settings,"footerNote")}/></Field>
    <Field label="Depoimento" wide><textarea name="quote" rows={3} defaultValue={recordText(settings,"quote")}/></Field>
    <Field label="Autor / crédito do depoimento" wide><input name="quoteAuthor" defaultValue={recordText(settings,"quoteAuthor")}/></Field>
  </>;
  if (section.type === "contact") return <>
    <div className={styles.builderTemplateTitle}><strong>Composição de encerramento</strong><span>Painel Próximos Passos da página 06.</span></div>
    <Field label="Título do painel lateral"><input name="nextStepsTitle" defaultValue={recordText(settings,"nextStepsTitle")} placeholder="PRÓXIMOS PASSOS"/></Field>
    <Field label="Slogan final"><input name="closingSlogan" defaultValue={recordText(settings,"closingSlogan")}/></Field>
    <Field label="Texto Próximos Passos" wide><textarea name="nextStepsBody" rows={4} defaultValue={recordText(settings,"nextStepsBody")}/></Field>
  </>;
  return null;
}

function ItemTemplateFields({ sectionType, metadata }: { sectionType: string; metadata: Record<string, unknown> }) {
  if (sectionType !== "audience") return null;
  return <>
    <div className={styles.builderTemplateTitle}><strong>Dados de audiência</strong><span>Classifique o item para posicioná-lo no bloco correto da página 03.</span></div>
    <Field label="Grupo">
      <select name="audienceGroup" defaultValue={recordText(metadata,"group") || "interest"}>
        <option value="gender">Perfil do público</option>
        <option value="age">Faixa etária</option>
        <option value="interest">Principais interesses</option>
        <option value="city">Principais cidades</option>
      </select>
    </Field>
    <Field label="Percentual"><input name="percentage" type="number" min="0" max="100" defaultValue={recordNumber(metadata,"percentage")} placeholder="0–100"/></Field>
  </>;
}

function ItemEditor({ item, media, sectionType }: { item: MediaKitItemRow; media: MediaOption[]; sectionType: string }) {
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
        <ItemTemplateFields sectionType={sectionType} metadata={item.metadata || {}}/>
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

function NewItemForm({ sectionId, media, sectionType }: { sectionId: string; media: MediaOption[]; sectionType: string }) {
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
        <ItemTemplateFields sectionType={sectionType} metadata={{}}/>
        <MediaImageFields value={null} media={media} label="Imagem do novo item"/>
        <Field label="Conteúdo" wide><textarea name="body" rows={3}/></Field>
      </div>
      <div className={styles.builderActions}><span/><button className="adminButton primary" type="submit">Adicionar item</button></div>
    </form>
  </details>;
}

function SectionEditor({ section, media }: { section: MediaKitSectionRow; media: MediaOption[] }) {
  return <details className={styles.builderSection}>
    <summary className={styles.builderSectionHeader}>
      <div>
        <span>SEÇÃO {section.position}</span>
        <strong>{section.title || "Sem título"}</strong>
        <small>{sectionTypes.find(([value])=>value===section.type)?.[1] || section.type} · clique para editar</small>
      </div>
      <div className={styles.builderSectionSummaryActions}>
        <span className={section.enabled ? styles.builderStatusOn : styles.builderStatusOff}>{section.enabled ? "Visível" : "Oculta"}</span>
        <span className={styles.builderChevron} aria-hidden="true">⌄</span>
      </div>
    </summary>

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
        <SectionTemplateFields section={section}/>
        <SectionMediaControls section={section}/>
        <MediaImageFields value={section.mediaId} media={media} label={sectionImageLabel(section.type)}/>
      </div>
      <div className={styles.builderActions}>
        <label className={styles.builderToggle}><input type="checkbox" name="enabled" defaultChecked={section.enabled}/><span>Exibir seção no Mídia Kit</span></label>
        <div>
          <button className="adminButton primary" type="submit">Salvar alterações</button>
          <button className={styles.dangerButton} type="submit" formAction={deleteMediaKitSection}>Remover seção</button>
        </div>
      </div>
    </form>

    <div className={styles.builderItems}>
      <div className={styles.builderItemsTitle}><strong>Conteúdo da seção</strong><span>{section.items.length} {section.items.length === 1 ? "item" : "itens"}</span></div>
      {section.items.map((item)=><ItemEditor key={item.id} item={item} media={media} sectionType={section.type}/>)}
      <NewItemForm sectionId={section.id} media={media} sectionType={section.type}/>
    </div>
  </details>;
}

export function MediaKitBuilder({
  settings,
  sections,
  media,
}: {
  settings: SettingsRow;
  sections: MediaKitSectionRow[];
  media: MediaOption[];
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

    <section className={styles.createSectionPanel}>
      <div className={styles.createSectionHeading}>
        <div className="adminPanelHeadingIdentity">
          <span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20}/></span>
          <div>
            <h2>Nova seção</h2>
            <p>Crie uma seção livremente. Layout, conteúdo, ordem, imagem e visibilidade continuam editáveis depois.</p>
          </div>
        </div>
      </div>
      <form action={createMediaKitSection} className={styles.createSectionForm}>
        <div className={styles.createSectionGrid}>
          <Field label="Layout">
            <select name="type" defaultValue="custom">{sectionTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
          </Field>
          <Field label="Tema">
            <select name="theme" defaultValue="light"><option value="light">Claro</option><option value="dark">Escuro</option></select>
          </Field>
          <Field label="Identificador / eyebrow"><input name="eyebrow" placeholder="Ex.: INSTITUCIONAL, AUDIÊNCIA, COMERCIAL"/></Field>
          <Field label="Título"><input name="title" placeholder="Título da nova seção"/></Field>
          <Field label="Subtítulo" wide><input name="subtitle" placeholder="Opcional"/></Field>
          <Field label="Texto inicial" wide><textarea name="body" rows={3} placeholder="Opcional. Você pode completar tudo depois."/></Field>
        </div>
        <div className={styles.createSectionActions}>
          <span>A nova seção entra no fim do deck e pode ser reordenada pelo campo “Posição”.</span>
          <button className="adminButton primary" type="submit"><AdminIcon name="plus" size={14}/>Adicionar seção</button>
        </div>
      </form>
    </section>

    {sections.length ? sections.map((section)=><SectionEditor key={section.id} section={section} media={media}/>) : <section className={styles.builderEmpty}><AdminIcon name="document" size={24}/><strong>Nenhuma seção cadastrada</strong><span>Crie a primeira seção para iniciar o Mídia Kit.</span></section>}
  </div>;
}
