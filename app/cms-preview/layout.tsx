import "../admin/admin.css";
import "../admin/dashboard.css";
import { notFound } from "next/navigation";

export default function AdminPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development" && process.env.DEV_PREVIEW_PUBLIC_ACCESS !== "true") notFound();
  return children;
}
