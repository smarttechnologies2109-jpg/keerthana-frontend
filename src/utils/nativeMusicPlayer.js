
import { Capacitor } from "@capacitor/core";
import { MediaSession } from "@capgo/capacitor-media-session";
import { getMediaUrl } from "./media";

export const isNativeAndroid = Capacitor.getPlatform() === "android";

let initialized = false;
let initializationPromise = null;
let handlersRegistered = false;
let actionCallbacks = {};

const hasTeluguScript = (value) =>
  /[\u0C00-\u0C7F]/.test(String(value || ""));

export function getNativeSongTitles(song) {
  const englishCandidates = [
    song?.title_english,
    song?.titleEnglish,
    song?.english_title,
    song?.englishTitle,
    song?.title,
    song?.name,
  ];

  const teluguCandidates = [
    song?.title_telugu,
    song?.titleTelugu,
    song?.title_native,
    song?.title,
    song?.name,
  ];

  const englishTitle = englishCandidates.find(
    (value) =>
      typeof value === "string" &&
      value.trim() &&
      !hasTeluguScript(value)
  );

  const teluguTitle = teluguCandidates.find(
    (value) =>
      typeof value === "string" &&
      value.trim() &&
      hasTeluguScript(value)
  );

  const primary = String(
    englishTitle || "Unknown Song"
  ).trim();

  const secondary = String(teluguTitle || "").trim();

  return {
    englishTitle: primary,
    teluguTitle:
      secondary && secondary !== primary
        ? secondary
        : "",
  };
}

export function getNativeArtistName(song) {
  const artist =
    song?.artist_name_english ||
    song?.artist_english ||
    song?.artistEnglish ||
    song?.artist?.name_english ||
    song?.artist?.english_name ||
    song?.artist_name ||
    song?.artist?.name ||
    song?.artist;

  if (typeof artist === "string" && artist.trim()) {
    return hasTeluguScript(artist)
      ? "KEERTHANA"
      : artist.trim();
  }

  return (
    artist?.name_english ||
    artist?.english_name ||
    "KEERTHANA"
  );
}

export async function initializeNativeMusicPlayer() {
  if (!isNativeAndroid) return false;
  if (initialized) return true;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        await MediaSession.setPlaybackState({
          playbackState: "none",
        });

        initialized = true;

        console.info(
          "KEERTHANA Android media session initialized"
        );

        return true;
      } catch (error) {
        initializationPromise = null;
        initialized = false;
        throw error;
      }
    })();
  }

  return initializationPromise;
}

export async function registerNativeMediaSessionHandlers(
  callbacks = {}
) {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  actionCallbacks = {
    ...actionCallbacks,
    ...callbacks,
  };

  if (handlersRegistered) return;

  const register = (
    action,
    callbackName,
    fallbackValue
  ) =>
    MediaSession.setActionHandler(
      { action },
      (details) => {
        const callback = actionCallbacks[callbackName];

        if (typeof callback !== "function") return;

        if (action === "seekto") {
          if (details?.seekTime != null) {
            callback(details.seekTime);
          }
          return;
        }

        if (
          action === "seekforward" ||
          action === "seekbackward"
        ) {
          callback(fallbackValue);
          return;
        }

        callback();
      }
    );

  await Promise.all([
    register("play", "onPlay"),
    register("pause", "onPause"),
    register("previoustrack", "onPrevious"),
    register("nexttrack", "onNext"),
    register("seekto", "onSeekTo"),
    register("seekforward", "onSeekForward", 10),
    register("seekbackward", "onSeekBackward", 10),
    register("stop", "onPause"),
  ]);

  handlersRegistered = true;
}

export async function setNativeSongMetadata(song) {
  if (!isNativeAndroid || !song) return;

  await initializeNativeMusicPlayer();

  const { englishTitle } = getNativeSongTitles(song);
  const artist = getNativeArtistName(song);

  const artworkSource =
    song?.cover_url ||
    song?.cover_image ||
    song?.coverImage ||
    song?.album_cover ||
    song?.album?.cover_url ||
    song?.image_url ||
    "";

  let artwork = [];

  if (
    typeof artworkSource === "string" &&
    artworkSource.trim()
  ) {
    const src = getMediaUrl(artworkSource.trim());

    if (/^https?:\/\//i.test(String(src || ""))) {
      artwork = [
        {
          src,
          sizes: "512x512",
          type: "image/*",
        },
      ];
    }
  }

  await MediaSession.setMetadata({
    title: englishTitle,
    artist,
    album:
      song?.album_title ||
      song?.album?.title ||
      "KEERTHANA MUSIC",
    artwork,
  });
}

export async function setNativePlaybackState(
  playbackState
) {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await MediaSession.setPlaybackState({
    playbackState,
  });
}

export async function setNativePositionState({
  duration,
  position,
  playbackRate = 1,
}) {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  const safeDuration = Number(duration);

  if (
    !Number.isFinite(safeDuration) ||
    safeDuration <= 0
  ) {
    return;
  }

  const safePosition = Math.min(
    Math.max(Number(position) || 0, 0),
    safeDuration
  );

  try {
    await MediaSession.setPositionState({
      duration: safeDuration,
      position: safePosition,
      playbackRate:
        Number(playbackRate) > 0
          ? Number(playbackRate)
          : 1,
    });
  } catch (error) {
    console.debug(
      "Media session position update skipped:",
      error
    );
  }
}

export async function clearNativeMediaSession() {
  if (!isNativeAndroid) return;

  try {
    await MediaSession.setPlaybackState({
      playbackState: "none",
    });

    await MediaSession.setMetadata({
      title: "",
      artist: "",
      album: "",
      artwork: [],
    });
  } catch (error) {
    console.warn(
      "Could not clear Android media session:",
      error
    );
  }
}
