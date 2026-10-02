const section = (pageId:string, key:string, position:number, input:Record<string,unknown>) => ({
  id:`mock-section-${pageId}-${key}`, pageId, sectionKey:key, type:key, position, enabled:true,
  eyebrow:"", title:"", subtitle:"", body:"", settings:{}, updatedAt:new Date("2026-09-20T12:00:00Z"), ...input,
});
const item = (sectionId:string, key:string, position:number, input:Record<string,unknown>) => ({
  id:`mock-item-${sectionId}-${key}`, sectionId, itemKey:key, position, enabled:true, mediaId:null,
  title:"", subtitle:"", body:"", label:"", url:"", ...input,
});

export const mockSiteSettings = {
  id:"site", brandName:"Lander Records", tagline:"Música · Artistas · Cultura · Oportunidades",
  contactEmail:"contato@landerrecords.com", contactPhone:"+55 (33) 99876-4321",
  location:"Governador Valadares · MG", address:"Av. Minas Gerais, 820 · Centro · Governador Valadares/MG",
  hours:"Segunda a sexta · 09h às 18h", defaultSeoTitle:"Lander Records · Música, artistas e oportunidades",
  defaultSeoDescription:"Gravadora, produtora musical e estrutura de gestão artística 360°.",
  logoMediaId:"mock-media-logo", socialImageMediaId:"mock-media-banner", updatedAt:new Date("2026-09-20T12:00:00Z"),
};

export const mockSocialLinks = [
  { id:"mock-social-instagram", platform:"instagram", label:"Instagram", url:"https://instagram.com/landerrecords", position:1, active:true },
  { id:"mock-social-youtube", platform:"youtube", label:"YouTube", url:"https://youtube.com/@landerrecords", position:2, active:true },
  { id:"mock-social-tiktok", platform:"tiktok", label:"TikTok", url:"https://tiktok.com/@landerrecords", position:3, active:true },
  { id:"mock-social-spotify", platform:"spotify", label:"Spotify", url:"https://open.spotify.com/", position:4, active:true },
];

export const mockNavigation = [
  { id:"mock-nav-home", menuKey:"primary", parentId:null, label:"Início", linkType:"internal", url:"/", position:1, enabled:true, newTab:false, createdAt:new Date("2026-08-01") },
  { id:"mock-nav-artists", menuKey:"primary", parentId:null, label:"Artistas", linkType:"internal", url:"/artistas", position:2, enabled:true, newTab:false, createdAt:new Date("2026-08-02") },
  { id:"mock-nav-news", menuKey:"primary", parentId:null, label:"Notícias", linkType:"internal", url:"/noticias", position:3, enabled:true, newTab:false, createdAt:new Date("2026-08-03") },
  { id:"mock-nav-about", menuKey:"primary", parentId:null, label:"Sobre nós", linkType:"internal", url:"/sobre-nos", position:4, enabled:true, newTab:false, createdAt:new Date("2026-08-04") },
  { id:"mock-nav-contact", menuKey:"primary", parentId:null, label:"Contato", linkType:"internal", url:"/contato", position:5, enabled:true, newTab:false, createdAt:new Date("2026-08-05") },
  { id:"mock-nav-instagram", menuKey:"footer", parentId:null, label:"Instagram", linkType:"external", url:"https://instagram.com/landerrecords", position:1, enabled:true, newTab:true, createdAt:new Date("2026-08-06") },
  { id:"mock-nav-privacy", menuKey:"footer", parentId:null, label:"Política de Privacidade", linkType:"internal", url:"/politica-de-privacidade", position:2, enabled:true, newTab:false, createdAt:new Date("2026-08-07") },
  { id:"mock-nav-terms", menuKey:"footer", parentId:null, label:"Termos e Condições", linkType:"internal", url:"/termos-e-condicoes", position:3, enabled:true, newTab:false, createdAt:new Date("2026-08-08") },
];

export const mockContactTopics = [
  { id:"mock-topic-booking", name:"Contratação de artista", slug:"contratacao-de-artista", position:1, active:true },
  { id:"mock-topic-partnership", name:"Parcerias e marcas", slug:"parcerias-e-marcas", position:2, active:true },
  { id:"mock-topic-release", name:"Lançamentos e distribuição", slug:"lancamentos-e-distribuicao", position:3, active:true },
  { id:"mock-topic-press", name:"Imprensa e conteúdo", slug:"imprensa-e-conteudo", position:4, active:true },
  { id:"mock-topic-demo", name:"Envio de material artístico", slug:"envio-de-material", position:5, active:true },
  { id:"mock-topic-other", name:"Outros assuntos", slug:"outros", position:6, active:true },
];

