
// =====================================================
// utils/media.js
// KEERTHANA MEDIA UTILITIES
// CloudFront Optimized
// No Default Cover Images
// =====================================================

// =====================================================
// BASE URLS
// =====================================================

const BACKEND_URL =
  "https://ke-de4d85674ebd473184155d3a955db0ba.ecs.ap-south-1.on.aws";

const CLOUDFRONT_URL =
  "https://d1aj7yf1pvtrkq.cloudfront.net";

// =====================================================
// BUILD CLOUDFRONT URL FROM S3 OBJECT KEY
// =====================================================

const getCloudFrontUrl = (key) => {
  if (!key || typeof key !== "string") {
    return null;
  }

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
          key.startsWith("profiles/") ||
          key.startsWith("artists/") ||
          key.startsWith("categories/") ||
          key.startsWith("ministries/")
        ) {
          return getCloudFrontUrl(key);
        }
      }

      return value;
    } catch (error) {
      console.error("Invalid media URL:", value, error);
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
  // S3 MEDIA FOLDERS
  // ===================================================

  const mediaFolderMappings = [
    ["/profiles/", "profiles/"],
    ["/artists/", "artists/"],
    ["/categories/", "categories/"],
    ["/ministries/", "ministries/"],
  ];

  for (const [prefix, s3Folder] of mediaFolderMappings) {
    if (cleanPath.startsWith(prefix)) {
      const filename = cleanPath.slice(prefix.length);

      if (!filename) return null;

      return getCloudFrontUrl(`${s3Folder}${filename}`);
    }
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

  const directS3Folders = [
    "audio/",
    "covers/",
    "profiles/",
    "artists/",
    "categories/",
    "ministries/",
  ];

  const s3Key = cleanPath.replace(/^\/+/, "");

  if (
    directS3Folders.some((folder) =>
      s3Key.startsWith(folder)
    )
  ) {
    return getCloudFrontUrl(s3Key);
  }

  // ===================================================
  // LEGACY BACKEND UPLOADS
  // ===================================================

  return `${BACKEND_URL}${cleanPath}`;
}

// =====================================================
// GET FIRST AVAILABLE IMAGE FIELD
// =====================================================

const getFirstImage = (item, fields) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  for (const field of fields) {
    const value = item[field];

    if (typeof value === "string" && value.trim()) {
      const resolved = getMediaUrl(value);

      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

// =====================================================
// SONG COVER
// NO DEFAULT IMAGE
// =====================================================

export function getSongCover(song) {
  return getFirstImage(song, [
    "cover_url",
    "coverUrl",
    "image_url",
    "image",
    "thumbnail",
  ]);
}

// =====================================================
// ALBUM COVER
// NO DEFAULT IMAGE
// =====================================================

export function getAlbumCover(album) {
  return getFirstImage(album, [
    "cover_url",
    "coverUrl",
    "image_url",
    "image",
    "thumbnail",
  ]);
}

// =====================================================
// ARTIST IMAGE
// NO DEFAULT IMAGE
// =====================================================

export function getArtistImage(artist) {
  return getFirstImage(artist, [
    "image_url",
    "imageUrl",
    "profile_image",
    "profile_image_url",
    "image",
    "photo",
  ]);
}

// =====================================================
// MINISTRY IMAGE
// NO DEFAULT IMAGE
// =====================================================

export function getMinistryImage(ministry) {
  return getFirstImage(ministry, [
    "image_url",
    "imageUrl",
    "cover_url",
    "image",
    "photo",
  ]);
}

// =====================================================
// CATEGORY IMAGE
// NO DEFAULT IMAGE
// =====================================================

export function getCategoryImage(category) {
  return getFirstImage(category, [
    "image_url",
    "imageUrl",
    "cover_url",
    "image",
    "photo",
  ]);
}

// =====================================================
// EXPORTS
// =====================================================

export {
  getCloudFrontUrl,
};
