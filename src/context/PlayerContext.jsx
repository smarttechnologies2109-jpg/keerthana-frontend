import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getMediaUrl } from "../utils/media";
import API from "../services/api";
import { useAuth } from "./AuthContext";

export const PlayerContext = createContext(null);

const PLAYER_STORAGE_KEY =
  "keerthana_player_state";

const OFFLINE_DB_NAME =
  "keerthana_offline_music";

const OFFLINE_DB_VERSION = 1;

const OFFLINE_STORE_NAME =
  "songs";


/* =========================================================
   OFFLINE DATABASE
========================================================= */

const openOfflineDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(
        new Error(
          "IndexedDB is not supported on this device."
        )
      );

      return;
    }

    const request = window.indexedDB.open(
      OFFLINE_DB_NAME,
      OFFLINE_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          OFFLINE_STORE_NAME
        )
      ) {
        db.createObjectStore(
          OFFLINE_STORE_NAME,
          {
            keyPath: "id",
          }
        );
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
   SAVE OFFLINE SONG
========================================================= */

const saveOfflineSong = async (
  song,
  audioBlob
) => {
  const db =
    await openOfflineDB();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          OFFLINE_STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          OFFLINE_STORE_NAME
        );

      const offlineSong = {
        id: song.id,

        number:
          song.number || "",

        title:
          song.title || "",

        titleEnglish:
          song.titleEnglish || "",

        language:
          song.language || "",

        category:
          song.category || "",

        lyrics:
          song.lyrics || "",

        audio_url:
          song.audio_url || "",

        audioBlob,

        downloadedAt:
          new Date().toISOString(),
      };

      store.put(offlineSong);

      transaction.oncomplete = () => {
        db.close();

        resolve(
          offlineSong
        );
      };

      transaction.onerror = () => {
        db.close();

        reject(
          transaction.error
        );
      };
    }
  );
};


/* =========================================================
   GET OFFLINE SONG
========================================================= */

const getOfflineSong = async (
  songId
) => {
  const db =
    await openOfflineDB();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          OFFLINE_STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          OFFLINE_STORE_NAME
        );

      const request =
        store.get(songId);

      request.onsuccess = () => {
        db.close();

        resolve(
          request.result || null
        );
      };

      request.onerror = () => {
        db.close();

        reject(
          request.error
        );
      };
    }
  );
};


/* =========================================================
   GET ALL OFFLINE SONGS
========================================================= */

const getAllOfflineSongs =
  async () => {
    const db =
      await openOfflineDB();

    return new Promise(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            OFFLINE_STORE_NAME,
            "readonly"
          );

        const store =
          transaction.objectStore(
            OFFLINE_STORE_NAME
          );

        const request =
          store.getAll();

        request.onsuccess = () => {
          db.close();

          resolve(
            request.result || []
          );
        };

        request.onerror = () => {
          db.close();

          reject(
            request.error
          );
        };
      }
    );
  };


/* =========================================================
   DELETE OFFLINE SONG
========================================================= */

const deleteOfflineSong =
  async (songId) => {
    const db =
      await openOfflineDB();

    return new Promise(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            OFFLINE_STORE_NAME,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            OFFLINE_STORE_NAME
          );

        store.delete(songId);

        transaction.oncomplete = () => {
          db.close();

          resolve(true);
        };

        transaction.onerror = () => {
          db.close();

          reject(
            transaction.error
          );
        };
      }
    );
  };


/* =========================================================
   CHECK OFFLINE SONG
========================================================= */

const checkOfflineSong =
  async (songId) => {
    try {
      const song =
        await getOfflineSong(
          songId
        );

      return Boolean(song);
    } catch (error) {
      console.error(
        "Offline check error:",
        error
      );

      return false;
    }
  };


/* =========================================================
   PLAYER PROVIDER
========================================================= */

