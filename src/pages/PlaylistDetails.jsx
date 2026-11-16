
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaMusic,
  FaPlay,
  FaPause,
  FaPlus,
  FaTrash,
  FaTimes,
  FaSearch,
  FaBroom,
} from "react-icons/fa";

import API from "../services/api";
import { usePlayer } from "../context/usePlayer";
import { getMediaUrl } from "../utils/media";
import VoiceSearch from "../components/VoiceSearch";

import "../assets/css/playlistDetails.css";



const VOICE_LANGUAGES = [
  { value: "te-IN", label: "Telugu" },
  { value: "hi-IN", label: "Hindi" },
  { value: "en-IN", label: "English" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ta-IN", label: "Tamil" },
];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getPlaylistFromResponse = (response) => {
  const data = response?.data;

  return (
    data?.playlist ||
    data?.data?.playlist ||
    data?.data ||
    data ||
    null
  );
};

const getSongsFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data?.songs)) return data.songs;
  if (Array.isArray(data?.data?.songs)) return data.data.songs;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getArtistsFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data?.artists)) return data.artists;
  if (Array.isArray(data?.data?.artists)) return data.data.artists;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const hasTeluguScript = (value) =>
  /[\u0C00-\u0C7F]/.test(String(value || ""));

const isUsableEnglishArtistName = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  const normalized = value.trim().toLowerCase();

  return (
    !hasTeluguScript(value) &&
    !["unknown artist", "unknown", "n/a", "null", "undefined"].includes(normalized)
  );
};

const getSongArtistId = (song) =>
  song?.artist_id ??
  song?.artistId ??
  song?.artist?.id ??
  song?.artist?.artist_id ??
  (typeof song?.artist === "number" || typeof song?.artist === "string"
    ? song.artist
    : null);

const buildArtistMap = (artists) => {
  const map = {};

  artists.forEach((artist) => {
    const artistId = artist?.id ?? artist?.artist_id ?? artist?.artistId;
    if (artistId == null) return;
    map[String(artistId)] = artist;
  });

  return map;
};

const getSongId = (song) =>
  song?.id ?? song?.song_id ?? song?.songId ?? null;

const getSongAudioSource = (song) =>
  song?.audio_url ||
  song?.audioUrl ||
  song?.audio_file ||
  song?.audioFile ||
  song?.audio ||
  song?.stream_url ||
  song?.streamUrl ||
  song?.file_url ||
  song?.fileUrl ||
  song?.url ||
  "";

const hasSongAudio = (song) =>
  Boolean(String(getSongAudioSource(song) || "").trim());

const buildSongMap = (songs) => {
  const map = {};
  songs.forEach((song) => {
    const songId = getSongId(song);
    if (songId != null) map[String(songId)] = song;
  });
  return map;
};

const enrichSongWithArtist = (song, songMap = {}, artistMap = {}) => {
  const songId = getSongId(song);
  const catalogueSong = songId != null ? songMap[String(songId)] : null;

  // Playlist responses can contain partial song objects. Merge the canonical
  // catalogue record while preserving all artist associations from either source.
  const mergedSong = catalogueSong
    ? { ...catalogueSong, ...song }
    : { ...song };

  const sourceArtists = [
    ...(Array.isArray(catalogueSong?.artists) ? catalogueSong.artists : []),
    ...(Array.isArray(song?.artists) ? song.artists : []),
  ];

  const artistIds = [
    ...(Array.isArray(catalogueSong?.artist_ids) ? catalogueSong.artist_ids : []),
    ...(Array.isArray(song?.artist_ids) ? song.artist_ids : []),
    ...sourceArtists.map((artist) =>
      typeof artist === "object" ? artist?.id ?? artist?.artist_id : artist
    ),
  ];

  const legacyArtistId =
    getSongArtistId(mergedSong) ?? getSongArtistId(catalogueSong);

  const resolvedArtists = [];
  const seen = new Set();

  const addArtist = (artistOrId) => {
    if (artistOrId == null) return;

    const artistId =
      typeof artistOrId === "object"
        ? artistOrId?.id ?? artistOrId?.artist_id ?? artistOrId?.artistId
        : artistOrId;

    const mappedArtist =
      artistId != null ? artistMap[String(artistId)] : null;

    const artist =
      typeof artistOrId === "object"
        ? { ...(mappedArtist || {}), ...artistOrId }
        : mappedArtist;

    if (!artist) return;

    const key = String(
      artist?.id ?? artist?.artist_id ?? artist?.artistId ?? artist?.name_english ??
      artist?.english_name ?? artist?.nameEnglish ?? ""
    ).toLowerCase();

    if (!key || seen.has(key)) return;
    seen.add(key);
    resolvedArtists.push(artist);
  };

  sourceArtists.forEach(addArtist);
  artistIds.forEach(addArtist);
  if (legacyArtistId != null) addArtist(legacyArtistId);

  const artists = resolvedArtists.length
    ? resolvedArtists
    : sourceArtists.filter((artist) => typeof artist === "object");

  const firstArtist = artists[0] || mergedSong.artist;
  const firstArtistId =
    firstArtist?.id ?? firstArtist?.artist_id ?? legacyArtistId ??
    mergedSong.artist_id;

  return {
    ...mergedSong,
    ...(artists.length ? { artists } : {}),
    ...(artistIds.length ? { artist_ids: [...new Set(artistIds.map(String))] } : {}),
    ...(firstArtistId != null ? { artist_id: firstArtistId } : {}),
    ...(firstArtist ? { artist: firstArtist } : {}),
  };
};

