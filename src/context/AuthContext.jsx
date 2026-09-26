
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

  /* =====================================================
     STATE
  ===================================================== */

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =====================================================
     CLEAR SESSION
  ===================================================== */

  const clearSession = () => {

    localStorage.removeItem(
      TOKEN_KEY
    );

    setUser(null);

  };


  /* =====================================================
     SAVE SESSION
  ===================================================== */

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


    setUser(
      userData
    );

  };


  /* =====================================================
     RESTORE LOGIN
  ===================================================== */

  useEffect(() => {

    let active = true;


    const loadUser =
      async () => {

        const token =
          localStorage.getItem(
            TOKEN_KEY
          );


        /* NO SAVED LOGIN */

        if (!token) {

          if (active) {

            setUser(null);

            setLoading(false);

          }

          return;

        }


        try {

          const response =
            await API.get(
              "/auth/me"
            );


          if (!active) {
            return;
          }


          if (
            !response.data?.user
          ) {

            throw new Error(
              "User data was not returned"
            );

          }


          setUser(
            response.data.user
          );


        } catch (error) {

          console.error(
            "Restore login failed:",
            error.response?.data ||
            error.message
          );


          if (active) {

            localStorage.removeItem(
              TOKEN_KEY
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


  /* =====================================================
     LOGIN USER

     EMAIL OR PHONE

     POST:
     /auth/login

     Body:
     {
       contact: "email@example.com"
     }

     OR

     {
       contact: "9876543210"
     }

     NO PASSWORD
     NO OTP
  ===================================================== */

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


  /* =====================================================
   REGISTER USER

   NAME + EMAIL OR PHONE + LANGUAGE

   POST:
   /auth/register

   Body:
   {
     name,
     contact,
     language
   }

   NO PASSWORD
   NO OTP
===================================================== */

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


  /* =====================================================
     ADMIN LOGIN

     ADMIN ONLY

     POST:
     /admin/auth/login

     Body:
     {
       email,
       password
     }

     ADMIN STILL USES PASSWORD
  ===================================================== */

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


      /*
       * Frontend safety check.
       *
       * Backend MUST also enforce
       * the admin role.
       */

      if (
        adminUser.role !== "ADMIN"
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


  /* =====================================================
     REFRESH CURRENT USER
  ===================================================== */

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


  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {

    clearSession();

  };


  /* =====================================================
     AUTH FLAGS
  ===================================================== */

  const isAuthenticated =
    Boolean(
      user
    );


  const isAdmin =
    user?.role ===
    "admin";


  /* =====================================================
     PROVIDER
  ===================================================== */

  return (

    <AuthContext.Provider
      value={{

        user,

        loading,

        register,

        login,

        adminLogin,

        logout,

        refreshUser,

        isAuthenticated,

        isAdmin,

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

