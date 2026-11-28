import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaExpand,
  FaHeart,
  FaPause,
  FaPlay,
  FaRandom,
  FaRedoAlt,
  FaRegHeart,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaMicrophone,
  FaListUl,
  FaUndo,
  FaRedo,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { useLikedSongs } from "../context/LikedSongsContext";
import { useAuth } from "../context/AuthContext";
import VerticalVolumeControl from "../components/VerticalVolumeControl";
import { getSongCover, getMediaUrl } from "../utils/media";
import "../assets/css/mini-player.css";
import { Capacitor } from "@capacitor/core";
/* =========================================================
   TIME FORMAT
\\\========================================================= */
function formatTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }
  return `${Math.floor(value / 60)}:${String(
    Math.floor(value % 60)
  ).padStart(2, "0")}`;
}
/* =========================================================
   LYRICS PARSER
\\\========================================================= */
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
      if (decimal.length === 1) {
        milliseconds *= 100;
      } else if (decimal.length === 2) {
        milliseconds *= 10;
      }
      return {
        id: `${index}-${line}`,
        time:
          Number(match[1]) * 60 +
          Number(match[2]) +
          milliseconds / 1000,
        text: match[4].trim(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}
/* =========================================================
   SONG ID HELPER
\\\========================================================= */
function songId(song) {
  return song?.id ?? song?.song_id ?? null;
}
/* =========================================================
   SONG DISPLAY NAMES
   English title first, Telugu title underneath, artist in English.
\\\========================================================= */
function getEnglishTitle(song) {
  return (
    song?.title_english ||
    song?.titleEnglish ||
    song?.english_title ||
    song?.title ||
    "Unknown Song"
  );
}
function getTeluguTitle(song) {
  const englishTitle = getEnglishTitle(song);
  const teluguTitle =
    song?.title_telugu ||
    song?.titleTelugu ||
    song?.telugu_title ||
    song?.title_native ||
    song?.native_title ||
    song?.title ||
    "";
  return teluguTitle && teluguTitle !== englishTitle ? teluguTitle : "";
}
const containsTelugu = (value) =>
  /[\u0C00-\u0C7F]/.test(String(value || ""));
function getEnglishArtists(song, artistsById = {}, songsById = {}) {
  const referenceSong =
    song?.id != null ? songsById[String(song.id)] || {} :
    song?.song_id != null ? songsById[String(song.song_id)] || {} : {};
  const source = { ...referenceSong, ...song };
  const names = [];
  const addName = (value) => {
    if (typeof value !== "string") return;
    // API fields sometimes contain a comma-separated list of singers.
    value.split(",").forEach((part) => {
      const name = part.trim();
      if (
        !name ||
        containsTelugu(name) ||
        /^(unknown artist|null|undefined|n\/a)$/i.test(name)
      ) return;
      if (!names.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
        names.push(name);
      }
    });
  };
  const addArtist = (artist) => {
    if (artist == null) return;
    if (typeof artist === "string" || typeof artist === "number") {
      const linked = artistsById[String(artist)];
      if (linked) addArtist(linked);
      else if (typeof artist === "string" && !/^\d+$/.test(artist.trim())) addName(artist);
      return;
    }
    if (typeof artist !== "object") return;
    const id = artist.id ?? artist.artist_id ?? artist.artistId;
    const linked = id != null ? artistsById[String(id)] || {} : {};
    [
      artist.name_english, artist.english_name, artist.nameEnglish,
      artist.englishName, artist.artist_name_english, artist.artist_english,
      artist.artist_name_en, artist.name_en, linked.name_english,
      linked.english_name, linked.nameEnglish, linked.englishName,
      linked.artist_name_english, linked.name,
      artist.name,
    ].forEach(addName);
  };

  const artistEntries = [
    ...(Array.isArray(source.artists) ? source.artists : source.artists ? [source.artists] : []),
    ...(Array.isArray(source.song_artists) ? source.song_artists : source.song_artists ? [source.song_artists] : []),
    ...(Array.isArray(source.artist) ? source.artist : []),
  ];
  artistEntries.forEach(addArtist);

  const ids = [
    ...(Array.isArray(source.artist_ids) ? source.artist_ids : []),
    ...(Array.isArray(source.artistIds) ? source.artistIds : []),
  ];
  ids.forEach(addArtist);

  if (names.length === 0) {
    const legacyId =
      source.artist_id ?? source.artistId ??
      (source.artist && !Array.isArray(source.artist)
        ? source.artist.id ?? source.artist.artist_id : null);
    if (legacyId != null) addArtist(artistsById[String(legacyId)] || { id: legacyId });
    const artistObject = source.artist && typeof source.artist === "object" && !Array.isArray(source.artist)
      ? source.artist : {};
    const nested = source.artist_details || source.artistDetails || {};
    [
      source.artist_name_english, source.artist_english, source.artist_english_name,
      source.artist_name_en, source.artistEnglishName, source.artistNameEnglish,
      source.artistEnglish, artistObject.name_english, artistObject.english_name,
      artistObject.nameEnglish, artistObject.name, nested.name_english,
      nested.english_name, nested.nameEnglish, nested.name,
      source.artist_name, source.artistName,
      typeof source.artist === "string" ? source.artist : "",
    ].forEach(addName);
  }
  return names.join(", ") || "Unknown Artist";
}
function SongTitleLines({ song, className = "" }) {
  return (
    <span className={`mini-song-title-lines ${className}`.trim()}>
      <strong className="mini-song-title-english">{getEnglishTitle(song)}</strong>
      {getTeluguTitle(song) && (
        <small className="mini-song-title-telugu">{getTeluguTitle(song)}</small>
      )}
    </span>
  );
}
/* =========================================================
   MINI PLAYER
\\\========================================================= */
export default function MiniPlayer({ onExpand }) {
const isAndroidNative =
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === "android";
  const navigate = useNavigate();
  const location = useLocation();
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
    closePlayer,
    playSong,
    playQueueSong,
  } = usePlayer();
  /* =======================================================
     LOCAL STATE
  ======================================================= */
  const [seekValue, setSeekValue] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const lyricLineRef = useRef(null);
  const queuePanelRef = useRef(null);
  const queueButtonRef = useRef(null);
  const [artistsById, setArtistsById] = useState({});
  const [songsById, setSongsById] = useState({});
  const [fetchedLyrics, setFetchedLyrics] = useState({ songId: null, text: "" });
  const [lyricsLoading, setLyricsLoading] = useState(false);
  /* =======================================================
     SONG DATA
  ======================================================= */
  const currentSongId = songId(currentSong);
  const directLyrics = [
    currentSong?.lyrics,
    currentSong?.song_lyrics,
    currentSong?.lyrics_text,
    currentSong?.lyric,
  ].find((value) => typeof value === "string" && value.trim());
  const lyrics =
    (typeof directLyrics === "string" ? directLyrics.trim() : "") ||
    (String(fetchedLyrics.songId) === String(currentSongId)
      ? fetchedLyrics.text
      : "");
  const syncedLyrics = useMemo(
    () => parseLyrics(lyrics),
    [lyrics]
  );
  const safeDuration = Number.isFinite(Number(duration))
    ? Math.max(0, Number(duration))
    : 0;
  const displayedTime =
    seekValue !== null
      ? Number(seekValue)
      : Number(currentTime) || 0;
  const activeLyricIndex = useMemo(() => {
    let active = -1;
    for (
      let index = 0;
      index < syncedLyrics.length;
      index += 1
    ) {
      if (displayedTime>= syncedLyrics[index].time) {
        active = index;
      } else {
        break;
      }
    }
    return active;
  }, [displayedTime, syncedLyrics]);
  const cover = currentSong ? getSongCover(currentSong) : "";
  const liked = currentSong?.id
    ? isLiked(currentSong.id)
    : false;
  const queueSongs = Array.isArray(queue) ? queue : [];
  const nextSongs = queueSongs.filter(
    (song) =>
      songId(song) == null ||
      currentSong?.id == null ||
      String(songId(song)) !== String(currentSong.id)
  );
  /* =======================================================
     LOAD ENGLISH ARTIST NAMES
     Same /artists fallback used by the All Songs page.
  ======================================================= */
  useEffect(() => {
    let active = true;
    const loadMetadata = async () => {
      const [artistsResult, songsResult] = await Promise.allSettled([
        API.get("/artists"),
        API.get("/songs"),
      ]);
      if (!active) return;

      if (artistsResult.status === "fulfilled") {
        const payload = artistsResult.value?.data;
        const list = Array.isArray(payload) ? payload :
          Array.isArray(payload?.artists) ? payload.artists :
          Array.isArray(payload?.data) ? payload.data : [];
        const lookup = {};
        list.forEach((artist) => {
          const id = artist?.id ?? artist?.artist_id ?? artist?.artistId;
          const englishName = artist?.name_english || artist?.english_name ||
            artist?.nameEnglish || artist?.englishName || artist?.name || "";
          if (id != null && englishName && !containsTelugu(englishName)) {
            lookup[String(id)] = { ...artist, name_english: String(englishName).trim() };
          }
        });
        setArtistsById(lookup);
      } else {
        console.warn("Unable to load artist directory:", artistsResult.reason);
      }

      if (songsResult.status === "fulfilled") {
        const payload = songsResult.value?.data;
        const list = Array.isArray(payload) ? payload :
          Array.isArray(payload?.songs) ? payload.songs :
          Array.isArray(payload?.data) ? payload.data : [];
        const lookup = {};
        list.forEach((song) => {
          const id = song?.id ?? song?.song_id;
          if (id != null) lookup[String(id)] = song;
        });
        setSongsById(lookup);
      } else {
        console.warn("Unable to load song artist relationships:", songsResult.reason);
      }
    };
    loadMetadata();
    return () => { active = false; };
  }, []);
  /* =======================================================
     LOAD FULL SONG LYRICS
     Playlist/search/queue items may contain only basic song fields.
     Song Details uses GET /songs/:id, so load that record when lyrics
     are not included in the current player queue item.
  ======================================================= */
  useEffect(() => {
    const id = songId(currentSong);
    if (id == null) {
      setFetchedLyrics({ songId: null, text: "" });
      setLyricsLoading(false);
      return undefined;
    }
    const existingLyrics = [
      currentSong?.lyrics,
      currentSong?.song_lyrics,
      currentSong?.lyrics_text,
      currentSong?.lyric,
    ].find((value) => typeof value === "string" && value.trim());
    if (existingLyrics) {
      setFetchedLyrics({ songId: id, text: existingLyrics.trim() });
      setLyricsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setFetchedLyrics({ songId: id, text: "" });
    setLyricsLoading(true);
    const loadLyrics = async () => {
      try {
        const response = await API.get(`/songs/${id}`);
        const payload = response?.data;
        const songData =
          payload?.song ||
          payload?.data?.song ||
          payload?.data ||
          payload;
        const lyricsValue = [
          songData?.lyrics,
          songData?.song_lyrics,
          songData?.lyrics_text,
          songData?.lyric,
        ].find((value) => typeof value === "string" && value.trim());
        if (!cancelled) {
          setFetchedLyrics({
            songId: id,
            text: typeof lyricsValue === "string" ? lyricsValue.trim() : "",
          });
        }
      } catch (error) {
        console.error(`Unable to load lyrics for song ${id}:`, error);
        if (!cancelled) {
          setFetchedLyrics({ songId: id, text: "" });
        }
      } finally {
        if (!cancelled) setLyricsLoading(false);
      }
    };
    loadLyrics();
    return () => {
      cancelled = true;
    };
  }, [currentSongId, currentSong]);
  /* =======================================================
     AUTO-SCROLL ACTIVE LYRIC
  ======================================================= */
  useEffect(() => {
    if (!lyricsOpen) return;
    lyricLineRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeLyricIndex, lyricsOpen]);
  /* =======================================================
     RESET PANELS WHEN SONG CHANGES
  ======================================================= */
  useEffect(() => {
    setLyricsOpen(false);
    setQueueOpen(false);
    setSeekValue(null);
  }, [currentSong?.id]);
  /* =======================================================
     ESCAPE KEY
  ======================================================= */
  useEffect(() => {
    if (!lyricsOpen && !queueOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLyricsOpen(false);
        setQueueOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lyricsOpen, queueOpen]);
  // Close the queue whenever the user navigates to another page.
  useEffect(() => {
    setQueueOpen(false);
  }, [location.pathname, location.search, location.hash]);
  // Close the queue when the user clicks anywhere outside the queue panel
  // and its toggle button, including the page behind the mini-player.
  useEffect(() => {
    if (!queueOpen) return undefined;
    const handleOutsidePointerDown = (event) => {
      const target = event.target;
      if (
        queuePanelRef.current?.contains(target) ||
        queueButtonRef.current?.contains(target)
      ) {
        return;
      }
      setQueueOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [queueOpen]);
  /* =======================================================
     PLAYER HANDLERS
  ======================================================= */
  if (!currentSong) return null;
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
  const commitSeek = () => {
    if (seekValue === null) return;
    seek(Number(seekValue));
    setSeekValue(null);
  };
  const handleQueueSong = async (song) => {
    try {
      if (typeof playQueueSong === "function") {
        await playQueueSong(song);
      } else if (typeof playSong === "function") {
        await playSong(song, queueSongs);
      }
      setQueueOpen(false);
    } catch (error) {
      console.error("Queue playback error:", error);
    }
  };
  /* =======================================================
     PANEL OPEN/CLOSE HANDLERS
     Lyrics = dedicated overlay.
     Queue  = compact floating panel.
  ======================================================= */
  const openLyrics = () => {
    setQueueOpen(false);
    setLyricsOpen(true);
  };
  const closeLyrics = () => {
    setLyricsOpen(false);
  };
  const openQueue = () => {
    setLyricsOpen(false);
    setQueueOpen((previous) => !previous);
  };
  const closeQueue = () => {
    setQueueOpen(false);
  };
  /* =======================================================
     LYRICS OVERLAY
     Lyrics retains its focused overlay experience.
  ======================================================= */
  const lyricsPanel = lyricsOpen && (
    <div
      className="mini-player-overlay"
      onClick={closeLyrics}
   >
      <section
        className="mini-player-panel mini-player-lyrics-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Song lyrics"
        onClick={(event) => event.stopPropagation()}
     >
        <header className="mini-panel-header">
          <div className="mini-panel-heading">
            <span className="mini-panel-eyebrow">
              KEERTHANA MUSIC
            </span>
            <h2>Live Lyrics</h2>
            <span className="mini-lyrics-live-badge">● LIVE SYNC</span>
            <p>
              {getEnglishTitle(currentSong)} ·{" "}
              {getEnglishArtists(currentSong, artistsById, songsById)}
            </p>
          </div>
          <button
            type="button"
            className="mini-panel-close"
            onClick={closeLyrics}
            aria-label="Close lyrics"
            title="Close lyrics"
         >
            <FaTimes />
          </button>
        </header>
        <div className="mini-lyrics-content">
          {lyricsLoading && !lyrics ? (
            <div className="mini-panel-empty" role="status">
              <FaMicrophone />
              <h3>Loading lyrics...</h3>
              <p>Please wait while we load this song's lyrics.</p>
            </div>
          ) : !lyrics ? (
            <div className="mini-panel-empty">
              <FaMicrophone />
              <h3>Lyrics not available</h3>
              <p>
                Lyrics have not been added for this song yet.
              </p>
            </div>
          ) : syncedLyrics.length> 0 ? (
            <div className="mini-synced-lyrics">
              {syncedLyrics.map((line, index) => (
                <button
                  key={line.id}
                  type="button"
                  ref={
                    index === activeLyricIndex
                      ? lyricLineRef
                      : null
                  }
                  className={
                    index === activeLyricIndex
                      ? "mini-lyric-line active"
                      : "mini-lyric-line"
                  }
                  onClick={() => seek(line.time)}
                  title="Jump to this lyric"
               >
                  <span>{line.text}</span>
                  {index === activeLyricIndex && <small className="mini-lyrics-live-indicator">NOW PLAYING</small>}
                </button>
              ))}
            </div>
          ) : (
            <div className="mini-plain-lyrics">
              {lyrics.split(/\r?\n/).map((line, index) => (
                <p key={`${index}-${line}`}>
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
  /* =======================================================
     QUEUE FLOATING PANEL
     Important:
     - No full-screen backdrop.
     - Does not block the rest of the page.
     - Does not use aria-modal="true".
     - Floats above the mini-player.
     - Uses its own CSS class, separate from lyrics.
  ======================================================= */
  const queuePanel = queueOpen && (
    <div className="mini-queue-popover-root">
      <section
        className="mini-player-panel mini-player-queue-panel"
        ref={queuePanelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Song queue"
     >
        <header className="mini-panel-header">
          <div className="mini-panel-heading">
            <span className="mini-panel-eyebrow">
              YOUR LISTENING SESSION
            </span>
            <h2>Up Next</h2>
            <p>
              {nextSongs.length} song
              {nextSongs.length === 1 ? "" : "s"} in queue
            </p>
          </div>
          <button
            type="button"
            className="mini-panel-close"
            onClick={closeQueue}
            aria-label="Close queue"
            title="Close queue"
         >
            <FaTimes />
          </button>
        </header>
        <div className="mini-queue-current">
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
          <div className="mini-queue-current-info">
            <span>NOW PLAYING</span>
            <SongTitleLines song={currentSong} className="mini-queue-current-title" />
            <small>{getEnglishArtists(currentSong, artistsById, songsById)}</small>
          </div>
          <span
            className={
              isPlaying
                ? "mini-queue-status playing"
                : "mini-queue-status"
            }
         >
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </div>
        <div className="mini-queue-list">
          {nextSongs.map((song, index) => {
            const songCover = song.cover_url
              ? getMediaUrl(song.cover_url)
              : getSongCover(song);
            return (
              <button
                type="button"
                className="mini-queue-song"
                key={
                  songId(song) ??
                  `${song.title}-${index}`
                }
                onClick={() => handleQueueSong(song)}
                title={`Play ${song.title || "song"}`}
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
                <span className="mini-queue-song-info">
                  <SongTitleLines song={song} />
                  <small>{getEnglishArtists(song, artistsById, songsById)}</small>
                </span>
                <FaPlay className="mini-queue-play-icon" />
              </button>
            );
          })}
          {nextSongs.length === 0 && (
            <div className="mini-panel-empty">
              <FaListUl />
              <h3>Your queue is empty</h3>
              <p>
                Choose more songs to keep listening.
              </p>
            </div>
          )}
        </div>
        <footer className="mini-queue-footer">
          <span>
            <FaListUl />
            Listening queue
          </span>
          <button
            type="button"
            onClick={closeQueue}
         >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
  /* =======================================================
     MINI PLAYER UI
  ======================================================= */
  return (
    <>
      {typeof document !== "undefined" &&
        createPortal(
          <section
            className={`keerthana-mini-player ${
              isAndroidNative ? "keerthana-android-native" : ""
            }`}
            onClick={(event) => {
              // Tapping anywhere on the mini-player opens the full player.
              // Buttons and the progress slider keep their own actions.
              if (event.target.closest('button, input, [role="slider"]')) return;
              onExpand?.();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onExpand?.();
              }
            }}
            aria-label="KEERTHANA mini player"
         >
            {/* Progress indicator */}
            <div className="mini-player-progress-top">
              <span
                style={{
                  width: `${
                    safeDuration> 0
                      ? Math.min(
                          100,
                          (displayedTime / safeDuration) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
            {/* Song information */}
            <div className="mini-player-song">
              <button
                className="mini-player-cover-button"
                type="button"
                onClick={onExpand}
                aria-label="Open full player"
             >
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
              </button>
              <div className="mini-player-song-info">
                <button
                  type="button"
                  className="mini-player-title"
                  onClick={(event) => {
                    // Keep Mini Player navigation consistent:
                    // tapping the song title opens the Full Player.
                    event.stopPropagation();
                    onExpand?.();
                  }}
                  title={getEnglishTitle(currentSong)}
               >
                  <SongTitleLines song={currentSong} />
                </button>
                <span>
                  {getEnglishArtists(currentSong, artistsById, songsById)}
                </span>
              </div>
              <button
                type="button"
                className={`mini-player-like ${
                  liked ? "is-liked" : ""
                }`}
                onClick={handleLike}
                aria-label={liked ? "Unlike song" : "Like song"}
                title={liked ? "Unlike song" : "Like song"}
             >
                {liked ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>
            {/* Playback controls */}
            <div className="mini-player-center">
              <div className="mini-player-controls">
                <button
                  type="button"
                  className={isShuffle ? "is-active" : ""}
                  onClick={toggleShuffle}
                  disabled={nextSongs.length === 0}
                  aria-label="Shuffle"
                  title="Shuffle"
               >
                  <FaRandom />
                </button>
                <button
                  type="button"
                  onClick={previousSong}
                  disabled={nextSongs.length === 0}
                  aria-label="Previous song"
                  title="Previous"
               >
                  <FaStepBackward />
                </button>
                <button
                  type="button"
                  className="mini-player-seek-button"
                  onClick={() => seekBackward(10)}
                  aria-label="Rewind 10 seconds"
                  title="Rewind 10 seconds"
               >
                  <FaUndo />
                  <span>10</span>
                </button>
                <button
                  type="button"
                  className="mini-player-play"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
               >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  type="button"
                  className="mini-player-seek-button"
                  onClick={() => seekForward(10)}
                  aria-label="Forward 10 seconds"
                  title="Forward 10 seconds"
               >
                  <FaRedo />
                  <span>10</span>
                </button>
                <button
                  type="button"
                  onClick={nextSong}
                  disabled={nextSongs.length === 0}
                  aria-label="Next song"
                  title="Next"
               >
                  <FaStepForward />
                </button>
                <button
                  type="button"
                  className={
                    repeatMode !== "off" ? "is-active" : ""
                  }
                  onClick={toggleRepeat}
                  aria-label="Repeat"
                  title="Repeat"
               >
                  <FaRedoAlt />
                  {repeatMode === "one" && (
                    <span>1</span>
                  )}
                </button>
              </div>
              {/* Progress slider */}
              <div className="mini-player-progress">
                <span>{formatTime(displayedTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={safeDuration || 1}
                  step="0.1"
                  value={Math.min(
                    displayedTime,
                    safeDuration || 0
                  )}
                  disabled={safeDuration <= 0}
                  onChange={(event) =>
                    setSeekValue(Number(event.target.value))
                  }
                  onPointerUp={commitSeek}
                  onKeyUp={commitSeek}
                  onTouchEnd={commitSeek}
                  aria-label="Song progress"
                />
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>
            {/* Player tools */}
            <div className="mini-player-actions">
              <button
                type="button"
                className={`mini-player-tool ${
                  lyricsOpen ? "is-active" : ""
                }`}
                onClick={openLyrics}
                aria-label="Open lyrics"
                title="Lyrics"
             >
                <FaMicrophone />
                <span>Lyrics</span>
              </button>
              <button
                type="button"
                className={`mini-player-tool ${
                  queueOpen ? "is-active" : ""
                }`}
                onClick={openQueue}
                ref={queueButtonRef}
                aria-label="Toggle queue"
                aria-expanded={queueOpen}
                title="Queue"
             >
                <FaListUl />
                <span>Queue</span>
              </button>
{/*
              <div className="mini-player-sleep">
                <SleepTimer />
              </div> */}
              <VerticalVolumeControl
                volume={volume}
                onVolumeChange={changeVolume}
              />
              <button
                type="button"
                className="mini-player-expand"
                onClick={onExpand}
                title="Open full player"
                aria-label="Open full player"
             >
                <FaExpand />
              </button>
              <button
                type="button"
                className="mini-player-close"
                onClick={closePlayer}
                title="Close player"
                aria-label="Close player"
             >
                <FaTimes />
              </button>
            </div>
          </section>,
          document.body
        )}
      {/* Lyrics remains a full overlay */}
      {typeof document !== "undefined" &&
        lyricsPanel &&
        createPortal(lyricsPanel, document.body)}
      {/* Queue is a compact floating panel */}
      {typeof document !== "undefined" &&
        queuePanel &&
        createPortal(queuePanel, document.body)}
    </>
  );
}
