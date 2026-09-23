import { mockArtists, mockArtistSummaries } from "./artists";
import { mockPosts } from "./posts";

export const mockDashboardData = {
  analytics:{
    visitors:28640, views:87320, engagementRate:6.7, conversions:486,
    previousVisitorsChange:18.4, previousViewsChange:21.8, previousEngagementChange:1.4, previousConversionsChange:26.9,
    series:[
      {label:"25 ago",visitors:980,views:2160},{label:"28 ago",visitors:1120,views:2480},{label:"31 ago",visitors:1050,views:2310},
      {label:"3 set",visitors:1380,views:2890},{label:"6 set",visitors:1660,views:3440},{label:"9 set",visitors:1520,views:3290},
      {label:"12 set",visitors:1740,views:3650},{label:"15 set",visitors:1880,views:4020},{label:"18 set",visitors:1710,views:3780},
      {label:"21 set",visitors:1960,views:4310},{label:"23 set",visitors:1820,views:4080},
    ],
    devices:[
      {label:"Desktop" as const,count:13244,percentage:46.2},
      {label:"Mobile" as const,count:13861,percentage:48.4},
      {label:"Tablet" as const,count:1535,percentage:5.4},
    ],
  },
  recentActivity:[
    {id:"mock-audit-a1",label:"Nova notícia publicada",meta:"Notícia · 23/09/2026 11:42",when:"há 2h",icon:"document" as const,accent:"red" as const},
    {id:"mock-audit-a2",label:"Artista atualizado",meta:"Artista · 23/09/2026 10:15",when:"há 4h",icon:"artists" as const,accent:"red" as const},
    {id:"mock-audit-a3",label:"Mídia enviada",meta:"Mídia · 22/09/2026 18:21",when:"há 20h",icon:"image" as const,accent:"neutral" as const},
    {id:"mock-audit-a4",label:"Sincronização de integrações executada",meta:"Integrações · 22/09/2026 17:50",when:"há 21h",icon:"activity" as const,accent:"neutral" as const},
    {id:"mock-audit-a5",label:"Conteúdo da Home atualizado",meta:"Página · 22/09/2026 16:05",when:"há 23h",icon:"pages" as const,accent:"neutral" as const},
    {id:"mock-audit-a6",label:"Usuário administrativo atualizado",meta:"Usuário · 21/09/2026 14:18",when:"há 2 dias",icon:"users" as const,accent:"neutral" as const},
  ],
  recentPublications:[
    {id:mockPosts[0].id,title:mockPosts[0].title,type:"Notícia",status:"published" as const,updatedAt:"21/09/2026",thumbnail:mockPosts[0].coverImage,href:"/admin/posts"},
    {id:mockArtists[0].id,title:mockArtists[0].name,type:"Artista",status:"published" as const,updatedAt:"20/09/2026",thumbnail:mockArtists[0].cardImage,href:"/admin/artists"},
    {id:mockPosts[1].id,title:mockPosts[1].title,type:"Notícia",status:"published" as const,updatedAt:"19/09/2026",thumbnail:mockPosts[1].coverImage,href:"/admin/posts"},
    {id:"mock-page-home",title:"Início",type:"Página",status:"published" as const,updatedAt:"18/09/2026",thumbnail:"/lander-records-logo.webp",href:"/admin/pages"},
    {id:mockArtistSummaries[1].id,title:mockArtistSummaries[1].name,type:"Artista",status:"published" as const,updatedAt:"17/09/2026",thumbnail:mockArtistSummaries[1].cardImage,href:"/admin/artists"},
  ],
};

export const mockAdminUsers = [
  {id:"mock-user-owner",name:"Lander Admin",email:"admin@landerrecords.com",role:"owner" as const,isActive:true},
  {id:"mock-user-content",name:"Marina Costa",email:"marina@landerrecords.com",role:"admin" as const,isActive:true},
  {id:"mock-user-aandr",name:"Rafael Lima",email:"rafael@landerrecords.com",role:"editor" as const,isActive:true},
  {id:"mock-user-social",name:"Bianca Melo",email:"bianca@landerrecords.com",role:"editor" as const,isActive:true},
  {id:"mock-user-view",name:"Paulo Freitas",email:"paulo@landerrecords.com",role:"viewer" as const,isActive:false},
];

const actions = ["post.published","artist.updated","media.uploaded","integration.sync.requested","page_section.updated","site_settings.identity_updated","admin_user.updated","artist.published","post.updated","navigation.updated","social_link.updated","auth.login_success"];
export const mockAuditRows = actions.map((action,index)=>({
  log:{
    id:`mock-audit-${index+1}`,
    action,
    entityType: action.startsWith("post")?"post":action.startsWith("artist")?"artist":action.startsWith("media")?"media_asset":action.startsWith("integration")?"integration_settings":action.startsWith("page")?"page_section":action.startsWith("site")?"site_settings":action.startsWith("admin")?"admin_user":action.startsWith("navigation")?"navigation_item":action.startsWith("social")?"social_link":"admin_user",
    entityId:`mock-entity-${index+1}`,
    metadata:{source:"preview",channel:index%2?"admin":"system",summary:["Publicação concluída","Conteúdo revisado","Mídia validada","Sincronização atualizada"][index%4]},
    createdAt:new Date(Date.UTC(2026,8,23-Math.floor(index/4),14-(index%4)*2,10)),
  },
  actorName:index%3===0?"Marina Costa":index%3===1?"Rafael Lima":"Sistema",
  actorEmail:index%3===2?"":index%3===0?"marina@landerrecords.com":"rafael@landerrecords.com",
}));


export const mockAuditSummary = {
  missingCard: 2,
  missingHero: 1,
  draftPosts: 1,
};

export const mockNotifications = mockAuditRows
  .filter(({ log }) => ["artist", "post", "media_asset"].includes(log.entityType))
  .slice(0, 12)
  .map(({ log, actorName }) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
    actorName: actorName || "Sistema",
  }));
