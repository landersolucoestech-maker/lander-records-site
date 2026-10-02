import Link from "next/link";

export default function NotFound(){
  return <main className="min-h-screen flex items-center justify-center px-6"><section className="max-w-xl text-center"><p className="text-sm uppercase tracking-[0.2em]">404</p><h1 className="mt-3 text-3xl font-semibold">Página não encontrada</h1><p className="mt-4">O endereço acessado não existe ou não está mais disponível.</p><Link className="mt-6 inline-block underline" href="/">Voltar para o início</Link></section></main>;
}
