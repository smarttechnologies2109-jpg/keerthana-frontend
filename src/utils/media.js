
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
// BUILD CLOUDFRONT URL FROM S3 OBJECT KEY
// =====================================================

const getCloudFrontUrl = (key) => {
  if (!key || typeof key !== "string") return null;

  const cleanKey = key
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${CLOUDFRONT_URL}/${cleanKey}`;
};

// =====================================================
// VALIDATE AND RESOLVE MEDIA URL
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

  // ===================================================
  // ABSOLUTE URL
  // ===================================================

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

      return value;
    } catch (error) {
      console.error("Invalid media URL:", value);
      return null;
    }
  }

  // ===================================================
  // NORMALIZE RELATIVE PATH
  // ===================================================

  const cleanPath = value.startsWith("/")
    ? value
    : `/${value}`;

  // ===================================================
  // LOCAL FRONTEND PUBLIC IMAGES
  // Example: /images/my-cover.jpg
  // ===================================================

  if (cleanPath.startsWith("/images/")) {
    return cleanPath;
  }

  // ===================================================
  // PROFILE IMAGES
  // ===================================================

  if (cleanPath.startsWith("/profiles/")) {
    return getCloudFrontUrl(cleanPath);
  }

  // ===================================================
  // AUDIO
  // ===================================================

  if (cleanPath.startsWith("/media/audio/")) {
    const filename = cleanPath.slice(
      "/media/audio/".length
    );

    if (!filename) return null;

    return getCloudFrontUrl(`audio/${filename}`);
  }

  // ===================================================
  // COVER IMAGES FROM S3
  // ===================================================

  if (cleanPath.startsWith("/media/images/")) {
    const filename = cleanPath.slice(
      "/media/images/".length
    );

    if (!filename) return null;

    return getCloudFrontUrl(`covers/${filename}`);
  }

  // ===================================================
  // DIRECT S3 KEYS
  // ===================================================

  if (
    cleanPath.startsWith("/audio/") ||
    cleanPath.startsWith("/covers/")
  ) {
    return getCloudFrontUrl(cleanPath);
  }

  // ===================================================
  // LEGACY BACKEND UPLOADS
  // ===================================================

  return `${BACKEND_URL}${cleanPath}`;
}

// =====================================================
// SONG COVER
// =====================================================

export function getSongCover(song) {
  return getMediaUrl(song?.cover_url);
}

// =====================================================
// ALBUM COVER
// =====================================================

export function getAlbumCover(album) {
  return getMediaUrl(album?.cover_url);
}

// =====================================================
// ARTIST IMAGE
// =====================================================

export function getArtistImage(artist) {
  return getMediaUrl(artist?.image_url);
}

// =====================================================
// MINISTRY IMAGE
// =====================================================

export function getMinistryImage(ministry) {
  return getMediaUrl(ministry?.image_url);
}

// =====================================================
// CATEGORY IMAGE
// =====================================================

export function getCategoryImage(category) {
  return getMediaUrl(category?.image_url);
}
