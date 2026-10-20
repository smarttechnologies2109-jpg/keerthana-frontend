
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  isNativeAndroid,
  initializeNativeMusicPlayer,
  setNativePlaylist,
  setNativeMusicVolume,
  Playlist,
  RmxAudioStatusMessage,
  seekNativeMusic,
} from "../utils/nativeMusicPlayer";


import { getMediaUrl } from "../utils/media";
import API from "../services/api";
import { useAuth } from "./AuthContext";

export const PlayerContext = createContext(null);

const PLAYER_STORAGE_KEY = "keerthana_player_state";
const OFFLINE_DB_NAME = "keerthana_offline_music";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_STORE_NAME = "songs";

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
};

/* --------------------------------------------------
   AUDIO URL HELPERS
-------------------------------------------------- */

const getSongAudioUrl = (song) => {
  if (!song) return null;

  const possibleFields = [
    "audio_url",
    "audioUrl",
    "audio_path",
    "audioPath",
    "audio_file",
    "audioFile",
    "file_url",
    "fileUrl",
    "media_url",
    "mediaUrl",
    "audio",
    "url",
  ];

  const source = possibleFields
    .map((field) => song[field])
    .find(
      (value) =>
        typeof value === "string" &&
        value.trim() !== "" &&
        value.trim().toLowerCase() !== "undefined" &&
        value.trim().toLowerCase() !== "null"
    );

  if (!source) {
    console.error("Song has no valid audio field:", {
      id: song.id,
      title: song.title,
      availableFields: Object.keys(song),
      song,
    });

    return null;
  }

  const audioUrl = getMediaUrl(source.trim());

  if (
    typeof audioUrl !== "string" ||
    !audioUrl.trim() ||
    audioUrl.includes("/undefined") ||
    audioUrl.endsWith("/null")
  ) {
    console.error("Invalid resolved audio URL:", {
      id: song.id,
      title: song.title,
      source,
      audioUrl,
    });

    return null;
  }

  return audioUrl;
};


const getSongId = (song) => song?.id ?? song?.song_id ?? null;

const sameSong = (a, b) =>
  Number(getSongId(a)) === Number(getSongId(b));

/* --------------------------------------------------
   OFFLINE DATABASE
-------------------------------------------------- */

const openOfflineDB = () =>
  new Promise((resolve, reject) => {
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

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getOfflineSong = async (id) => {
  if (id == null) return null;

  let db;

  try {
    db = await openOfflineDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readonly"
      );

      const request = transaction
        .objectStore(OFFLINE_STORE_NAME)
        .get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };

      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    if (db) {
      try {
        db.close();
      } catch {}
    }

    console.warn("Could not read offline song:", error);
    return null;
  }
};

const saveOfflineSong = async (song) => {
  let db;

  try {
    db = await openOfflineDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readwrite"
      );

      transaction.objectStore(OFFLINE_STORE_NAME).put(song);

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };

      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    if (db) {
      try {
        db.close();
      } catch {}
    }

    console.error("Save offline song error:", error);
    return false;
  }
};

const deleteOfflineSong = async (id) => {
  let db;

  try {
    db = await openOfflineDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readwrite"
      );

      transaction.objectStore(OFFLINE_STORE_NAME).delete(id);

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };

      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    if (db) {
      try {
        db.close();
      } catch {}
    }

    console.error("Delete offline song error:", error);
    return false;
  }
};

const getAllOfflineSongs = async () => {
  let db;

  try {
    db = await openOfflineDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        OFFLINE_STORE_NAME,
        "readonly"
      );

      const request = transaction
        .objectStore(OFFLINE_STORE_NAME)
        .getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };

      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    if (db) {
      try {
        db.close();
      } catch {}
    }

    console.warn("Get offline songs error:", error);
    return [];
  }
};

/* --------------------------------------------------
   PLAYER PROVIDER
-------------------------------------------------- */

