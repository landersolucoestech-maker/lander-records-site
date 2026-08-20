import type { Metadata } from "next";
import { Footer, Header } from "../components/SiteChrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade da Lander Records e informações sobre tratamento de dados pessoais.",
};

const sections = [
  {
    title: "1. Quem somos",
    body: "A Lander Records é responsável por este site e pelo tratamento dos dados pessoais coletados por meio de seus canais digitais, formulários e interações relacionadas aos serviços apresentados no site.",
  },
  {
    title: "2. Dados que podemos coletar",
    body: "Podemos receber dados fornecidos diretamente por você, como nome, telefone, e-mail, empresa, assunto e conteúdo de mensagens enviadas pelos formulários. Também podem ser tratados dados técnicos necessários ao funcionamento e à segurança do site, como endereço IP, tipo de navegador, dispositivo, data e horário de acesso e registros de segurança.",
  },
  {
    title: "3. Como utilizamos os dados",
    body: "Os dados podem ser utilizados para responder contatos, avaliar propostas comerciais, atender solicitações de contratação e parceria, manter a segurança do site, prevenir abusos e fraudes, cumprir obrigações legais e aprimorar nossos serviços e canais de atendimento.",
  },
  {
    title: "4. Bases legais",
    body: "O tratamento poderá ocorrer, conforme o caso, com base no consentimento, na execução de procedimentos preliminares ou de contrato, no cumprimento de obrigação legal ou regulatória e em interesses legítimos da Lander Records, sempre observando os direitos do titular previstos na legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais — LGPD.",
  },
  {
    title: "5. Compartilhamento de dados",
    body: "Os dados poderão ser compartilhados somente quando necessário com fornecedores de infraestrutura, hospedagem, armazenamento, segurança, comunicação e demais prestadores que apoiem a operação do site e o atendimento. Também poderemos compartilhar informações quando houver obrigação legal, ordem de autoridade competente ou necessidade de proteção de direitos.",
  },
  {
    title: "6. Armazenamento e retenção",
    body: "Mantemos os dados pelo período necessário para cumprir as finalidades informadas, atender obrigações legais, exercer direitos em processos administrativos ou judiciais e preservar registros necessários à segurança e à continuidade das operações.",
  },
  {
    title: "7. Segurança",
    body: "Adotamos medidas técnicas e administrativas razoáveis para reduzir riscos de acesso não autorizado, perda, alteração, divulgação indevida ou destruição de dados. Nenhum sistema, contudo, pode garantir segurança absoluta em todas as circunstâncias.",
  },
  {
    title: "8. Direitos do titular",
    body: "Você pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informações sobre compartilhamento, revisão de decisões automatizadas e revogação do consentimento. As solicitações serão analisadas conforme os limites e requisitos legais.",
  },
  {
    title: "9. Cookies e tecnologias semelhantes",
    body: "O site pode utilizar cookies estritamente necessários e tecnologias similares para funcionamento, segurança, preferências e medição de desempenho. Quando exigido pela legislação, tecnologias opcionais dependerão de consentimento ou de outro fundamento jurídico adequado.",
  },
  {
    title: "10. Links de terceiros",
    body: "O site pode conter links para plataformas externas, redes sociais e serviços de terceiros. As práticas de privacidade desses serviços são regidas por suas próprias políticas e não estão sob controle da Lander Records.",
  },
  {
    title: "11. Alterações desta política",
    body: "Esta Política de Privacidade poderá ser atualizada para refletir mudanças legais, operacionais ou tecnológicas. A versão vigente será sempre disponibilizada nesta página com a indicação da data da última atualização.",
  },
  {
    title: "12. Contato",
    body: "Para dúvidas ou solicitações relacionadas à privacidade e ao tratamento de dados pessoais, utilize os canais disponíveis na página de contato da Lander Records.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">PRIVACIDADE</span>
        <p className="eyebrow">LANDER RECORDS</p>
        <h1>Política de Privacidade</h1>
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
