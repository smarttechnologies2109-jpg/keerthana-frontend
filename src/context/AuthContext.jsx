
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import API from "../services/api";


const AuthContext =
  createContext(null);


/* =========================================================
   TOKEN KEY
========================================================= */

const TOKEN_KEY =
  "keerthana_token";


/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}) {

  /* =======================================================
     STATE
  ======================================================= */

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =======================================================
     CLEAR SESSION
  ======================================================= */

  const clearSession = () => {

    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);

  };


  /* =======================================================
     SAVE SESSION
  ======================================================= */

  const saveSession = (
    token,
    userData
  ) => {

    if (!token) {

      throw new Error(
        "Authentication token is missing"
      );

    }


    if (!userData) {

      throw new Error(
        "User data is missing"
      );

    }


    localStorage.setItem(
      TOKEN_KEY,
      token
    );


    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );


    setUser(
      userData
    );

  };


  /* =======================================================
     UPDATE CURRENT USER
  ======================================================= */

  const updateUser = (
    updatedUser
  ) => {

    if (!updatedUser) {
      return;
    }


    setUser(
      (currentUser) => {

        const nextUser =
          currentUser
            ? {
                ...currentUser,
                ...updatedUser,
              }
            : updatedUser;


        localStorage.setItem(
          "user",
          JSON.stringify(nextUser)
        );


        return nextUser;

      }
    );

  };


  /* =======================================================
     RESTORE LOGIN
  ======================================================= */

  useEffect(() => {

    let active = true;


    const loadUser =
      async () => {

        /*
         * Capture the token used for this request.
         *
         * This is important because the user may log in
         * while /auth/me is still running.
         */
        const requestToken =
          localStorage.getItem(
            TOKEN_KEY
          );


        /* ---------------------------------------------------
           NO SAVED TOKEN
        --------------------------------------------------- */

        if (!requestToken) {

          if (active) {

            setUser(null);

            setLoading(false);

          }

          return;

        }


        /* ---------------------------------------------------
           RESTORE FROM BACKEND
        --------------------------------------------------- */

        try {

          const response =
            await API.get(
              "/auth/me"
            );


          if (!active) {
            return;
          }


          /*
           * IMPORTANT:
           *
           * Check the current token again.
           *
           * If it changed while /auth/me was running,
           * a new login has happened.
           *
           * Do NOT overwrite that new session.
           */
          const currentToken =
            localStorage.getItem(
              TOKEN_KEY
            );


          if (
            currentToken !==
            requestToken
          ) {

            console.log(
              "Auth restore skipped because a new session was created."
            );

            setLoading(false);

            return;

          }


          const restoredUser =
            response.data?.user;


          if (!restoredUser) {

            throw new Error(
              "User data was not returned"
            );

          }


          /*
           * Only restore the user if the token is still
           * the same token that started this request.
           */
          setUser(
            restoredUser
          );


          localStorage.setItem(
            "user",
            JSON.stringify(
              restoredUser
            )
          );


        } catch (error) {

          console.error(
            "Restore login failed:",
            error.response?.data ||
            error.message
          );


          /*
           * Do not clear a newer login session.
           */
          const currentToken =
            localStorage.getItem(
              TOKEN_KEY
            );


          if (
            active &&
            currentToken ===
              requestToken
          ) {

            localStorage.removeItem(
              TOKEN_KEY
            );

            localStorage.removeItem(
              "user"
            );

            setUser(null);

          }


        } finally {

          if (active) {

            setLoading(false);

          }

        }

      };


    loadUser();


    return () => {

      active = false;

    };

  }, []);


  /* =======================================================
     NORMAL USER LOGIN
  ======================================================= */

  const login =
    async (
      contact
    ) => {

      const cleanContact =
        String(contact || "")
          .trim();


      if (!cleanContact) {

        throw new Error(
          "Please enter your email or phone number."
        );

      }


      const response =
        await API.post(
          "/auth/login",
          {
            contact:
              cleanContact,
          }
        );


      const {
        token,
        user: loggedInUser,
      } = response.data;


      if (!token) {

        throw new Error(
          "Login did not return an authentication token."
        );

      }


      if (!loggedInUser) {

        throw new Error(
          "Login did not return user data."
        );

      }


      saveSession(
        token,
        loggedInUser
      );


      return loggedInUser;

    };


  /* =======================================================
     REGISTER USER
  ======================================================= */

  const register =
    async (
      name,
      contact,
      language
    ) => {

      const cleanName =
        String(name || "")
          .trim();


      const cleanContact =
        String(contact || "")
          .trim();


      const cleanLanguage =
        String(language || "")
          .trim();


      if (!cleanName) {

        throw new Error(
          "Name is required."
        );

      }


      if (!cleanContact) {

        throw new Error(
          "Email or phone number is required."
        );

      }


      if (!cleanLanguage) {

        throw new Error(
          "Preferred language is required."
        );

      }


      const response =
        await API.post(
          "/auth/register",
          {
            name:
              cleanName,

            contact:
              cleanContact,

            language:
              cleanLanguage,
          }
        );


      const {
        token,
        user: registeredUser,
      } = response.data;


      if (!token) {

        throw new Error(
          "Registration did not return an authentication token."
        );

      }


      if (!registeredUser) {

        throw new Error(
          "Registration did not return user data."
        );

      }


      saveSession(
        token,
        registeredUser
      );


      return registeredUser;

    };


  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  const adminLogin =
    async (
      email,
      password
    ) => {

      const response =
        await API.post(
          "/admin/auth/login",
          {
            email,
            password,
          }
        );


      const {
        token,
        user: adminUser,
      } = response.data;


      if (!token) {

        throw new Error(
          "Admin login did not return a token"
        );

      }


      if (!adminUser) {

        throw new Error(
          "Admin login did not return user data"
        );

      }


      /* ---------------------------------------------------
         ADMIN ROLE CHECK
      --------------------------------------------------- */

      if (
        String(adminUser.role)
          .trim()
          .toUpperCase() !==
        "ADMIN"
      ) {

        throw new Error(
          "This account does not have administrator access."
        );

      }


      saveSession(
        token,
        adminUser
      );


      return adminUser;

    };


  /* =======================================================
     BUSINESS OWNER LOGIN
  ======================================================= */

  const ownerLogin =
    async (
      email,
      password
    ) => {

      const cleanEmail =
        String(email || "")
          .trim();


      if (!cleanEmail) {

        throw new Error(
          "Please enter your email address."
        );

      }


      if (!password) {

        throw new Error(
          "Please enter your password."
        );

      }


      const response =
        await API.post(
          "/auth/owner/login",
          {
            email:
              cleanEmail,

            password,
          }
        );


      const {
        token,
        user: ownerUser,
      } = response.data;


      /* ---------------------------------------------------
         TOKEN CHECK
      --------------------------------------------------- */

      if (!token) {

        throw new Error(
          "Owner login did not return an authentication token."
        );

      }


      /* ---------------------------------------------------
         USER CHECK
      --------------------------------------------------- */

      if (!ownerUser) {

        throw new Error(
          "Owner login did not return user data."
        );

      }


      /* ---------------------------------------------------
         OWNER ROLE CHECK
      --------------------------------------------------- */

      if (
        String(ownerUser.role)
          .trim()
          .toUpperCase() !==
        "BUSINESS_OWNER"
      ) {

        throw new Error(
          "This account does not have business owner access."
        );

      }


      /* ---------------------------------------------------
         SAVE SESSION
      --------------------------------------------------- */

      saveSession(
        token,
        ownerUser
      );


      console.log(
        "Business Owner Login Successful:",
        ownerUser
      );


      return ownerUser;

    };


  /* =======================================================
     REFRESH CURRENT USER
  ======================================================= */

  const refreshUser =
    async () => {

      const token =
        localStorage.getItem(
          TOKEN_KEY
        );


      if (!token) {

        setUser(null);

        return null;

      }


      try {

        const response =
          await API.get(
            "/auth/me"
          );


        const refreshedUser =
          response.data?.user;


        if (!refreshedUser) {

          throw new Error(
            "Unable to refresh user"
          );

        }


        setUser(
          refreshedUser
        );


        localStorage.setItem(
          "user",
          JSON.stringify(
            refreshedUser
          )
        );


        return refreshedUser;


      } catch (error) {

        console.error(
          "Refresh user failed:",
          error.response?.data ||
          error.message
        );


        if (
          error.response?.status === 401
        ) {

          clearSession();

        }


        throw error;

      }

    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {

    clearSession();

  };


  /* =======================================================
     AUTH FLAGS
  ======================================================= */

  const isAuthenticated =
    Boolean(
      user
    );


  const isAdmin =
    String(
      user?.role || ""
    )
      .trim()
      .toUpperCase() ===
    "ADMIN";


  const isBusinessOwner =
    String(
      user?.role || ""
    )
      .trim()
      .toUpperCase() ===
    "BUSINESS_OWNER";


  /* =======================================================
     PROVIDER
  ======================================================= */

  return (

    <AuthContext.Provider
      value={{

        user,

        loading,

        register,

        login,

        adminLogin,

        ownerLogin,

        logout,

        refreshUser,

        updateUser,

        isAuthenticated,

        isAdmin,

        isBusinessOwner,

      }}
    >

      {children}

    </AuthContext.Provider>

  );

}


/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;

}

