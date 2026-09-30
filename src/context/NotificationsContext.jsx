import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../services/api";

import {
  useAuth,
} from "./AuthContext";


const NotificationsContext =
  createContext(null);


export function NotificationsProvider({
  children,
}) {

  const {
    user,
  } = useAuth();


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    syncing,
    setSyncing,
  ] = useState(false);


  /* =====================================================
     FETCH NOTIFICATIONS
  ===================================================== */

  const fetchNotifications =
    useCallback(
      async (
        showLoading = false
      ) => {

        if (!user) {

          setNotifications([]);

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
              "/notifications"
            );


          const data =
            response?.data;


          const items =
            Array.isArray(
              data?.notifications
            )
              ? data.notifications
              : Array.isArray(data)
                ? data
                : [];


          setNotifications(
            items
          );

        } catch (error) {

          console.error(
            "Notifications error:",
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


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    fetchNotifications(
      true
    );

  }, [
    fetchNotifications,
  ]);


  /* =====================================================
     AUTO REFRESH
  ===================================================== */

  useEffect(() => {

    if (!user) {

      return;

    }


    const handleVisibility =
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          fetchNotifications();

        }

      };


    const handleFocus =
      () => {

        fetchNotifications();

      };


    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );


    window.addEventListener(
      "focus",
      handleFocus
    );


    const interval =
      window.setInterval(
        () => {

          fetchNotifications();

        },
        30000
      );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );


      window.removeEventListener(
        "focus",
        handleFocus
      );


      window.clearInterval(
        interval
      );

    };

  }, [
    user,
    fetchNotifications,
  ]);


  /* =====================================================
     UNREAD COUNT
  ===================================================== */

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification?.is_read &&
            !notification?.read
        ).length,

      [
        notifications,
      ]
    );


  /* =====================================================
     MARK ONE AS READ
  ===================================================== */

  const markAsRead =
    useCallback(
      async (
        notificationId
      ) => {

        if (
          !user ||
          notificationId ===
            undefined ||
          notificationId ===
            null
        ) {

          return false;

        }


        try {

          await API.post(
            `/notifications/${notificationId}/read`
          );


          setNotifications(
            (current) =>
              current.map(
                (notification) =>
                  Number(
                    notification?.id
                  ) ===
                  Number(
                    notificationId
                  )
                    ? {
                        ...notification,
                        is_read: true,
                        read: true,
                      }
                    : notification
              )
          );


          return true;

        } catch (error) {

          console.error(
            "Mark notification read error:",
            error
          );


          return false;

        }

      },
      [user]
    );


  /* =====================================================
     MARK ALL AS READ
  ===================================================== */

  const markAllAsRead =
    useCallback(
      async () => {

        if (!user) {

          return false;

        }


        try {

          await API.post(
            "/notifications/read-all"
          );


          setNotifications(
            (current) =>
              current.map(
                (notification) => ({
                  ...notification,
                  is_read: true,
                  read: true,
                })
              )
          );


          return true;

        } catch (error) {

          console.error(
            "Mark all notifications read error:",
            error
          );


          return false;

        }

      },
      [user]
    );


  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        syncing,
        unreadCount,
        refreshNotifications:
          fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >

      {children}

    </NotificationsContext.Provider>
  );

}


/* =====================================================
   HOOK
===================================================== */

export function useNotifications() {

  const context =
    useContext(
      NotificationsContext
    );


  if (!context) {

    throw new Error(
      "useNotifications must be used inside NotificationsProvider"
    );

  }


  return context;

}