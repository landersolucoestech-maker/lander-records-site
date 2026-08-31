type IconName = "activity" | "artists" | "audit" | "calendar" | "chevron" | "dashboard" | "external" | "home" | "integration" | "media" | "menu" | "navigation" | "pages" | "posts" | "settings" | "tags" | "users" | "x";

const paths: Record<IconName, React.ReactNode> = {
  activity: <><path d="M4 12h3l2-6 4 12 2-6h5" /></>,
  artists: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></>,
  audit: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  external: <><path d="M14 3h7v7M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
  integration: <><path d="M8 3v4M16 3v4M5 7h14v4a7 7 0 0 1-14 0ZM12 18v3" /></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m3 17 5-4 4 3 3-2 6 5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  navigation: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="7" cy="6" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /></>,
  pages: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5M9 13h6M9 17h6" /></>,
  posts: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z" transform="scale(.8) translate(3 3)" /></>,
  tags: <><path d="M20 13 11 4H4v7l9 9z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6M16 5c2 .3 3 1.3 3 3s-1 2.7-3 3M17 14c2.3.6 3.6 2.6 4 6" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

export function AdminIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" className="adminIcon" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</svg>;
}

export type { IconName };