const getSongTitles = (song) => {
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

  const primary = String(englishTitle || "Unknown Song").trim();
  const secondary = String(teluguTitle || "").trim();

  return {
    primary,
    secondary: secondary && secondary !== primary ? secondary : "",
  };
};

const getSongTitle = (song) => getSongTitles(song).primary;

const getSongArtistNames = (song, artistMap = {}) => {
  const names = [];
  const seen = new Set();

  const addName = (value) => {
    if (!isUsableEnglishArtistName(value)) return;
    const name = value.trim();
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };

  const addArtist = (artistOrId) => {
    if (artistOrId == null) return;

    const artistId =
      typeof artistOrId === "object"
        ? artistOrId?.id ?? artistOrId?.artist_id ?? artistOrId?.artistId
        : artistOrId;

    const matchedArtist =
      artistId != null ? artistMap[String(artistId)] : null;

    const artist =
      typeof artistOrId === "object"
        ? { ...(matchedArtist || {}), ...artistOrId }
        : matchedArtist;

    if (artist) {
      addName(artist.name_english);
      addName(artist.english_name);
      addName(artist.nameEnglish);
      addName(artist.artist_name_english);
      addName(artist.name);
    } else if (typeof artistOrId === "string" && !/^\\d+$/.test(artistOrId.trim())) {
      addName(artistOrId);
    }
  };

  if (Array.isArray(song?.artists)) song.artists.forEach(addArtist);
  if (Array.isArray(song?.artist_ids)) song.artist_ids.forEach(addArtist);
  addArtist(getSongArtistId(song));

  // Keep support for older API responses that only expose a single artist.
  [
    song?.artist_name_english,
    song?.artist_english,
    song?.artistEnglish,
    song?.artistEnglishName,
    song?.artist?.name_english,
    song?.artist?.english_name,
    song?.artist?.nameEnglish,
    song?.artist?.artist_name_english,
    song?.artist_name,
    song?.artistName,
    song?.artist?.name,
    typeof song?.artist === "string" ? song.artist : "",
  ].forEach(addName);

  return names.length ? names.join(", ") : "Artist details unavailable";
};

const getSongArtist = (song, artistMap = {}) =>
  getSongArtistNames(song, artistMap);

const getSongSearchFields = (song) => [
  song?.title,
  song?.title_english,
  song?.titleEnglish,
  song?.title_telugu,
  song?.titleTelugu,
  song?.english_title,
  song?.englishTitle,
  song?.artist_name_english,
  song?.artist_english,
  song?.artistEnglish,
  song?.artist_name,
  song?.artist?.name_english,
  song?.artist?.english_name,
  song?.artist?.name,
  ...(Array.isArray(song?.artist_ids) ? song.artist_ids : []),
  ...(Array.isArray(song?.artists)
    ? song.artists.flatMap((artist) => [
        typeof artist === "string" ? artist : "",
        artist?.name_english,
        artist?.english_name,
        artist?.nameEnglish,
        artist?.artist_name_english,
        artist?.name,
      ])
    : []),
  song?.album_name,
  song?.album?.name,
  song?.category_name,
  song?.category?.name,
  song?.language,
];

/* =========================================================
   COMPONENT
========================================================= */

