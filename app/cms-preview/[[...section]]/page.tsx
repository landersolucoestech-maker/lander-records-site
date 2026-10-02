import { notFound } from "next/navigation";
import { AdminPreview } from "../AdminPreview";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { section = [] } = await params;
  return <AdminPreview section={section[0] || "dashboard"} />;
}
