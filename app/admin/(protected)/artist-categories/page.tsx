import { redirect } from "next/navigation";

export default function LegacyArtistCategoriesPage() {
  redirect("/admin/categories");
}
