"use client";

import Link from "next/link";

export default function AdminHomeError({ reset }: { reset: () => void }) {
  return <div className="homeManager"><section className="adminPanel homeManagerError" role="alert"><p className="adminEyebrow">MÓDULO HOME</p><h1>Não foi possível carregar a Home</h1><p>Os dados administrativos não foram alterados. Tente novamente ou volte ao Dashboard.</p><div className="adminActions"><button className="adminButton primary" onClick={reset} type="button">Tentar novamente</button><Link className="adminButton" href="/admin">Voltar ao Dashboard</Link></div></section></div>;
}
