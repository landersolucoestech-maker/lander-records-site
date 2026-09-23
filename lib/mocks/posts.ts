import type { PublicPost } from "@/modules/posts/types";

export const mockPostCategories = [
  { id: "mock-post-cat-releases", name: "Lançamentos", slug: "lancamentos", position: 1, active: true, showAsFilter: true },
  { id: "mock-post-cat-backstage", name: "Bastidores", slug: "bastidores", position: 2, active: true, showAsFilter: true },
  { id: "mock-post-cat-market", name: "Mercado", slug: "mercado", position: 3, active: true, showAsFilter: true },
  { id: "mock-post-cat-events", name: "Eventos", slug: "eventos", position: 4, active: true, showAsFilter: true },
  { id: "mock-post-cat-editorial", name: "Editorial", slug: "editorial", position: 5, active: true, showAsFilter: true },
] as const;

const categoryBySlug = Object.fromEntries(mockPostCategories.map((item) => [item.slug, item]));

function post(input: {
  id: string; title: string; slug: string; excerpt: string; category: keyof typeof categoryBySlug;
  coverImage: string; authorName?: string; publishedAt: string; contentMarkdown: string;
}): PublicPost {
  const category = categoryBySlug[input.category];
  return {
    id: input.id, title: input.title, slug: input.slug, excerpt: input.excerpt, contentMarkdown: input.contentMarkdown,
    authorName: input.authorName || "Redação Lander Records", status: "published",
    publishedAt: new Date(input.publishedAt), scheduledAt: null,
    seoTitle: input.title, seoDescription: input.excerpt,
    canonicalUrl: `https://landerrecords.com/noticias/${input.slug}`,
    category: { id: category.id, name: category.name, slug: category.slug },
    coverImage: input.coverImage, ogImage: input.coverImage, updatedAt: new Date(input.publishedAt),
  };
}

