import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getMediaUrl } from "../utils/media";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const PlayerContext = createContext(null);

const PLAYER_STORAGE_KEY =
  "keerthana_player_state";

export function PlayerProvider({ children }) {
  /* =======================================================
     REFS
  ======================================================= */

  const audioRef = useRef(null);

  const historyIdRef = useRef(null);

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

  /*
    IMPORTANT:
    These refs prevent the restored position
    from being overwritten with 0 while the
    audio element is loading.
  */
  const restoringPositionRef =
    useRef(false);

  const restoredTimeRef =
    useRef(0);


  /* =======================================================
     AUTH
  ======================================================= */

  const { user } = useAuth();


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
     RESTORE PLAYER STATE FROM LOCAL STORAGE
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
         RESTORE CURRENT SONG
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
         RESTORE QUEUE
      --------------------------------------------------- */

      if (
        Array.isArray(state.queue)
      ) {
        setQueue(
          state.queue
        );
      }


      /* ---------------------------------------------------
         RESTORE CURRENT TIME
      --------------------------------------------------- */

      const savedTime =
        Number(
          state.currentTime
        ) || 0;

      if (
        Number.isFinite(savedTime) &&
        savedTime >= 0
      ) {
        restoredTimeRef.current =
          savedTime;

        songStartTimeRef.current =
          savedTime;

        /*
          Tell the player that a position
          needs to be restored after the
          audio metadata is loaded.
        */
        restoringPositionRef.current =
          savedTime > 0;

        setCurrentTime(
          savedTime
        );
      }


      /* ---------------------------------------------------
         RESTORE VOLUME
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
         RESTORE SHUFFLE
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
         RESTORE REPEAT MODE
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
      Restoration from localStorage
      has finished.

      We still keep the restored
      position protected until the
      audio metadata is loaded.
    */
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
      IMPORTANT:

      During refresh, React may briefly
      render currentTime as 0 before the
      audio metadata is loaded.

      Do NOT overwrite the saved position.
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
     SAVE BEFORE REFRESH / TAB CLOSE
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

          /*
            Prefer the real audio element
            position.
          */
          if (audio) {
            actualTime =
              Number(
                audio.currentTime
              ) || 0;
          }

          /*
            Never overwrite a valid restored
            position with 0 while restoring.
          */
          if (
            restoringPositionRef.current &&
            restoredTimeRef.current > 0 &&
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

  const recordHistory = async (
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
            song_id:
              song.id,

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
        response.data?.history?.id ||
        null;

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

  const saveProgress = async (
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
          Number(
            time
          ) || 0
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
     PLAY SONG
  ======================================================= */

  const playSong = async (
    song,
    songList = [],
    startTime = 0
  ) => {

    if (!song?.audio_url) {
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
      Array.isArray(songList) &&
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
      }

      return;
    }


    /* ---------------------------------------------------
       SAVE OLD SONG PROGRESS
    --------------------------------------------------- */

    if (
      audioRef.current &&
      historyIdRef.current
    ) {
      await saveProgress(
        audioRef.current.currentTime
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


    setCurrentTime(
      safeStart
    );

    setDuration(
      0
    );


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
    const audio =
      audioRef.current;


    if (
      !audio ||
      !currentSong?.audio_url
    ) {
      return;
    }


    /*
      Load the new audio source.
    */
    audio.load();


    /*
      IMPORTANT:

      Do NOT automatically play after
      refresh.

      Browser autoplay policies can
      block playback.
    */

    if (
      restoringPlayerRef.current
    ) {
      setIsPlaying(
        false
      );
    }

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
     TOGGLE SHUFFLE
  ======================================================= */

  const toggleShuffle =
    () => {
      setShuffle(
        (value) =>
          !value
      );
    };


  /* =======================================================
     TOGGLE REPEAT
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

        const songs =
          queue.filter(
            (song) =>
              song.id !==
              currentSong.id
          );


        const randomSong =
          songs[
            Math.floor(
              Math.random() *
                songs.length
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
         FIND CURRENT SONG
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
          queue[
            index + 1
          ],
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
         RESTART CURRENT SONG
      --------------------------------------------------- */

      if (
        audio &&
        audio.currentTime > 3
      ) {

        audio.currentTime =
          0;

        setCurrentTime(
          0
        );

        await saveProgress(
          0
        );

        return;
      }


      /* ---------------------------------------------------
         FIND CURRENT SONG
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


      value =
        Math.max(
          0,
          value
        );


      if (
        duration > 0
      ) {
        value =
          Math.min(
            value,
            duration
          );
      }


      audio.currentTime =
        value;


      setCurrentTime(
        value
      );


      /*
        Update local storage immediately.
      */
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
     CHANGE VOLUME
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


      /*
        VERY IMPORTANT:

        While restoring the position after
        refresh, the browser can emit a
        timeupdate event with 0.

        Do not save that 0.
      */
      if (
        restoringPositionRef.current
      ) {
        return;
      }


      const seconds =
        Math.floor(
          time
        );


      /* ---------------------------------------------------
         SAVE LOCAL STORAGE
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
         SAVE SERVER HISTORY
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


      /*
        Get the saved position.

        This is the important part that
        restores the song after refresh.
      */
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

        setCurrentTime(
          0
        );
      }


      /*
        Audio position has now been restored.

        It is safe to save timeupdate
        events again.
      */
      songStartTimeRef.current =
        0;

      restoredTimeRef.current =
        0;

      restoringPositionRef.current =
        false;


      /* ---------------------------------------------------
         RESTORE VOLUME
      --------------------------------------------------- */

      audio.volume =
        Math.min(
          1,
          Math.max(
            0,
            Number(
              volume
            ) || 0
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


          /*
            Never replace the restored
            position with 0.
          */
          if (
            restoringPositionRef.current &&
            restoredTimeRef.current > 0 &&
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
        repeatMode === "one" &&
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
         FIND CURRENT SONG
      --------------------------------------------------- */

      const index =
        queue.findIndex(
          (song) =>
            song.id ===
            currentSong?.id
        );


      /* ---------------------------------------------------
         NEXT SONG
      --------------------------------------------------- */

      if (
        index >= 0 &&
        index <
          queue.length - 1
      ) {

        await playSong(
          queue[
            index + 1
          ],
          queue
        );

        return;
      }


      /* ---------------------------------------------------
         REPEAT ALL
      --------------------------------------------------- */

      if (
        repeatMode === "all" &&
        queue.length
      ) {

        await playSong(
          queue[0],
          queue
        );

        return;
      }


      /*
        No next song.

        Make sure UI shows paused.
      */
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

        audio.currentTime =
          0;
      }


      setIsPlaying(
        false
      );

      setCurrentSong(
        null
      );

      setQueue(
        []
      );

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

        nextSong,
        previousSong,

        seek,
        changeVolume,

        toggleShuffle,
        toggleRepeat,

        closePlayer,
      }}
    >

      {children}


      {/* =================================================
          GLOBAL AUDIO ELEMENT
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


/* =========================================================
   USE PLAYER HOOK
========================================================= */

export function usePlayer() {

  const context =
    useContext(
      PlayerContext
    );


  if (!context) {

    throw new Error(
      "usePlayer must be used inside PlayerProvider"
    );
  }


  return context;
}