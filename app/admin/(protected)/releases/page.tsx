import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ReleasesPage() {
  redirect("/admin/settings/lander-records");
}
