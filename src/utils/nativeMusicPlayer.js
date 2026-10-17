
import { Capacitor } from "@capacitor/core";
import {
  Playlist,
  RmxAudioStatusMessage,
} from "capacitor-plugin-playlist";

let initialized = false;
let initializationPromise = null;

export const isNativeAndroid =
  Capacitor.getPlatform() === "android";

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
      console.error("Native music player initialization failed:", error);
      throw error;
    });
  }

  return initializationPromise;
}

export function toNativeTrack(song, audioUrl) {
  const id = song?.id ?? song?.song_id;

  const artist =
    song?.artist_name ??
    song?.artist?.name ??
    song?.artist ??
    "KEERTHANA";

  const albumArt =
    song?.cover_url ??
    song?.cover_image ??
    song?.coverImage ??
    song?.album_cover ??
    song?.album?.cover_url ??
    song?.image_url ??
    "";

  return {
    trackId: String(id),
    assetUrl: audioUrl,
    title: song?.title ?? "Unknown Song",
    artist:
      typeof artist === "string"
        ? artist
        : artist?.name ?? "KEERTHANA",
    album:
      song?.album_title ??
      song?.album?.title ??
      "KEERTHANA",
    ...(albumArt ? { albumArt } : {}),
    isStream: false,
  };
}

export async function setNativePlaylist(songs, resolveAudioUrl) {
  await initializeNativeMusicPlayer();

  const items = [];

  for (const song of songs) {
    const id = song?.id ?? song?.song_id;
    if (id == null) continue;

    const audioUrl = await resolveAudioUrl(song);
    if (!audioUrl) continue;

    items.push(toNativeTrack(song, audioUrl));
  }

  await Playlist.setPlaylistItems({
    items,
    options: { startPaused: true },
  });

  return items;
}

export { Playlist, RmxAudioStatusMessage };
export async function playNativeMusic() {
  await initializeNativeMusicPlayer();
  await Playlist.play();
}

export async function pauseNativeMusic() {
  if (!isNativeAndroid) return;
  await Playlist.pause();
}

export async function skipNativeNext() {
  if (!isNativeAndroid) return;
  await Playlist.skipForward();
}

export async function skipNativePrevious() {
  if (!isNativeAndroid) return;
  await Playlist.skipBack();
}

export async function seekNativeMusic(seconds) {
  if (!isNativeAndroid) return;

  await Playlist.seekTo({
    position: Math.max(0, Number(seconds) || 0),
  });
}
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