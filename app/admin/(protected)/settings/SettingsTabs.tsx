"use client";

import { useState, type ReactNode } from "react";
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

  return <div className={styles.settingsWorkspace}>
    <div className={styles.tabs} role="tablist" aria-label="Seções de configurações">
      {tabs.filter((item) => item.key !== "users" || canManageUsers).map((item) => <button aria-selected={tab === item.key} className={tab === item.key ? styles.activeTab : ""} key={item.key} onClick={() => setTab(item.key)} role="tab" type="button"><AdminIcon name={item.icon} size={15}/><span>{item.label}</span></button>)}
    </div>
    <section className={styles.tabPanel} role="tabpanel">{panels[tab]}</section>
  </div>;
}
