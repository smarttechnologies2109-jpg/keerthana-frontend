
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../services/api";
import { useAuth } from "./AuthContext";

const LikedSongsContext = createContext(null);

/* =====================================================
   SONG ID HELPER
===================================================== */

const getSongId = (song) =>
  song?.id ?? song?.song_id ?? song?.song?.id ?? song?.song?.song_id ?? null;

/* =====================================================
   NORMALIZE LIKED SONGS
===================================================== */

function normalizeLikedSongs(response) {
  const data = response?.data;

  let songs = [];

  if (Array.isArray(data)) {
    songs = data;
  } else if (Array.isArray(data?.songs)) {
    songs = data.songs;
  } else if (Array.isArray(data?.likedSongs)) {
    songs = data.likedSongs;
  } else if (Array.isArray(data?.data?.songs)) {
    songs = data.data.songs;
  } else if (Array.isArray(data?.data?.likedSongs)) {
    songs = data.data.likedSongs;
  } else if (Array.isArray(data?.data)) {
    songs = data.data;
  }

  const uniqueSongs = new Map();

  songs.forEach((item) => {
    const song = item?.song ?? item;
    const id = getSongId(song);

    if (id == null) return;

    uniqueSongs.set(String(id), {
      ...song,
      id,
    });
  });

  return Array.from(uniqueSongs.values());
}

/* =====================================================
   PROVIDER
===================================================== */

export function LikedSongsProvider({ children }) {
  const { user } = useAuth();

  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  /* =====================================================
     FETCH LIKED SONGS
  ===================================================== */

  const fetchLikedSongs = useCallback(
    async (showLoading = false) => {
      if (!user) {
        setLikedSongs([]);
        setLoading(false);
        setSyncing(false);
        return [];
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setSyncing(true);
      }

      try {
        const response = await API.get("/liked-songs");
        const songs = normalizeLikedSongs(response);

        setLikedSongs(songs);

        return songs;
      } catch (error) {
        console.error(
          "Failed to fetch liked songs:",
          error?.response?.data || error.message
        );

        return null;
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [user]
  );

  /* =====================================================
     INITIAL FETCH
  ===================================================== */

  useEffect(() => {
    fetchLikedSongs(true);
  }, [fetchLikedSongs]);

  /* =====================================================
     REFRESH WHEN APP BECOMES ACTIVE
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLikedSongs();
      }
    };

    const handleFocus = () => {
      fetchLikedSongs();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", handleFocus);
    };
  }, [user, fetchLikedSongs]);

  /* =====================================================
     LIKED SONG IDS
  ===================================================== */

  const likedSongIds = useMemo(
    () =>
      new Set(
        likedSongs.map((song) => String(getSongId(song)))
      ),
    [likedSongs]
  );

  /* =====================================================
     CHECK LIKED STATUS
  ===================================================== */

  const isLiked = useCallback(
    (songOrId) => {
      const id =
        typeof songOrId === "object"
          ? getSongId(songOrId)
          : songOrId;

      if (id == null) return false;

      return likedSongIds.has(String(id));
    },
    [likedSongIds]
  );

  /* =====================================================
     LIKE SONG
  ===================================================== */

  const likeSong = useCallback(
    async (song) => {
      if (!user) {
        throw new Error("LOGIN_REQUIRED");
      }

      const songId = getSongId(song);

      if (songId == null) {
        throw new Error("SONG_ID_REQUIRED");
      }

      if (isLiked(songId)) return;

      const normalizedSong = {
        ...song,
        id: songId,
      };

      // Immediately update all components using this context.
      setLikedSongs((previous) => {
        const exists = previous.some(
          (item) =>
            String(getSongId(item)) === String(songId)
        );

        if (exists) return previous;

        return [...previous, normalizedSong];
      });

      try {
        await API.post("/liked-songs", {
          song_id: Number(songId),
        });

        await fetchLikedSongs();
      } catch (error) {
        // Roll back optimistic update.
        setLikedSongs((previous) =>
          previous.filter(
            (item) =>
              String(getSongId(item)) !== String(songId)
          )
        );

        console.error(
          "Failed to like song:",
          error?.response?.data || error.message
        );

        throw error;
      }
    },
    [user, isLiked, fetchLikedSongs]
  );

  /* =====================================================
     UNLIKE SONG
  ===================================================== */

  const unlikeSong = useCallback(
    async (songOrId) => {
      if (!user) {
        throw new Error("LOGIN_REQUIRED");
      }

      const songId =
        typeof songOrId === "object"
          ? getSongId(songOrId)
          : songOrId;

      if (songId == null) {
        throw new Error("SONG_ID_REQUIRED");
      }

      const previousSongs = likedSongs;

      // Immediately remove from all components.
      setLikedSongs((previous) =>
        previous.filter(
          (song) =>
            String(getSongId(song)) !== String(songId)
        )
      );

      try {
        await API.delete(`/liked-songs/${songId}`);

        await fetchLikedSongs();
      } catch (error) {
        // Restore previous list if API fails.
        setLikedSongs(previousSongs);

        console.error(
          "Failed to unlike song:",
          error?.response?.data || error.message
        );

        throw error;
      }
    },
    [user, likedSongs, fetchLikedSongs]
  );

  /* =====================================================
     TOGGLE LIKE / UNLIKE
  ===================================================== */

  const toggleLike = useCallback(
    async (song) => {
      if (!user) {
        throw new Error("LOGIN_REQUIRED");
      }

      const songId = getSongId(song);

      if (songId == null) {
        throw new Error("SONG_ID_REQUIRED");
      }

      if (isLiked(songId)) {
        await unlikeSong(songId);
      } else {
        await likeSong({
          ...song,
          id: songId,
        });
      }
    },
    [user, isLiked, unlikeSong, likeSong]
  );

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = useMemo(
    () => ({
      likedSongs,
      loading,
      syncing,
      isLiked,
      likeSong,
      unlikeSong,
      toggleLike,
      refreshLikedSongs: fetchLikedSongs,
    }),
    [
      likedSongs,
      loading,
      syncing,
      isLiked,
      likeSong,
      unlikeSong,
      toggleLike,
      fetchLikedSongs,
    ]
  );

  return (
    <LikedSongsContext.Provider value={value}>
      {children}
    </LikedSongsContext.Provider>
  );
}

/* =====================================================
   CUSTOM HOOK
===================================================== */

export function useLikedSongs() {
  const context = useContext(LikedSongsContext);

  if (!context) {
    throw new Error(
      "useLikedSongs must be used inside LikedSongsProvider"
    );
  }

  return context;
}