const page = (id:string,key:string,title:string,slug:string,seoDescription:string) => ({
  id,key,title,slug,enabled:true,seoTitle:`${title} · Lander Records`,seoDescription,
  canonicalUrl: slug ? `https://landerrecords.com/${slug}` : "https://landerrecords.com/",
  ogMediaId:"mock-media-banner",updatedAt:new Date("2026-09-20T12:00:00Z"),
});

export const mockPages = [
  page("mock-page-home","home","Início","","Música, artistas, cultura e oportunidades conectadas pela Lander Records."),
  page("mock-page-artists","artists","Artistas","artistas","Conheça o casting e os artistas em desenvolvimento na Lander Records."),
  page("mock-page-news","news","Notícias","noticias","Lançamentos, bastidores, mercado, agenda e conteúdo editorial."),
  page("mock-page-about","about","Sobre nós","sobre-nos","Conheça a Lander Records e sua estrutura de gestão artística 360°."),
  page("mock-page-contact","contact","Contato","contato","Fale com a equipe da Lander Records para parcerias, booking e projetos."),
  page("mock-page-privacy","privacy","Política de Privacidade","politica-de-privacidade","Política de privacidade e tratamento de dados."),
  page("mock-page-terms","terms","Termos e Condições","termos-e-condicoes","Termos e condições de uso do site Lander Records."),
];

const homeSections = [
  section("mock-page-home","hero",1,{ eyebrow:"LANDER RECORDS", title:"MÚSICA MOVE PESSOAS.", subtitle:"Conectamos artistas, repertório, produção e oportunidades em uma estrutura de gestão artística 360°.", settings:{ mediaId:"mock-media-dj-stay-wide" } }),
  section("mock-page-home","intro",2,{ eyebrow:"QUEM SOMOS", title:"DESENVOLVIMENTO ARTÍSTICO COM VISÃO DE NEGÓCIO.", body:"A Lander Records atua como gravadora, produtora musical e estrutura de gestão artística 360°, conectando desenvolvimento de carreira, produção, conteúdo, posicionamento e oportunidades comerciais.\n\nNosso objetivo é transformar música em projetos consistentes, aproximando artistas, público e parceiros." }),
  section("mock-page-home","shortcuts",3,{ eyebrow:"ATUAÇÃO", title:"NOSSAS FRENTES" }),
  section("mock-page-home","artists",4,{ eyebrow:"CASTING", title:"ARTISTAS EM DESTAQUE", subtitle:"Talentos com identidade, repertório e estratégia." }),
  section("mock-page-home","releases",5,{ eyebrow:"STREAMING", title:"ÚLTIMOS LANÇAMENTOS", subtitle:"Uma seleção atualizada dos lançamentos do casting." }),
  section("mock-page-home","advertise_banner",6,{ eyebrow:"PARCERIAS", title:"CONECTE SUA MARCA À MÚSICA", settings:{ mediaId:"mock-media-banner" } }),
  section("mock-page-home","news",7,{ eyebrow:"PORTAL LANDER", title:"ÚLTIMAS NOTÍCIAS", subtitle:"Lançamentos, bastidores, mercado e cultura." }),
];
const homeItems = [
  item(homeSections[0].id,"primary_cta",1,{ label:"Conheça nossos artistas",url:"/artistas" }),
  item(homeSections[0].id,"secondary_cta",2,{ label:"Fale com a Lander",url:"/contato" }),
  item(homeSections[1].id,"about_link",1,{ label:"Conheça a Lander Records",url:"/sobre-nos" }),
  item(homeSections[2].id,"artists",1,{ title:"Artistas",label:"Artistas",url:"/artistas" }),
  item(homeSections[2].id,"releases",2,{ title:"Lançamentos",label:"Lançamentos",url:"/#lancamentos" }),
  item(homeSections[2].id,"news",3,{ title:"Notícias",label:"Notícias",url:"/noticias" }),
  item(homeSections[2].id,"contact",4,{ title:"Parcerias",label:"Parcerias",url:"/contato" }),
  item(homeSections[5].id,"banner",1,{ title:"Sua marca no ritmo certo",label:"Conheça formatos comerciais",url:"/contato",mediaId:"mock-media-banner" }),
];

