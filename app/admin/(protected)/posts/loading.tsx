export default function PostsLoading() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Notícias</h1><p>Carregando publicações do CMS...</p></div></header>
      <section className="adminPanel" aria-busy="true" aria-live="polite"><div className="adminEmpty">Carregando notícias, categorias, imagens e autores...</div></section>
    </div>
  );
}
