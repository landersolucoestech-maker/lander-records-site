import { asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { mediaAssets, pageSectionItems, pageSections, pages } from "../../../../../lib/db/schema";
import { mockDataEnabled, mockMediaOptions, mockPageItems, mockPages, mockPageSections } from "../../../../../lib/mocks";
import { AdminContextHeaderSync } from "../../../components/AdminContextHeaderSync";
import PageContentWorkbench, { type PageEditorItem, type PageEditorSection, type PageMediaOption } from "./PageContentWorkbench";
import { pageContract } from "../page-contract";
import { siteSectionContract } from "../site-page-contract";

export const dynamic = "force-dynamic";

function sectionMediaId(settings: Record<string, unknown> | null | undefined) {
  const value = settings?.mediaId;
  return typeof value === "string" ? value : null;
}

export default async function PageContentEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> }) {
  const session = await requireAdmin("editor");
  // Development preview sessions may inspect the section editor; mutations remain guarded by the existing server actions.
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  const [pageRows, sections, mediaRows] = mockDataEnabled() ? [
    mockPages.filter((page) => page.id === id),
    mockPageSections.filter((section) => section.pageId === id).sort((left, right) => left.position - right.position),
    mockMediaOptions,
  ] : await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.position)),
    db.select({
      id: mediaAssets.id,
      url: mediaAssets.url,
      altText: mediaAssets.altText,
      mimeType: mediaAssets.mimeType,
      originalFilename: mediaAssets.originalFilename,
    }).from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();

  const itemRows = mockDataEnabled()
    ? mockPageItems.filter((item) => sections.some((section) => section.id === item.sectionId)).sort((left, right) => left.position - right.position)
    : sections.length
      ? await db.select().from(pageSectionItems).where(inArray(pageSectionItems.sectionId, sections.map((section) => section.id))).orderBy(asc(pageSectionItems.position))
      : [];

  const editorSections: PageEditorSection[] = sections.map((section) => ({
    id: section.id,
    sectionKey: section.sectionKey,
    type: section.type,
    position: section.position,
    enabled: section.enabled,
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    mediaId: sectionMediaId(section.settings),
  }));

  const editorItems: PageEditorItem[] = itemRows.map((item) => ({
    id: item.id,
    sectionId: item.sectionId,
    itemKey: item.itemKey,
    position: item.position,
    enabled: item.enabled,
    mediaId: item.mediaId,
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    label: item.label,
    url: item.url,
  }));
  const mediaOptions: PageMediaOption[] = mediaRows;

  const initialSection = editorSections.find((section) => section.id === query.section) || editorSections[0];
  const initialLabel = initialSection
    ? siteSectionContract(page.key, initialSection.sectionKey)?.label || initialSection.sectionKey.replaceAll("_", " ")
    : page.title;
  const headerDescription = `Edite os campos realmente consumidos por ${initialLabel} no site da Lander Records e valide o resultado no preview público.`;

  return <>
    <AdminContextHeaderSync title={`Configurar seção: ${initialLabel}`} description={headerDescription} />
    <PageContentWorkbench
      page={{ id: page.id, key: page.key, title: page.title }}
      publicRoute={pageContract(page.key).route}
      sections={editorSections}
      items={editorItems}
      mediaOptions={mediaOptions}
      initialSectionId={query.section}
    />
  </>;
}
