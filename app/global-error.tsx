"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main id="main-content" className="publicRouteState publicRouteError" role="alert">
          <p className="eyebrow dark">LANDER RECORDS</p>
          <h1>Não foi possível carregar o site.</h1>
          <p>Tente novamente em instantes. Nenhuma informação interna foi exibida.</p>
          <div className="publicRouteActions">
            <button className="button buttonPrimary" type="button" onClick={() => reset()}>Tentar novamente</button>
            <Link className="button buttonOutline" href="/">Voltar ao início</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
