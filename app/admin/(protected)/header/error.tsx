"use client";

export default function HeaderError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="adminPage"><section className="adminPanel adminStack" role="alert"><h1>Não foi possível carregar o Cabeçalho</h1><p>As configurações permaneceram inalteradas. Nenhum detalhe interno foi exposto.</p><div className="adminActions"><button className="adminButton primary" onClick={reset} type="button">Tentar novamente</button><a className="adminButton" href="/admin">Voltar ao Dashboard</a></div></section></div>;
}
