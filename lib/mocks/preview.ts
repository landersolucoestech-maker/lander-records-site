import { mockDashboardData, mockAdminUsers, mockAuditRows } from "./admin";
import { mockArtistCategories, mockArtistSummaries, mockArtists } from "./artists";
import { mockIntegrationSettings, mockSocialMetrics, mockSpotifyFeed } from "./integrations";
import { mockMedia } from "./media";
import { mockPostCategories, mockPostRecords } from "./posts";
import { mockNavigation, mockPageContent, mockPages, mockPageSections, mockSiteSettings } from "./site";

export const mockPreviewModules = [
  ["dashboard","Dashboard"],["home","Home"],["artists","Artistas"],["posts","Conteúdos"],
  ["pages","Páginas"],["media","Mídias"],["categories","Categorias"],["navigation","Navegação"],
  ["header","Cabeçalho"],["settings","Configurações"],["integrations","Integrações"],
  ["users","Usuários"],["audit","Auditoria"],
] as const;

export const mockPreviewRows: Record<string, Array<[string,string,string]>> = {
  media: mockMedia.slice(0,8).map((item)=>[item.originalFilename,item.status==="active"?"Ativo":"Arquivado",`${item.width||"—"} × ${item.height||"—"}`]),
  categories: [
    ...mockArtistCategories.map((item)=>[item.name,item.active?"Ativa":"Inativa","Artistas"] as [string,string,string]),
    ...mockPostCategories.map((item)=>[item.name,item.active?"Ativa":"Inativa","Conteúdos"] as [string,string,string]),
  ].slice(0,10),
  users: mockAdminUsers.map((item)=>[item.name,item.isActive?"Ativo":"Inativo",item.role] as [string,string,string]),
  audit: mockAuditRows.slice(0,10).map(({log})=>[log.action,"Sucesso",log.entityType] as [string,string,string]),
};

export const mockPreviewArtists = mockArtistSummaries;
export const mockPreviewPosts = mockPostRecords;

const pageContracts: Record<string,{classification:"Estrutural"|"Institucional"|"Módulo de domínio"|"Funcional"|"Legal";scope:string;route:string}> = {
  home:{classification:"Estrutural",scope:"Composição gerenciada no módulo Home",route:"/"},
  about:{classification:"Institucional",scope:"Conteúdo estruturado por seções",route:"/sobre-nos"},
  artists:{classification:"Módulo de domínio",scope:"Apresentação; catálogo no módulo Artistas",route:"/artistas"},
  news:{classification:"Módulo de domínio",scope:"Apresentação; publicações no módulo Conteúdos",route:"/noticias"},
  contact:{classification:"Funcional",scope:"Conteúdo editorial e formulário",route:"/contato"},
  privacy:{classification:"Legal",scope:"Documento público de privacidade",route:"/politica-de-privacidade"},
  terms:{classification:"Legal",scope:"Documento público de termos",route:"/termos-e-condicoes"},
};

export const mockPreviewPages = mockPages.map((page)=>{
  const contract=pageContracts[page.key];
  const sections=mockPageSections.filter((item)=>item.pageId===page.id);
  const configuredRoute=page.slug?`/${page.slug}`:"/";
  return {
    id:page.id,key:page.key,title:page.title,configuredRoute,publicRoute:contract?.route||null,
    classification:contract?.classification||"Estrutura administrativa" as const,scope:contract?.scope||"Estrutura administrativa",
    routeWarning:Boolean(contract&&configuredRoute!==contract.route),enabled:page.enabled,seoConfigured:Boolean(page.seoTitle&&page.seoDescription),
    sectionCount:sections.length,enabledSectionCount:sections.filter((item)=>item.enabled).length,
    updatedAt:new Intl.DateTimeFormat("pt-BR").format(page.updatedAt),
    sections:sections.map(({id,sectionKey,type,position,enabled,title,subtitle})=>({id,sectionKey,type,position,enabled,title,subtitle})),
  };
});

export const mockPreviewNavigation = mockNavigation.map((item)=>({
  id:item.id,menuKey:item.menuKey,parentId:item.parentId,parentLabel:null,label:item.label,url:item.url,linkType:item.linkType,
  position:item.position,enabled:item.enabled,newTab:item.newTab,depth:0,childCount:0,issue:null,safeDestination:true,
}));