function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [artistMap, setArtistMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [songsError, setSongsError] = useState("");

  const [showAddSongs, setShowAddSongs] = useState(false);

  const [playlistSearch, setPlaylistSearch] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [visibleSongLimit, setVisibleSongLimit] = useState(10);
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");

  /* =======================================================
     LOAD ARTIST DIRECTORY
  ======================================================= */

  /* =======================================================
     LOAD PLAYLIST
  ======================================================= */

  const fetchPlaylist = useCallback(async () => {
    if (!id) {
      setPlaylist(null);
      setError("Playlist ID is missing.");
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError("");

      const [response, songsResponse, artistsResponse] = await Promise.all([
        API.get(`/playlists/${id}`),
        API.get("/songs"),
        API.get("/artists"),
      ]);
      const loadedPlaylist = getPlaylistFromResponse(response);

      const catalogueSongs = getSongsFromResponse(songsResponse);
      const nextArtistMap = buildArtistMap(getArtistsFromResponse(artistsResponse));
      const catalogueSongMap = buildSongMap(catalogueSongs);
      setArtistMap(nextArtistMap);

      if (!loadedPlaylist || loadedPlaylist.id == null) {
        setPlaylist(null);
        setError("Playlist not found.");
        return null;
      }

      const normalizedPlaylist = {
        ...loadedPlaylist,
        songs: (Array.isArray(loadedPlaylist.songs)
          ? loadedPlaylist.songs
          : []
        ).map((song) =>
          enrichSongWithArtist(song, catalogueSongMap, nextArtistMap)
        ),
      };

      setPlaylist(normalizedPlaylist);

      return normalizedPlaylist;
    } catch (err) {
      console.error("Load playlist error:", err);

      setPlaylist(null);
      setError(
        err.response?.data?.message ||
          "Unable to load playlist."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  /* =======================================================
     LOAD AVAILABLE SONGS
  ======================================================= */

  const fetchAllSongs = useCallback(async () => {
    try {
      setSongsLoading(true);
      setSongsError("");

      const [songsResponse, artistsResponse] = await Promise.all([
        API.get("/songs"),
        API.get("/artists"),
      ]);

      const artists = getArtistsFromResponse(artistsResponse);
      const nextArtistMap = buildArtistMap(artists);

      setArtistMap(nextArtistMap);
      const catalogueSongs = getSongsFromResponse(songsResponse);
      const catalogueSongMap = buildSongMap(catalogueSongs);

      setAllSongs(
        catalogueSongs.map((song) =>
          enrichSongWithArtist(song, catalogueSongMap, nextArtistMap)
        )
      );

      setPlaylist((current) =>
        current
          ? {
              ...current,
              songs: (current.songs || []).map((song) =>
                enrichSongWithArtist(song, catalogueSongMap, nextArtistMap)
              ),
            }
          : current
      );
    } catch (err) {
      console.error("Load songs error:", err);

      setSongsError(
        err.response?.data?.message ||
          "Unable to load songs."
      );
    } finally {
      setSongsLoading(false);
    }
  }, []);

  /* =======================================================
     OPEN / CLOSE ADD SONGS MODAL
  ======================================================= */

  const openAddSongs = async () => {
    setSongSearch("");
    setVisibleSongLimit(10);
    setSongsError("");
    setShowAddSongs(true);

    await fetchAllSongs();
  };

  const closeAddSongs = () => {
    if (actionLoading) return;

    setShowAddSongs(false);
    setSongSearch("");
    setVisibleSongLimit(10);
    setSongsError("");
  };

  /* =======================================================
     SEARCH AVAILABLE SONGS
  ======================================================= */

  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLowerCase();

    if (!query) return allSongs;

    return allSongs.filter((song) =>
      getSongSearchFields(song).some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [allSongs, songSearch]);

  const visibleSongs = useMemo(
    () => filteredSongs.slice(0, visibleSongLimit),
    [filteredSongs, visibleSongLimit]
  );

  /* =======================================================
     SEARCH CURRENT PLAYLIST SONGS
  ======================================================= */

  const playlistSongs = playlist?.songs || [];

  const filteredPlaylistSongs = useMemo(() => {
    const query = playlistSearch.trim().toLowerCase();

    if (!query) return playlistSongs;

    return playlistSongs.filter((song) =>
      [
        ...getSongSearchFields(song),
        getSongArtist(song, artistMap),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [playlistSongs, playlistSearch, artistMap]);

  /* =======================================================
     CHECK IF SONG ALREADY EXISTS
  ======================================================= */

  const songExistsInPlaylist = useCallback(
    (songId) =>
      (playlist?.songs || []).some(
        (song) => String(song.id) === String(songId)
      ),
    [playlist?.songs]
  );

  /* =======================================================
     ADD SONG TO PLAYLIST
  ======================================================= */

  const addSong = async (songId) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setSongsError("");

      const songToAdd = allSongs.find(
        (song) => String(song.id) === String(songId)
      );

      if (!songToAdd) {
        setSongsError("Unable to find this song.");
        return;
      }

      if (!hasSongAudio(songToAdd)) {
        setSongsError(
          "Audio is not available for this song."
        );
        return;
      }

      if (songExistsInPlaylist(songId)) {
        setSongsError(
          "This song is already in the playlist."
        );
        return;
      }

      await API.post(`/playlists/${id}/songs/${songId}`);

      const response = await API.get(`/playlists/${id}`);
      const updatedPlaylist = getPlaylistFromResponse(response);

      if (!updatedPlaylist) {
        setSongsError(
          "Song added, but unable to refresh the playlist."
        );
        return;
      }

      const catalogueSongMap = buildSongMap(allSongs);
      const updatedSongs = (Array.isArray(updatedPlaylist.songs)
        ? updatedPlaylist.songs
        : []).map((song) =>
          enrichSongWithArtist(song, catalogueSongMap, artistMap)
        );

      setPlaylist({
        ...updatedPlaylist,
        songs: updatedSongs,
      });

      const addedSong = updatedSongs.find(
        (song) => String(song.id) === String(songId)
      );

      setShowAddSongs(false);
      setSongSearch("");

      if (addedSong) {
        try {
          await playSong(addedSong, updatedSongs);
        } catch (playError) {
          console.error(
            "Song added, but playback failed:",
            playError
          );

          setError(
            "Song added, but playback could not start."
          );
        }
      }
    } catch (err) {
      console.error("Add song error:", err);

      setSongsError(
        err.response?.data?.message ||
          "Unable to add this song."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     REMOVE SONG FROM PLAYLIST
  ======================================================= */

  const removeSong = async (songId) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      await API.delete(
        `/playlists/${id}/songs/${songId}`
      );

      await fetchPlaylist();
    } catch (err) {
      console.error("Remove song error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove song."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     CLEAR ALL PLAYLIST SONGS
  ======================================================= */

  const clearSongs = async () => {
    if (!playlistSongs.length || actionLoading) return;

    const confirmed = window.confirm(
      `Remove all ${playlistSongs.length} songs from "${playlist.name}"? The playlist itself will remain.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      for (const song of playlistSongs) {
        await API.delete(
          `/playlists/${id}/songs/${song.id}`
        );
      }

      await fetchPlaylist();
      setPlaylistSearch("");
    } catch (err) {
      console.error("Clear playlist songs error:", err);

      setError(
        err.response?.data?.message ||
          "Some songs could not be removed. Refresh the playlist and try again."
      );

      await fetchPlaylist();
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     DELETE PLAYLIST
  ======================================================= */

  const deletePlaylist = async () => {
    if (!playlist || actionLoading) return;

    const confirmed = window.confirm(
      `Delete "${playlist.name}"? This will delete the playlist.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/playlists/${id}`);

      navigate("/playlists", { replace: true });
    } catch (err) {
      console.error("Delete playlist error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete playlist."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     PLAYBACK HELPERS
  ======================================================= */

  const isCurrentSong = (song) => {
    const currentId = getSongId(currentSong);
    const selectedId = getSongId(song);

    return (
      currentId != null &&
      selectedId != null &&
      String(currentId) === String(selectedId)
    );
  };

  const isSongPlaying = (song) =>
    isCurrentSong(song) && Boolean(isPlaying);

  const handleSongPlayPause = async (song) => {
    if (!song) return;

    if (!hasSongAudio(song)) {
      setError("Audio is not available for this song.");
      return;
    }

    try {
      setError("");

      if (isCurrentSong(song)) {
        if (typeof togglePlay === "function") {
          await togglePlay();
        } else {
          throw new Error("Playback controls are unavailable.");
        }
        return;
      }

      if (typeof playSong !== "function") {
        throw new Error("Song playback is unavailable.");
      }

      const selectedId = getSongId(song);
      const queueIndex = playlistSongs.findIndex(
        (item) => String(getSongId(item)) === String(selectedId)
      );

      // PlayerContext expects the selected song, the queue, and its index.
      // Supplying the real index keeps the queue and active track in sync.
      await playSong(
        song,
        playlistSongs.length ? playlistSongs : [song],
        queueIndex >= 0 ? queueIndex : 0
      );
    } catch (err) {
      console.error("Song playback error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to play this song. Please try again."
      );
    }
  };

  const handlePlaylistPlayPause = async () => {
    if (!playlistSongs.length) return;

    const currentBelongsToPlaylist = playlistSongs.some(
      (song) =>
        String(song.id) === String(currentSong?.id)
    );

    try {
      setError("");

      if (currentBelongsToPlaylist) {
        await togglePlay();
        return;
      }

      const firstPlayableSong = playlistSongs.find(hasSongAudio);

      if (!firstPlayableSong) {
        setError("No playable songs in this playlist.");
        return;
      }

      await playSong(firstPlayableSong, playlistSongs);
    } catch (err) {
      console.error("Playlist playback error:", err);
      setError("Unable to play this playlist.");
    }
  };

  const playlistPlaying =
    Boolean(playlistSongs.length) &&
    Boolean(isPlaying) &&
    playlistSongs.some(
      (song) =>
        String(song.id) === String(currentSong?.id)
    );

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <main className="playlist-details-page">
        <div
          className="playlist-loading"
          role="status"
          aria-live="polite"
        >
          <span className="playlist-loading-spinner" />
          <FaMusic aria-hidden="true" />
          <span>Loading playlist...</span>
        </div>
      </main>
    );
  }

  /* =======================================================
     PLAYLIST NOT FOUND
  ======================================================= */

  if (!playlist) {
    return (
      <main className="playlist-details-page">
        <button
          type="button"
          className="playlist-back-button"
          onClick={() => navigate("/playlists")}
        >
          <FaArrowLeft aria-hidden="true" />
          Back to Playlists
        </button>

        <div className="playlist-error" role="alert">
          <span>{error || "Playlist not found."}</span>

          <button
            type="button"
            onClick={fetchPlaylist}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <main className="playlist-details-page">
      <button
        type="button"
        className="playlist-back-button"
        onClick={() => navigate("/playlists")}
      >
        <FaArrowLeft aria-hidden="true" />
        Back to Playlists
      </button>

      {/* PLAYLIST HERO */}

      <section className="playlist-hero">
        <div className="playlist-large-cover">
          {playlist.cover_url && (
            <img
              src={getMediaUrl(playlist.cover_url)}
              alt={`${playlist.name} cover`}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        <div className="playlist-hero-info">
          <span className="playlist-label">
            YOUR COLLECTION
          </span>

          <h1>{playlist.name}</h1>

          <p>
            {playlist.description ||
              "Your personal music collection"}
          </p>
        </div>
      </section>

      {/* PLAYLIST ACTIONS */}

      <section
        className="playlist-actions"
        aria-label="Playlist actions"
      >
        <button
          type="button"
          className={`playlist-main-play ${
            playlistPlaying ? "is-playing" : ""
          }`}
          onClick={handlePlaylistPlayPause}
          disabled={actionLoading || !playlistSongs.length}
          aria-label={
            playlistPlaying ? "Pause playlist" : "Play playlist"
          }
        >
          {playlistPlaying ? <FaPause /> : <FaPlay />}
          <span>{playlistPlaying ? "Pause" : "Play All"}</span>
        </button>

        <button
          type="button"
          className="playlist-add-button"
          onClick={openAddSongs}
          disabled={actionLoading}
        >
          <FaPlus aria-hidden="true" />
          Add Songs
        </button>

        <button
          type="button"
          className="playlist-clear-button"
          onClick={clearSongs}
          disabled={actionLoading || !playlistSongs.length}
        >
          <FaBroom aria-hidden="true" />
          Clear Songs
        </button>

        <button
          type="button"
          className="playlist-delete-button"
          onClick={deletePlaylist}
          disabled={actionLoading}
        >
          <FaTrash aria-hidden="true" />
          Delete Playlist
        </button>
      </section>

      {/* GENERAL ERROR */}

      {error && (
        <div className="playlist-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
      )}

      {/* PLAYLIST SONGS */}

      <section className="playlist-song-section">
        <div className="playlist-section-heading">
          <div>
            <span className="playlist-section-eyebrow">
              NOW AND ALWAYS
            </span>

            <h2>Playlist songs</h2>
          </div>

          <span className="playlist-count">
            {playlistSongs.length}{" "}
            {playlistSongs.length === 1 ? "song" : "songs"}
          </span>
        </div>

        {/* VOICE SEARCH AND LANGUAGE */}

        <div className="playlist-voice-search">
          <div className="playlist-voice-search-control">
            <VoiceSearch
              value={playlistSearch}
              onChange={setPlaylistSearch}
              onSearch={setPlaylistSearch}
              language={voiceLanguage}
              placeholder="Search songs in this playlist..."
              ariaLabel="Search songs in this playlist"
            />
          </div>
{/* 
          <div className="playlist-voice-language">
            <label htmlFor="playlist-voice-language-select">
              Voice search language
            </label>

            <select
              id="playlist-voice-language-select"
              value={voiceLanguage}
              onChange={(event) =>
                setVoiceLanguage(event.target.value)
              }
              aria-label="Choose voice search language"
            >
              {VOICE_LANGUAGES.map((language) => (
                <option
                  key={language.value}
                  value={language.value}
                >
                  {language.label}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        {/* SEARCH RESULTS COUNT */}

        <div
          className="playlist-page-search-summary"
          aria-live="polite"
        >
          {playlistSearch.trim()
            ? `${filteredPlaylistSongs.length} matching ${
                filteredPlaylistSongs.length === 1
                  ? "song"
                  : "songs"
              }`
            : `${playlistSongs.length} ${
                playlistSongs.length === 1 ? "song" : "songs"
              } in this playlist`}
        </div>

        {/* EMPTY PLAYLIST */}

        {!playlistSongs.length ? (
          <div className="playlist-empty-state">
            <div className="playlist-empty-icon">
              <FaMusic aria-hidden="true" />
            </div>

            <h2>Your playlist is waiting</h2>

            <p>
              Add your favorite Christian songs and create a
              collection for every moment of worship.
            </p>

            <button
              type="button"
              onClick={openAddSongs}
            >
              <FaPlus aria-hidden="true" />
              Add Your First Songs
            </button>
          </div>
        ) : filteredPlaylistSongs.length === 0 ? (
          /* NO SEARCH RESULTS */

          <div className="playlist-empty-state playlist-search-empty">
            <div className="playlist-empty-icon">
              <FaSearch aria-hidden="true" />
            </div>

            <h2>No songs found</h2>

            <p>
              Try another song title, artist, album, or language.
            </p>

            <button
              type="button"
              onClick={() => setPlaylistSearch("")}
            >
              <FaTimes aria-hidden="true" />
              Clear Search
            </button>
          </div>
        ) : (
          /* SONG TABLE */

          <div className="playlist-song-list">
            <div className="playlist-table-header">
              {/* SONG NUMBER HEADER REMOVED */}
              <span>SONG</span>
              <span className="playlist-table-action-heading">
                ACTION
              </span>
            </div>

            {filteredPlaylistSongs.map((song, index) => {
              const current = isCurrentSong(song);
              const playing = isSongPlaying(song);
              const { primary: title, secondary: nativeTitle } =
                getSongTitles(song);

              return (
                <div
                  className={`playlist-song-row ${
                    current ? "is-current" : ""
                  } ${playing ? "is-playing" : ""}`}
                  key={getSongId(song) ?? index}
                >
                  {/* PLAY BUTTON — SONG NUMBER REMOVED */}

                  <div className="playlist-song-number">
                    <button
                      type="button"
                      className={`playlist-song-play ${
                        playing ? "is-playing" : ""
                      }`}
                      onClick={() => handleSongPlayPause(song)}
                      disabled={!hasSongAudio(song) || actionLoading}
                      aria-label={`${
                        playing ? "Pause" : "Play"
                      } ${title}`}
                      title={playing ? "Pause" : "Play"}
                    >
                      {playing ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>

                  {/* SONG DETAILS */}

                  <button
                    type="button"
                    className={`playlist-song-title playlist-song-title-button ${
                      playing ? "is-playing" : ""
                    }`}
                    onClick={() => handleSongPlayPause(song)}
                    disabled={!hasSongAudio(song) || actionLoading}
                    aria-label={`${
                      playing ? "Pause" : "Play"
                    } ${title}`}
                    title={
                      hasSongAudio(song)
                        ? playing
                          ? "Pause song"
                          : "Play song"
                        : "Audio is not available"
                    }
                  >
                    {song.cover_url && (
                      <img
                        src={getMediaUrl(song.cover_url)}
                        alt={`${title} cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    <div>
                      <strong>{title}</strong>

                      {nativeTitle && <small>{nativeTitle}</small>}

                      <span>{getSongArtist(song, artistMap)}</span>
                    </div>
                  </button>

                  {/* REMOVE SONG */}

                  <button
                    type="button"
                    className="playlist-remove-song"
                    onClick={() => removeSong(song.id)}
                    disabled={actionLoading}
                    title="Remove song"
                    aria-label={`Remove ${title} from playlist`}
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          ADD SONGS MODAL
      ===================================================== */}

      {showAddSongs && (
        <div
          className="add-song-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddSongs();
            }
          }}
        >
          <section
            className="add-song-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-songs-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="add-song-header">
              <div>
                <span>KEERTHANA MUSIC</span>
                <h2 id="add-songs-title">Add Songs</h2>
                <p>
                  Find the songs you want to worship with.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddSongs}
                disabled={actionLoading}
                aria-label="Close Add Songs"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {/* AVAILABLE SONGS SEARCH */}

            <div className="playlist-add-search">
              <FaSearch aria-hidden="true" />

              <input
                type="search"
                value={songSearch}
                onChange={(event) =>
                  setSongSearch(event.target.value)
                }
                placeholder="Search songs, artists, albums..."
                aria-label="Search available songs"
              />

              {songSearch && (
                <button
                  type="button"
                  onClick={() => setSongSearch("")}
                  aria-label="Clear search"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              className="playlist-add-search-summary"
              aria-live="polite"
            >
              {songSearch.trim()
                ? `${filteredSongs.length} matching ${
                    filteredSongs.length === 1 ? "song" : "songs"
                  } · Showing ${Math.min(
                    visibleSongs.length,
                    filteredSongs.length
                  )}`
                : `${allSongs.length} available ${
                    allSongs.length === 1 ? "song" : "songs"
                  } · Showing ${visibleSongs.length}`}
            </div>

            {/* MODAL ERROR */}

            {songsError && (
              <div className="playlist-error" role="alert">
                <span>{songsError}</span>

                <button
                  type="button"
                  onClick={() => setSongsError("")}
                  aria-label="Dismiss message"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
            )}

            {/* AVAILABLE SONGS LIST */}

            <div className="add-song-list">
              {songsLoading ? (
                <div className="add-song-empty" role="status">
                  <span className="playlist-loading-spinner" />
                  <p>Loading songs...</p>
                </div>
              ) : songsError && !allSongs.length ? (
                <div className="add-song-empty">
                  <FaMusic aria-hidden="true" />
                  <p>Unable to load songs.</p>

                  <button
                    type="button"
                    onClick={fetchAllSongs}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="add-song-empty">
                  <FaMusic aria-hidden="true" />

                  <p>
                    {allSongs.length
                      ? "No songs match your search."
                      : "No songs are available."}
                  </p>

                  {songSearch && allSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSongSearch("")}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                visibleSongs.map((song) => {
                  const alreadyAdded = songExistsInPlaylist(song.id);
                  const { primary: title, secondary: nativeTitle } =
                    getSongTitles(song);

                  return (
                    <div
                      className="add-song-row"
                      key={song.id}
                    >
                      {song.cover_url && (
                        <img
                          src={getMediaUrl(song.cover_url)}
                          alt={`${title} cover`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}

                      <div className="add-song-info">
                        <strong>{title}</strong>

                        {nativeTitle && <small>{nativeTitle}</small>}

                        <span>{getSongArtist(song, artistMap)}</span>
                      </div>

                      <button
                        type="button"
                        className={alreadyAdded ? "song-added" : ""}
                        disabled={alreadyAdded || actionLoading}
                        onClick={() => addSong(song.id)}
                      >
                        {alreadyAdded
                          ? "Added"
                          : actionLoading
                            ? "Adding..."
                            : "Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {!songsLoading && visibleSongs.length < filteredSongs.length && (
              <button
                type="button"
                className="playlist-load-more-songs"
                onClick={() =>
                  setVisibleSongLimit((current) => current + 10)
                }
                disabled={actionLoading}
              >
                Show 10 more songs
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default PlaylistDetails;