export function PlayerProvider({
  children,
}) {
  /* =======================================================
     REFS
  ======================================================= */

  const audioRef =
    useRef(null);

  const historyIdRef =
    useRef(null);

  const lastSavedProgressRef =
    useRef(0);

  const songStartTimeRef =
    useRef(0);

  const progressSavingRef =
    useRef(false);

  const restoringPlayerRef =
    useRef(true);

  const storageReadyRef =
    useRef(false);

  const restoringPositionRef =
    useRef(false);

  const restoredTimeRef =
    useRef(0);

  const shouldAutoplayRef =
    useRef(false);

  /*
    URL created from IndexedDB audio Blob.
    We revoke it when it is no longer required.
  */

  const offlineAudioUrlRef =
    useRef(null);


  /* =======================================================
     AUTH
  ======================================================= */

  const { user } =
    useAuth();


  /* =======================================================
     STATE
  ======================================================= */

  const [queue, setQueue] =
    useState([]);

  const [currentSong, setCurrentSong] =
    useState(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(1);

  const [shuffle, setShuffle] =
    useState(false);

  const [repeatMode, setRepeatMode] =
    useState("off");


  /* =======================================================
     OFFLINE STATE
  ======================================================= */

  const [offlineSongs, setOfflineSongs] =
    useState([]);

  const [offlineLoading, setOfflineLoading] =
    useState(false);

  const [offlineDownloadingId, setOfflineDownloadingId] =
    useState(null);


  /* =======================================================
     LOAD OFFLINE SONGS
  ======================================================= */

  const refreshOfflineSongs =
    async () => {
      try {
        const songs =
          await getAllOfflineSongs();

        setOfflineSongs(
          songs || []
        );

        return songs || [];
      } catch (error) {
        console.error(
          "Unable to load offline songs:",
          error
        );

        setOfflineSongs([]);

        return [];
      }
    };


  useEffect(() => {
    refreshOfflineSongs();
  }, []);


  /* =======================================================
     RESTORE PLAYER STATE
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          PLAYER_STORAGE_KEY
        );

      if (!stored) {
        restoringPlayerRef.current =
          false;

        storageReadyRef.current =
          true;

        return;
      }

      const state =
        JSON.parse(stored);


      /* ---------------------------------------------------
         CURRENT SONG
      --------------------------------------------------- */

      if (
        state.currentSong &&
        state.currentSong.audio_url
      ) {
        setCurrentSong(
          state.currentSong
        );
      }


      /* ---------------------------------------------------
         QUEUE
      --------------------------------------------------- */

      if (
        Array.isArray(
          state.queue
        )
      ) {
        setQueue(
          state.queue
        );
      }


      /* ---------------------------------------------------
         CURRENT TIME
      --------------------------------------------------- */

      const savedTime =
        Number(
          state.currentTime
        ) || 0;

      if (
        Number.isFinite(
          savedTime
        ) &&
        savedTime >= 0
      ) {
        restoredTimeRef.current =
          savedTime;

        songStartTimeRef.current =
          savedTime;

        restoringPositionRef.current =
          savedTime > 0;

        setCurrentTime(
          savedTime
        );
      }


      /* ---------------------------------------------------
         VOLUME
      --------------------------------------------------- */

      const savedVolume =
        Number(
          state.volume
        );

      if (
        Number.isFinite(
          savedVolume
        )
      ) {
        setVolume(
          Math.min(
            1,
            Math.max(
              0,
              savedVolume
            )
          )
        );
      }


      /* ---------------------------------------------------
         SHUFFLE
      --------------------------------------------------- */

      if (
        typeof state.shuffle ===
        "boolean"
      ) {
        setShuffle(
          state.shuffle
        );
      }


      /* ---------------------------------------------------
         REPEAT
      --------------------------------------------------- */

      if (
        [
          "off",
          "all",
          "one",
        ].includes(
          state.repeatMode
        )
      ) {
        setRepeatMode(
          state.repeatMode
        );
      }
    } catch (error) {
      console.error(
        "Player restore error:",
        error
      );

      localStorage.removeItem(
        PLAYER_STORAGE_KEY
      );
    }


    /*
      Restored songs must NOT
      automatically play.
    */

    shouldAutoplayRef.current =
      false;

    restoringPlayerRef.current =
      false;

    storageReadyRef.current =
      true;
  }, []);


  /* =======================================================
     SAVE PLAYER STATE
  ======================================================= */

  useEffect(() => {
    if (
      !storageReadyRef.current
    ) {
      return;
    }

    /*
      Don't overwrite restored
      position with 0.
    */

    if (
      restoringPositionRef.current &&
      restoredTimeRef.current > 0
    ) {
      return;
    }

    try {
      const audio =
        audioRef.current;

      const actualTime =
        audio
          ? Number(
              audio.currentTime
            ) || 0
          : Number(
              currentTime
            ) || 0;

      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify({
          currentSong,
          queue,
          currentTime:
            actualTime,
          volume,
          shuffle,
          repeatMode,
        })
      );
    } catch (error) {
      console.error(
        "Player save error:",
        error
      );
    }
  }, [
    currentSong,
    queue,
    currentTime,
    volume,
    shuffle,
    repeatMode,
  ]);


  /* =======================================================
     SAVE BEFORE REFRESH
  ======================================================= */

  useEffect(() => {
    const handleBeforeUnload =
      () => {
        try {
          const audio =
            audioRef.current;

          let actualTime =
            Number(
              currentTime
            ) || 0;

          if (audio) {
            actualTime =
              Number(
                audio.currentTime
              ) || 0;
          }

          if (
            restoringPositionRef.current &&
            restoredTimeRef.current >
              0 &&
            actualTime === 0
          ) {
            actualTime =
              restoredTimeRef.current;
          }

          localStorage.setItem(
            PLAYER_STORAGE_KEY,
            JSON.stringify({
              currentSong,
              queue,
              currentTime:
                actualTime,
              volume,
              shuffle,
              repeatMode,
            })
          );
        } catch (error) {
          console.error(
            "Player unload save error:",
            error
          );
        }
      };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    currentSong,
    queue,
    currentTime,
    volume,
    shuffle,
    repeatMode,
  ]);


  /* =======================================================
     RECORD HISTORY
  ======================================================= */

  const recordHistory =
    async (
      song,
      startTime = 0
    ) => {
      if (
        !user ||
        !song?.id
      ) {
        return;
      }

      try {
        const response =
          await API.post(
            "/history/play",
            {
              song_id: song.id,

              progress_seconds:
                Math.floor(
                  Number(
                    startTime
                  ) || 0
                ),

              completed: false,
            }
          );

        historyIdRef.current =
          response.data?.history
            ?.id || null;

        lastSavedProgressRef.current =
          Math.floor(
            Number(
              startTime
            ) || 0
          );
      } catch (error) {
        console.error(
          "History error:",
          error.response?.data ||
            error.message
        );
      }
    };


  /* =======================================================
     SAVE SERVER PROGRESS
  ======================================================= */

  const saveProgress =
    async (
      time,
      completed = false
    ) => {
      if (
        !user ||
        !historyIdRef.current
      ) {
        return;
      }

      if (
        progressSavingRef.current &&
        !completed
      ) {
        return;
      }

      const progress =
        Math.max(
          0,
          Math.floor(
            Number(time) || 0
          )
        );

      try {
        progressSavingRef.current =
          true;

        await API.patch(
          `/history/${historyIdRef.current}/progress`,
          {
            progress_seconds:
              progress,

            completed,
          }
        );

        lastSavedProgressRef.current =
          progress;
      } catch (error) {
        console.error(
          "Progress error:",
          error.response?.data ||
            error.message
        );
      } finally {
        progressSavingRef.current =
          false;
      }
    };


  /* =======================================================
     DOWNLOAD SONG FOR OFFLINE USE
     
     This saves:
     
     - Audio
     - Lyrics
     - Title
     - Category
     - Language
     - Other song information
  ======================================================= */

  const downloadSongOffline =
    async (song) => {
      if (!song?.id) {
        return {
          success: false,
          error:
            "Invalid song.",
        };
      }

      if (
        !song.audio_url
      ) {
        return {
          success: false,
          error:
            "This song does not have an audio file.",
        };
      }

      try {
        setOfflineDownloadingId(
          song.id
        );

        /*
          Check if already downloaded.
        */

        const existing =
          await getOfflineSong(
            song.id
          );

        if (existing) {
          await refreshOfflineSongs();

          return {
            success: true,
            alreadyDownloaded:
              true,
          };
        }


        /*
          Get the real media URL.
        */

        const mediaUrl =
          getMediaUrl(
            song.audio_url
          );


        /*
          Download audio.
        */

        const response =
          await fetch(
            mediaUrl
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Audio download failed: ${response.status}`
          );
        }


        /*
          Convert audio into Blob.
        */

        const audioBlob =
          await response.blob();


        if (
          !audioBlob ||
          audioBlob.size === 0
        ) {
          throw new Error(
            "Downloaded audio is empty."
          );
        }


        /*
          Save audio + lyrics
          + song information.
        */

        await saveOfflineSong(
          song,
          audioBlob
        );


        /*
          Refresh offline list.
        */

        await refreshOfflineSongs();


        return {
          success: true,
          alreadyDownloaded:
            false,
        };
      } catch (error) {
        console.error(
          "Offline download error:",
          error
        );

        return {
          success: false,
          error:
            error.message ||
            "Unable to download song.",
        };
      } finally {
        setOfflineDownloadingId(
          null
        );
      }
    };


  /* =======================================================
     REMOVE OFFLINE SONG
  ======================================================= */

  const removeOfflineSong =
    async (songId) => {
      try {
        /*
          If currently playing
          this offline song,
          switch back to network
          source before deleting.
        */

        if (
          currentSong?.id ===
          songId
        ) {
          if (
            offlineAudioUrlRef.current
          ) {
            URL.revokeObjectURL(
              offlineAudioUrlRef.current
            );

            offlineAudioUrlRef.current =
              null;
          }
        }

        await deleteOfflineSong(
          songId
        );

        await refreshOfflineSongs();

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          "Remove offline song error:",
          error
        );

        return {
          success: false,
          error:
            error.message ||
            "Unable to remove offline song.",
        };
      }
    };


  /* =======================================================
     CHECK SONG OFFLINE
  ======================================================= */

  const isSongOffline =
    async (songId) => {
      return checkOfflineSong(
        songId
      );
    };


  /* =======================================================
     GET OFFLINE SONGS
  ======================================================= */

  const getOfflineSongs =
    async () => {
      try {
        return await getAllOfflineSongs();
      } catch (error) {
        console.error(
          "Get offline songs error:",
          error
        );

        return [];
      }
    };


  /* =======================================================
     GET AUDIO SOURCE
     
     OFFLINE FIRST:
     
     1. If downloaded -> IndexedDB Blob
     2. Otherwise -> Server URL
  ======================================================= */

  const loadAudioSource =
    async (song) => {
      if (
        !song?.audio_url
      ) {
        return null;
      }


      /*
        Revoke previous
        object URL.
      */

      if (
        offlineAudioUrlRef.current
      ) {
        URL.revokeObjectURL(
          offlineAudioUrlRef.current
        );

        offlineAudioUrlRef.current =
          null;
      }


      /*
        Check offline database.
      */

      try {
        const offlineSong =
          await getOfflineSong(
            song.id
          );

        if (
          offlineSong?.audioBlob
        ) {
          const objectUrl =
            URL.createObjectURL(
              offlineSong.audioBlob
            );

          offlineAudioUrlRef.current =
            objectUrl;

          return objectUrl;
        }
      } catch (error) {
        console.warn(
          "Offline audio lookup failed:",
          error
        );
      }


      /*
        No offline copy.
        Use server URL.
      */

      return getMediaUrl(
        song.audio_url
      );
    };


  /* =======================================================
     PLAY SONG
  ======================================================= */

  const playSong =
    async (
      song,
      songList = [],
      startTime = 0
    ) => {
      if (
        !song?.audio_url
      ) {
        console.error(
          "Song has no audio URL:",
          song
        );

        return;
      }


      /* ---------------------------------------------------
         SET QUEUE
      --------------------------------------------------- */

      if (
        Array.isArray(
          songList
        ) &&
        songList.length
      ) {
        setQueue(
          songList
        );
      }


      /* ---------------------------------------------------
         SAME SONG
      --------------------------------------------------- */

      if (
        currentSong?.id ===
        song.id
      ) {
        const audio =
          audioRef.current;

        if (!audio) {
          return;
        }

        const start =
          Math.max(
            0,
            Number(
              startTime
            ) || 0
          );

        if (
          start > 0 &&
          Math.abs(
            audio.currentTime -
              start
          ) > 2
        ) {
          audio.currentTime =
            start;

          setCurrentTime(
            start
          );
        }

        try {
          await audio.play();
        } catch (error) {
          console.error(
            "Play error:",
            error
          );

          setIsPlaying(false);
        }

        return;
      }


      /* ---------------------------------------------------
         SAVE OLD SONG
      --------------------------------------------------- */

      if (
        audioRef.current &&
        historyIdRef.current
      ) {
        await saveProgress(
          audioRef.current
            .currentTime
        );
      }


      /* ---------------------------------------------------
         RESET HISTORY
      --------------------------------------------------- */

      historyIdRef.current =
        null;

      lastSavedProgressRef.current =
        0;

      progressSavingRef.current =
        false;


      /* ---------------------------------------------------
         START POSITION
      --------------------------------------------------- */

      const safeStart =
        Math.max(
          0,
          Number(
            startTime
          ) || 0
        );

      songStartTimeRef.current =
        safeStart;

      restoredTimeRef.current =
        safeStart;

      restoringPositionRef.current =
        safeStart > 0;


      /*
        User selected this song.
        Automatically play.
      */

      shouldAutoplayRef.current =
        true;


      setCurrentTime(
        safeStart
      );

      setDuration(0);


      /* ---------------------------------------------------
         SET SONG
      --------------------------------------------------- */

      setCurrentSong(
        song
      );


      /* ---------------------------------------------------
         RECORD HISTORY
      --------------------------------------------------- */

      await recordHistory(
        song,
        safeStart
      );
    };


  /* =======================================================
     LOAD CURRENT SONG
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadSong =
      async () => {
        const audio =
          audioRef.current;

        if (
          !audio ||
          !currentSong?.audio_url
        ) {
          return;
        }


        /*
          Get offline audio if
          available.
        */

        const source =
          await loadAudioSource(
            currentSong
          );

        if (
          cancelled ||
          !source
        ) {
          return;
        }


        /*
          Set source.
        */

        audio.src =
          source;

        audio.load();


        /*
          User selected song.
        */

        if (
          shouldAutoplayRef.current
        ) {
          const playWhenReady =
            async () => {
              try {
                await audio.play();
              } catch (error) {
                console.error(
                  "Automatic song play error:",
                  error
                );

                setIsPlaying(
                  false
                );
              }
            };

          audio.addEventListener(
            "canplay",
            playWhenReady,
            {
              once: true,
            }
          );

          return () => {
            audio.removeEventListener(
              "canplay",
              playWhenReady
            );
          };
        }


        /*
          Restored player stays paused.
        */

        if (
          restoringPlayerRef.current
        ) {
          setIsPlaying(
            false
          );
        }
      };


    loadSong();


    return () => {
      cancelled = true;
    };
  }, [
    currentSong,
  ]);


  /* =======================================================
     TOGGLE PLAY / PAUSE
  ======================================================= */

  const togglePlay =
    async () => {
      const audio =
        audioRef.current;

      if (
        !audio ||
        !currentSong
      ) {
        return;
      }


      /* ---------------------------------------------------
         PAUSE
      --------------------------------------------------- */

      if (isPlaying) {
        audio.pause();

        await saveProgress(
          audio.currentTime
        );

        return;
      }


      /* ---------------------------------------------------
         PLAY
      --------------------------------------------------- */

      try {
        await audio.play();
      } catch (error) {
        console.error(
          "Play error:",
          error
        );
      }
    };


  /* =======================================================
     SHUFFLE
  ======================================================= */

  const toggleShuffle =
    () => {
      setShuffle(
        (value) => !value
      );
    };

  /* =======================================================
     ADD SONG TO QUEUE
  ======================================================= */

  const addToQueue =
    (song) => {
      if (!song?.id) {
        return false;
      }

      setQueue(
        (currentQueue) => {

          /*
            Prevent duplicate songs.
          */

          const alreadyExists =
            currentQueue.some(
              (item) =>
                item.id === song.id
            );

          if (alreadyExists) {
            return currentQueue;
          }

          return [
            ...currentQueue,
            song,
          ];
        }
      );

      return true;
    };


  /* =======================================================
     ADD MULTIPLE SONGS TO QUEUE
  ======================================================= */

  const addSongsToQueue =
    (songs) => {
      if (
        !Array.isArray(songs) ||
        !songs.length
      ) {
        return;
      }

      setQueue(
        (currentQueue) => {

          const existingIds =
            new Set(
              currentQueue.map(
                (song) =>
                  song.id
              )
            );

          const newSongs =
            songs.filter(
              (song) => {

                if (
                  !song?.id ||
                  existingIds.has(
                    song.id
                  )
                ) {
                  return false;
                }

                existingIds.add(
                  song.id
                );

                return true;
              }
            );

          return [
            ...currentQueue,
            ...newSongs,
          ];
        }
      );
    };


  /* =======================================================
     REMOVE SONG FROM QUEUE
  ======================================================= */

const removeFromQueue =
  (songId) => {

    if (
      songId === undefined ||
      songId === null
    ) {
      return;
    }

    setQueue(
      (currentQueue) =>
        currentQueue.filter(
          (song) =>
            Number(song?.id) !==
            Number(songId)
        )
    );
  };


  /* =======================================================
     CLEAR QUEUE
  ======================================================= */

  const clearQueue =
    () => {

      /*
        Keep the currently playing
        song in the queue.

        Remove everything after it.
      */

      if (!currentSong) {
        setQueue([]);
        return;
      }

      setQueue(
        (currentQueue) => {

          const currentIndex =
            currentQueue.findIndex(
              (song) =>
                song.id ===
                currentSong.id
            );

          if (
            currentIndex < 0
          ) {
            return [
              currentSong,
            ];
          }

          return currentQueue.slice(
            0,
            currentIndex + 1
          );
        }
      );
    };


  /* =======================================================
     MOVE QUEUE SONG UP
  ======================================================= */

  const moveQueueItemUp =
    (songId) => {

      setQueue(
        (currentQueue) => {

          const index =
            currentQueue.findIndex(
              (song) =>
                song.id === songId
            );

          if (
            index <= 0
          ) {
            return currentQueue;
          }

          const updatedQueue = [
            ...currentQueue,
          ];

          [
            updatedQueue[index - 1],
            updatedQueue[index],
          ] = [
            updatedQueue[index],
            updatedQueue[index - 1],
          ];

          return updatedQueue;
        }
      );
    };


  /* =======================================================
     MOVE QUEUE SONG DOWN
  ======================================================= */

  const moveQueueItemDown =
    (songId) => {

      setQueue(
        (currentQueue) => {

          const index =
            currentQueue.findIndex(
              (song) =>
                song.id === songId
            );

          if (
            index < 0 ||
            index >=
              currentQueue.length - 1
          ) {
            return currentQueue;
          }

          const updatedQueue = [
            ...currentQueue,
          ];

          [
            updatedQueue[index],
            updatedQueue[index + 1],
          ] = [
            updatedQueue[index + 1],
            updatedQueue[index],
          ];

          return updatedQueue;
        }
      );
    };


  /* =======================================================
     PLAY SONG FROM QUEUE
  ======================================================= */

  const playQueueSong =
    async (song) => {

      if (!song?.id) {
        return;
      }

      await playSong(
        song,
        queue
      );
    };
  /* =======================================================
     REPEAT
  ======================================================= */

  const toggleRepeat =
    () => {
      setRepeatMode(
        (mode) => {
          if (
            mode === "off"
          ) {
            return "all";
          }

          if (
            mode === "all"
          ) {
            return "one";
          }

          return "off";
        }
      );
    };


  /* =======================================================
     NEXT SONG
  ======================================================= */

  const nextSong =
    async () => {
      if (
        !currentSong ||
        !queue.length
      ) {
        return;
      }


      /* ---------------------------------------------------
         SHUFFLE
      --------------------------------------------------- */

      if (
        shuffle &&
        queue.length > 1
      ) {
        const availableSongs =
          queue.filter(
            (song) =>
              song.id !==
              currentSong.id
          );

        const randomSong =
          availableSongs[
            Math.floor(
              Math.random() *
                availableSongs.length
            )
          ];

        if (randomSong) {
          await playSong(
            randomSong,
            queue
          );
        }

        return;
      }


      /* ---------------------------------------------------
         FIND CURRENT
      --------------------------------------------------- */

      const index =
        queue.findIndex(
          (song) =>
            song.id ===
            currentSong.id
        );

      if (index < 0) {
        return;
      }


      /* ---------------------------------------------------
         NEXT
      --------------------------------------------------- */

      if (
        index <
        queue.length - 1
      ) {
        await playSong(
          queue[index + 1],
          queue
        );

        return;
      }


      /* ---------------------------------------------------
         REPEAT ALL
      --------------------------------------------------- */

      if (
        repeatMode ===
        "all"
      ) {
        await playSong(
          queue[0],
          queue
        );
      }
    };


  /* =======================================================
     PREVIOUS SONG
  ======================================================= */

  const previousSong =
    async () => {
      if (
        !currentSong ||
        !queue.length
      ) {
        return;
      }

      const audio =
        audioRef.current;


      /* ---------------------------------------------------
         RESTART CURRENT
      --------------------------------------------------- */

      if (
        audio &&
        audio.currentTime > 3
      ) {
        audio.currentTime = 0;

        setCurrentTime(0);

        await saveProgress(0);

        return;
      }


      /* ---------------------------------------------------
         FIND CURRENT
      --------------------------------------------------- */

      const index =
        queue.findIndex(
          (song) =>
            song.id ===
            currentSong.id
        );

      if (index < 0) {
        return;
      }


      const previousIndex =
        index <= 0
          ? queue.length - 1
          : index - 1;


      await playSong(
        queue[
          previousIndex
        ],
        queue
      );
    };


  /* =======================================================
     SEEK
  ======================================================= */

  const seek =
    (time) => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      let value =
        Number(time);

      if (
        !Number.isFinite(
          value
        )
      ) {
        value = 0;
      }

      value = Math.max(
        0,
        value
      );

      if (
        duration > 0
      ) {
        value = Math.min(
          value,
          duration
        );
      }

      audio.currentTime =
        value;

      setCurrentTime(
        value
      );


      if (
        storageReadyRef.current
      ) {
        try {
          localStorage.setItem(
            PLAYER_STORAGE_KEY,
            JSON.stringify({
              currentSong,
              queue,
              currentTime:
                value,
              volume,
              shuffle,
              repeatMode,
            })
          );
        } catch (error) {
          console.error(
            "Seek save error:",
            error
          );
        }
      }
    };


  /* =======================================================
     VOLUME
  ======================================================= */

  const changeVolume =
    (value) => {
      const volumeValue =
        Math.min(
          1,
          Math.max(
            0,
            Number(value)
          )
        );

      setVolume(
        volumeValue
      );

      if (
        audioRef.current
      ) {
        audioRef.current.volume =
          volumeValue;
      }
    };


  /* =======================================================
     TIME UPDATE
  ======================================================= */

  const handleTimeUpdate =
    (event) => {
      const time =
        event.currentTarget
          .currentTime;

      setCurrentTime(
        time
      );

      if (
        restoringPositionRef.current
      ) {
        return;
      }

      const seconds =
        Math.floor(time);


      /* ---------------------------------------------------
         LOCAL STORAGE
      --------------------------------------------------- */

      if (
        storageReadyRef.current
      ) {
        try {
          localStorage.setItem(
            PLAYER_STORAGE_KEY,
            JSON.stringify({
              currentSong,
              queue,
              currentTime:
                time,
              volume,
              shuffle,
              repeatMode,
            })
          );
        } catch (error) {
          console.error(
            "Realtime player save error:",
            error
          );
        }
      }


      /* ---------------------------------------------------
         SERVER HISTORY
      --------------------------------------------------- */

      if (
        historyIdRef.current &&
        seconds -
          lastSavedProgressRef.current >=
          10
      ) {
        saveProgress(
          seconds
        );
      }
    };


  /* =======================================================
     LOADED METADATA
  ======================================================= */

  const handleLoadedMetadata =
    (event) => {
      const audio =
        event.currentTarget;

      const newDuration =
        Number.isFinite(
          audio.duration
        )
          ? audio.duration
          : 0;

      setDuration(
        newDuration
      );

      const savedPosition =
        Number(
          restoredTimeRef.current
        ) || 0;


      if (
        savedPosition > 0 &&
        newDuration > 0
      ) {
        const safePosition =
          Math.min(
            savedPosition,
            Math.max(
              0,
              newDuration - 1
            )
          );

        try {
          audio.currentTime =
            safePosition;
        } catch (error) {
          console.error(
            "Unable to restore audio position:",
            error
          );
        }

        setCurrentTime(
          safePosition
        );
      } else {
        if (
          !shouldAutoplayRef.current
        ) {
          setCurrentTime(0);
        }
      }


      if (
        restoringPositionRef.current
      ) {
        songStartTimeRef.current =
          0;

        restoredTimeRef.current =
          0;

        restoringPositionRef.current =
          false;
      }


      /* ---------------------------------------------------
         VOLUME
      --------------------------------------------------- */

      audio.volume =
        Math.min(
          1,
          Math.max(
            0,
            Number(volume) || 0
          )
        );
    };


  /* =======================================================
     AUDIO PLAY EVENT
  ======================================================= */

  const handlePlay =
    () => {
      setIsPlaying(
        true
      );

      shouldAutoplayRef.current =
        false;
    };


  /* =======================================================
     AUDIO PAUSE EVENT
  ======================================================= */

  const handlePause =
    () => {
      setIsPlaying(
        false
      );

      const audio =
        audioRef.current;

      if (
        audio &&
        storageReadyRef.current
      ) {
        try {
          let actualTime =
            Number(
              audio.currentTime
            ) || 0;

          if (
            restoringPositionRef.current &&
            restoredTimeRef.current >
              0 &&
            actualTime === 0
          ) {
            actualTime =
              restoredTimeRef.current;
          }

          localStorage.setItem(
            PLAYER_STORAGE_KEY,
            JSON.stringify({
              currentSong,
              queue,
              currentTime:
                actualTime,
              volume,
              shuffle,
              repeatMode,
            })
          );
        } catch (error) {
          console.error(
            "Pause state save error:",
            error
          );
        }
      }
    };


  /* =======================================================
     SONG ENDED
  ======================================================= */

  const handleEnded =
    async () => {
      const audio =
        audioRef.current;

      const finalTime =
        audio?.duration ||
        duration ||
        currentTime;

      await saveProgress(
        finalTime,
        true
      );

      historyIdRef.current =
        null;

      lastSavedProgressRef.current =
        0;


      /* ---------------------------------------------------
         REPEAT ONE
      --------------------------------------------------- */

      if (
        repeatMode ===
          "one" &&
        currentSong
      ) {
        await recordHistory(
          currentSong,
          0
        );

        if (audio) {
          audio.currentTime =
            0;

          setCurrentTime(
            0
          );

          try {
            await audio.play();
          } catch (error) {
            console.error(
              "Repeat play error:",
              error
            );

            setIsPlaying(
              false
            );
          }
        }

        return;
      }


      /* ---------------------------------------------------
         SHUFFLE
      --------------------------------------------------- */

      if (
        shuffle &&
        queue.length > 1
      ) {
        await nextSong();

        return;
      }


      /* ---------------------------------------------------
         FIND CURRENT
      --------------------------------------------------- */

      const index =
        queue.findIndex(
          (song) =>
            song.id ===
            currentSong?.id
        );


      /* ---------------------------------------------------
         NEXT
      --------------------------------------------------- */

      if (
        index >= 0 &&
        index <
          queue.length - 1
      ) {
        await playSong(
          queue[index + 1],
          queue
        );

        return;
      }


      /* ---------------------------------------------------
         REPEAT ALL
      --------------------------------------------------- */

      if (
        repeatMode ===
          "all" &&
        queue.length
      ) {
        await playSong(
          queue[0],
          queue
        );

        return;
      }

      setIsPlaying(
        false
      );
    };


  /* =======================================================
     AUDIO ERROR
  ======================================================= */

  const handleAudioError =
    (event) => {
      console.error(
        "Audio error:",
        event.currentTarget.error
      );

      console.error(
        "Audio URL:",
        audioSrc
      );

      setIsPlaying(
        false
      );
    };


  /* =======================================================
     CLOSE PLAYER
  ======================================================= */

  const closePlayer =
    async () => {
      const audio =
        audioRef.current;

      if (
        audio &&
        historyIdRef.current
      ) {
        await saveProgress(
          audio.currentTime
        );
      }

      if (audio) {
        audio.pause();

        audio.currentTime = 0;
      }

      shouldAutoplayRef.current =
        false;

      setIsPlaying(
        false
      );

      setCurrentSong(
        null
      );

      setQueue([]);

      setCurrentTime(
        0
      );

      setDuration(
        0
      );

      setShuffle(
        false
      );

      setRepeatMode(
        "off"
      );

      historyIdRef.current =
        null;

      lastSavedProgressRef.current =
        0;

      songStartTimeRef.current =
        0;

      restoredTimeRef.current =
        0;

      restoringPositionRef.current =
        false;

      /*
        Revoke offline object URL.
      */

      if (
        offlineAudioUrlRef.current
      ) {
        URL.revokeObjectURL(
          offlineAudioUrlRef.current
        );

        offlineAudioUrlRef.current =
          null;
      }

      localStorage.removeItem(
        PLAYER_STORAGE_KEY
      );
    };


  /* =======================================================
     AUDIO SOURCE
  ======================================================= */

  const audioSrc =
    currentSong?.audio_url
      ? getMediaUrl(
          currentSong.audio_url
        )
      : undefined;


  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <PlayerContext.Provider
      value={{
        /* ---------------------------
           EXISTING PLAYER
        --------------------------- */

        currentSong,
        queue,

        isPlaying,

        currentTime,
        duration,

        volume,

        shuffle,
        repeatMode,

        playSong,
        togglePlay,
        
         /* ---------------------------
           QUEUE
        --------------------------- */

        addToQueue,
        addSongsToQueue,
        removeFromQueue,
        clearQueue,
        moveQueueItemUp,
        moveQueueItemDown,
        playQueueSong,
        nextSong,
        previousSong,

        seek,
        changeVolume,

        toggleShuffle,
        toggleRepeat,

        closePlayer,


        /* ---------------------------
           OFFLINE FEATURES
        --------------------------- */

        offlineSongs,

        offlineLoading,

        offlineDownloadingId,

        downloadSongOffline,

        removeOfflineSong,

        isSongOffline,

        getOfflineSongs,

        refreshOfflineSongs,
      }}
    >
      {children}


      {/* =================================================
          GLOBAL AUDIO
      ================================================= */}

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onTimeUpdate={
          handleTimeUpdate
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onPlay={
          handlePlay
        }
        onPause={
          handlePause
        }
        onEnded={
          handleEnded
        }
        onError={
          handleAudioError
        }
      />
    </PlayerContext.Provider>
  );
}