export const PlayerProvider = ({ children }) => {
  const { user } = useAuth();

  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const playRequestIdRef = useRef(0);

  // Only one audio element is used for playback.
  if (!audioRef.current) {
    const element = new Audio();

    element.preload = "auto";
    element.autoplay = false;
    element.setAttribute("playsinline", "true");

    audioRef.current = element;
  }

  const audio = audioRef.current;

  const [playerRestored, setPlayerRestored] = useState(false);
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

  /* RELEASE OLD BLOB URL */

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  /* LOAD SOURCE FOR A SONG */

  const resolveSongSource = useCallback(
  async (song) => {
    const onlineUrl = getSongAudioUrl(song);

    if (!onlineUrl) {
      return null;
    }

    // Try the offline cache without blocking playback for long.
    try {
      const offline = await Promise.race([
        getOfflineSong(getSongId(song)),
        new Promise((resolve) =>
          setTimeout(() => resolve(null), 200)
        ),
      ]);

      if (offline?.blob instanceof Blob) {
        releaseObjectUrl();

        const url = URL.createObjectURL(offline.blob);
        objectUrlRef.current = url;

        return url;
      }
    } catch (error) {
      console.warn("Offline lookup failed:", error);
    }

    // Fall back to CloudFront immediately after the cache check.
    return onlineUrl;
  },
  [releaseObjectUrl]
);

  /* RESTORE PLAYER WITHOUT AUTOMATICALLY PLAYING */

  useEffect(() => {
    let cancelled = false;

    const restorePlayer = async () => {
      const requestId = ++playRequestIdRef.current;

      try {
        const saved = localStorage.getItem(PLAYER_STORAGE_KEY);

        if (!saved) return;

        const data = JSON.parse(saved);
        const restoredSong = data.currentSong || null;
        const restoredQueue = Array.isArray(data.queue)
          ? data.queue
          : [];

        const restoredTime = Math.max(
          0,
          Number(data.currentTime) || 0
        );

        setQueue(restoredQueue);
        setCurrentSong(restoredSong);

        let index =
          typeof data.currentIndex === "number"
            ? data.currentIndex
            : -1;

        if (restoredSong) {
          const matchingIndex = restoredQueue.findIndex(
            (song) => sameSong(song, restoredSong)
          );

          if (matchingIndex >= 0) index = matchingIndex;
        }

        setCurrentIndex(index);

        if (typeof data.volume === "number") {
          setVolume(Math.min(Math.max(data.volume, 0), 1));
        }

        if (typeof data.isShuffle === "boolean") {
          setIsShuffle(data.isShuffle);
        }

        if (["off", "one", "all"].includes(data.repeatMode)) {
          setRepeatMode(data.repeatMode);
        }

        if (!restoredSong) return;

        const source = await resolveSongSource(restoredSong);

        if (
          cancelled ||
          requestId !== playRequestIdRef.current
        ) {
          return;
        }

        if (!source) {
          console.warn(
            "Restored song has no valid audio source:",
            restoredSong
          );
          return;
        }

        const onMetadata = () => {
          if (
            cancelled ||
            requestId !== playRequestIdRef.current
          ) {
            return;
          }

          if (Number.isFinite(audio.duration)) {
            audio.currentTime = Math.min(
              restoredTime,
              audio.duration
            );
          }

          setCurrentTime(audio.currentTime || 0);
          setIsPlaying(false);
          setIsLoading(false);
        };

        audio.addEventListener("loadedmetadata", onMetadata, {
          once: true,
        });

        audio.src = source;
        audio.load();

        // Intentionally do not autoplay on app startup.
      } catch (error) {
        console.error("Failed to restore player state:", error);
      } finally {
        if (!cancelled) {
          setPlayerRestored(true);
        }
      }
    };

    restorePlayer();

    return () => {
      cancelled = true;
    };
  }, [audio, resolveSongSource]);

  /* SAVE PLAYER STATE */

  useEffect(() => {
    if (!playerRestored) return;

    try {
      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify({
          currentSong,
          queue,
          currentIndex,
          currentTime,
          wasPlaying: isPlaying,
          volume,
          isShuffle,
          repeatMode,
        })
      );
    } catch (error) {
      console.warn("Could not save player state:", error);
    }
  }, [
    playerRestored,
    currentSong,
    queue,
    currentIndex,
    currentTime,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
  ]);

  /* LOAD OFFLINE SONG LIST */

  useEffect(() => {
    let cancelled = false;

    getAllOfflineSongs().then((songs) => {
      if (!cancelled) setOfflineSongs(songs);
    });

    return () => {
      cancelled = true;
    };
  }, []);



  /* ANDROID NATIVE PLAYBACK STATUS */

  useEffect(() => {
    if (!isNativeAndroid) return;

    let cancelled = false;
    let listenerHandle = null;

    const setupNativePlayer = async () => {
      try {
        await initializeNativeMusicPlayer();

        if (cancelled) return;

        listenerHandle = await Playlist.addListener(
          "status",
          ({ status }) => {
            if (cancelled || !status) return;

            const value = status.value ?? {};
            const message = status.msgType;

            // The plugin reports currentPosition, not position.
            if (
              value.currentPosition != null &&
              Number.isFinite(Number(value.currentPosition))
            ) {
              setCurrentTime(
                Math.max(0, Number(value.currentPosition))
              );
            }

            // Duration is reported in seconds.
            if (
              value.duration != null &&
              Number.isFinite(Number(value.duration)) &&
              Number(value.duration) > 0
            ) {
              setDuration(Number(value.duration));
            }

            switch (message) {
              case RmxAudioStatusMessage.RMXSTATUS_PLAYING:
                setIsPlaying(true);
                setIsLoading(false);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_LOADING:
                setIsLoading(true);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_CANPLAY:
              case RmxAudioStatusMessage.RMXSTATUS_LOADED:
                setIsLoading(false);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_PAUSE:
                setIsPlaying(false);
                setIsLoading(false);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_PLAYBACK_POSITION:
              case RmxAudioStatusMessage.RMXSTATUS_DURATION:
              case RmxAudioStatusMessage.RMXSTATUS_SEEK:
                // Time and duration have already been updated above.
                break;

              case RmxAudioStatusMessage.RMXSTATUS_TRACK_CHANGED:
                setCurrentTime(
                  Number(value.currentPosition) || 0
                );

                if (
                  Number.isFinite(Number(value.duration)) &&
                  Number(value.duration) > 0
                ) {
                  setDuration(Number(value.duration));
                } else {
                  setDuration(0);
                }
                break;

              case RmxAudioStatusMessage.RMXSTATUS_COMPLETED:
                setIsPlaying(false);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_STOPPED:
                setIsPlaying(false);
                setIsLoading(false);
                break;

              case RmxAudioStatusMessage.RMXSTATUS_ERROR:
                console.error(
                  "Android native playback error:",
                  value
                );
                setIsPlaying(false);
                setIsLoading(false);
                break;

              default:
                break;
            }
          }
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Android native status listener failed:",
            error
          );
        }
      }
    };

    setupNativePlayer();

    return () => {
      cancelled = true;

      if (listenerHandle) {
        listenerHandle.remove().catch((error) => {
          console.warn(
            "Could not remove native status listener:",
            error
          );
        });
      }
    };
  }, []);

  /* AUDIO EVENTS */

  useEffect(() => {
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onMetadata = () => {
      setDuration(
        Number.isFinite(audio.duration) ? audio.duration : 0
      );
      setIsLoading(false);
    };

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const onPause = () => setIsPlaying(false);

    const onWaiting = () => setIsLoading(true);

    const onCanPlay = () => setIsLoading(false);

 
const onError = () => {
  const mediaError = audio.error;

  console.error("AUDIO DEBUG DETAILS", {
    srcAttribute: audio.getAttribute("src"),
    currentSrc: audio.currentSrc,
    errorCode: mediaError?.code,
    errorMessage: mediaError?.message,
    networkState: audio.networkState,
    readyState: audio.readyState,
    songId: currentSong?.id,
    songTitle: currentSong?.title,
  });

  setIsPlaying(false);
  setIsLoading(false);
};


    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("durationchange", onMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("durationchange", onMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, [audio]);

  /* APPLY VOLUME */

  useEffect(() => {
    audio.volume = Math.min(Math.max(Number(volume) || 0, 0), 1);
    audio.muted = isMuted;
  }, [audio, volume, isMuted]);

  /* CHECK LIKED SONG */

  const checkLikedSong = useCallback(
    async (songId) => {
      if (!songId || !user) {
        setIsLiked(false);
        return;
      }

      try {
        const response = await API.get(`/songs/${songId}/liked`);

        setIsLiked(
          Boolean(response?.data?.liked ?? response?.data?.isLiked)
        );

        return;
      } catch {
        // Fall back to the liked-songs endpoint.
      }

      try {
        const response = await API.get("/liked-songs");
        const data = response?.data;

        const songs = Array.isArray(data)
          ? data
          : Array.isArray(data?.songs)
            ? data.songs
            : [];

        setIsLiked(
          songs.some(
            (item) =>
              Number(item.song_id ?? item.songId ?? item.id) ===
              Number(songId)
          )
        );
      } catch (error) {
        console.warn("Could not check liked song:", error);
        setIsLiked(false);
      }
    },
    [user]
  );

  /* PLAY A SONG */

  
const playSong = useCallback(
  async (song, songs = [], index = 0) => {
    if (!song) return;

    const requestId = ++playRequestIdRef.current;

    try {
      setIsLoading(true);
      setIsPlaying(false);

      let activeQueue = [song];

      if (Array.isArray(songs) && songs.length > 0) {
        activeQueue = [...songs];
      }

      let activeIndex = activeQueue.findIndex(
        (item) => sameSong(item, song)
      );

      if (activeIndex < 0) {
        activeIndex = Math.max(
          0,
          Math.min(index, activeQueue.length - 1)
        );
        activeQueue[activeIndex] = song;
      }

      setQueue(activeQueue);
      setCurrentIndex(activeIndex);
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(0);

      checkLikedSong(getSongId(song)).catch(() => {});

if (isNativeAndroid) {
  await initializeNativeMusicPlayer();

  const nativeItems = await setNativePlaylist(
    activeQueue,
    async (item) => getSongAudioUrl(item)
  );

  const selectedId = String(getSongId(song));

  const nativeIndex = nativeItems.findIndex(
    (item) => String(item.trackId) === selectedId
  );

  if (nativeIndex < 0) {
    throw new Error(`Song not found in native playlist: ${selectedId}`);
  }

  const selectedTrack = nativeItems[nativeIndex];

  if (
    !selectedTrack.assetUrl ||
    !/^https?:\/\//i.test(selectedTrack.assetUrl)
  ) {
    throw new Error(
      `Invalid Android audio URL: ${selectedTrack.assetUrl}`
    );
  }

  console.log("Playing Android song:", {
    title: selectedTrack.title,
    audioUrl: selectedTrack.assetUrl,
    index: nativeIndex,
  });

  await Playlist.playTrackByIndex({
    index: nativeIndex,
    position: 0,
  });

  if (requestId !== playRequestIdRef.current) return;

  setIsPlaying(true);
  setIsLoading(false);
} else {
 

        const audioUrl = await resolveSongSource(song);

        if (requestId !== playRequestIdRef.current) return;

        if (!audioUrl) {
          throw new Error(
            `No valid audio URL for song ${getSongId(song)}`
          );
        }

        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();

        await audio.play();

        if (requestId !== playRequestIdRef.current) {
          audio.pause();
          return;
        }

        setIsPlaying(true);
        setIsLoading(false);
      }

      if (user && getSongId(song) != null) {
        API.post("/history/play", {
          song_id: getSongId(song),
          progress_seconds: 0,
          completed: false,
        }).catch((error) => {
          console.warn(
            "Could not save listening history:",
            error?.response?.status,
            error?.response?.data
          );
        });
      }
    } catch (error) {
      if (requestId === playRequestIdRef.current) {
        console.error("KEERTHANA playback failed:", error);
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  },
  [
    audio,
    checkLikedSong,
    resolveSongSource,
    user,
  ]
);


  /* PAUSE */

const pauseSong = useCallback(async () => {
  playRequestIdRef.current += 1;

  try {
    if (isNativeAndroid) {
      await Playlist.pause();
    } else {
      audio.pause();
    }

    setIsPlaying(false);
    setIsLoading(false);
  } catch (error) {
    console.error("Pause failed:", error);
  }
}, [audio]);

const resumeSong = useCallback(async () => {
  if (!currentSong) return;

  try {
    setIsLoading(true);

    if (isNativeAndroid) {
      await initializeNativeMusicPlayer();
      await Playlist.play();
    } else {
      if (!audio.getAttribute("src") || audio.error) {
        const audioUrl = await resolveSongSource(currentSong);

        if (!audioUrl) {
          throw new Error("No playable audio URL.");
        }

        audio.src = audioUrl;
        audio.load();
      }

      await audio.play();
    }

    setIsPlaying(true);
  } catch (error) {
    console.error("Resume failed:", error);
    setIsPlaying(false);
  } finally {
    setIsLoading(false);
  }
}, [audio, currentSong, resolveSongSource]);

const togglePlay = useCallback(async () => {
  if (!currentSong) return;

  if (isPlaying) {
    await pauseSong();
  } else {
    await resumeSong();
  }
}, [currentSong, isPlaying, pauseSong, resumeSong]);


  /* NEXT SONG */
  
const nextSong = useCallback(async () => {
  if (!queue.length) return;

  let nextIndex;

  if (isShuffle && queue.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * queue.length);
    } while (nextIndex === currentIndex);
  } else {
    nextIndex = currentIndex + 1;
  }

  if (nextIndex >= queue.length) {
    if (repeatMode === "all") {
      nextIndex = 0;
    } else {
      await pauseSong();
      return;
    }
  }

  await playSong(queue[nextIndex], queue, nextIndex);
}, [
  queue,
  isShuffle,
  currentIndex,
  repeatMode,
  playSong,
  pauseSong,
]);

const previousSong = useCallback(async () => {
  if (!queue.length) return;

  if (currentTime > 3) {
    if (isNativeAndroid) {
      await Playlist.seekTo({ position: 0 });
    } else {
      audio.currentTime = 0;
    }

    setCurrentTime(0);
    return;
  }

  let previousIndex = currentIndex - 1;

  if (previousIndex < 0) {
    previousIndex =
      repeatMode === "all" ? queue.length - 1 : 0;
  }

  await playSong(queue[previousIndex], queue, previousIndex);
}, [
  audio,
  queue,
  currentIndex,
  currentTime,
  repeatMode,
  playSong,
]);

const seek = useCallback(
  async (value) => {
    const newTime = Number(value);

    if (!Number.isFinite(newTime) || newTime < 0) return;

    if (isNativeAndroid) {
      await Playlist.seekTo({ position: newTime });
      setCurrentTime(newTime);
      return;
    }

    if (!Number.isFinite(audio.duration)) return;

    audio.currentTime = Math.min(newTime, audio.duration);
    setCurrentTime(audio.currentTime);
  },
  [audio]
);


  


  /* AUTO NEXT AND REPEAT */
useEffect(() => {
  if (isNativeAndroid) return;

  const handleEnded = async () => {
    if (!currentSong) return;

    if (repeatMode === "one") {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.error("Repeat playback failed:", error);
        setIsPlaying(false);
      }

      return;
    }

    await nextSong();
  };

  audio.addEventListener("ended", handleEnded);

  return () => {
    audio.removeEventListener("ended", handleEnded);
  };
}, [
  audio,
  currentSong,
  repeatMode,
  nextSong,
]);

  /* SEEK */


const seekForward = useCallback(
  async (seconds = 10) => {
    if (isNativeAndroid) {
      const nextTime = Math.max(
        0,
        currentTime + seconds
      );

      try {
        await seekNativeMusic(nextTime);
        setCurrentTime(nextTime);
      } catch (error) {
        console.error(
          "Android seek forward failed:",
          error
        );
      }

      return;
    }

    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(
        audio.currentTime + seconds,
        audio.duration
      );
    }
  },
  [audio, currentTime]
);

const seekBackward = useCallback(
  async (seconds = 10) => {
    if (isNativeAndroid) {
      const previousTime = Math.max(
        0,
        currentTime - seconds
      );

      try {
        await seekNativeMusic(previousTime);
        setCurrentTime(previousTime);
      } catch (error) {
        console.error(
          "Android seek backward failed:",
          error
        );
      }

      return;
    }

    audio.currentTime = Math.max(
      audio.currentTime - seconds,
      0
    );
  },
  [audio, currentTime]
);

  /* VOLUME */

  const changeVolume = useCallback(
  async (value) => {
    const newVolume = Math.min(
      Math.max(Number(value) || 0, 0),
      1
    );

    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (isNativeAndroid) {
      try {
        await setNativeMusicVolume(newVolume);
      } catch (error) {
        console.error(
          "Native music volume change failed:",
          error
        );
      }

      return;
    }

    audio.volume = newVolume;
    audio.muted = newVolume === 0;
  },
  [audio]
);


  const toggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  /* SHUFFLE AND REPEAT */

  const toggleShuffle = useCallback(() => {
    setIsShuffle((previous) => !previous);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((previous) => {
      if (previous === "off") return "all";
      if (previous === "all") return "one";
      return "off";
    });
  }, []);

  /* LIKE / UNLIKE */

  const toggleLike = useCallback(
    async (song = currentSong) => {
      const songId = getSongId(song);

      if (songId == null || !user) return;

      try {
        if (isLiked && sameSong(song, currentSong)) {
          await API.delete(`/liked-songs/${songId}`);
          setIsLiked(false);
        } else {
          await API.post("/liked-songs", {
            song_id: songId,
          });

          if (sameSong(song, currentSong)) {
            setIsLiked(true);
          }
        }
      } catch (error) {
        console.error("Toggle like failed:", error);
      }
    },
    [currentSong, user, isLiked]
  );

  /* DOWNLOAD SONG FOR OFFLINE PLAYBACK */

  const downloadSong = useCallback(async (song) => {
    const songId = getSongId(song);

    if (songId == null) return false;

    try {
      const existing = await getOfflineSong(songId);

      if (existing?.blob) return true;

      const audioUrl = getSongAudioUrl(song);

      if (!audioUrl) {
        throw new Error("Song has no valid audio URL");
      }

      const response = await fetch(audioUrl);

      if (!response.ok) {
        throw new Error(
          `Audio download failed with status ${response.status}`
        );
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("Downloaded audio file is empty");
      }

      const saved = await saveOfflineSong({
        ...song,
        id: songId,
        blob,
        downloadedAt: Date.now(),
      });

      if (saved) {
        setOfflineSongs(await getAllOfflineSongs());
      }

      return saved;
    } catch (error) {
      console.error("Offline download failed:", error);
      return false;
    }
  }, []);


  
  // Alias used by SongDetails.jsx
  const downloadSongOffline = downloadSong;

  // Track which song is currently downloading
  const [offlineDownloadingId, setOfflineDownloadingId] = useState(null);


  /* REMOVE OFFLINE SONG */

  const removeOfflineSong = useCallback(async (songId) => {
    if (songId == null) return;

    await deleteOfflineSong(songId);
    setOfflineSongs(await getAllOfflineSongs());
  }, []);

  const isSongOffline = useCallback(
    (songId) =>
      offlineSongs.some(
        (song) => Number(getSongId(song)) === Number(songId)
      ),
    [offlineSongs]
  );

  /* QUEUE: ADD WITHOUT PLAYING */


  /* QUEUE: ADD WITHOUT PLAYING */

  const addToQueue = useCallback(
    (song) => {
      if (getSongId(song) == null) return;

      setQueue((previous) => {
        const existingQueue = Array.isArray(previous)
          ? previous
          : [];

        // Do not add the same song twice.
        if (
          existingQueue.some((item) => sameSong(item, song))
        ) {
          return existingQueue;
        }

        // Preserve the currently playing song at the front
        // when creating a queue for the first time.
        if (
          currentSong &&
          !existingQueue.some(
            (item) => sameSong(item, currentSong)
          )
        ) {
          return [...existingQueue, currentSong, song];
        }

        return [...existingQueue, song];
      });

      setCurrentIndex((previousIndex) => {
        if (previousIndex >= 0) return previousIndex;
        return currentSong ? 0 : -1;
      });
    },
    [currentSong]
  );


  /* QUEUE: REMOVE */

  const removeFromQueue = useCallback(
    (songId) => {
      setQueue((previous) => {
        const removedIndex = previous.findIndex(
          (song) => Number(getSongId(song)) === Number(songId)
        );

        if (removedIndex < 0) return previous;

        const updated = previous.filter(
          (song) => Number(getSongId(song)) !== Number(songId)
        );

        if (removedIndex < currentIndex) {
          setCurrentIndex((index) => Math.max(0, index - 1));
        } else if (removedIndex === currentIndex) {
          const newIndex = updated.findIndex(
            (song) => sameSong(song, currentSong)
          );

          setCurrentIndex(newIndex);
        }

        return updated;
      });
    },
    [currentIndex, currentSong]
  );

  /* QUEUE: CLEAR UPCOMING SONGS */

  const clearQueue = useCallback(() => {
    setQueue(currentSong ? [currentSong] : []);
    setCurrentIndex(currentSong ? 0 : -1);
  }, [currentSong]);

  /* QUEUE: MOVE UP */

  const moveQueueItemUp = useCallback(
    (songId) => {
      setQueue((previous) => {
        const index = previous.findIndex(
          (song) => Number(getSongId(song)) === Number(songId)
        );

        if (index <= 0) return previous;

        const updated = [...previous];

        [updated[index - 1], updated[index]] = [
          updated[index],
          updated[index - 1],
        ];

        setCurrentIndex((current) => {
          if (current === index) return index - 1;
          if (current === index - 1) return index;
          return current;
        });

        return updated;
      });
    },
    []
  );

  /* QUEUE: MOVE DOWN */

  const moveQueueItemDown = useCallback(
    (songId) => {
      setQueue((previous) => {
        const index = previous.findIndex(
          (song) => Number(getSongId(song)) === Number(songId)
        );

        if (index < 0 || index >= previous.length - 1) {
          return previous;
        }

        const updated = [...previous];

        [updated[index], updated[index + 1]] = [
          updated[index + 1],
          updated[index],
        ];

        setCurrentIndex((current) => {
          if (current === index) return index + 1;
          if (current === index + 1) return index;
          return current;
        });

        return updated;
      });
    },
    []
  );

  /* PLAY A SONG SELECTED FROM THE QUEUE */


  /* PLAY A SONG SELECTED FROM THE QUEUE */

  const playQueueSong = useCallback(
    async (song) => {
      if (!song || getSongId(song) == null) return;

      const activeQueue = Array.isArray(queue) ? queue : [];

      const index = activeQueue.findIndex(
        (item) => sameSong(item, song)
      );

      if (index >= 0) {
        await playSong(activeQueue[index], activeQueue, index);
        return;
      }

      // If the selected song is not currently in the queue,
      // create a valid queue containing the current song and selection.
      const nextQueue =
        currentSong && !sameSong(currentSong, song)
          ? [currentSong, song]
          : [song];

      const nextIndex = nextQueue.findIndex(
        (item) => sameSong(item, song)
      );

      await playSong(song, nextQueue, nextIndex);
    },
    [queue, currentSong, playSong]
  );


  /* CLOSE / CLEAR PLAYER */
const clearPlayer = useCallback(async () => {
  playRequestIdRef.current += 1;

  try {
    if (isNativeAndroid) {
      await Playlist.pause();
      await Playlist.clearAllItems();
    } else {
      audio.pause();

      try {
        audio.currentTime = 0;
      } catch {}

      audio.removeAttribute("src");
      audio.load();
    }
  } catch (error) {
    console.error("Failed to clear player:", error);
  }

  releaseObjectUrl();

  setCurrentSong(null);
  setQueue([]);
  setCurrentIndex(-1);
  setCurrentTime(0);
  setDuration(0);
  setIsPlaying(false);
  setIsLiked(false);
  setIsLoading(false);

  localStorage.removeItem(PLAYER_STORAGE_KEY);
}, [audio, releaseObjectUrl]);

  const closePlayer = clearPlayer;

  /* CLEANUP */

  useEffect(() => {
    return () => {
      playRequestIdRef.current += 1;

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      releaseObjectUrl();
    };
  }, [audio, releaseObjectUrl]);

  /* FORMAT TIME */

  const formatTime = useCallback((seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }, []);

  /* CONTEXT VALUE */

  const value = {
    currentSong,
    setCurrentSong,
    queue,
    setQueue,
    currentIndex,
    setCurrentIndex,

    isPlaying,
    isLoading,

    playSong,
    pauseSong,
    resumeSong,
    togglePlay,
    nextSong,
    previousSong,

    currentTime,
    duration,
    seek,
    seekForward,
    seekBackward,

    volume,
    setVolume: changeVolume,
    changeVolume,
    isMuted,
    toggleMute,

    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,

    isLiked,
    setIsLiked,
    toggleLike,

    offlineSongs,
    downloadSong,
       downloadSongOffline,
    offlineDownloadingId,
    removeOfflineSong,
    isSongOffline,

    addToQueue,
    removeFromQueue,
    clearQueue,
    moveQueueItemUp,
    moveQueueItemDown,
    playQueueSong,

    audioRef,
    audio,

    clearPlayer,
    closePlayer,
    formatTime,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
