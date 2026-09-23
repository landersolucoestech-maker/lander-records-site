export const mockSocialMetrics: Record<string, number> = {
  "instagram:followers": 184600,
  "youtube:subscribers": 72800,
};

export const mockSpotifyFeed = {
  playlistUrl:"https://open.spotify.com/",
  releases:[
    { position:1, playlistId:"mock-playlist", albumId:"mock-album-neon", title:"Neon After Hours", artistName:"DJ Stay", coverUrl:"/dj-stay-home-card.webp", spotifyUrl:"https://open.spotify.com/", releaseDate:"2026-09-18", releaseDatePrecision:"day", playlistAddedAt:new Date("2026-09-18"), fetchedAt:new Date("2026-09-22"), expiresAt:new Date("2026-09-30") },
    { position:2, playlistId:"mock-playlist", albumId:"mock-album-pulso", title:"Pulso", artistName:"Maya Luz", coverUrl:"/lander-records-anuncie-banner.webp", spotifyUrl:"https://open.spotify.com/", releaseDate:"2026-09-11", releaseDatePrecision:"day", playlistAddedAt:new Date("2026-09-11"), fetchedAt:new Date("2026-09-22"), expiresAt:new Date("2026-09-30") },
    { position:3, playlistId:"mock-playlist", albumId:"mock-album-late", title:"Late Check-Out", artistName:"Luna Prado", coverUrl:"/dj-stay-wide.webp", spotifyUrl:"https://open.spotify.com/", releaseDate:"2026-08-29", releaseDatePrecision:"day", playlistAddedAt:new Date("2026-08-29"), fetchedAt:new Date("2026-09-22"), expiresAt:new Date("2026-09-30") },
    { position:4, playlistId:"mock-playlist", albumId:"mock-album-sombra", title:"Sombra Neon", artistName:"Caio Nox", coverUrl:"/dj-stay-home-card.webp", spotifyUrl:"https://open.spotify.com/", releaseDate:"2026-08-15", releaseDatePrecision:"day", playlistAddedAt:new Date("2026-08-15"), fetchedAt:new Date("2026-09-22"), expiresAt:new Date("2026-09-30") },
    { position:5, playlistId:"mock-playlist", albumId:"mock-album-horizon", title:"Horizonte 4AM", artistName:"Enzo Vale", coverUrl:"/lander-records-anuncie-banner.webp", spotifyUrl:"https://open.spotify.com/", releaseDate:"2026-08-01", releaseDatePrecision:"day", playlistAddedAt:new Date("2026-08-01"), fetchedAt:new Date("2026-09-22"), expiresAt:new Date("2026-09-30") },
  ],
};

export const mockIntegrationSettings = {
  key:"lander_records",
  instagramUrl:"https://instagram.com/landerrecords",
  youtubeUrl:"https://youtube.com/@landerrecords",
  spotifyPlaylistUrl:"https://open.spotify.com/",
  spotifyPlaylistId:"mock-playlist-2026",
  spotifyUserId:"lander-records",
  spotifyConnectedAt:new Date("2026-08-20T14:00:00Z"),
  spotifyLastSyncedAt:new Date("2026-09-23T12:30:00Z"),
  spotifyLastError:"",
  soundchartsArtistUuid:"mock-soundcharts-uuid-lander-records",
  soundchartsResolutionStatus:"resolved",
  soundchartsMatchedVia:"instagram:https://instagram.com/landerrecords",
  soundchartsLastSyncedAt:new Date("2026-09-23T12:15:00Z"),
  soundchartsLastError:"",
};

export const mockIntegrationMetricRows = [
  { platform:"instagram", metric:"followers", value:184600 },
  { platform:"youtube", metric:"subscribers", value:72800 },
  { platform:"youtube", metric:"views", value:2840000 },
];