const artistSections = [
  section("mock-page-artists","hero",1,{ eyebrow:"CASTING",title:"ARTISTAS",subtitle:"Talentos que constroem o som de amanhã." }),
  section("mock-page-artists","artist_filters",2,{ title:"ENCONTRE POR PERFIL" }),
  section("mock-page-artists","artist_list",3,{ title:"CASTING LANDER RECORDS" }),
];
const newsSections = [
  section("mock-page-news","hero",1,{ eyebrow:"PORTAL LANDER",title:"NOTÍCIAS",subtitle:"Lançamentos, bastidores, mercado e cultura." }),
  section("mock-page-news","news_categories",2,{ title:"EDITORIAS" }),
  section("mock-page-news","news_list",3,{ title:"CONTEÚDOS RECENTES" }),
];
const aboutSections = [
  section("mock-page-about","hero",1,{ eyebrow:"INSTITUCIONAL",title:"SOBRE A LANDER RECORDS",subtitle:"Música, artistas, cultura e oportunidades em uma estrutura conectada." }),
  section("mock-page-about","history",2,{ eyebrow:"NOSSA HISTÓRIA",title:"UMA ESTRUTURA CRIADA PARA DESENVOLVER CARREIRAS.",body:"A Lander Records nasceu para integrar criação, produção, posicionamento, gestão e oportunidades em uma operação única.\n\nTrabalhamos com visão de longo prazo, organização e capacidade de execução." }),
  section("mock-page-about","identity",3,{ eyebrow:"IDENTIDADE",title:"ARTISTA NO CENTRO. ESTRATÉGIA AO REDOR.",body:"Missão: desenvolver projetos artísticos sustentáveis.\n\nVisão: ser uma estrutura de referência em gestão artística integrada.\n\nValores: criatividade, transparência, consistência, colaboração e resultado." }),
  section("mock-page-about","companies",4,{ eyebrow:"ECOSSISTEMA",title:"FRENTES QUE SE COMPLETAM." }),
  section("mock-page-about","methodology",5,{ eyebrow:"GESTÃO 360°",title:"DA MÚSICA AO MERCADO.",body:"Diagnóstico, posicionamento, repertório, produção, conteúdo, distribuição, audiência, parcerias e acompanhamento de performance." }),
];
const aboutItems = [
  item(aboutSections[3].id,"records",1,{title:"Lander Records",body:"Gravadora, desenvolvimento artístico e estratégia de lançamentos."}),
  item(aboutSections[3].id,"studio",2,{title:"Produção Musical",body:"Sessões, produção, direção e finalização de repertório."}),
  item(aboutSections[3].id,"business",3,{title:"Lander Business",body:"Parcerias, marcas, projetos comerciais e oportunidades."}),
  item(aboutSections[3].id,"content",4,{title:"Conteúdo & Cultura",body:"Narrativas, audiovisual, portal e experiências de marca."}),
];
const contactSections = [
  section("mock-page-contact","hero",1,{eyebrow:"CONTATO",title:"VAMOS CONSTRUIR ALGO JUNTOS.",subtitle:"Booking, parcerias, projetos, lançamentos e novas oportunidades."}),
  section("mock-page-contact","contact_form",2,{title:"FALE COM A EQUIPE",body:"Conte o contexto do seu projeto para direcionarmos sua mensagem à pessoa certa."}),
];
const legalSections = (pageId:string,title:string)=>[
  section(pageId,"hero",1,{eyebrow:"LEGAL",title}),
  section(pageId,"legal_body",2,{title,body:"Este conteúdo demonstra a estrutura completa da página legal no ambiente de preview. Em produção, o texto oficial deve ser mantido pelo responsável jurídico e de privacidade da organização.\n\nA Lander Records adota práticas de segurança, transparência e minimização de dados compatíveis com a operação do site e seus canais de contato."}),
];

export const mockPageSections = [
  ...homeSections,...artistSections,...newsSections,...aboutSections,...contactSections,
  ...legalSections("mock-page-privacy","POLÍTICA DE PRIVACIDADE"),
  ...legalSections("mock-page-terms","TERMOS E CONDIÇÕES"),
];

