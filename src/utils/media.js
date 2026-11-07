// =====================================================
// utils/media.js
// KEERTHANA MEDIA UTILITIES
// CloudFront Optimized
// =====================================================

const BACKEND_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws";

const CLOUDFRONT_URL =
  "https://d1aj7yf1pvtrkq.cloudfront.net";

// =====================================================
// DEFAULT IMAGES
// =====================================================

export const DEFAULT_COVER = "/images/default-cover.png";
export const DEFAULT_ALBUM = "/images/default-album.png";
export const DEFAULT_ARTIST = "/images/default-artist.png";
export const DEFAULT_MINISTRY = "/images/default-ministry.png";
export const DEFAULT_CATEGORY = "/images/default-category.png";

// =====================================================
// BUILD CLOUDFRONT URL FROM AN S3 OBJECT KEY
// =====================================================

const getCloudFrontUrl = (key) => {
  const cleanKey = key
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${CLOUDFRONT_URL}/${cleanKey}`;
};

// =====================================================
// VALIDATE MEDIA PATH
// =====================================================

export function getMediaUrl(path) {
  if (typeof path !== "string" || !path.trim()) {
    return null;
  }

  const value = path.trim();

  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "undefined" ||
    lowerValue === "null" ||
    lowerValue.includes("/undefined") ||
    lowerValue.endsWith("/null")
  ) {
    console.error("Invalid media path:", path);
    return null;
  }

  // ---------------------------------------------------
  // ABSOLUTE URL
  // ---------------------------------------------------

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      const isKeerthanaS3 =
        url.hostname ===
        "keerthana-media-908209635187.s3.ap-south-1.amazonaws.com";

      if (isKeerthanaS3) {
        const key = decodeURIComponent(
          url.pathname.replace(/^\/+/, "")
        );

        if (
          key.startsWith("audio/") ||
          key.startsWith("covers/") ||
          key.startsWith("profiles/")
        ) {
          return getCloudFrontUrl(key);
        }
      }

      // Preserve existing CloudFront and other URLs.
      return value;
    } catch (error) {
      console.error("Invalid media URL:", value);
      return null;
    }
  }

  // ---------------------------------------------------
  // NORMALIZE RELATIVE PATH
  // ---------------------------------------------------

  const cleanPath = value.startsWith("/")
    ? value
    : `/${value}`;

  // ---------------------------------------------------
  // NEW PROFILE IMAGE S3 KEY
  // Example: profiles/profile-123.webp
  // ---------------------------------------------------

  if (cleanPath.startsWith("/profiles/")) {
    const key = cleanPath.replace(/^\/+/, "");
    return getCloudFrontUrl(key);
  }

  // ---------------------------------------------------
  // AUDIO
  // Existing format: /media/audio/song.mp3
  // ---------------------------------------------------

  if (cleanPath.startsWith("/media/audio/")) {
    const filename = cleanPath.slice(
      "/media/audio/".length
    );

    if (!filename || filename.includes("undefined")) {
      return null;
    }

    return getCloudFrontUrl(`audio/${filename}`);
  }

  // ---------------------------------------------------
  // COVER IMAGES
  // Existing format: /media/images/image.jpg
  // ---------------------------------------------------

  if (cleanPath.startsWith("/media/images/")) {
    const filename = cleanPath.slice(
      "/media/images/".length
    );

    if (!filename || filename.includes("undefined")) {
      return null;
    }

    return getCloudFrontUrl(`covers/${filename}`);
  }

  // ---------------------------------------------------
  // DIRECT S3 KEYS
  // ---------------------------------------------------

  if (
    cleanPath.startsWith("/audio/") ||
    cleanPath.startsWith("/covers/")
  ) {
    return getCloudFrontUrl(cleanPath);
  }

  // ---------------------------------------------------
  // LEGACY LOCAL UPLOADS AND OTHER BACKEND PATHS
  // Example: /uploads/profile/old-photo.jpg
  // ---------------------------------------------------

  return `${BACKEND_URL}${cleanPath}`;
}

// =====================================================
// SONG COVER
// =====================================================

export function getSongCover(song) {
  if (!song?.cover_url) {
    return DEFAULT_COVER;
  }

  return getMediaUrl(song.cover_url) || DEFAULT_COVER;
}

// =====================================================
// ALBUM COVER
// =====================================================

export function getAlbumCover(album) {
  if (!album?.cover_url) {
    return DEFAULT_ALBUM;
  }

  return getMediaUrl(album.cover_url) || DEFAULT_ALBUM;
}

// =====================================================
// ARTIST IMAGE
// =====================================================

export function getArtistImage(artist) {
  if (!artist?.image_url) {
    return DEFAULT_ARTIST;
  }

  return getMediaUrl(artist.image_url) || DEFAULT_ARTIST;
}

// =====================================================
// MINISTRY IMAGE
// =====================================================

export function getMinistryImage(ministry) {
  if (!ministry?.image_url) {
    return DEFAULT_MINISTRY;
  }

  return getMediaUrl(ministry.image_url) || DEFAULT_MINISTRY;
}

// =====================================================
// CATEGORY IMAGE
// =====================================================

export function getCategoryImage(category) {
  if (!category?.image_url) {
    return DEFAULT_CATEGORY;
  }

  return getMediaUrl(category.image_url) || DEFAULT_CATEGORY;
}