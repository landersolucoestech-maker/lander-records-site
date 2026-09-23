export const mockMediaKitSettings = {
  id: "default",
  documentTitle: "Mídia Kit",
  edition: "2026",
  footerWebsite: "landerrecords.com",
  showPageNumbers: true,
};

export const mockMediaKitSections = [
  { id:"mock-kit-cover", type:"cover", theme:"dark", eyebrow:"LANDER RECORDS · 2026", title:"CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES.", subtitle:"Gravadora, produtora musical e gestão artística 360°.", body:"Um ecossistema para talentos, marcas, projetos e boas ideias.", ctaLabel:"", ctaUrl:"", mediaId:"mock-media-dj-stay-wide", position:1, enabled:true, settings:{mediaFit:"cover",mediaPosition:"center",coverSideNote:"INFORMAÇÃO QUE MOVE O MERCADO",mockupLabel:"MÚSICA MOVE PESSOAS.",footerNote:"MÚSICA · ARTISTAS · OPORTUNIDADES"} },
  { id:"mock-kit-about", type:"editorial", theme:"light", eyebrow:"INSTITUCIONAL", title:"SOBRE A LANDER RECORDS", subtitle:"", body:"A Lander Records atua como gravadora, produtora musical e estrutura de gestão artística 360°, conectando desenvolvimento de carreira, produção, conteúdo, posicionamento e oportunidades comerciais.\n\nAqui, música e estratégia caminham juntas para transformar projetos em experiências relevantes e sustentáveis.", ctaLabel:"", ctaUrl:"", mediaId:"mock-media-banner", position:2, enabled:true, settings:{mediaFit:"cover",mediaPosition:"center",sideTitle:"MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.",bannerTitle:"CONTEÚDO QUE GERA VISIBILIDADE REAL PARA ARTISTAS E MARCAS.",footerNote:"INFORMAÇÃO QUE MOVE O MERCADO"} },
  { id:"mock-kit-audience", type:"audience", theme:"light", eyebrow:"AUDIÊNCIA", title:"NOSSA AUDIÊNCIA", subtitle:"", body:"Uma comunidade engajada, conectada à música, entretenimento, cultura e oportunidades.", ctaLabel:"", ctaUrl:"", mediaId:null, position:3, enabled:true, settings:{footerNote:"DADOS DEMONSTRATIVOS · 2026"} },
  { id:"mock-kit-partnerships", type:"cards", theme:"light", eyebrow:"COMERCIAL", title:"FORMATOS DE PUBLICIDADE", subtitle:"", body:"A Lander Records oferece diferentes espaços para marcas, integrados à estrutura editorial, artística e aos nossos canais.", ctaLabel:"", ctaUrl:"", mediaId:null, position:4, enabled:true, settings:{footerNote:"FORMATOS COMERCIAIS"} },
  { id:"mock-kit-application", type:"application", theme:"light", eyebrow:"APLICAÇÃO", title:"EXEMPLO DE APLICAÇÃO", subtitle:"", body:"Veja como sua marca pode estar presente de forma natural e estratégica, integrada ao conteúdo e à experiência da audiência.", ctaLabel:"", ctaUrl:"", mediaId:"mock-media-dj-stay-wide", position:5, enabled:true, settings:{mediaFit:"cover",mediaPosition:"center",footerNote:"APLICAÇÃO COMERCIAL"} },
  { id:"mock-kit-contact", type:"contact", theme:"light", eyebrow:"CONTATO", title:"VAMOS CONSTRUIR ALGO GRANDE JUNTOS?", subtitle:"", body:"Sua marca ou projeto merece estratégia, repertório e oportunidades. Fale com nossa equipe e descubra as melhores soluções para o seu objetivo.", ctaLabel:"ENTRE EM CONTATO", ctaUrl:"/contato", mediaId:"mock-media-banner", position:6, enabled:true, settings:{nextStepsTitle:"PRÓXIMOS PASSOS",nextStepsBody:"Seguimos evoluindo para oferecer mais conteúdo, formatos e oportunidades. A cobertura de eventos, ativações com artistas e projetos especiais fazem parte da nossa expansão.",closingSlogan:"MÚSICA QUE APROXIMA PESSOAS.",footerNote:"LANDER RECORDS · 2026"} },
];

