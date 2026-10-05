import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getMediaUrl } from "../utils/media";
import API from "../services/api";
import { useAuth } from "./AuthContext";

/* =========================================================
   PLAYER CONTEXT
========================================================= */

export const PlayerContext = createContext(null);

/* =========================================================
   CONSTANTS
========================================================= */

const PLAYER_STORAGE_KEY = "keerthana_player_state";

const OFFLINE_DB_NAME = "keerthana_offline_music";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_STORE_NAME = "songs";

/* =========================================================
   usePlayer HOOK
========================================================= */

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used inside a PlayerProvider"
    );
  }

  return context;
};

/* =========================================================
   INDEXED DB
========================================================= */

const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = window.indexedDB.open(
      OFFLINE_DB_NAME,
      OFFLINE_DB_VERSION
    );

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/* =========================================================
   GET OFFLINE SONG
========================================================= */

const getOfflineSong = async (id) => {
  try {
    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readonly"
      );

      const store = transaction.objectStore(
        OFFLINE_STORE_NAME
      );

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Offline song error:", error);
    return null;
  }
};

/* =========================================================
   SAVE OFFLINE SONG
========================================================= */

const saveOfflineSong = async (song) => {
  try {
    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readwrite"
      );

      const store = transaction.objectStore(
        OFFLINE_STORE_NAME
      );

      const request = store.put(song);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Save offline song error:", error);
    return false;
  }
};

/* =========================================================
   DELETE OFFLINE SONG
========================================================= */

const deleteOfflineSong = async (id) => {
  try {
    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readwrite"
      );

      const store = transaction.objectStore(
        OFFLINE_STORE_NAME
      );

      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Delete offline song error:", error);
    return false;
  }
};

/* =========================================================
   GET ALL OFFLINE SONGS
========================================================= */

const getAllOfflineSongs = async () => {
  try {
    const db = await openOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readonly"
      );

      const store = transaction.objectStore(
        OFFLINE_STORE_NAME
      );

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Get offline songs error:", error);
    return [];
  }
};

/* =========================================================
   PLAYER PROVIDER
========================================================= */

