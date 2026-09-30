import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import API
  from "../services/api";

import {
  useAuth,
} from "./AuthContext";


const LikedSongsContext =
  createContext(null);


export function LikedSongsProvider({
  children,
}) {

  const {
    user,
  } = useAuth();


  const [
    likedSongs,
    setLikedSongs,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    syncing,
    setSyncing,
  ] =
    useState(false);


  /* =====================================
     FETCH LIKES
  ===================================== */

  const fetchLikedSongs =
    useCallback(
      async (
        showLoading = false
      ) => {

        if (!user) {

          setLikedSongs([]);

          setLoading(false);

          return;

        }


        try {

          if (showLoading) {

            setLoading(true);

          } else {

            setSyncing(true);

          }


          const response =
            await API.get(
              "/liked-songs"
            );


          const songs =
            Array.isArray(
              response?.data?.songs
            )
              ? response.data.songs
              : [];


          /*
            Server is the source of truth.
            This replaces the local list with
            the latest server data.
          */

          setLikedSongs(
            songs
          );


        } catch (error) {

          console.error(
            "Liked songs error:",
            error
          );

        } finally {

          if (showLoading) {

            setLoading(false);

          } else {

            setSyncing(false);

          }

        }

      },
      [user]
    );


  /* =====================================
     INITIAL FETCH
  ===================================== */

  useEffect(() => {

    fetchLikedSongs(
      true
    );

  }, [
    fetchLikedSongs,
  ]);


  /* =====================================
     SYNC WHEN APP BECOMES ACTIVE
  ===================================== */

  useEffect(() => {

    if (!user) {

      return;

    }


    const handleVisibilityChange =
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          fetchLikedSongs();

        }

      };


    const handleWindowFocus =
      () => {

        fetchLikedSongs();

      };


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    window.addEventListener(
      "focus",
      handleWindowFocus
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );


      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

    };

  }, [
    user,
    fetchLikedSongs,
  ]);


  /* =====================================
     LIKED IDS
  ===================================== */

  const likedSongIds =
    useMemo(
      () =>
        new Set(
          likedSongs.map(
            (song) =>
              Number(song.id)
          )
        ),

      [
        likedSongs,
      ]
    );


  /* =====================================
     CHECK LIKE
  ===================================== */

  const isLiked =
    useCallback(
      (songId) => {

        if (
          songId === undefined ||
          songId === null
        ) {

          return false;

        }


        return likedSongIds.has(
          Number(songId)
        );

      },
      [
        likedSongIds,
      ]
    );


  /* =====================================
     LIKE
  ===================================== */

  const likeSong =
    useCallback(
      async (song) => {

        if (!user) {

          throw new Error(
            "LOGIN_REQUIRED"
          );

        }


        if (!song?.id) {

          return;

        }


        /*
          Keep your existing backend endpoint.
        */

        await API.post(
          `/liked-songs/${song.id}`
        );


        /*
          Fetch again from server so the
          context always matches the backend.
        */

        await fetchLikedSongs();

      },
      [
        user,
        fetchLikedSongs,
      ]
    );


  /* =====================================
     UNLIKE
  ===================================== */

  const unlikeSong =
    useCallback(
      async (songId) => {

        if (!user) {

          throw new Error(
            "LOGIN_REQUIRED"
          );

        }


        if (
          songId === undefined ||
          songId === null
        ) {

          return;

        }


        await API.delete(
          `/liked-songs/${songId}`
        );


        /*
          Refresh from server after removing.
        */

        await fetchLikedSongs();

      },
      [
        user,
        fetchLikedSongs,
      ]
    );


  /* =====================================
     TOGGLE
  ===================================== */

  const toggleLike =
    useCallback(
      async (song) => {

        if (!song?.id) {

          return;

        }


        if (
          isLiked(
            song.id
          )
        ) {

          await unlikeSong(
            song.id
          );

        } else {

          await likeSong(
            song
          );

        }

      },
      [
        isLiked,
        likeSong,
        unlikeSong,
      ]
    );


  /* =====================================
     CONTEXT
  ===================================== */

  return (

    <LikedSongsContext.Provider
      value={{
        likedSongs,

        loading,

        syncing,

        isLiked,

        likeSong,

        unlikeSong,

        toggleLike,

        refreshLikedSongs:
          fetchLikedSongs,
      }}
    >

      {children}

    </LikedSongsContext.Provider>

  );

}


/* =====================================
   HOOK
===================================== */

export function useLikedSongs() {

  const context =
    useContext(
      LikedSongsContext
    );


  if (!context) {

    throw new Error(
      "useLikedSongs must be used inside LikedSongsProvider"
    );

  }


  return context;

}