export type MockMediaKitItem = {
  id:string; sectionId:string; kind:string; title:string; subtitle:string; body:string; label:string;
  value:string; url:string; sourceKey:string; icon:string; mediaId:string|null; position:number; enabled:boolean;
  metadata:Record<string,unknown>;
};

const item=(value:MockMediaKitItem)=>value;

export const mockMediaKitItems: MockMediaKitItem[] = [
  item({id:"mock-cover-device",sectionId:"mock-kit-cover",kind:"card",title:"Site Lander Records",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"external",mediaId:"mock-media-banner",position:0,enabled:true,metadata:{}}),
  item({id:"mock-cover-artists",sectionId:"mock-kit-cover",kind:"metric",title:"ARTISTAS",subtitle:"talentos em desenvolvimento",body:"",label:"",value:"",url:"",sourceKey:"artists_total",icon:"artists",mediaId:null,position:1,enabled:true,metadata:{}}),
  item({id:"mock-cover-releases",sectionId:"mock-kit-cover",kind:"metric",title:"LANÇAMENTOS",subtitle:"catálogo ativo",body:"",label:"",value:"",url:"",sourceKey:"releases_total",icon:"media",mediaId:null,position:2,enabled:true,metadata:{}}),
  item({id:"mock-cover-content",sectionId:"mock-kit-cover",kind:"metric",title:"CONTEÚDOS",subtitle:"publicações editoriais",body:"",label:"",value:"",url:"",sourceKey:"posts_total",icon:"document",mediaId:null,position:3,enabled:true,metadata:{}}),
  item({id:"mock-cover-community",sectionId:"mock-kit-cover",kind:"metric",title:"COMUNIDADE",subtitle:"ecossistema em crescimento",body:"",label:"",value:"185K+",url:"",sourceKey:"static",icon:"users",mediaId:null,position:4,enabled:true,metadata:{}}),

  item({id:"mock-about-reach",sectionId:"mock-kit-about",kind:"metric",title:"ALCANCE MENSAL",subtitle:"canais e conteúdo",body:"",label:"",value:"1.8M+",url:"",sourceKey:"static",icon:"activity",mediaId:null,position:1,enabled:true,metadata:{}}),
  item({id:"mock-about-community",sectionId:"mock-kit-about",kind:"metric",title:"COMUNIDADE",subtitle:"perfis qualificados",body:"",label:"",value:"185K+",url:"",sourceKey:"static",icon:"users",mediaId:null,position:2,enabled:true,metadata:{}}),
  item({id:"mock-about-social",sectionId:"mock-kit-about",kind:"metric",title:"REDES SOCIAIS",subtitle:"alcance orgânico",body:"",label:"",value:"640K+",url:"",sourceKey:"static",icon:"smartphone",mediaId:null,position:3,enabled:true,metadata:{}}),
  item({id:"mock-about-video",sectionId:"mock-kit-about",kind:"metric",title:"VÍDEO",subtitle:"visualizações",body:"",label:"",value:"420K+",url:"",sourceKey:"static",icon:"media",mediaId:null,position:4,enabled:true,metadata:{}}),
  item({id:"mock-about-content",sectionId:"mock-kit-about",kind:"metric",title:"PUBLICAÇÕES",subtitle:"conteúdo ativo",body:"",label:"",value:"34",url:"",sourceKey:"static",icon:"document",mediaId:null,position:5,enabled:true,metadata:{}}),

  item({id:"mock-gender-women",sectionId:"mock-kit-audience",kind:"audience",title:"Mulheres",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:1,enabled:true,metadata:{group:"gender",percentage:54}}),
  item({id:"mock-gender-men",sectionId:"mock-kit-audience",kind:"audience",title:"Homens",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:2,enabled:true,metadata:{group:"gender",percentage:46}}),
  item({id:"mock-age-13",sectionId:"mock-kit-audience",kind:"audience",title:"13–17",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:3,enabled:true,metadata:{group:"age",percentage:8}}),
  item({id:"mock-age-18",sectionId:"mock-kit-audience",kind:"audience",title:"18–24",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:4,enabled:true,metadata:{group:"age",percentage:31}}),
  item({id:"mock-age-25",sectionId:"mock-kit-audience",kind:"audience",title:"25–34",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:5,enabled:true,metadata:{group:"age",percentage:38}}),
  item({id:"mock-age-35",sectionId:"mock-kit-audience",kind:"audience",title:"35–44",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:6,enabled:true,metadata:{group:"age",percentage:15}}),
  item({id:"mock-age-45",sectionId:"mock-kit-audience",kind:"audience",title:"45+",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:7,enabled:true,metadata:{group:"age",percentage:8}}),
  item({id:"mock-interest-music",sectionId:"mock-kit-audience",kind:"audience",title:"Música e lançamentos",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"media",mediaId:null,position:8,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-interest-culture",sectionId:"mock-kit-audience",kind:"audience",title:"Entretenimento e cultura",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"activity",mediaId:null,position:9,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-interest-business",sectionId:"mock-kit-audience",kind:"audience",title:"Negócios e empreendedorismo",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"chart",mediaId:null,position:10,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-interest-events",sectionId:"mock-kit-audience",kind:"audience",title:"Eventos e oportunidades",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"calendar",mediaId:null,position:11,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-interest-career",sectionId:"mock-kit-audience",kind:"audience",title:"Carreira artística e profissional",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"artists",mediaId:null,position:12,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-interest-trends",sectionId:"mock-kit-audience",kind:"audience",title:"Conteúdo e tendências",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"document",mediaId:null,position:13,enabled:true,metadata:{group:"interest"}}),
  item({id:"mock-city-sp",sectionId:"mock-kit-audience",kind:"audience",title:"São Paulo",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:14,enabled:true,metadata:{group:"city",percentage:32}}),
  item({id:"mock-city-rj",sectionId:"mock-kit-audience",kind:"audience",title:"Rio de Janeiro",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:15,enabled:true,metadata:{group:"city",percentage:21}}),
  item({id:"mock-city-bh",sectionId:"mock-kit-audience",kind:"audience",title:"Belo Horizonte",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:16,enabled:true,metadata:{group:"city",percentage:14}}),
  item({id:"mock-city-gv",sectionId:"mock-kit-audience",kind:"audience",title:"Governador Valadares",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:17,enabled:true,metadata:{group:"city",percentage:11}}),
  item({id:"mock-city-brasilia",sectionId:"mock-kit-audience",kind:"audience",title:"Brasília",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:18,enabled:true,metadata:{group:"city",percentage:8}}),
  item({id:"mock-city-other",sectionId:"mock-kit-audience",kind:"audience",title:"Outras",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:19,enabled:true,metadata:{group:"city",percentage:14}}),

  item({id:"mock-ad-banner",sectionId:"mock-kit-partnerships",kind:"card",title:"Banner topo",subtitle:"",body:"Exibição em área nobre, com alta visibilidade para campanhas e lançamentos.",label:"",value:"",url:"",sourceKey:"static",icon:"media",mediaId:"mock-media-banner",position:1,enabled:true,metadata:{}}),
  item({id:"mock-ad-side",sectionId:"mock-kit-partnerships",kind:"card",title:"Publicidade lateral",subtitle:"",body:"Inserção contextual em páginas editoriais e áreas de navegação.",label:"",value:"",url:"",sourceKey:"static",icon:"pages",mediaId:"mock-media-news-studio",position:2,enabled:true,metadata:{}}),
  item({id:"mock-ad-here",sectionId:"mock-kit-partnerships",kind:"card",title:"Anuncie aqui",subtitle:"",body:"Área dedicada com chamada direta para anunciantes e parceiros.",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:3,enabled:true,metadata:{}}),
  item({id:"mock-ad-content",sectionId:"mock-kit-partnerships",kind:"card",title:"Página de conteúdo",subtitle:"",body:"Conteúdo de marca integrado ao fluxo editorial e à experiência do público.",label:"",value:"",url:"",sourceKey:"static",icon:"document",mediaId:"mock-media-dj-stay-wide",position:4,enabled:true,metadata:{}}),
  item({id:"mock-ad-news",sectionId:"mock-kit-partnerships",kind:"card",title:"Newsletter",subtitle:"",body:"Presença de marca em comunicação direta para uma audiência segmentada.",label:"",value:"",url:"",sourceKey:"static",icon:"mail",mediaId:"mock-media-banner",position:5,enabled:true,metadata:{}}),
  item({id:"mock-ad-social",sectionId:"mock-kit-partnerships",kind:"card",title:"Redes sociais",subtitle:"",body:"Divulgação nos canais oficiais com formatos adaptados para cada plataforma.",label:"",value:"",url:"",sourceKey:"static",icon:"smartphone",mediaId:"mock-media-dj-stay-card",position:6,enabled:true,metadata:{}}),

  item({id:"mock-app-top",sectionId:"mock-kit-application",kind:"item",title:"Banner Topo",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:1,enabled:true,metadata:{}}),
  item({id:"mock-app-side",sectionId:"mock-kit-application",kind:"item",title:"Publicidade Lateral",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:2,enabled:true,metadata:{}}),
  item({id:"mock-app-cta",sectionId:"mock-kit-application",kind:"item",title:"Anuncie Aqui",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:3,enabled:true,metadata:{}}),
  item({id:"mock-app-content",sectionId:"mock-kit-application",kind:"item",title:"Conteúdo Editorial",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:4,enabled:true,metadata:{}}),

  item({id:"mock-contact-email",sectionId:"mock-kit-contact",kind:"contact",title:"E-mail",subtitle:"",body:"",label:"E-mail",value:"",url:"",sourceKey:"contact_email",icon:"mail",mediaId:null,position:1,enabled:true,metadata:{}}),
  item({id:"mock-contact-phone",sectionId:"mock-kit-contact",kind:"contact",title:"Telefone",subtitle:"",body:"",label:"Telefone",value:"",url:"",sourceKey:"contact_phone",icon:"smartphone",mediaId:null,position:2,enabled:true,metadata:{}}),
  item({id:"mock-contact-instagram",sectionId:"mock-kit-contact",kind:"contact",title:"Instagram",subtitle:"",body:"",label:"Instagram",value:"",url:"",sourceKey:"instagram",icon:"activity",mediaId:null,position:3,enabled:true,metadata:{}}),
  item({id:"mock-contact-website",sectionId:"mock-kit-contact",kind:"contact",title:"Website",subtitle:"",body:"",label:"Website",value:"",url:"",sourceKey:"website",icon:"external",mediaId:null,position:4,enabled:true,metadata:{}}),
];

export const mockMediaKitArtists = [
  {name:"DJ Stay",eyebrow:"DJ · PRODUTOR",shortBio:"Funk, bass e performance de alta energia."},
  {name:"Luna Prado",eyebrow:"POP · R&B",shortBio:"Pop contemporâneo com identidade vocal e estética sofisticada."},
  {name:"Caio Nox",eyebrow:"TRAP · PRODUTOR",shortBio:"Trap e eletrônico com design sonoro cinematográfico."},
  {name:"Maya Luz",eyebrow:"POP · NOVA MPB",shortBio:"Pop brasileiro com repertório autoral e narrativa solar."},
];

export const mockMediaKitReleases = [
  {title:"Neon After Hours",artistName:"DJ Stay",releaseType:"Single",releaseDate:"2026-09-18"},
  {title:"Pulso",artistName:"Maya Luz",releaseType:"Single",releaseDate:"2026-09-11"},
  {title:"Late Check-Out",artistName:"Luna Prado",releaseType:"Single",releaseDate:"2026-08-29"},
  {title:"Sombra Neon",artistName:"Caio Nox",releaseType:"Single",releaseDate:"2026-08-15"},
];
