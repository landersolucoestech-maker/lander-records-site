import { requireAdmin } from "../../../../lib/auth";
import { getSiteChrome } from "../../../../lib/content";
import { HeaderManagerView } from "./HeaderManagerView";

export const dynamic = "force-dynamic";

export default async function HeaderPage() {
  const session = await requireAdmin();
  const chrome = await getSiteChrome();
  const primaryItems = chrome.navigation.filter((item) => item.menuKey === "primary" && !item.parentId).map(({ id, label, newTab, url }) => ({ id, label, newTab, url }));

  return <HeaderManagerView data={{
    brandName: chrome.settings.brandName,
    ctaLabel: "Quero Contratar",
    ctaUrl: "/contato",
    globalLogoUrl: chrome.logoUrl,
    primaryItems,
    publicLogoSrc: "/lander-records-brand.svg",
  }} viewer={session.user.role === "viewer"} />;
}
