import PostForm from "../PostForm";
import { loadPostOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const options = await loadPostOptions();
  return <div className="adminPage"><PostForm {...options} /></div>;
}
