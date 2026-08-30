export function PublicRouteLoading({ label }: { label: string }) {
  return (
    <section className="publicRouteState publicRouteLoading" role="status" aria-live="polite" aria-busy="true">
      <p className="eyebrow dark">LANDER RECORDS</p>
      <h1>{label}</h1>
      <div className="publicRouteLoadingLine" aria-hidden="true" />
      <span className="srOnly">Carregando conteúdo</span>
    </section>
  );
}
