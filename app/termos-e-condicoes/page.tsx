import type { Metadata } from "next";
import { Footer, Header } from "../components/SiteChrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description: "Termos e Condições de uso do site da Lander Records.",
};

const sections = [
  {
    title: "1. Aceitação dos termos",
    body: "Ao acessar ou utilizar este site, você declara que leu e concorda com estes Termos e Condições. Caso não concorde com alguma disposição, recomendamos que não utilize o site ou seus recursos interativos.",
  },
  {
    title: "2. Finalidade do site",
    body: "O site apresenta informações institucionais, artistas, lançamentos, notícias, serviços, projetos, oportunidades de contratação, publicidade, parceria e canais de contato da Lander Records. O conteúdo poderá ser atualizado, removido ou reorganizado a qualquer momento.",
  },
  {
    title: "3. Uso permitido",
    body: "O usuário deve utilizar o site de forma lícita e compatível com sua finalidade. É proibido tentar comprometer a segurança, explorar vulnerabilidades, interferir no funcionamento, automatizar acessos abusivos, introduzir código malicioso ou utilizar o conteúdo para práticas ilegais ou fraudulentas.",
  },
  {
    title: "4. Propriedade intelectual",
    body: "Marcas, logotipos, identidade visual, textos, imagens, fotografias, vídeos, materiais gráficos, nomes artísticos, obras, fonogramas e demais conteúdos exibidos no site podem estar protegidos por direitos autorais, direitos conexos, marcas e outras normas de propriedade intelectual. Nenhum conteúdo poderá ser reproduzido, distribuído, modificado ou explorado comercialmente sem autorização quando essa autorização for exigida por lei.",
  },
  {
    title: "5. Conteúdo de artistas e terceiros",
    body: "Determinados materiais podem pertencer a artistas, parceiros, plataformas digitais, produtores, fotógrafos, designers ou outros titulares. A presença desses materiais no site não transfere ao usuário qualquer licença além do acesso normal ao conteúdo publicado.",
  },
  {
    title: "6. Formulários e contatos",
    body: "Ao enviar uma mensagem, proposta, solicitação de contratação ou parceria, o usuário declara que as informações fornecidas são verdadeiras e que possui legitimidade para compartilhá-las. O envio de um formulário não cria, por si só, obrigação de contratação, representação, parceria ou resposta comercial.",
  },
  {
    title: "7. Links e serviços externos",
    body: "O site pode direcionar para redes sociais, plataformas de streaming, serviços de vídeo, páginas de artistas e outros ambientes de terceiros. A Lander Records não controla a disponibilidade, segurança, conteúdo ou termos desses serviços externos.",
  },
  {
    title: "8. Disponibilidade do site",
    body: "Buscamos manter o site disponível e atualizado, mas não garantimos funcionamento ininterrupto ou livre de falhas. Manutenções, indisponibilidades de fornecedores, eventos de segurança, falhas de rede e outras circunstâncias podem causar interrupções temporárias.",
  },
  {
    title: "9. Responsabilidades",
    body: "Na medida permitida pela legislação aplicável, a Lander Records não se responsabiliza por danos decorrentes de uso indevido do site, atos de terceiros, indisponibilidade de serviços externos ou decisões tomadas exclusivamente com base em informações que tenham sido alteradas, removidas ou estejam temporariamente indisponíveis.",
  },
  {
    title: "10. Privacidade",
    body: "O tratamento de dados pessoais relacionado ao uso do site é disciplinado pela Política de Privacidade da Lander Records, disponível no rodapé e em página própria.",
  },
  {
    title: "11. Alterações dos termos",
    body: "Estes Termos e Condições poderão ser alterados para refletir mudanças no site, nos serviços, nas práticas operacionais ou na legislação. A versão vigente será publicada nesta página com a data da última atualização.",
  },
  {
    title: "12. Legislação aplicável",
    body: "Estes termos serão interpretados de acordo com a legislação brasileira. Eventuais controvérsias serão tratadas conforme as regras de competência previstas na legislação aplicável, sem prejuízo de direitos assegurados ao usuário por normas obrigatórias.",
  },
  {
    title: "13. Contato",
    body: "Para dúvidas sobre estes Termos e Condições, utilize os canais disponíveis na página de contato da Lander Records.",
  },
];

export default function TermsPage() {
  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">TERMOS</span>
        <p className="eyebrow">LANDER RECORDS</p>
        <h1>Termos e Condições</h1>
        <p>Última atualização: 20 de agosto de 2026</p>
      </section>
      <section className="section">
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {sections.map((section) => (
            <article className="detailCard" key={section.title} style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
