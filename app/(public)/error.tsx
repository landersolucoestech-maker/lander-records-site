"use client";

import Link from "next/link";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="publicRouteState publicRouteError" role="alert">
      <p className="eyebrow dark">NÃO FOI POSSÍVEL CARREGAR</p>
      <h1>Algo deu errado.</h1>
      <p>Não conseguimos carregar este conteúdo agora. Tente novamente ou volte para o início.</p>
      <div className="publicRouteActions">
        <button className="button buttonPrimary" type="button" onClick={() => reset()}>Tentar novamente</button>
        <Link className="button buttonOutline" href="/">Voltar ao início</Link>
      </div>
    </section>
  );
}
