"use client";

export default function PagesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SITE</p><h1>Páginas e Seções</h1><p>O módulo não conseguiu carregar a estrutura do site.</p></div></header>
      <div className="adminAlert error" role="alert">Falha ao carregar páginas e seções. Nenhum conteúdo foi alterado.</div>
      <div className="adminActions"><button className="adminButton primary" type="button" onClick={reset}>Tentar novamente</button><a className="adminButton" href="/admin">Voltar ao Dashboard</a></div>
    </div>
  );
}
