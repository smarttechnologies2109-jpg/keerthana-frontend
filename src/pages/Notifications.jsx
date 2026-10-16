
import { useCallback, useState } from "react";
import {
  FaBell,
  FaMusic,
  FaCompactDisc,
  FaChurch,
  FaCheck,
  FaSyncAlt,
  FaArrowRight,
  FaTrashAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../context/NotificationsContext";
import "../assets/css/notifications.css";

function Notifications() {
  const navigate = useNavigate();

  const {
    notifications = [],
    loading,
    syncing,
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    clearNotifications,
  } = useNotifications();

  const [clearing, setClearing] = useState(false);

  // Get the notification type from supported fields.
  const getNotificationType = useCallback((notification) => {
    return String(
      notification?.entity_type ||
        notification?.target_type ||
        notification?.type ||
        notification?.notification_type ||
        ""
    ).toLowerCase();
  }, []);

  // Notification icon.
  const getNotificationIcon = useCallback(
    (notification) => {
      const type = getNotificationType(notification);

      if (type.includes("album")) {
        return <FaCompactDisc />;
      }

      if (
        type.includes("ministry") ||
        type.includes("church")
      ) {
        return <FaChurch />;
      }

      return <FaMusic />;
    },
    [getNotificationType]
  );

  // Format notification date.
  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Check whether the notification has been read.
  const isNotificationRead = (notification) => {
    return (
      notification?.is_read === true ||
      notification?.read === true
    );
  };

  // Get the destination entity ID.
  const getEntityId = (notification) => {
    return (
      notification?.entity_id ??
      notification?.target_id ??
      notification?.song_id ??
      notification?.album_id ??
      notification?.ministry_id
    );
  };

  // Navigate to related content and mark it as read.
  const handleNotificationClick = async (notification) => {
    try {
      if (
        notification?.id != null &&
        !isNotificationRead(notification) &&
        typeof markAsRead === "function"
      ) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }

    const type = getNotificationType(notification);
    const entityId = getEntityId(notification);

    if (entityId == null) return;

    if (type.includes("song")) {
      navigate(`/songs/${entityId}`);
      return;
    }

    if (type.includes("album")) {
      navigate(`/albums/${entityId}`);
      return;
    }

    if (
      type.includes("ministry") ||
      type.includes("church")
    ) {
      navigate(`/ministries/${entityId}`);
    }
  };

  // Refresh notifications.
  const handleRefresh = async () => {
    try {
      if (typeof refreshNotifications === "function") {
        await refreshNotifications();
      }
    } catch (error) {
      console.error(
        "Unable to refresh notifications:",
        error
      );
    }
  };

  // Mark every notification as read.
  const handleMarkAllRead = async () => {
    try {
      if (typeof markAllAsRead === "function") {
        await markAllAsRead();
      }
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  };

  // Clear all notifications after confirmation.
  const handleClearNotifications = async () => {
    if (notifications.length === 0 || clearing) return;

    if (typeof clearNotifications !== "function") {
      window.alert(
        "The clear notifications function is not configured yet. Please update NotificationsContext and the backend."
      );
      console.error(
        "clearNotifications is missing from NotificationsContext."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all notifications? This action may not be reversible."
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      await clearNotifications();
    } catch (error) {
      console.error(
        "Unable to clear notifications:",
        error
      );

      window.alert(
        "Unable to clear notifications. Please try again."
      );
    } finally {
      setClearing(false);
    }
  };

  // Loading screen.
  if (loading && notifications.length === 0) {
    return (
      <main className="notifications-page">
        <div className="notifications-loading">
          <FaBell className="notifications-loading-icon" />

          <h2>Loading notifications...</h2>

          <p>
            Checking for the latest KEERTHANA updates.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="notifications-page">
      {/* Header */}
      <header className="notifications-header">
        <div className="notifications-header-title">
          <div className="notifications-header-icon">
            <FaBell />

            {unreadCount > 0 && (
              <span className="notifications-header-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="notifications-heading-text">
            <span className="notifications-eyebrow">
              YOUR UPDATES
            </span>

            <h1>Notifications</h1>

            <p>
              Discover new songs, albums and ministry updates.
            </p>
          </div>
        </div>

        <div className="notifications-header-actions">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={syncing || clearing}
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <FaSyncAlt
              className={
                syncing ? "notifications-spin" : ""
              }
            />

            <span>
              {syncing ? "Refreshing..." : "Refresh"}
            </span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={clearing}
              title="Mark all notifications as read"
            >
              <FaCheck />
              <span>Mark all read</span>
            </button>
          )}

          {/* {notifications.length > 0 && (
            <button
              type="button"
              className="notifications-clear-button"
              onClick={handleClearNotifications}
              disabled={clearing || syncing}
              title="Clear all notifications"
              aria-label="Clear all notifications"
             >
              <FaTrashAlt />

              <span>
                {clearing ? "Clearing..." : "Clear all"}
              </span>
             </button>
            )} */}
        </div>
      </header>

      {/* Summary */}
      <section
        className="notifications-summary"
        aria-live="polite"
      >
        <FaBell />

        <span>
          {unreadCount === 0
            ? "You're all caught up"
            : `${unreadCount} unread notification${
                unreadCount === 1 ? "" : "s"
              }`}
        </span>
      </section>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <section className="notifications-empty">
          <div className="notifications-empty-icon">
            <FaBell />
          </div>

          <h2>No notifications yet</h2>

          <p>
            When new songs and other updates are published,
            they'll appear here.
          </p>

          <button
            type="button"
            className="notifications-empty-refresh"
            onClick={handleRefresh}
            disabled={syncing || clearing}
          >
            <FaSyncAlt
              className={
                syncing ? "notifications-spin" : ""
              }
            />

            {syncing ? "Checking..." : "Check for updates"}
          </button>
        </section>
      ) : (
        <section className="notifications-section">
          <div className="notifications-list-heading">
            <h2>Recent activity</h2>

            <span>
              {notifications.length}{" "}
              {notifications.length === 1
                ? "update"
                : "updates"}
            </span>
          </div>

          <div className="notifications-list">
            {notifications.map((notification, index) => {
              const isRead =
                isNotificationRead(notification);

              const title =
                notification?.title ||
                notification?.name ||
                "New Update";

              const message =
                notification?.message ||
                notification?.description ||
                "";

              const createdAt =
                notification?.created_at ||
                notification?.createdAt;

              const type =
                getNotificationType(notification);

              const entityId =
                getEntityId(notification);

              const isSupportedType =
                type.includes("song") ||
                type.includes("album") ||
                type.includes("ministry") ||
                type.includes("church");

              const isClickable =
                entityId != null && isSupportedType;

              return (
                <button
                  type="button"
                  key={
                    notification?.id ??
                    `notification-${index}`
                  }
                  className={[
                    "notification-item",
                    !isRead ? "unread" : "",
                    isClickable
                      ? "notification-clickable"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  aria-label={`${title}${
                    !isRead ? ", unread" : ""
                  }`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <strong>{title}</strong>

                      {!isRead && (
                        <span className="notification-new-label">
                          NEW
                        </span>
                      )}
                    </div>

                    {message && <p>{message}</p>}

                    {createdAt && (
                      <small>{formatDate(createdAt)}</small>
                    )}
                  </div>

                  {!isRead && (
                    <span
                      className="notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}

                  {isClickable && (
                    <FaArrowRight className="notification-arrow" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

export default Notifications;
