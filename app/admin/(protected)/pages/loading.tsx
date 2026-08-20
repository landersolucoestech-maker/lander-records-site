export default function PagesLoading() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SITE</p><h1>Páginas e Seções</h1><p>Carregando estrutura administrável do site...</p></div></header>
      <section className="adminPanel" aria-busy="true" aria-live="polite"><div className="adminEmpty">Carregando páginas, rotas, seções e SEO...</div></section>
    </div>
  );
}
