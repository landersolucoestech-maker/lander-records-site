# Spotify — mapper

- playlist item → SpotifyRelease{albumId, trackId, title, artistName, coverUrl, spotifyUrl, releaseDate, releaseDatePrecision, playlistAddedAt}

Mapping code lives only in the client module (spotifyApi); consumers never re-map provider payloads.
