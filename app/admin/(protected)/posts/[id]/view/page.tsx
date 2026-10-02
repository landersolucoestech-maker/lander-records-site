import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/posts?view=${encodeURIComponent(id)}`);
}
