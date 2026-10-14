
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

const NotificationsContext = createContext(null);

const REFRESH_INTERVAL = 30000;

// Normalize database/API notification fields
function normalizeNotification(notification) {
  const isRead =
    notification?.is_read === true ||
    notification?.read === true;

  return {
    ...notification,
    id: notification?.id,
    title:
      notification?.title ||
      notification?.name ||
      "New Update",
    message:
      notification?.message ||
      notification?.description ||
      "",
    type:
      notification?.type ||
      notification?.notification_type ||
      "",
    song_id: notification?.song_id ?? null,
    album_id: notification?.album_id ?? null,
    ministry_id: notification?.ministry_id ?? null,
    is_read: isRead,
    read: isRead,
  };
}

function getNotificationItems(response) {
  const data = response?.data;

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch notifications from the backend
  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (!user) {
        setNotifications([]);
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
        const response = await API.get("/notifications");

        const items = getNotificationItems(response)
          .map(normalizeNotification)
          .filter((item) => item.id != null);

        // Keep newest notifications first.
        items.sort((a, b) => {
          const aDate = new Date(
            a.created_at || a.createdAt || 0
          ).getTime();

          const bDate = new Date(
            b.created_at || b.createdAt || 0
          ).getTime();

          return bDate - aDate;
        });

        setNotifications(items);

        return items;
      } catch (error) {
        console.error(
          "KEERTHANA notifications fetch failed:",
          error?.response?.data || error.message
        );

        // Preserve existing notifications if a refresh fails.
        return null;
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [user]
  );

  // Initial fetch and user changes
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
    } else {
      setNotifications([]);
      setLoading(false);
      setSyncing(false);
    }
  }, [user, fetchNotifications]);

  // Automatic background refresh
  useEffect(() => {
    if (!user) return undefined;

    let lastRefresh = 0;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      // Avoid duplicate refreshes from focus and visibility events.
      const now = Date.now();

      if (now - lastRefresh < 2000) {
        return;
      }

      lastRefresh = now;
      fetchNotifications();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, REFRESH_INTERVAL);

    document.addEventListener(
      "visibilitychange",
      refreshIfVisible
    );

    window.addEventListener(
      "focus",
      refreshIfVisible
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        refreshIfVisible
      );

      window.removeEventListener(
        "focus",
        refreshIfVisible
      );
    };
  }, [user, fetchNotifications]);

  // Unread notification count
  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.is_read !== true &&
          notification.read !== true
      ).length,
    [notifications]
  );

  // Mark one notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!user || notificationId == null) {
        return false;
      }

      const existing = notifications.find(
        (item) =>
          String(item.id) === String(notificationId)
      );

      if (!existing) {
        return false;
      }

      if (
        existing.is_read === true ||
        existing.read === true
      ) {
        return true;
      }

      try {
        await API.post(
          `/notifications/${notificationId}/read`
        );

        setNotifications((current) =>
          current.map((notification) =>
            String(notification.id) ===
            String(notificationId)
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
          "Mark notification as read failed:",
          error?.response?.data || error.message
        );

        return false;
      }
    },
    [user, notifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || unreadCount === 0) {
      return true;
    }

    try {
      await API.post("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read: true,
        }))
      );

      return true;
    } catch (error) {
      console.error(
        "Mark all notifications as read failed:",
        error?.response?.data || error.message
      );

      return false;
    }
  }, [user, unreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      loading,
      syncing,
      unreadCount,
      refreshNotifications: fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      loading,
      syncing,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationsProvider"
    );
  }

  return context;
}