export const mockPosts: PublicPost[] = [
  post({ id:"mock-post-01", title:"DJ Stay abre nova fase com o single “Neon After Hours”", slug:"dj-stay-neon-after-hours", excerpt:"Faixa inaugura uma sequência de lançamentos que conecta funk, bass e estética noturna.", category:"lancamentos", coverImage:"/dj-stay-home-card.webp", publishedAt:"2026-09-21T15:00:00Z", contentMarkdown:"## Uma nova fase\n\n**Neon After Hours** inaugura o novo ciclo de DJ Stay com produção voltada para pistas e conteúdo audiovisual integrado.\n\nA estratégia inclui lançamento digital, recortes verticais, live session e campanha com creators." }),
  post({ id:"mock-post-02", title:"Como a Lander organiza uma campanha de lançamento em 30 dias", slug:"campanha-lancamento-30-dias", excerpt:"Do planejamento de repertório ao pós-lançamento: um fluxo prático para concentrar conteúdo, mídia e relacionamento.", category:"editorial", coverImage:"/lander-records-anuncie-banner.webp", publishedAt:"2026-09-19T12:00:00Z", contentMarkdown:"## Planejamento integrado\n\nUma campanha forte nasce da combinação entre **música, narrativa, distribuição e repetição**.\n\nNa Lander, cada etapa tem entregáveis, responsáveis e indicadores claros." }),
  post({ id:"mock-post-03", title:"Bastidores: sessão de Luna Prado reúne composição e direção ao vivo", slug:"bastidores-luna-prado-sessao", excerpt:"Uma tarde de estúdio para testar arranjos, repertório e possibilidades para a próxima fase da artista.", category:"bastidores", coverImage:"/dj-stay-wide.webp", publishedAt:"2026-09-17T18:30:00Z", contentMarkdown:"## Dentro do estúdio\n\nA sessão reuniu Luna Prado, produtores e direção artística para desenvolver novas versões, harmonias e caminhos de performance." }),
  post({ id:"mock-post-04", title:"Lander Live Session confirma primeira edição para outubro", slug:"lander-live-session-outubro", excerpt:"Projeto audiovisual reúne artistas do casting em performances curtas, entrevistas e conteúdo de bastidores.", category:"eventos", coverImage:"/lander-records-anuncie-banner.webp", publishedAt:"2026-09-15T10:00:00Z", contentMarkdown:"## Lander Live Session\n\nA primeira edição será gravada em outubro e terá foco em performance, repertório autoral e histórias de processo criativo." }),
  post({ id:"mock-post-05", title:"Cinco sinais que mostram quando um artista está pronto para escalar sua operação", slug:"cinco-sinais-artista-pronto-escalar", excerpt:"Consistência de catálogo, clareza de posicionamento e leitura de dados são alguns dos indicadores.", category:"mercado", coverImage:"/dj-stay-wide.webp", publishedAt:"2026-09-13T14:00:00Z", contentMarkdown:"## Crescer com estrutura\n\nEscala não é apenas aumentar investimento. É conseguir repetir o que funciona com processo, identidade e capacidade de entrega." }),
  post({ id:"mock-post-06", title:"Maya Luz apresenta “Pulso”, segundo single do projeto", slug:"maya-luz-pulso", excerpt:"Canção combina pop, elementos brasileiros e direção visual em tons quentes.", category:"lancamentos", coverImage:"/lander-records-anuncie-banner.webp", publishedAt:"2026-09-11T13:00:00Z", contentMarkdown:"## Pulso\n\nMaya Luz amplia seu universo autoral em uma faixa sobre movimento, presença e recomeço." }),
  post({ id:"mock-post-07", title:"Checklist de lançamento: o que precisa estar pronto antes da distribuição", slug:"checklist-antes-da-distribuicao", excerpt:"Arquivos, créditos, identidade, calendário, assets e links: organize tudo antes de apertar publicar.", category:"editorial", coverImage:"/lander-records-logo.webp", publishedAt:"2026-09-09T11:00:00Z", contentMarkdown:"## Antes de distribuir\n\nOrganização reduz retrabalho e protege o calendário. O checklist precisa contemplar áudio, capa, créditos, metadados e plano de comunicação." }),
  post({ id:"mock-post-08", title:"Caio Nox conclui produção de novo EP com quatro faixas", slug:"caio-nox-novo-ep", excerpt:"Projeto cruza trap e eletrônico e entra agora em etapa de finalização, capa e planejamento de lançamento.", category:"bastidores", coverImage:"/dj-stay-wide.webp", publishedAt:"2026-09-07T16:00:00Z", contentMarkdown:"## Novo EP\n\nAs quatro faixas foram desenvolvidas em um ciclo concentrado de sessões com participação de produtores e compositores convidados." }),
  post({ id:"mock-post-09", title:"O que marcas procuram em projetos musicais para 2027", slug:"marcas-projetos-musicais-2027", excerpt:"Contexto, afinidade de público e capacidade de execução pesam mais do que alcance isolado.", category:"mercado", coverImage:"/lander-records-anuncie-banner.webp", publishedAt:"2026-09-05T09:00:00Z", contentMarkdown:"## Parcerias com contexto\n\nUma boa parceria combina narrativa, público, formato e entrega mensurável. Alcance é apenas uma das variáveis." }),
  post({ id:"mock-post-10", title:"Agenda: showcases, gravações e encontros da Lander em setembro", slug:"agenda-lander-setembro-2026", excerpt:"Confira os principais compromissos do casting e da equipe ao longo do mês.", category:"eventos", coverImage:"/lander-records-logo.webp", publishedAt:"2026-09-02T08:30:00Z", contentMarkdown:"## Setembro\n\nO mês reúne gravações, showcases privados, sessões de conteúdo e encontros com parceiros do mercado." }),
];

export const mockPostRecords = mockPosts.map((item, index) => ({
  id:item.id, title:item.title, slug:item.slug, excerpt:item.excerpt, contentMarkdown:item.contentMarkdown,
  status: index === 8 ? "draft" as const : "published" as const,
  editorStatus: index === 8 ? "draft" as const : "published" as const,
  category:item.category?.name || "Editorial", categoryId:item.category?.id || "",
  authorName:item.authorName, publishedAt:item.publishedAt ? new Intl.DateTimeFormat("pt-BR").format(item.publishedAt) : "",
  publishedAtInput:item.publishedAt?.toISOString() || "",
  coverImage:item.coverImage, coverMediaId:"mock-media-news-studio", authorMediaId:"mock-media-logo", authorImage:"/lander-records-logo.webp",
  links:{ instagram:"https://instagram.com/landerrecords", linkedin:"https://www.linkedin.com/" },
  featuredOnHome:index < 3, homePosition:index + 1, isPubliclyVisible:index !== 8,
  seoTitle:item.seoTitle, seoDescription:item.seoDescription, canonicalUrl:item.canonicalUrl,
  updatedAt:new Intl.DateTimeFormat("pt-BR").format(item.updatedAt),
}));
