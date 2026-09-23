/* =====================================================
   KEERTHANA MEDIA UTILITIES
===================================================== */

const BACKEND_URL =
  "http://localhost:5000";


/* =====================================================
   DEFAULT IMAGES
===================================================== */

export const DEFAULT_COVER =
  "/images/default-cover.png";

export const DEFAULT_ALBUM =
  "/images/default-album.png";

export const DEFAULT_ARTIST =
  "/images/default-artist.png";


/* =====================================================
   GET BACKEND MEDIA URL
===================================================== */

export function getMediaUrl(path) {

  if (!path) {
    return null;
  }

  // Already a complete URL
  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  // Ensure path starts with /
  const cleanPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${BACKEND_URL}${cleanPath}`;
}


/* =====================================================
   SONG COVER
===================================================== */

export function getSongCover(song) {

  if (!song?.cover_url) {
    return DEFAULT_COVER;
  }

  return getMediaUrl(
    song.cover_url
  );
}


/* =====================================================
   ALBUM COVER
===================================================== */

export function getAlbumCover(album) {

  if (!album?.cover_url) {
    return DEFAULT_ALBUM;
  }

  return getMediaUrl(
    album.cover_url
  );
}


/* =====================================================
   ARTIST IMAGE
===================================================== */

export function getArtistImage(artist) {

  if (!artist?.image_url) {
    return DEFAULT_ARTIST;
  }

  return getMediaUrl(
    artist.image_url
  );
}