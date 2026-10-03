import { notFound } from "next/navigation";
import { AdminPreview } from "../AdminPreview";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (process.env.NODE_ENV !== "development" && process.env.DEV_PREVIEW_PUBLIC_ACCESS !== "true") notFound();
  const { section = [] } = await params;
  return <AdminPreview section={section[0] || "dashboard"} />;
}
