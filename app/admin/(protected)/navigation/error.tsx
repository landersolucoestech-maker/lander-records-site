"use client";

export default function NavigationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="adminPage"><header className="adminPageHeader"><div><p className="adminEyebrow">NAVEGAÇÃO</p><h1>Não foi possível carregar os menus</h1><p>Nenhum detalhe interno foi exposto. Tente novamente ou volte ao painel.</p></div></header><div className="adminAlert error" role="alert">A leitura administrativa falhou de forma segura.</div><div className="adminActions"><button className="adminButton primary" onClick={reset} type="button">Tentar novamente</button><a className="adminButton" href="/admin">Voltar ao Dashboard</a></div></div>;
}
