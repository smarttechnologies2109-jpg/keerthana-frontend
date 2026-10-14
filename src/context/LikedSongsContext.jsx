
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

/*
  Supports common response formats:
  - [song, song]
  - { songs: [...] }
  - { likedSongs: [...] }
  - { data: { songs: [...] } }
  - Like records containing a nested song object
*/
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
  } else if (Array.isArray(data?.data)) {
    songs = data.data;
  }

  return songs
    .map((item) => item?.song ?? item)
    .filter((song) => song && (song.id != null || song.song_id != null))
    .map((song) => ({
      ...song,
      id: song.id ?? song.song_id,
    }));
}

export function LikedSongsProvider({ children }) {
  const { user } = useAuth();

  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  /*
    Fetch the current user's liked songs.
  */
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

        // Keep the existing list if the request fails.
        return null;
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [user]
  );

  /*
    Fetch when the user signs in or changes.
  */
  useEffect(() => {
    fetchLikedSongs(true);
  }, [fetchLikedSongs]);

  /*
    Refresh when the app becomes active again.
  */
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

  /*
    IDs are compared as strings to avoid
    mismatches between numeric and string IDs.
  */
  const likedSongIds = useMemo(
    () =>
      new Set(
        likedSongs.map((song) => String(song.id))
      ),
    [likedSongs]
  );

  const isLiked = useCallback(
    (songId) => {
      if (songId == null) return false;
      return likedSongIds.has(String(songId));
    },
    [likedSongIds]
  );

  /*
    Add a song to the current user's likes.
  */
  const likeSong = useCallback(
    async (song) => {
      if (!user) {
        throw new Error("LOGIN_REQUIRED");
      }

      if (song?.id == null) {
        throw new Error("SONG_ID_REQUIRED");
      }

      if (isLiked(song.id)) {
        return;
      }

      // Keep the UI responsive.
      setLikedSongs((previous) => {
        if (
          previous.some(
            (item) => String(item.id) === String(song.id)
          )
        ) {
          return previous;
        }

        return [...previous, song];
      });

      try {
        await API.post(`/liked-songs/${song.id}`);
        await fetchLikedSongs();
      } catch (error) {
        // Revert the optimistic update if saving fails.
        setLikedSongs((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(song.id)
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

  /*
    Remove a song from the current user's likes.
  */
  const unlikeSong = useCallback(
    async (songId) => {
      if (!user) {
        throw new Error("LOGIN_REQUIRED");
      }

      if (songId == null) return;

      const previousSongs = likedSongs;

      setLikedSongs((previous) =>
        previous.filter(
          (song) => String(song.id) !== String(songId)
        )
      );

      try {
        await API.delete(`/liked-songs/${songId}`);
        await fetchLikedSongs();
      } catch (error) {
        // Restore the previous list if removal fails.
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

  /*
    Toggle a song's liked status.
  */
  const toggleLike = useCallback(
    async (song) => {
      if (song?.id == null) {
        throw new Error("SONG_ID_REQUIRED");
      }

      if (isLiked(song.id)) {
        await unlikeSong(song.id);
      } else {
        await likeSong(song);
      }
    },
    [isLiked, unlikeSong, likeSong]
  );

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

export function useLikedSongs() {
  const context = useContext(LikedSongsContext);

  if (!context) {
    throw new Error(
      "useLikedSongs must be used inside LikedSongsProvider"
    );
  }

  return context;
}
