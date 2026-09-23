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


  const [likedSongs, setLikedSongs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);


  /* =====================================
     FETCH LIKES
  ===================================== */

  const fetchLikedSongs =
    useCallback(async () => {

      if (!user) {

        setLikedSongs([]);

        return;

      }


      try {

        setLoading(true);


        const response =
          await API.get(
            "/liked-songs"
          );


        setLikedSongs(
          response.data.songs || []
        );


      } catch (error) {

        console.error(
          "Liked songs error:",
          error
        );

      } finally {

        setLoading(false);

      }

    }, [user]);


  useEffect(() => {

    fetchLikedSongs();

  }, [fetchLikedSongs]);


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

      [likedSongs]
    );


  /* =====================================
     CHECK LIKE
  ===================================== */

  const isLiked =
    (songId) => {

      return likedSongIds.has(
        Number(songId)
      );

    };


  /* =====================================
     LIKE
  ===================================== */

  const likeSong =
    async (song) => {

      if (!user) {

        throw new Error(
          "LOGIN_REQUIRED"
        );

      }


      await API.post(
        `/liked-songs/${song.id}`
      );


      setLikedSongs(
        (current) => {

          const exists =
            current.some(
              (item) =>
                Number(item.id) ===
                Number(song.id)
            );


          if (exists) {
            return current;
          }


          return [
            song,
            ...current,
          ];

        }
      );

    };


  /* =====================================
     UNLIKE
  ===================================== */

  const unlikeSong =
    async (songId) => {

      if (!user) {

        throw new Error(
          "LOGIN_REQUIRED"
        );

      }


      await API.delete(
        `/liked-songs/${songId}`
      );


      setLikedSongs(
        (current) =>
          current.filter(
            (song) =>
              Number(song.id) !==
              Number(songId)
          )
      );

    };


  /* =====================================
     TOGGLE
  ===================================== */

  const toggleLike =
    async (song) => {

      if (
        isLiked(song.id)
      ) {

        await unlikeSong(
          song.id
        );

      } else {

        await likeSong(song);

      }

    };


  return (

    <LikedSongsContext.Provider
      value={{
        likedSongs,
        loading,

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