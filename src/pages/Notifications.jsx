
import { useCallback } from "react";
import {
  FaBell,
  FaMusic,
  FaCompactDisc,
  FaChurch,
  FaCheck,
  FaSyncAlt,
  FaArrowRight,
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
  } = useNotifications();

  // Notification icon
  const getNotificationIcon = useCallback((notification) => {
    const type = String(
      notification?.type ||
      notification?.notification_type ||
      notification?.entity_type ||
      ""
    ).toLowerCase();

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
  }, []);

  // Format timestamp
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

  // Navigate to related content
  const handleNotificationClick = async (notification) => {
    try {
      if (notification?.id != null) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }

    const type = String(
      notification?.entity_type ||
      notification?.target_type ||
      notification?.type ||
      notification?.notification_type ||
      ""
    ).toLowerCase();

    const entityId =
      notification?.entity_id ??
      notification?.target_id ??
      notification?.song_id ??
      notification?.album_id ??
      notification?.ministry_id;

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

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error("Unable to refresh notifications:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Unable to mark all as read:", error);
    }
  };

  // Initial loading state
  if (loading && notifications.length === 0) {
    return (
      <main className="notifications-page">
        <div className="notifications-loading">
          <FaBell className="notifications-loading-icon" />
          <h2>Loading notifications...</h2>
          <p>Checking for the latest KEERTHANA updates.</p>
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

          <div>
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
            disabled={syncing}
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <FaSyncAlt
              className={syncing ? "notifications-spin" : ""}
            />
            <span>{syncing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
            >
              <FaCheck />
              <span>Mark all read</span>
            </button>
          )}
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
            disabled={syncing}
          >
            <FaSyncAlt
              className={syncing ? "notifications-spin" : ""}
            />
            Check for updates
          </button>
        </section>
      ) : (
        <section className="notifications-section">
          <div className="notifications-list-heading">
            <h2>Recent activity</h2>
            <span>{notifications.length} updates</span>
          </div>

          <div className="notifications-list">
            {notifications.map((notification, index) => {
              const isRead =
                notification?.is_read === true ||
                notification?.read === true;

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

              const notificationType = String(
                notification?.type ||
                notification?.notification_type ||
                ""
              ).toLowerCase();

              const hasDestination =
                notification?.entity_id != null ||
                notification?.target_id != null ||
                notification?.song_id != null ||
                notification?.album_id != null ||
                notification?.ministry_id != null;

              const isClickable =
                hasDestination &&
                (
                  notificationType.includes("song") ||
                  notificationType.includes("album") ||
                  notificationType.includes("ministry") ||
                  notificationType.includes("church")
                );

              return (
                <button
                  type="button"
                  key={notification?.id ?? `notification-${index}`}
                  className={[
                    "notification-item",
                    !isRead ? "unread" : "",
                    isClickable ? "notification-clickable" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  aria-label={`${title}${!isRead ? ", unread" : ""}`}
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