export const PlayerProvider = ({ children }) => {
  const { user } = useAuth();

  /* =======================================================
     AUDIO
  ======================================================= */

  const audioRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio();
  }

  const audio = audioRef.current;

  /* =======================================================
     PLAYER STATE
  ======================================================= */

  const [currentSong, setCurrentSong] = useState(null);

  const [queue, setQueue] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(-1);

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);

  const [isMuted, setIsMuted] = useState(false);

  const [isShuffle, setIsShuffle] = useState(false);

  const [repeatMode, setRepeatMode] = useState("off");

  const [isLoading, setIsLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);

  const [offlineSongs, setOfflineSongs] = useState([]);

  /* =======================================================
     RESTORE PLAYER STATE
  ======================================================= */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        PLAYER_STORAGE_KEY
      );

      if (!saved) return;

      const data = JSON.parse(saved);

      if (Array.isArray(data.queue)) {
        setQueue(data.queue);
      }

      if (
        typeof data.currentIndex === "number"
      ) {
        setCurrentIndex(data.currentIndex);
      }

      if (typeof data.volume === "number") {
        setVolume(data.volume);
      }

      if (typeof data.isShuffle === "boolean") {
        setIsShuffle(data.isShuffle);
      }

      if (
        data.repeatMode === "off" ||
        data.repeatMode === "one" ||
        data.repeatMode === "all"
      ) {
        setRepeatMode(data.repeatMode);
      }

      if (data.currentSong) {
        setCurrentSong(data.currentSong);
      }
    } catch (error) {
      console.error(
        "Failed to restore player state:",
        error
      );
    }
  }, []);

  /* =======================================================
     SAVE PLAYER STATE
  ======================================================= */

  useEffect(() => {
    try {
      const state = {
        currentSong,
        queue,
        currentIndex,
        volume,
        isShuffle,
        repeatMode,
      };

      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error(
        "Failed to save player state:",
        error
      );
    }
  }, [
    currentSong,
    queue,
    currentIndex,
    volume,
    isShuffle,
    repeatMode,
  ]);

  /* =======================================================
     LOAD OFFLINE SONGS
  ======================================================= */

  useEffect(() => {
    const loadOfflineSongs = async () => {
      const songs = await getAllOfflineSongs();
      setOfflineSongs(songs);
    };

    loadOfflineSongs();
  }, []);

  /* =======================================================
     AUDIO EVENTS
  ======================================================= */

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "durationchange",
      handleDurationChange
    );

    audio.addEventListener(
      "play",
      handlePlay
    );

    audio.addEventListener(
      "pause",
      handlePause
    );

    audio.addEventListener(
      "waiting",
      handleWaiting
    );

    audio.addEventListener(
      "canplay",
      handleCanPlay
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "durationchange",
        handleDurationChange
      );

      audio.removeEventListener(
        "play",
        handlePlay
      );

      audio.removeEventListener(
        "pause",
        handlePause
      );

      audio.removeEventListener(
        "waiting",
        handleWaiting
      );

      audio.removeEventListener(
        "canplay",
        handleCanPlay
      );
    };
  }, [audio]);

  /* =======================================================
     VOLUME
  ======================================================= */

  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, audio]);

  /* =======================================================
     CHECK LIKED SONG
  ======================================================= */

  const checkLikedSong = useCallback(
    async (songId) => {
      if (!songId || !user) {
        setIsLiked(false);
        return;
      }

      try {
        const response = await API.get(
          `/songs/${songId}/liked`
        );

        setIsLiked(
          Boolean(
            response?.data?.liked ??
              response?.data?.isLiked
          )
        );
      } catch (error) {
        /*
         * Some versions of the backend may not expose
         * this endpoint. Keep the player working.
         */

        try {
          const response = await API.get(
            "/liked-songs"
          );

          const songs =
            response?.data?.songs ||
            response?.data ||
            [];

          const found = songs.some(
            (item) =>
              Number(
                item.song_id || item.id
              ) === Number(songId)
          );

          setIsLiked(found);
        } catch {
          setIsLiked(false);
        }
      }
    },
    [user]
  );

  /* =======================================================
     PLAY SONG
  ======================================================= */

  const playSong = useCallback(
    async (
      song,
      songs = [],
      index = 0
    ) => {
      if (!song) return;

      try {
        setIsLoading(true);

        /*
         * Update queue
         */

        if (Array.isArray(songs) && songs.length > 0) {
          setQueue(songs);

          const foundIndex = songs.findIndex(
            (item) =>
              Number(item.id) === Number(song.id)
          );

          setCurrentIndex(
            foundIndex >= 0
              ? foundIndex
              : index
          );
        } else {
          setQueue([song]);
          setCurrentIndex(0);
        }

        setCurrentSong(song);

        /*
         * Check liked state
         */

        await checkLikedSong(song.id);

        /*
         * First try offline copy
         */

        const offline = await getOfflineSong(
          song.id
        );

        let audioUrl = null;

        if (offline?.blob) {
          audioUrl = URL.createObjectURL(
            offline.blob
          );
        } else {
          audioUrl = getMediaUrl(
            song.audio_url ||
              song.audioUrl ||
              song.url
          );
        }

        if (!audioUrl) {
          console.error(
            "Audio URL not found:",
            song
          );

          setIsLoading(false);
          return;
        }

        /*
         * Stop previous song
         */

        audio.pause();

        /*
         * Reset audio
         */

        audio.currentTime = 0;

        /*
         * Set new source
         */

        audio.src = audioUrl;

        audio.load();

        /*
         * Play
         */

        await audio.play();

        setIsPlaying(true);

        /*
         * Listening history
         */

        if (user && song.id) {
          try {
            await API.post(
              "/listening-history",
              {
                song_id: song.id,
              }
            );
          } catch (historyError) {
            console.warn(
              "Listening history could not be saved:",
              historyError
            );
          }
        }
      } catch (error) {
        console.error(
          "Play song error:",
          error
        );

        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [audio, checkLikedSong, user]
  );

  /* =======================================================
     PAUSE
  ======================================================= */

  const pauseSong = useCallback(() => {
    audio.pause();
    setIsPlaying(false);
  }, [audio]);

  /* =======================================================
     RESUME
  ======================================================= */

  const resumeSong = useCallback(async () => {
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error(
        "Resume playback error:",
        error
      );
    }
  }, [audio]);

  /* =======================================================
     TOGGLE PLAY / PAUSE
  ======================================================= */

  const togglePlay = useCallback(async () => {
    if (!currentSong) return;

    if (audio.paused) {
      await resumeSong();
    } else {
      pauseSong();
    }
  }, [
    audio,
    currentSong,
    pauseSong,
    resumeSong,
  ]);

  /* =======================================================
     NEXT SONG
  ======================================================= */

  const nextSong = useCallback(async () => {
    if (!queue.length) return;

    let nextIndex;

    if (isShuffle) {
      if (queue.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(
            Math.random() * queue.length
          );
        } while (
          nextIndex === currentIndex
        );
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    /*
     * End of queue
     */

    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const next = queue[nextIndex];

    setCurrentIndex(nextIndex);

    await playSong(
      next,
      queue,
      nextIndex
    );
  }, [
    queue,
    isShuffle,
    currentIndex,
    repeatMode,
    playSong,
  ]);

  /* =======================================================
     PREVIOUS SONG
  ======================================================= */

  const previousSong = useCallback(async () => {
    if (!queue.length) return;

    /*
     * If song has already played for more than 3 seconds,
     * restart it first.
     */

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    let previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      if (repeatMode === "all") {
        previousIndex = queue.length - 1;
      } else {
        previousIndex = 0;
      }
    }

    const previous = queue[previousIndex];

    setCurrentIndex(previousIndex);

    await playSong(
      previous,
      queue,
      previousIndex
    );
  }, [
    audio,
    queue,
    currentIndex,
    repeatMode,
    playSong,
  ]);

  /* =======================================================
     AUTO NEXT / REPEAT
  ======================================================= */

  useEffect(() => {
    const handleEnded = async () => {
      if (!currentSong) return;

      /*
       * Repeat current song
       */

      if (repeatMode === "one") {
        audio.currentTime = 0;

        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error(
            "Repeat playback error:",
            error
          );
        }

        return;
      }

      /*
       * Next song
       */

      await nextSong();
    };

    audio.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [
    audio,
    currentSong,
    repeatMode,
    nextSong,
  ]);

  /* =======================================================
     SEEK
  ======================================================= */

  const seek = useCallback(
    (value) => {
      const newTime = Number(value);

      if (
        !Number.isFinite(newTime) ||
        !Number.isFinite(audio.duration)
      ) {
        return;
      }

      audio.currentTime = Math.min(
        Math.max(newTime, 0),
        audio.duration
      );

      setCurrentTime(audio.currentTime);
    },
    [audio]
  );

  /* =======================================================
     SEEK FORWARD
  ======================================================= */

  const seekForward = useCallback(
    (seconds = 10) => {
      if (!Number.isFinite(audio.duration)) {
        return;
      }

      audio.currentTime = Math.min(
        audio.currentTime + seconds,
        audio.duration
      );
    },
    [audio]
  );

  /* =======================================================
     SEEK BACKWARD
  ======================================================= */

  const seekBackward = useCallback(
    (seconds = 10) => {
      audio.currentTime = Math.max(
        audio.currentTime - seconds,
        0
      );
    },
    [audio]
  );

  /* =======================================================
     SET PLAYER VOLUME
  ======================================================= */

  const changeVolume = useCallback(
    (value) => {
      const newVolume = Math.min(
        Math.max(Number(value), 0),
        1
      );

      setVolume(newVolume);

      if (newVolume > 0) {
        setIsMuted(false);
      }
    },
    []
  );

  /* =======================================================
     TOGGLE MUTE
  ======================================================= */

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  /* =======================================================
     TOGGLE SHUFFLE
  ======================================================= */

  const toggleShuffle = useCallback(() => {
    setIsShuffle((previous) => !previous);
  }, []);

  /* =======================================================
     TOGGLE REPEAT
  ======================================================= */

  const toggleRepeat = useCallback(() => {
    setRepeatMode((previous) => {
      if (previous === "off") {
        return "all";
      }

      if (previous === "all") {
        return "one";
      }

      return "off";
    });
  }, []);

  /* =======================================================
     LIKE / UNLIKE SONG
  ======================================================= */

  const toggleLike = useCallback(
    async (song = currentSong) => {
      if (!song?.id || !user) {
        return;
      }

      try {
        if (isLiked) {
          await API.delete(
            `/liked-songs/${song.id}`
          );

          setIsLiked(false);
        } else {
          await API.post(
            "/liked-songs",
            {
              song_id: song.id,
            }
          );

          setIsLiked(true);
        }
      } catch (error) {
        console.error(
          "Toggle like error:",
          error
        );
      }
    },
    [currentSong, user, isLiked]
  );

  /* =======================================================
     DOWNLOAD SONG FOR OFFLINE
  ======================================================= */

  const downloadSong = useCallback(
    async (song) => {
      if (!song?.id) return false;

      try {
        const existing =
          await getOfflineSong(song.id);

        if (existing) {
          return true;
        }

        const audioUrl = getMediaUrl(
          song.audio_url ||
            song.audioUrl ||
            song.url
        );

        if (!audioUrl) {
          return false;
        }

        const response = await fetch(
          audioUrl
        );

        if (!response.ok) {
          throw new Error(
            `Download failed: ${response.status}`
          );
        }

        const blob = await response.blob();

        await saveOfflineSong({
          id: song.id,
          title: song.title,
          title_english: song.title_english,
          language: song.language,
          artist_id: song.artist_id,
          album_id: song.album_id,
          category_id: song.category_id,
          cover_url: song.cover_url,
          audio_url:
            song.audio_url ||
            song.audioUrl ||
            song.url,
          blob,
          downloadedAt: Date.now(),
        });

        const updated =
          await getAllOfflineSongs();

        setOfflineSongs(updated);

        return true;
      } catch (error) {
        console.error(
          "Download song error:",
          error
        );

        return false;
      }
    },
    []
  );

  /* =======================================================
     REMOVE OFFLINE SONG
  ======================================================= */

  const removeOfflineSong = useCallback(
    async (songId) => {
      if (!songId) return;

      await deleteOfflineSong(songId);

      const updated =
        await getAllOfflineSongs();

      setOfflineSongs(updated);
    },
    []
  );

  /* =======================================================
     CHECK OFFLINE SONG
  ======================================================= */

  const isSongOffline = useCallback(
    (songId) => {
      if (!songId) return false;

      return offlineSongs.some(
        (song) =>
          Number(song.id) === Number(songId)
      );
    },
    [offlineSongs]
  );

  /* =======================================================
     CLEAR PLAYER
  ======================================================= */

  const clearPlayer = useCallback(() => {
    audio.pause();

    audio.src = "";

    setCurrentSong(null);
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLiked(false);

    localStorage.removeItem(
      PLAYER_STORAGE_KEY
    );
  }, [audio]);

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatTime = useCallback(
    (seconds) => {
      if (
        !seconds ||
        !Number.isFinite(seconds)
      ) {
        return "0:00";
      }

      const minutes = Math.floor(
        seconds / 60
      );

      const remainingSeconds = Math.floor(
        seconds % 60
      );

      return `${minutes}:${String(
        remainingSeconds
      ).padStart(2, "0")}`;
    },
    []
  );

  /* =======================================================
     PLAYER VALUE
  ======================================================= */

  const value = {
    /* Current song */
    currentSong,
    setCurrentSong,

    /* Queue */
    queue,
    setQueue,

    currentIndex,
    setCurrentIndex,

    /* Playback */
    isPlaying,
    isLoading,

    playSong,
    pauseSong,
    resumeSong,
    togglePlay,

    nextSong,
    previousSong,

    /* Time */
    currentTime,
    duration,
    seek,
    seekForward,
    seekBackward,

    /* Volume */
    volume,
    setVolume: changeVolume,
    changeVolume,
    isMuted,
    toggleMute,

    /* Shuffle / repeat */
    isShuffle,
    toggleShuffle,

    repeatMode,
    toggleRepeat,

    /* Like */
    isLiked,
    setIsLiked,
    toggleLike,

    /* Offline */
    offlineSongs,
    downloadSong,
    removeOfflineSong,
    isSongOffline,

    /* Utility */
    clearPlayer,
    formatTime,

    /* Audio */
    audioRef,
    audio,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;