"use client";

export default function ArtistsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CONTEÚDO</p><h1>Artistas</h1><p>O módulo não conseguiu carregar os dados.</p></div></header>
      <div className="adminAlert error" role="alert">Falha ao carregar artistas. Nenhum dado foi alterado.</div>
      <div className="adminActions"><button className="adminButton primary" type="button" onClick={reset}>Tentar novamente</button><a className="adminButton" href="/admin">Voltar ao Dashboard</a></div>
    </div>
  );
}
