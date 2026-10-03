import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
    <section style={{ width: "min(100%, 640px)", textAlign: "center" }}>
      <p style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase" }}>404</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.05 }}>Página não encontrada</h1>
      <p style={{ margin: "16px auto 0", maxWidth: 520 }}>O endereço acessado não existe ou não está mais disponível.</p>
      <Link href="/" style={{ display: "inline-block", marginTop: 24, textDecoration: "underline", textUnderlineOffset: 4 }}>Voltar para o início</Link>
    </section>
  </main>;
}
