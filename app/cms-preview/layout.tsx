import "../admin/admin.css";
import "./preview.css";
import { notFound } from "next/navigation";

export default function AdminPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}
