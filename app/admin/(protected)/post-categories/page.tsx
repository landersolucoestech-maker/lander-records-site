import { redirect } from "next/navigation";

export default function LegacyPostCategoriesPage() {
  redirect("/admin/categories");
}