const aboutIdentityItems = [
  item(aboutSections[2].id,"mission",1,{title:"Missão",body:"Desenvolver projetos artísticos sustentáveis, conectando criação, estratégia e execução."}),
  item(aboutSections[2].id,"vision",2,{title:"Visão",body:"Ser referência em gestão artística integrada, produção e desenvolvimento de carreira."}),
  item(aboutSections[2].id,"values",3,{title:"Valores",body:"Criatividade, transparência, consistência, colaboração, respeito e resultado."}),
];
const aboutMethodItems = [
  item(aboutSections[4].id,"diagnosis",1,{title:"Diagnóstico",body:"Leitura de identidade, repertório, audiência, canais, momento de carreira e oportunidades."}),
  item(aboutSections[4].id,"positioning",2,{title:"Posicionamento",body:"Definição de narrativa, proposta artística, linguagem visual e prioridades estratégicas."}),
  item(aboutSections[4].id,"production",3,{title:"Produção",body:"Repertório, gravação, direção musical, assets, conteúdo e preparação de lançamento."}),
  item(aboutSections[4].id,"distribution",4,{title:"Distribuição & audiência",body:"Calendário, distribuição digital, mídia, conteúdo e relacionamento com público."}),
  item(aboutSections[4].id,"business",5,{title:"Negócios",body:"Booking, marcas, parcerias, projetos especiais e novas fontes de receita."}),
  item(aboutSections[4].id,"summary",6,{title:"Gestão contínua",body:"Acompanhamento de performance, aprendizados e próximos ciclos de crescimento."}),
];
const contactIntro = section("mock-page-contact","intro",3,{eyebrow:"LANDER RECORDS",title:"FALE COM A EQUIPE",body:"Conte o contexto do seu projeto, objetivo, prazo e formato desejado. Nossa equipe direciona sua mensagem para booking, parcerias, conteúdo, distribuição ou desenvolvimento artístico."});
mockPageSections.push(contactIntro);

const privacySection = mockPageSections.find((entry)=>entry.pageId==="mock-page-privacy" && entry.sectionKey==="legal_body")!;
const termsSection = mockPageSections.find((entry)=>entry.pageId==="mock-page-terms" && entry.sectionKey==="legal_body")!;
const legalItems = [
  item(privacySection.id,"collection",1,{title:"1. Dados tratados",body:"Podemos receber dados enviados voluntariamente em formulários, informações técnicas de navegação e dados necessários para responder solicitações."}),
  item(privacySection.id,"purpose",2,{title:"2. Finalidades",body:"Os dados são utilizados para atendimento, segurança, operação do site, melhoria de experiência e relacionamento comercial solicitado pelo usuário."}),
  item(privacySection.id,"retention",3,{title:"3. Retenção e direitos",body:"A retenção segue necessidade operacional e obrigações aplicáveis. Solicitações de acesso, correção ou exclusão podem ser encaminhadas pelos canais oficiais."}),
  item(termsSection.id,"use",1,{title:"1. Uso do site",body:"O site apresenta informações institucionais, artísticas, editoriais e canais de contato da Lander Records."}),
  item(termsSection.id,"content",2,{title:"2. Conteúdo e propriedade intelectual",body:"Textos, marcas, imagens e demais materiais são protegidos e não devem ser reutilizados fora das permissões aplicáveis."}),
  item(termsSection.id,"contact",3,{title:"3. Contato e atualizações",body:"Estes termos podem ser atualizados para refletir mudanças operacionais. A versão vigente permanece disponível nesta página."}),
];

export const mockPageItems = [...homeItems,...aboutItems,...aboutIdentityItems,...aboutMethodItems,...legalItems];


export function mockPageContent(pageKey:string) {
  const page = mockPages.find((entry)=>entry.key===pageKey);
  if(!page) return null;
  const sections = mockPageSections.filter((entry)=>entry.pageId===page.id).map((entry)=>({
    ...entry,
    mediaId: typeof entry.settings === "object" && entry.settings && "mediaId" in entry.settings ? String((entry.settings as {mediaId?:string}).mediaId || "") : null,
    mediaUrl: (()=>{ const id=typeof entry.settings === "object" && entry.settings && "mediaId" in entry.settings ? String((entry.settings as {mediaId?:string}).mediaId || ""):""; return id==="mock-media-banner"?"/lander-records-anuncie-banner.webp":id==="mock-media-dj-stay-wide"?"/dj-stay-wide.webp":""; })(),
    mediaAltText:"",
    mediaMimeType:"image/webp",
    items:mockPageItems.filter((itemRow)=>itemRow.sectionId===entry.id).map((itemRow)=>({
      ...itemRow,
      mediaUrl:itemRow.mediaId==="mock-media-banner"?"/lander-records-anuncie-banner.webp":"",
      mediaAltText:itemRow.title || itemRow.label || "",
      mediaMimeType:itemRow.mediaId?"image/webp":"",
    })),
  }));
  return { page, ogImageUrl:"/lander-records-anuncie-banner.webp", sections };
}
