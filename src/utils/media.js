/* =====================================================
   KEERTHANA MEDIA UTILITIES
   CloudFront Optimized
===================================================== */

const BACKEND_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws";

const CLOUDFRONT_URL =
  "https://d1aj7yf1pvtrkq.cloudfront.net";


/* =====================================================
   DEFAULT IMAGES
===================================================== */

export const DEFAULT_COVER =
  "/images/default-cover.png";

export const DEFAULT_ALBUM =
  "/images/default-album.png";

export const DEFAULT_ARTIST =
  "/images/default-artist.png";

export const DEFAULT_MINISTRY =
  "/images/default-ministry.png";

export const DEFAULT_CATEGORY =
  "/images/default-category.png";


/* =====================================================
   GET MEDIA URL
===================================================== */

export function getMediaUrl(path) {

  if (!path) {
    return null;
  }


  /* ---------------------------------------------------
     Already a complete URL
  --------------------------------------------------- */

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }


  /* ---------------------------------------------------
     Ensure path starts with /
  --------------------------------------------------- */

  const cleanPath =
    path.startsWith("/")
      ? path
      : `/${path}`;


  /* ---------------------------------------------------
     CLOUDFRONT AUDIO

     Backend:
     /media/audio/song.mp3

     CloudFront:
     https://d1aj7yf1pvtrkq.cloudfront.net/audio/song.mp3
  --------------------------------------------------- */

  if (cleanPath.startsWith("/media/audio/")) {

    const filename =
      cleanPath.replace("/media/audio/", "");

    return `${CLOUDFRONT_URL}/audio/${filename}`;
  }


  /* ---------------------------------------------------
     CLOUDFRONT IMAGES

     Backend:
     /media/images/image.jpg

     CloudFront:
     https://d1aj7yf1pvtrkq.cloudfront.net/covers/image.jpg
  --------------------------------------------------- */

  if (cleanPath.startsWith("/media/images/")) {

    const filename =
      cleanPath.replace("/media/images/", "");

    return `${CLOUDFRONT_URL}/covers/${filename}`;
  }


  /* ---------------------------------------------------
     OTHER MEDIA

     Keep using ECS backend.
  --------------------------------------------------- */

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


/* =====================================================
   MINISTRY IMAGE
===================================================== */

export function getMinistryImage(ministry) {

  if (!ministry?.image_url) {
    return DEFAULT_MINISTRY;
  }

  return getMediaUrl(
    ministry.image_url
  );
}


/* =====================================================
   CATEGORY IMAGE
===================================================== */

export function getCategoryImage(category) {

  if (!category?.image_url) {
    return DEFAULT_CATEGORY;
  }

  return getMediaUrl(
    category.image_url
  );
}