export const mockPreviewHeader = {
  brandName:mockSiteSettings.brandName,ctaLabel:"Quero Contratar",ctaUrl:"/contato",globalLogoUrl:"/lander-records-brand.svg",
  primaryItems:mockPreviewNavigation.filter((item)=>item.menuKey==="primary"&&!item.parentId&&item.enabled).map(({id,label,newTab,url})=>({id,label,newTab,url})),
  publicLogoSrc:"/lander-records-brand.svg",
};

export function mockPreviewHomeSections(){
  const content=mockPageContent("home");
  const byKey=(key:string)=>content?.sections.find((section)=>section.sectionKey===key);
  const hero=byKey("hero"),intro=byKey("intro"),shortcuts=byKey("shortcuts"),artists=byKey("artists"),releases=byKey("releases"),advertising=byKey("advertise_banner"),news=byKey("news");
  return [
    {key:"hero",title:hero?.title||"Hero",description:"Abertura institucional da Home.",classification:"editable",badge:"Editável",detail:"Conteúdo completo de demonstração",actionHref:"/admin/pages",actionLabel:"Editar",primaryText:hero?.title,secondaryText:hero?.subtitle},
    {key:"intro",title:intro?.title||"Sobre Nós",description:"Resumo institucional e números sociais.",classification:"editable",badge:"Editável",detail:"Conteúdo completo de demonstração",actionHref:"/admin/pages",actionLabel:"Editar",primaryText:intro?.title},
    {key:"social",title:"Redes Sociais (Instagram e YouTube)",description:"Métricas sociais integradas.",classification:"configurable",badge:"Automático / Configurável",detail:"Fonte demonstrativa: Soundcharts",actionHref:"/admin/settings/lander-records",actionLabel:"Configurar",itemLabels:[mockSocialMetrics["instagram:followers"].toLocaleString("pt-BR"),mockSocialMetrics["youtube:subscribers"].toLocaleString("pt-BR")]},
    {key:"shortcuts",title:shortcuts?.title||"Nossas Ações",description:"Atalhos editoriais da Home.",classification:"editable",badge:"Editável",detail:`${shortcuts?.items.length||0} atalhos configurados`,actionHref:"/admin/pages",actionLabel:"Editar",itemLabels:shortcuts?.items.map((item)=>item.label||item.title)},
    {key:"artists",title:artists?.title||"Artistas em destaque",description:"Casting destacado na Home.",classification:"configurable",badge:"CMS + Artistas",detail:`${mockArtists.length} artistas no cenário`,actionHref:"/admin/pages",actionLabel:"Editar seção",secondaryActionHref:"/admin/artists",secondaryActionLabel:"Gerenciar artistas",imageUrls:mockArtists.slice(0,5).map((item)=>item.cardImage)},
    {key:"releases",title:releases?.title||"Últimos Lançamentos",description:"Feed da playlist Spotify.",classification:"configurable",badge:"CMS + Spotify",detail:`${mockSpotifyFeed.releases.length} lançamentos sincronizados`,actionHref:"/admin/pages",actionLabel:"Editar seção",secondaryActionHref:"/admin/settings/lander-records",secondaryActionLabel:"Configurar fonte",imageUrls:mockSpotifyFeed.releases.map((item)=>item.coverUrl)},
    {key:"advertising",title:"Anuncie com a Lander",description:"Banner comercial.",classification:"editable",badge:"Editável",detail:"Banner configurado",actionHref:"/admin/pages",actionLabel:"Editar",imageUrls:advertising?.items[0]?.mediaUrl?[advertising.items[0].mediaUrl]:[]},
    {key:"news",title:news?.title||"Últimas Notícias",description:"Conteúdo editorial destacado.",classification:"configurable",badge:"CMS + Conteúdos",detail:`${mockPostRecords.length} conteúdos no cenário`,actionHref:"/admin/pages",actionLabel:"Editar seção",secondaryActionHref:"/admin/posts",secondaryActionLabel:"Gerenciar conteúdos",imageUrls:mockPostRecords.slice(0,3).map((item)=>item.coverImage)},
  ];
}

export const mockPreviewSettings = {
  brandName:mockSiteSettings.brandName,email:mockSiteSettings.contactEmail,
  spotify:`Conectado · ${mockIntegrationSettings.spotifyPlaylistId}`,
  soundcharts:`Resolvido · ${mockIntegrationSettings.soundchartsArtistUuid}`,
};

export const mockPreviewDashboard=mockDashboardData;
