import "./admin.css";

/** Auth and protected routes share primitives, never public-site styling. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
