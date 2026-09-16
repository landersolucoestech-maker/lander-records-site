import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (id === "new") redirect("/admin/posts?create=1");
  const query = new URLSearchParams({ edit: id });
  if (saved) query.set("saved", "1");
  redirect(`/admin/posts?${query.toString()}`);
}
