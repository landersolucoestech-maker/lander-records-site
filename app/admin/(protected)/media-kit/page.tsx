export const dynamic = "force-dynamic";

export default function MediaKitPage() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div>
          <p className="adminEyebrow">SITE</p>
          <h1>Mídia Kit</h1>
          <p>Apresentação comercial, audiência, inventário publicitário e canais do Portal Lander.</p>
        </div>
      </header>
      <section className="adminPanel">
        <h2>Módulo em refatoração</h2>
        <p>Esta rota foi separada da biblioteca de mídias para receber a implementação do Mídia Kit aprovada no novo painel administrativo.</p>
      </section>
    </div>
  );
}
