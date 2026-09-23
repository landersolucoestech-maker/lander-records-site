export const mockMediaKitSettings = {
  id: "default",
  documentTitle: "Mídia Kit",
  edition: "2026",
  footerWebsite: "landerrecords.com",
  showPageNumbers: true,
};

export const mockMediaKitSections = [
  { id:"mock-kit-cover", type:"cover", theme:"dark", eyebrow:"LANDER RECORDS · 2026", title:"CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES.", subtitle:"Estrutura 360° para desenvolvimento artístico, conteúdo e negócios.", body:"Música com estratégia, identidade e capacidade de execução.", ctaLabel:"Conheça a Lander", ctaUrl:"/sobre-nos", mediaId:"mock-media-dj-stay-wide", position:1, enabled:true, settings:{mediaFit:"cover",mediaPosition:"center",coverSideNote:"O SOM DE NOVAS POSSIBILIDADES.",mockupLabel:"MÚSICA MOVE PESSOAS."} },
  { id:"mock-kit-about", type:"editorial", theme:"light", eyebrow:"INSTITUCIONAL", title:"SOBRE A LANDER RECORDS", subtitle:"Gravadora, produtora musical e estrutura de gestão artística 360°.", body:"Conectamos desenvolvimento de carreira, produção, conteúdo, posicionamento, distribuição e oportunidades comerciais em uma operação integrada.", ctaLabel:"", ctaUrl:"", mediaId:"mock-media-banner", position:2, enabled:true, settings:{mediaFit:"cover",mediaPosition:"center",sideTitle:"MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.",sideCaption:"TALENTOS HOJE. GRANDES AMANHÃ.",bannerTitle:"VISIBILIDADE, CREDIBILIDADE E RELEVÂNCIA PARA ARTISTAS E MARCAS.",bannerNote:"MÚSICA · CULTURA · OPORTUNIDADES"} },
  { id:"mock-kit-audience", type:"audience", theme:"light", eyebrow:"AUDIÊNCIA", title:"NOSSA AUDIÊNCIA", subtitle:"Perfil consolidado das comunidades alcançadas pelo ecossistema.", body:"Dados demonstrativos para visualizar a apresentação completa no ambiente de preview.", ctaLabel:"", ctaUrl:"", mediaId:null, position:3, enabled:true, settings:{dataNote:"Cenário de demonstração para validação visual do Mídia Kit."} },
  { id:"mock-kit-partnerships", type:"cards", theme:"light", eyebrow:"COMERCIAL", title:"FORMATOS DE PARCERIA", subtitle:"Soluções para marcas que desejam se conectar com música, cultura e artistas.", body:"", ctaLabel:"", ctaUrl:"", mediaId:null, position:4, enabled:true, settings:{footerNote:"PARCERIAS QUE AMPLIFICAM"} },
  { id:"mock-kit-artists", type:"artists", theme:"light", eyebrow:"CASTING", title:"ARTISTAS & DESTAQUES", subtitle:"Talentos, lançamentos e possibilidades de exposição reunidos em uma página.", body:"", ctaLabel:"", ctaUrl:"", mediaId:"mock-media-dj-stay-card", position:5, enabled:true, settings:{featuredLabel:"ARTISTA EM DESTAQUE",quote:"Mais que uma gravadora, uma parceira de verdade.",quoteAuthor:"Parceiro comercial"} },
  { id:"mock-kit-contact", type:"contact", theme:"dark", eyebrow:"CONTATO", title:"VAMOS CONVERSAR", subtitle:"Booking, marcas, conteúdo, lançamentos e novos projetos.", body:"Conte o contexto da oportunidade e conectaremos você à pessoa certa da equipe.", ctaLabel:"FALE COM A LANDER", ctaUrl:"/contato", mediaId:"mock-media-banner", position:6, enabled:true, settings:{nextStepsTitle:"PRÓXIMOS PASSOS",nextStepsBody:"Briefing, alinhamento de objetivos, proposta e plano de execução.",closingSlogan:"MÚSICA QUE APROXIMA PESSOAS."} },
] as const;

