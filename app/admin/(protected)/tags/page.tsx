import { redirect } from "next/navigation";

export default function LegacyTagsPage() {
  redirect("/admin/categories");
}
