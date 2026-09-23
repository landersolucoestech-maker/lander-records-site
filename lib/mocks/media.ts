export const mockMedia = [
  { id: "mock-media-logo", url: "/lander-records-logo.webp", originalFilename: "lander-records-logo.webp", storageProvider: "local", mimeType: "image/webp", width: 1200, height: 400, byteSize: 182400, altText: "Logotipo Lander Records", status: "active", createdAt: "18/09/2026" },
  { id: "mock-media-brand", url: "/lander-records-brand.svg", originalFilename: "lander-records-brand.svg", storageProvider: "local", mimeType: "image/svg+xml", width: 1600, height: 520, byteSize: 82400, altText: "Marca Lander Records", status: "active", createdAt: "17/09/2026" },
  { id: "mock-media-dj-stay-card", url: "/dj-stay-home-card.webp", originalFilename: "dj-stay-home-card.webp", storageProvider: "local", mimeType: "image/webp", width: 1200, height: 1200, byteSize: 286300, altText: "DJ Stay em retrato promocional", status: "active", createdAt: "16/09/2026" },
  { id: "mock-media-dj-stay-wide", url: "/dj-stay-wide.webp", originalFilename: "dj-stay-wide.webp", storageProvider: "local", mimeType: "image/webp", width: 1920, height: 1080, byteSize: 438100, altText: "DJ Stay em imagem horizontal", status: "active", createdAt: "16/09/2026" },
  { id: "mock-media-banner", url: "/lander-records-anuncie-banner.webp", originalFilename: "lander-records-anuncie-banner.webp", storageProvider: "local", mimeType: "image/webp", width: 1920, height: 640, byteSize: 512700, altText: "Banner comercial Lander Records", status: "active", createdAt: "15/09/2026" },
  { id: "mock-media-luna", url: "/dj-stay-home-card.webp", originalFilename: "luna-prado-portrait.webp", storageProvider: "local", mimeType: "image/webp", width: 1200, height: 1200, byteSize: 264800, altText: "Retrato editorial de Luna Prado", status: "active", createdAt: "14/09/2026" },
  { id: "mock-media-caio", url: "/dj-stay-wide.webp", originalFilename: "caio-nox-live.webp", storageProvider: "local", mimeType: "image/webp", width: 1920, height: 1080, byteSize: 401500, altText: "Caio Nox em apresentação ao vivo", status: "active", createdAt: "13/09/2026" },
  { id: "mock-media-maya", url: "/lander-records-anuncie-banner.webp", originalFilename: "maya-luz-editorial.webp", storageProvider: "local", mimeType: "image/webp", width: 1600, height: 900, byteSize: 355200, altText: "Maya Luz em ensaio editorial", status: "active", createdAt: "12/09/2026" },
  { id: "mock-media-release-neon", url: "/dj-stay-home-card.webp", originalFilename: "neon-after-hours-cover.webp", storageProvider: "local", mimeType: "image/webp", width: 1400, height: 1400, byteSize: 312400, altText: "Capa do lançamento Neon After Hours", status: "active", createdAt: "11/09/2026" },
  { id: "mock-media-release-pulso", url: "/lander-records-anuncie-banner.webp", originalFilename: "pulso-cover.webp", storageProvider: "local", mimeType: "image/webp", width: 1400, height: 1400, byteSize: 298900, altText: "Capa do lançamento Pulso", status: "active", createdAt: "10/09/2026" },
  { id: "mock-media-news-studio", url: "/dj-stay-wide.webp", originalFilename: "bastidores-studio.webp", storageProvider: "local", mimeType: "image/webp", width: 1800, height: 1000, byteSize: 377100, altText: "Bastidores de sessão em estúdio", status: "active", createdAt: "09/09/2026" },
  { id: "mock-media-event", url: "/lander-records-anuncie-banner.webp", originalFilename: "lander-live-session.webp", storageProvider: "local", mimeType: "image/webp", width: 1800, height: 1000, byteSize: 392700, altText: "Lander Live Session", status: "active", createdAt: "08/09/2026" },
] as const;

export const mockMediaOptions = mockMedia.map(({ id, originalFilename, url, altText, mimeType }) => ({
  id,
  name: originalFilename,
  originalFilename,
  url,
  altText,
  mimeType,
}));
