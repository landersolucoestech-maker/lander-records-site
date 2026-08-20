export default function ArtistsLoading() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CONTEÚDO</p><h1>Artistas</h1><p>Carregando dados do CMS...</p></div></header>
      <section className="adminPanel adminStack" aria-busy="true" aria-live="polite">
        <div className="adminEmpty">Carregando artistas, métricas, taxonomias e publicação...</div>
      </section>
    </div>
  );
}
