export default function HeaderLoading() {
  return <div aria-busy="true" aria-label="Carregando configurações do cabeçalho" className="adminPage">
    <header className="adminPageHeader"><div><p className="adminEyebrow">CABEÇALHO</p><h1>Carregando cabeçalho...</h1><p>Consultando as fontes oficiais do Header.</p></div></header>
    <div className="adminMetricGrid">{Array.from({ length: 5 }, (_, index) => <div className="adminMetricCard" key={index}><span>Carregando</span><strong>—</strong><small>Aguarde</small></div>)}</div>
    <section className="adminPanel"><div className="adminEmpty">Preparando fontes e prévia ilustrativa...</div></section>
  </div>;
}
