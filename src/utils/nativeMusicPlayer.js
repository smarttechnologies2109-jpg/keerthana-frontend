import { Capacitor } from "@capacitor/core";

import {
  Playlist,
  RmxAudioStatusMessage,
} from "capacitor-plugin-playlist";

let initialized = false;
let initializationPromise = null;

export const isNativeAndroid =
  Capacitor.getPlatform() === "android";

/* =========================================================
   SONG DISPLAY HELPERS
========================================================= */

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

/* =========================================================
   ENGLISH ARTIST NAME
========================================================= */

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

/* =========================================================
   INITIALIZE NATIVE PLAYER
========================================================= */

export async function initializeNativeMusicPlayer() {
  if (!isNativeAndroid) return false;

  if (initialized) return true;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await Playlist.setOptions({
        verbose: import.meta.env.DEV,
        resetStreamOnPause: true,
      });

      await Playlist.initialize();

      initialized = true;

      return true;
    })().catch((error) => {
      initializationPromise = null;

      console.error(
        "Native music player initialization failed:",
        error
      );

      throw error;
    });
  }

  return initializationPromise;
}

/* =========================================================
   CONVERT SONG TO NATIVE TRACK
========================================================= */

export function toNativeTrack(song, audioUrl) {
  const id = song?.id ?? song?.song_id;

  const { englishTitle, teluguTitle } =
    getNativeSongTitles(song);

  const artist = getNativeArtistName(song);

  const albumArt =
    song?.cover_url ||
    song?.cover_image ||
    song?.coverImage ||
    song?.album_cover ||
    song?.album?.cover_url ||
    song?.image_url ||
    "";

  return {
    trackId: String(id),

    assetUrl: audioUrl,

    // Android notification / lock-screen title
    title: englishTitle,

    // English artist name
    artist,

    album:
      song?.album_title ||
      song?.album?.title ||
      "KEERTHANA",

    ...(albumArt ? { albumArt } : {}),

    isStream: false,

    // Keep Telugu title available for app-side display.
    // The native plugin may not display custom fields.
    ...(teluguTitle
      ? { subtitle: teluguTitle }
      : {}),
  };
}

/* =========================================================
   LOAD NATIVE PLAYLIST
========================================================= */

export async function setNativePlaylist(
  songs,
  resolveAudioUrl
) {
  if (!isNativeAndroid) return [];

  await initializeNativeMusicPlayer();

  const items = [];

  for (const song of songs) {
    const id = song?.id ?? song?.song_id;

    if (id == null) {
      console.warn(
        "Skipping native track without an ID:",
        song
      );

      continue;
    }

    try {
      const audioUrl = await resolveAudioUrl(song);

      const normalizedUrl =
        typeof audioUrl === "string"
          ? audioUrl.trim()
          : "";

      if (!/^https?:\/\//i.test(normalizedUrl)) {
        console.warn("Invalid native audio URL:", {
          id,
          title: song?.title,
          audioUrl,
        });

        continue;
      }

      items.push(
        toNativeTrack(song, normalizedUrl)
      );
    } catch (error) {
      console.error(
        `Failed to resolve audio URL for song ${id}:`,
        error
      );
    }
  }

  if (items.length === 0) {
    throw new Error(
      "No songs with valid audio URLs are available for Android playback."
    );
  }

  await Playlist.setPlaylistItems({
    items,
    options: {
      startPaused: true,
    },
  });

  console.log(
    "Android playlist loaded:",
    items.map((item) => ({
      trackId: item.trackId,
      title: item.title,
      artist: item.artist,
      assetUrl: item.assetUrl,
    }))
  );

  return items;
}

/* =========================================================
   PLAYBACK CONTROLS
========================================================= */

export async function playNativeMusic() {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await Playlist.play();
}

export async function pauseNativeMusic() {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await Playlist.pause();
}

export async function skipNativeNext() {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await Playlist.skipForward();
}

export async function skipNativePrevious() {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await Playlist.skipBack();
}

export async function seekNativeMusic(seconds) {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  await Playlist.seekTo({
    position: Math.max(0, Number(seconds) || 0),
  });
}

/* =========================================================
   VOLUME CONTROL
========================================================= */

export async function setNativeMusicVolume(volume) {
  if (!isNativeAndroid) return;

  await initializeNativeMusicPlayer();

  const safeVolume = Math.min(
    Math.max(Number(volume) || 0, 0),
    1
  );

  await Playlist.setPlaybackVolume({
    volume: safeVolume,
  });
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  Playlist,
  RmxAudioStatusMessage,
};