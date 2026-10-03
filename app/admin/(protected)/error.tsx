"use client";

export default function AdminProtectedError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="adminPage">
    <div className="adminAlert error" role="alert">
      <strong>Não foi possível carregar este módulo.</strong>
      <p>O erro foi contido nesta área administrativa. Tente carregar novamente.</p>
      <button className="adminButton primary" onClick={() => reset()} type="button">Tentar novamente</button>
    </div>
  </div>;
}
