"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "./Settings.module.css";

type TabKey = "company" | "identity" | "automations" | "security" | "integrations" | "users";

type Tab = { key: TabKey; label: string; icon: IconName };

const tabs: Tab[] = [
  { key: "company", label: "Empresa", icon: "home" },
  { key: "identity", label: "Identidade do Site", icon: "media" },
  { key: "automations", label: "Automações", icon: "activity" },
  { key: "security", label: "Segurança", icon: "shield" },
  { key: "integrations", label: "Integrações", icon: "integration" },
  { key: "users", label: "Usuários", icon: "users" },
];

function tabFromHash(): TabKey {
  if (typeof window === "undefined") return "company";
  const hash = window.location.hash.replace(/^#/, "") as TabKey;
  return tabs.some((item) => item.key === hash) ? hash : "company";
}

export function SettingsTabs({ company, identity, automations, security, integrations, users, canManageUsers }: {
  company: ReactNode;
  identity: ReactNode;
  automations: ReactNode;
  security: ReactNode;
  integrations: ReactNode;
  users: ReactNode;
  canManageUsers: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("company");
  const panels: Record<TabKey, ReactNode> = { company, identity, automations, security, integrations, users };

  useEffect(() => {
    const sync = () => setTab(tabFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectTab = (next: TabKey) => {
    setTab(next);
    const hash = next === "company" ? "" : `#${next}`;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return <div className={styles.settingsWorkspace}>
    <div className={styles.tabs} role="tablist" aria-label="Seções de configurações">
      {tabs.filter((item) => item.key !== "users" || canManageUsers).map((item) => <button aria-selected={tab === item.key} className={tab === item.key ? styles.activeTab : ""} key={item.key} onClick={() => selectTab(item.key)} role="tab" type="button"><AdminIcon name={item.icon} size={15}/><span>{item.label}</span></button>)}
    </div>
    <section className={styles.tabPanel} role="tabpanel">{panels[tab]}</section>
  </div>;
}