const metric = (id:string,sectionId:string,title:string,sourceKey:string,position:number,icon:string,subtitle="") => ({
  id,sectionId,kind:"metric",title,subtitle,body:"",label:title,value:"",url:"",sourceKey,icon,mediaId:null,position,enabled:true,metadata:{},
});

export const mockMediaKitItems = [
  metric("mock-kit-item-artists","mock-kit-cover","ARTISTAS","artists_total",1,"artists","talentos em desenvolvimento"),
  metric("mock-kit-item-releases","mock-kit-cover","LANÇAMENTOS","releases_total",2,"media","catálogo em expansão"),
  metric("mock-kit-item-posts","mock-kit-cover","CONTEÚDOS","posts_total",3,"document","portal editorial ativo"),
  metric("mock-kit-item-media","mock-kit-cover","ASSETS","media_total",4,"image","biblioteca centralizada"),

  metric("mock-kit-about-artists","mock-kit-about","ARTISTAS NO CAST","artists_total",1,"artists"),
  metric("mock-kit-about-releases","mock-kit-about","LANÇAMENTOS","releases_total",2,"media"),
  metric("mock-kit-about-posts","mock-kit-about","PUBLICAÇÕES","posts_total",3,"document"),

  {id:"mock-kit-gender-women",sectionId:"mock-kit-audience",kind:"audience",title:"Mulheres",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:1,enabled:true,metadata:{group:"gender",percentage:54}},
  {id:"mock-kit-gender-men",sectionId:"mock-kit-audience",kind:"audience",title:"Homens",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:2,enabled:true,metadata:{group:"gender",percentage:46}},
  {id:"mock-kit-age-18",sectionId:"mock-kit-audience",kind:"audience",title:"18–24",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:3,enabled:true,metadata:{group:"age",percentage:31}},
  {id:"mock-kit-age-25",sectionId:"mock-kit-audience",kind:"audience",title:"25–34",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:4,enabled:true,metadata:{group:"age",percentage:38}},
  {id:"mock-kit-age-35",sectionId:"mock-kit-audience",kind:"audience",title:"35–44",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:5,enabled:true,metadata:{group:"age",percentage:19}},
  {id:"mock-kit-age-45",sectionId:"mock-kit-audience",kind:"audience",title:"45+",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"users",mediaId:null,position:6,enabled:true,metadata:{group:"age",percentage:12}},
  {id:"mock-kit-interest-music",sectionId:"mock-kit-audience",kind:"audience",title:"Música e streaming",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"media",mediaId:null,position:7,enabled:true,metadata:{group:"interest",percentage:84}},
  {id:"mock-kit-interest-events",sectionId:"mock-kit-audience",kind:"audience",title:"Shows e festivais",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"calendar",mediaId:null,position:8,enabled:true,metadata:{group:"interest",percentage:71}},
  {id:"mock-kit-interest-fashion",sectionId:"mock-kit-audience",kind:"audience",title:"Moda e comportamento",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:9,enabled:true,metadata:{group:"interest",percentage:58}},
  {id:"mock-kit-city-sp",sectionId:"mock-kit-audience",kind:"audience",title:"São Paulo",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:10,enabled:true,metadata:{group:"city",percentage:32}},
  {id:"mock-kit-city-rj",sectionId:"mock-kit-audience",kind:"audience",title:"Rio de Janeiro",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:11,enabled:true,metadata:{group:"city",percentage:21}},
  {id:"mock-kit-city-bh",sectionId:"mock-kit-audience",kind:"audience",title:"Belo Horizonte",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:12,enabled:true,metadata:{group:"city",percentage:14}},
  {id:"mock-kit-city-gv",sectionId:"mock-kit-audience",kind:"audience",title:"Governador Valadares",subtitle:"",body:"",label:"",value:"",url:"",sourceKey:"static",icon:"target",mediaId:null,position:13,enabled:true,metadata:{group:"city",percentage:11}},

  {id:"mock-kit-part-sponsor",sectionId:"mock-kit-partnerships",kind:"card",title:"Patrocínio",subtitle:"",body:"Presença de marca em projetos, lançamentos e iniciativas especiais.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"target",mediaId:"mock-media-banner",position:1,enabled:true,metadata:{}},
  {id:"mock-kit-part-editorial",sectionId:"mock-kit-partnerships",kind:"card",title:"Publieditorial",subtitle:"",body:"Conteúdo editorial integrado ao ecossistema da Lander Records.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"document",mediaId:"mock-media-news-studio",position:2,enabled:true,metadata:{}},
  {id:"mock-kit-part-digital",sectionId:"mock-kit-partnerships",kind:"card",title:"Campanhas digitais",subtitle:"",body:"Conteúdo multiplataforma pensado para música, cultura e comunidade.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"activity",mediaId:"mock-media-dj-stay-wide",position:3,enabled:true,metadata:{}},
  {id:"mock-kit-part-social",sectionId:"mock-kit-partnerships",kind:"card",title:"Redes sociais",subtitle:"",body:"Cocriação, mídia, menções e ativações nos canais oficiais.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"smartphone",mediaId:null,position:4,enabled:true,metadata:{}},
  {id:"mock-kit-part-events",sectionId:"mock-kit-partnerships",kind:"card",title:"Eventos",subtitle:"",body:"Shows, showcases, listening parties e experiências de marca.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"calendar",mediaId:null,position:5,enabled:true,metadata:{}},
  {id:"mock-kit-part-newsletter",sectionId:"mock-kit-partnerships",kind:"card",title:"Newsletter & conteúdo",subtitle:"",body:"Distribuição editorial para públicos segmentados.",label:"",value:"",url:"/contato",sourceKey:"static",icon:"mail",mediaId:null,position:6,enabled:true,metadata:{}},

  {id:"mock-kit-opp-brand",sectionId:"mock-kit-artists",kind:"item",title:"Sua marca no projeto",subtitle:"",body:"Integração contextual em lançamentos e conteúdo.",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:1,enabled:true,metadata:{}},
  {id:"mock-kit-opp-social",sectionId:"mock-kit-artists",kind:"item",title:"Citação em redes sociais",subtitle:"",body:"Ativações em canais oficiais e perfis dos artistas.",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:2,enabled:true,metadata:{}},
  {id:"mock-kit-opp-shows",sectionId:"mock-kit-artists",kind:"item",title:"Branding em shows",subtitle:"",body:"Presença de marca em experiências e apresentações.",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:3,enabled:true,metadata:{}},
  {id:"mock-kit-opp-fans",sectionId:"mock-kit-artists",kind:"item",title:"Ações com fãs",subtitle:"",body:"Experiências, conteúdos exclusivos e ativações.",label:"",value:"",url:"",sourceKey:"static",icon:"plus",mediaId:null,position:4,enabled:true,metadata:{}},

  {id:"mock-kit-contact-email",sectionId:"mock-kit-contact",kind:"contact",title:"E-mail",subtitle:"",body:"",label:"E-mail",value:"",url:"",sourceKey:"contact_email",icon:"mail",mediaId:null,position:1,enabled:true,metadata:{}},
  {id:"mock-kit-contact-phone",sectionId:"mock-kit-contact",kind:"contact",title:"Telefone",subtitle:"",body:"",label:"Telefone",value:"",url:"",sourceKey:"contact_phone",icon:"smartphone",mediaId:null,position:2,enabled:true,metadata:{}},
  {id:"mock-kit-contact-location",sectionId:"mock-kit-contact",kind:"contact",title:"Localização",subtitle:"",body:"",label:"Localização",value:"",url:"",sourceKey:"location",icon:"target",mediaId:null,position:3,enabled:true,metadata:{}},
  {id:"mock-kit-contact-instagram",sectionId:"mock-kit-contact",kind:"contact",title:"Instagram",subtitle:"",body:"",label:"Instagram",value:"",url:"",sourceKey:"instagram",icon:"activity",mediaId:null,position:4,enabled:true,metadata:{}},
] as const;

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
