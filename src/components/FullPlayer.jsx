import { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";

import {

FaCompress,

FaHeart,

FaListUl,

FaMicrophone,

FaPause,

FaPlay,

FaRandom,

FaRedoAlt,

FaRegHeart,

FaStepBackward,

FaStepForward,

FaTimes,

FaVolumeUp,

FaVolumeDown,

FaVolumeMute,

FaUndo,

FaRedo,

} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../services/api";

import { usePlayer } from "../context/usePlayer";

import { useLikedSongs } from "../context/LikedSongsContext";

import { useAuth } from "../context/AuthContext";


import {

getSongCover,

getMediaUrl,

} from "../utils/media";

import "../assets/css/full-player.css";

import VerticalVolumeControl from "../components/VerticalVolumeControl";
import SleepTimerControl from "./SleepTimerControl";
import PlaybackSpeedControl from "./PlaybackSpeedControl";

function formatTime(seconds) {

const value = Number(seconds);

if (!Number.isFinite(value) || value < 0) return "0:00";

return `${Math.floor(value / 60)}:${String(

Math.floor(value % 60)

).padStart(2, "0")}`;

}

function parseLyrics(lyrics) {

if (typeof lyrics !== "string") return [];

const regex = /^\[(\d{1,2}):([0-5]\d)(?:\.(\d{1,3}))?\]\s*(.+)$/;

return lyrics

.split(/\r?\n/)

.map((line, index) => {

const match = line.trim().match(regex);

if (!match) return null;

const decimal = match[3] || "0";

let milliseconds = Number(decimal);

if (decimal.length === 1) milliseconds *= 100;

else if (decimal.length === 2) milliseconds *= 10;

return {

id: `${index}-${match[1]}-${match[2]}`,

time: Number(match[1]) * 60 + Number(match[2]) + milliseconds / 1000,

text: match[4].trim(),

};

})

.filter(Boolean)

.sort((a, b) => a.time - b.time);

}

function songId(song) {

return song?.id ?? song?.song_id ?? null;

}

// Use the same artist-name rules as AllSongs.jsx.

function containsTelugu(value) {

  return /[\u0C00-\u0C7F]/.test(String(value || ""));

}

function getSongReference(song, songsById = {}) {

  const id = song?.id ?? song?.song_id;

  return id == null ? {} : songsById[String(id)] || {};

}

function getArtistName(song, artistsById = {}, songsById = {}) {
  const referenceSong = getSongReference(song, songsById);
  const sources = [referenceSong, song].filter(Boolean);
  const names = [];
  const seen = new Set();

  const addName = (value) => {
    if (typeof value !== "string") return;
    // Some API fields already contain a comma-separated list of singers.
    value.split(",").forEach((part) => {
      const name = part.trim();
      if (!name || containsTelugu(name) || /^(unknown artist|null|undefined|n\/a)$/i.test(name)) return;
      const key = name.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    });
  };

  const addArtist = (artist) => {
    if (artist == null) return;
    if (typeof artist === "string" || typeof artist === "number") {
      const linked = artistsById[String(artist)];
      if (linked) addArtist(linked);
      else if (typeof artist === "string" && !/^\\d+$/.test(artist.trim())) addName(artist);
      return;
    }
    if (typeof artist !== "object") return;

    // song_artists rows may wrap the actual artist in an `artist` property.
    if (artist.artist && typeof artist.artist === "object") addArtist(artist.artist);

    const id = artist.id ?? artist.artist_id ?? artist.artistId;
    const linked = id != null ? artistsById[String(id)] : null;
    if (linked && linked !== artist) {
      [
        linked.name_english, linked.english_name, linked.nameEnglish,
        linked.englishName, linked.artist_name_english, linked.name,
      ].forEach(addName);
    }

    [
      artist.name_english, artist.english_name, artist.nameEnglish,
      artist.englishName, artist.artist_name_english, artist.artist_english,
      artist.artist_name_en, artist.name_en, artist.display_name, artist.name,
    ].forEach(addName);
  };

  // Prefer explicit many-to-many relationship data from both the active
  // player song and the full catalogue record.
  sources.forEach((source) => {
    [
      ...(Array.isArray(source?.artists) ? source.artists : source?.artists ? [source.artists] : []),
      ...(Array.isArray(source?.song_artists) ? source.song_artists : []),
      ...(Array.isArray(source?.artist) ? source.artist : []),
    ].forEach(addArtist);

    [
      ...(Array.isArray(source?.artist_ids) ? source.artist_ids : []),
      ...(Array.isArray(source?.artistIds) ? source.artistIds : []),
    ].forEach(addArtist);
  });

  // Legacy single-artist fields are a fallback, not an extra singer when
  // the many-to-many relationship already supplied artists.
  if (names.length === 0) {
    sources.forEach((source) => {
      const artistObject =
        source?.artist && typeof source.artist === "object" && !Array.isArray(source.artist)
          ? source.artist : {};
      const nestedArtist =
        source?.artist_details && typeof source.artist_details === "object"
          ? source.artist_details
          : source?.artistDetails && typeof source.artistDetails === "object"
            ? source.artistDetails : {};

      const ids = [
        source?.artist_id, source?.artistId,
        artistObject?.id, artistObject?.artist_id,
        nestedArtist?.id, nestedArtist?.artist_id,
      ].filter((id) => id != null);

      ids.forEach((id) => addArtist(artistsById[String(id)] || { id }));

      [
        source?.artist_name_english, source?.artist_english,
        source?.artist_english_name, source?.artist_name_en,
        source?.artistEnglishName, source?.artistNameEnglish,
        source?.artistEnglish, artistObject?.name_english,
        artistObject?.english_name, artistObject?.nameEnglish,
        artistObject?.englishName, artistObject?.name,
        nestedArtist?.name_english, nestedArtist?.english_name,
        nestedArtist?.nameEnglish, nestedArtist?.englishName,
        nestedArtist?.artist_name_english, nestedArtist?.name,
        source?.artist_name, source?.artistName,
        typeof source?.artist === "string" ? source.artist : "",
      ].forEach(addName);
    });
  }

  return names.join(", ") || "Unknown Artist";
}

export default function FullPlayer({ onCollapse }) {
const isAndroidNative =
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === "android";

const navigate = useNavigate();

const { user } = useAuth();

const { isLiked, toggleLike } = useLikedSongs();

const {

currentSong,

queue,

isPlaying,

currentTime,

duration,

volume,

isShuffle,

repeatMode,

togglePlay,

nextSong,

previousSong,

seek,

seekBackward,

seekForward,

changeVolume,

toggleShuffle,

toggleRepeat,

playSong,

playQueueSong,

closePlayer,

} = usePlayer();

const [lyricsOpen, setLyricsOpen] = useState(false);

const [queueOpen, setQueueOpen] = useState(false);

const [seekValue, setSeekValue] = useState(null);

const [fetchedLyrics, setFetchedLyrics] = useState("");

const [lyricsLoading, setLyricsLoading] = useState(false);

const [lyricsError, setLyricsError] = useState("");
const [lyricsFontSize, setLyricsFontSize] = useState(22);
const [lyricsSyncOffset, setLyricsSyncOffset] = useState(0);
const [lyricsTranslation, setLyricsTranslation] = useState(false);
const [lyricsFocusMode, setLyricsFocusMode] = useState(false);

const [artistsById, setArtistsById] = useState({});

const [songsById, setSongsById] = useState({});


const lyricsButtonRef = useRef(null);



const activeLyricRef = useRef(null);
const backButtonStateRef = useRef({ lyricsOpen, queueOpen, onCollapse });
backButtonStateRef.current = { lyricsOpen, queueOpen, onCollapse };

const currentSongReference = getSongReference(currentSong, songsById);

const songData = { ...currentSongReference, ...currentSong };

const songTitleEnglish =

songData?.title_english || songData?.titleEnglish ||

songData?.english_title || songData?.title || "Unknown Song";

// Match AllSongs.jsx: title_telugu first, then title as native-language fallback.

const songTitleNative =

songData?.title_telugu || songData?.titleTelugu ||

songData?.title_native || songData?.titleNative ||

songData?.title_local || songData?.title || "";

const artistEnglish = getArtistName(currentSong, artistsById, songsById);

const directLyrics = typeof currentSong?.lyrics === "string" ? currentSong.lyrics.trim() : "";

const lyrics = directLyrics || fetchedLyrics;
const translatedLyrics = [songData?.lyrics_translation, songData?.translated_lyrics, songData?.lyrics_english].find((value) => typeof value === "string" && value.trim()) || "";
const visibleLyrics = lyricsTranslation && translatedLyrics ? translatedLyrics : lyrics;

const syncedLyrics = useMemo(

() => parseLyrics(visibleLyrics),

[visibleLyrics]

);

const hasSyncedLyrics = syncedLyrics.length> 0;

const displayedTime =

seekValue !== null ? seekValue : Number(currentTime) || 0;

const activeLyricIndex = useMemo(() => {

let active = -1;

for (let index = 0; index < syncedLyrics.length; index += 1) {

if (displayedTime + lyricsSyncOffset >= syncedLyrics[index].time) active = index;

else break;

}

return active;

}, [displayedTime, syncedLyrics, lyricsSyncOffset]);

// Use the same two API sources as AllSongs.jsx. The /songs reference

// supplies artist_id/title fields when PlayerContext has only a partial song.

useEffect(() => {

let active = true;

Promise.all([API.get("/artists"), API.get("/songs")])

.then(([artistsResponse, songsResponse]) => {

if (!active) return;

const artistsPayload = artistsResponse?.data;

const artistList = Array.isArray(artistsPayload)

? artistsPayload

: Array.isArray(artistsPayload?.artists)

? artistsPayload.artists

: Array.isArray(artistsPayload?.data)

? artistsPayload.data

: [];

const artistLookup = {};

artistList.forEach((artist) => {

const artistId = artist?.id ?? artist?.artist_id;

// Keep the exact English fields used by AllSongs.jsx.

const englishName =

artist?.name_english ||

artist?.english_name ||

artist?.nameEnglish ||

"";

if (

artistId != null &&

typeof englishName === "string" &&

englishName.trim() &&

!containsTelugu(englishName)

) {

artistLookup[String(artistId)] = {

...artist,

name_english: englishName.trim(),

};

}

});

setArtistsById(artistLookup);

const songsPayload = songsResponse?.data;

const songList = Array.isArray(songsPayload)

? songsPayload

: Array.isArray(songsPayload?.songs)

? songsPayload.songs

: Array.isArray(songsPayload?.data)

? songsPayload.data

: [];

const songLookup = {};

songList.forEach((song) => {

const id = song?.id ?? song?.song_id;

if (id != null) songLookup[String(id)] = song;

});

setSongsById(songLookup);

})

.catch((error) => {

console.warn("Full player artist/song reference lookup failed:", error);

});

return () => {

active = false;

};

}, []);

useEffect(() => {

let active = true;

const id = songId(currentSong);

setFetchedLyrics("");

setLyricsError("");

if (!id || directLyrics) {

setLyricsLoading(false);

return () => { active = false; };

}

setLyricsLoading(true);

API.get(`/songs/${id}`)

.then((response) => {

if (!active) return;

const payload = response?.data?.song || response?.data || {};

const value = payload.lyrics || payload.lyric || payload.song_lyrics || "";

setFetchedLyrics(typeof value === "string" ? value.trim() : "");

})

.catch((error) => {

if (!active) return;

console.error("Full player lyrics fetch failed:", error);

setLyricsError("Unable to load lyrics right now.");

})

.finally(() => {

if (active) setLyricsLoading(false);

});

return () => { active = false; };

}, [currentSong?.id, currentSong?.song_id, directLyrics]);

useEffect(() => {

if (!lyricsOpen || activeLyricIndex < 0) return;

activeLyricRef.current?.scrollIntoView({

behavior: "smooth",

block: "center",

});

}, [lyricsOpen, activeLyricIndex]);

useEffect(() => {

setLyricsOpen(false);

setQueueOpen(false);

setSeekValue(null);

}, [currentSong?.id]);

useEffect(() => {

const onKeyDown = (event) => {

if (event.key !== "Escape") return;

if (lyricsOpen) setLyricsOpen(false);

else if (queueOpen) setQueueOpen(false);

else onCollapse();

};

window.addEventListener("keydown", onKeyDown);

return () => window.removeEventListener("keydown", onKeyDown);

}, [lyricsOpen, queueOpen, onCollapse]);

if (!currentSong) return null;

const safeDuration = Number.isFinite(Number(duration))

? Math.max(0, Number(duration))

: 0;

const songs = Array.isArray(queue) ? queue : [];

const currentId = songId(currentSong);

const upNext = songs.filter((song) => {

const id = songId(song);

if (id == null || currentId == null) return song !== currentSong;

return String(id) !== String(currentId);

});

const liked = currentSong.id ? isLiked(currentSong.id) : false;

const cover = getSongCover(currentSong);

const handleLike = async () => {

if (!user) {

navigate("/login");

return;

}

try {

await toggleLike(currentSong);

} catch (error) {

console.error("Like error:", error);

}

};

const openSongDetails = () => {

const id = currentSong?.id ?? currentSong?.song_id;

if (id == null) return;

// Close Full Player and its open panels.

setLyricsOpen(false);

setQueueOpen(false);

// Collapse to Mini Player before navigating.

onCollapse();

// Open the existing Song Details route.

navigate(`/songs/${id}`);

};

const playSelectedSong = async (song) => {

try {

if (playQueueSong) await playQueueSong(song);

else await playSong(song, songs);

setQueueOpen(false);

} catch (error) {

console.error("Queue playback error:", error);

}

};

const handleClose = async () => {

setLyricsOpen(false);

setQueueOpen(false);

onCollapse();

await closePlayer();

};

const lyricsAvailable = lyrics.length> 0;

return createPortal(

<main className={`keerthana-full-player ${
  isAndroidNative ? "keerthana-android-native" : ""
}`} >

<header className="full-player-header">

<button

type="button"

className="full-player-icon-button"

onClick={onCollapse}

title="Minimize player"

aria-label="Minimize player"

>

<FaCompress />

</button>

<div className="full-player-brand">

<span className="full-player-brand-mark">K</span>

<span>KEERTHANA <small>MUSIC</small></span>

</div>

<button

type="button"

className="full-player-icon-button"

onClick={handleClose}

title="Close player"

aria-label="Close player"

>

<FaTimes />

</button>

</header>

<section className="full-player-body">

<button

type="button"

className="full-player-artwork-wrap full-player-details-link"

onClick={openSongDetails}

title="View song details"

aria-label={`View details for ${currentSong.title || "this song"}`}

>

{cover && (

<img

className="full-player-artwork"

src={cover}

alt={currentSong.title || "Song cover"}

onError={(event) => {

event.currentTarget.onerror = null;

event.currentTarget.style.display = "none";

}}

/>

)}

<span className="full-player-artwork-glow" />

</button>

<div className="full-player-song-info">

<span className="full-player-eyebrow">NOW PLAYING</span>

<button

type="button"

className="full-player-title-link"

onClick={openSongDetails}

title="View song details"

>

{songTitleEnglish}

</button>

{songTitleNative && <span className="full-player-native-title">{songTitleNative}</span>}

<p>

{artistEnglish}

</p>

<button

type="button"

className={`full-player-like ${liked ? "is-liked" : ""}`}

onClick={handleLike}

aria-label={liked ? "Unlike song" : "Like song"}

>

{liked ? <FaHeart /> : <FaRegHeart />}

<span>{liked ? "Liked" : "Add to liked songs"}</span>

</button>



</div>

<div className="full-player-controls-area">

<div className="full-player-controls">

<button

type="button"

className={isShuffle ? "is-active" : ""}

onClick={toggleShuffle}

disabled={upNext.length === 0}

title="Shuffle"

aria-label="Shuffle"

>

<FaRandom />

</button>

<button

type="button"

onClick={previousSong}

disabled={upNext.length === 0}

title="Previous"

aria-label="Previous song"

>

<FaStepBackward />

</button>

<button

type="button"

className="full-player-seek-button"

onClick={() => seekBackward(10)}

title="Rewind 10 seconds"

aria-label="Rewind 10 seconds"

>

<FaUndo />

<span>10</span>

</button>

<button

type="button"

className="full-player-play"

onClick={togglePlay}

title={isPlaying ? "Pause" : "Play"}

aria-label={isPlaying ? "Pause" : "Play"}

>

{isPlaying ? <FaPause /> : <FaPlay />}

</button>

<button

type="button"

className="full-player-seek-button"

onClick={() => seekForward(10)}

title="Forward 10 seconds"

aria-label="Forward 10 seconds"

>

<FaRedo />

<span>10</span>

</button>

<button

type="button"

onClick={nextSong}

disabled={upNext.length === 0}

title="Next"

aria-label="Next song"

>

<FaStepForward />

</button>

<button

type="button"

className={repeatMode !== "off" ? "is-active" : ""}

onClick={toggleRepeat}

title="Repeat"

aria-label="Repeat"

>

<FaRedoAlt />

{repeatMode === "one" && <span>1</span>}

</button>

</div>

<div className="full-player-progress">

<span>{formatTime(displayedTime)}</span>

<input
  className="full-player-seek-range"
  type="range"
  min="0"
  max={safeDuration}
  step="0.1"
  value={Math.min(displayedTime, safeDuration)}
  disabled={safeDuration <= 0}
  onChange={(event) => {
    const nextTime = Number(event.target.value);
    setSeekValue(nextTime);

    // Seek while the thumb moves. This is more reliable in Android
    // WebView than waiting only for pointer-up to commit the seek.
    seek(nextTime);
  }}
  onPointerUp={() => setSeekValue(null)}
  onTouchEnd={() => setSeekValue(null)}
  onMouseUp={() => setSeekValue(null)}
  onKeyUp={() => setSeekValue(null)}
  aria-label="Song progress"
/>

<span>{formatTime(safeDuration)}</span>

</div>

</div>

</section>

<footer className="full-player-toolbar">

<div className="full-player-toolbar-group">

<button
  type="button"
  className={queueOpen ? "is-active" : ""}
  onClick={() => setQueueOpen((value) => !value)}
  title="Open queue"
  aria-label="Open queue"
  aria-pressed={queueOpen}
>
  <FaListUl />
  <span>Queue</span>
</button>

<button
  type="button"
  className={lyricsOpen ? "is-active" : ""}
  onClick={() => setLyricsOpen((value) => !value)}
  title="Open song lyrics"
  aria-label="Open song lyrics"
  aria-pressed={lyricsOpen}
>
  <FaMicrophone />
  <span>Lyrics</span>
</button>

<SleepTimerControl />

<PlaybackSpeedControl />

</div>


<div className="full-player-volume" aria-label="Volume control">

<span className="full-player-volume-icon" aria-hidden="true">

{Number(volume) <= 0 ? <FaVolumeMute /> : Number(volume) < 0.5 ? <FaVolumeDown /> : <FaVolumeUp />}

</span>

<input className="full-player-volume-slider" type="range" min="0" max="1" step="0.01"

value={Math.min(1, Math.max(0, Number(volume) || 0))}

onChange={(event) => changeVolume(Number(event.target.value))}

aria-label="Adjust volume" />

</div>

</footer>

{(lyricsOpen || queueOpen) && (
  <div
    className="full-player-overlay full-player-panels-overlay"
    onClick={() => {
      setLyricsOpen(false);
      setQueueOpen(false);
    }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "18px",
      flexDirection: "row",
      flexWrap: "wrap",
      padding: "24px",
      boxSizing: "border-box",
      background: "rgba(0, 0, 0, 0.72)",
      overflowY: "auto",
    }}
  >
    {lyricsOpen && (
      <div style={{ flex: "1 1 420px", maxWidth: "560px", minWidth: "min(100%, 320px)" }} onClick={(event) => event.stopPropagation()}>
<section

className="full-player-panel full-player-lyrics-panel"

onClick={(event) => event.stopPropagation()}

aria-label="Song lyrics"

>

<header className="full-player-panel-header">

<div>

<span className="lyrics-live-eyebrow">KEERTHANA • LIVE LYRICS</span>
<div className="lyrics-pro-toolbar">
<button type="button" onClick={() => setLyricsFontSize((v) => Math.max(14, v - 2))} aria-label="Decrease lyrics font size">A−</button>
<button type="button" onClick={() => setLyricsFontSize((v) => Math.min(34, v + 2))} aria-label="Increase lyrics font size">A+</button>
<button type="button" onClick={() => setLyricsFocusMode((v) => !v)} aria-pressed={lyricsFocusMode}>{lyricsFocusMode ? "Exit focus" : "Focus mode"}</button>
<label className="lyrics-sync-control">Sync <input type="range" min="-5" max="5" step="0.1" value={lyricsSyncOffset} onChange={(event) => setLyricsSyncOffset(Number(event.target.value))} aria-label="Adjust lyric timing" /><span>{lyricsSyncOffset > 0 ? "+" : ""}{lyricsSyncOffset.toFixed(1)}s</span></label>
{translatedLyrics && <button type="button" onClick={() => setLyricsTranslation((v) => !v)} aria-pressed={lyricsTranslation}>{lyricsTranslation ? "Original" : "Translation"}</button>}
</div>

<h2>{songTitleEnglish}</h2>

{songTitleNative && <p className="full-player-native-title">{songTitleNative}</p>}

<p>{artistEnglish}</p>

</div>

<button

type="button"

onClick={() => setLyricsOpen(false)}

aria-label="Close lyrics"

>

<FaTimes />

</button>

</header>

<div className={`full-player-lyrics-content${lyricsFocusMode ? " lyrics-focus-mode" : ""}`} style={{ "--lyrics-font-size": `${lyricsFontSize}px`, backgroundImage: cover ? `linear-gradient(rgba(4,12,28,.94),rgba(4,12,28,.98)), url("${cover}")` : undefined }}>

{lyricsLoading ? (

<div className="full-player-no-lyrics"><p>Loading lyrics...</p></div>

) : !lyricsAvailable ? (

<div className="full-player-no-lyrics">

<FaMicrophone />

<h3>Lyrics are not available yet</h3>

<p>{lyricsError || "Lyrics have not been added for this song."}</p>

</div>

) : hasSyncedLyrics ? (

<div className="full-player-synced-lyrics">

{syncedLyrics.map((line, index) => (

<button

type="button"

key={line.id}

ref={index === activeLyricIndex ? activeLyricRef : null}

className={

index === activeLyricIndex

? "full-player-lyric-line is-active"

: "full-player-lyric-line"

}

onClick={() => seek(Math.max(0, line.time - lyricsSyncOffset))}

>

<span style={{ fontSize: "var(--lyrics-font-size, 22px)" }}>{line.text}</span>

{index === activeLyricIndex && <small className="lyrics-live-indicator">NOW PLAYING</small>}

</button>

))}

</div>

) : (

<div className="full-player-plain-lyrics" style={{ fontSize: `${lyricsFontSize}px` }}>

{lyrics.split(/\r?\n/).map((line, index) => (

<p key={`${index}-${line}`}>{line || "\u00A0"}</p>

))}

</div>

)}

</div>

</section>
      </div>
    )}
    {queueOpen && (
      <div style={{ flex: "1 1 380px", maxWidth: "480px", minWidth: "min(100%, 320px)" }} onClick={(event) => event.stopPropagation()}>
<section

className="full-player-panel full-player-queue-panel"



onClick={(event) => event.stopPropagation()}

aria-label="Song queue"

>

<header className="full-player-panel-header">

<div>

<span>YOUR LISTENING SESSION</span>

<h2>Queue</h2>

<p>{upNext.length} songs up next</p>

</div>

<button

type="button"

onClick={() => setQueueOpen(false)}

aria-label="Close queue"

>

<FaTimes />

</button>

</header>

<div className="full-player-queue-current">

{cover && (

<img

src={cover}

alt=""

onError={(event) => {

event.currentTarget.onerror = null;

event.currentTarget.style.display = "none";

}}

/>

)}

<div>

<small>NOW PLAYING</small>

<strong>{songTitleEnglish}</strong>

{songTitleNative && <small>{songTitleNative}</small>}

<span>{artistEnglish}</span>

</div>

</div>

<div className="full-player-queue-list">

{upNext.map((song, index) => {

const referenceSong = getSongReference(song, songsById);

const queueSong = { ...referenceSong, ...song };

const queueTitleEnglish =

queueSong?.title_english ||

queueSong?.english_title ||

queueSong?.titleEnglish ||

queueSong?.title ||

"Unknown Song";

const queueTitleNative =

queueSong?.title_telugu ||

queueSong?.titleTelugu ||

queueSong?.title_native ||

queueSong?.titleNative ||

queueSong?.title_local ||

queueSong?.title ||

"";

const queueArtistEnglish = getArtistName(song, artistsById, songsById);

const songCover = queueSong.cover_url

? getMediaUrl(queueSong.cover_url)

: getSongCover(queueSong);

return (

<button

type="button"

key={songId(song) ?? `${queueTitleEnglish}-${index}`}

className="full-player-queue-song"

onClick={() => playSelectedSong(song)}

>

{songCover && (

<img

src={songCover}

alt=""

onError={(event) => {

event.currentTarget.onerror = null;

event.currentTarget.style.display = "none";

}}

/>

)}

<span className="full-player-queue-song-info">

<strong>{queueTitleEnglish}</strong>

{queueTitleNative && queueTitleNative.trim() !== queueTitleEnglish.trim() && (

<small className="full-player-queue-native-title">{queueTitleNative}</small>

)}

<small>{queueArtistEnglish}</small>

</span>

<FaPlay />

</button>

);

})}

{upNext.length === 0 && (

<div className="full-player-queue-empty">

<FaListUl />

<strong>No songs in the queue</strong>

<p>Add more songs to continue listening.</p>

</div>

)}

</div>

</section>
      </div>
    )}
  </div>
)}

</main>,

document.body

);

}
