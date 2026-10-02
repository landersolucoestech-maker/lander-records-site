"use client";

export default function PostsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Notícias</h1><p>O módulo não conseguiu carregar os dados.</p></div></header>
      <div className="adminAlert error" role="alert">Falha ao carregar notícias. Nenhum conteúdo foi alterado.</div>
      <div className="adminActions"><button className="adminButton primary" type="button" onClick={reset}>Tentar novamente</button><a className="adminButton" href="/admin">Voltar ao Dashboard</a></div>
    </div>
  );
}
