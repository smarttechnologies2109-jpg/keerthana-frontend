import {
  FaBell,
  FaMusic,
  FaCompactDisc,
  FaChurch,
  FaCheck,
  FaSyncAlt,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  useNotifications,
} from "../context/NotificationsContext";

import "../assets/css/notifications.css";


function Notifications() {

  const navigate =
    useNavigate();


  const {
    notifications,
    loading,
    syncing,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();


  /* =====================================================
     ICON
  ===================================================== */

  const getNotificationIcon =
    (notification) => {

      const type =
        String(
          notification?.type ||
          notification?.notification_type ||
          ""
        ).toLowerCase();


      if (
        type.includes("album")
      ) {

        return <FaCompactDisc />;

      }


      if (
        type.includes("ministry") ||
        type.includes("church")
      ) {

        return <FaChurch />;

      }


      return <FaMusic />;

    };


  /* =====================================================
     OPEN NOTIFICATION
  ===================================================== */

  const handleNotificationClick =
    async (
      notification
    ) => {

      if (
        notification?.id !==
        undefined
      ) {

        await markAsRead(
          notification.id
        );

      }


      const entityType =
        String(
          notification?.entity_type ||
          notification?.target_type ||
          notification?.type ||
          ""
        ).toLowerCase();


      const entityId =
        notification?.entity_id ||
        notification?.target_id ||
        notification?.song_id ||
        notification?.album_id ||
        notification?.ministry_id;


      if (!entityId) {

        return;

      }


      if (
        entityType.includes(
          "song"
        )
      ) {

        navigate(
          `/songs/${entityId}`
        );

        return;

      }


      if (
        entityType.includes(
          "album"
        )
      ) {

        navigate(
          `/albums/${entityId}`
        );

        return;

      }


      if (
        entityType.includes(
          "ministry"
        )
      ) {

        navigate(
          `/ministries/${entityId}`
        );

      }

    };


  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading &&
    notifications.length ===
      0
  ) {

    return (

      <div className="notifications-page">

        <div className="notifications-loading">

          <FaBell />

          <h2>
            Loading Notifications...
          </h2>

          <p>
            Checking for new updates.
          </p>

        </div>

      </div>

    );

  }


  return (

    <div className="notifications-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="notifications-header">

        <div className="notifications-header-title">

          <div className="notifications-header-icon">

            <FaBell />

          </div>


          <div>

            <span>
              YOUR UPDATES
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              New songs, albums and ministry updates.
            </p>

          </div>

        </div>


        <div className="notifications-header-actions">

          <button
            type="button"
            onClick={() =>
              refreshNotifications()
            }
            disabled={syncing}
            title="Refresh notifications"
          >

            <FaSyncAlt
              className={
                syncing
                  ? "notifications-spin"
                  : ""
              }
            />

            <span>
              Refresh
            </span>

          </button>


          {unreadCount > 0 && (

            <button
              type="button"
              onClick={
                markAllAsRead
              }
            >

              <FaCheck />

              <span>
                Mark all read
              </span>

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          UNREAD SUMMARY
      ================================================= */}

      <div className="notifications-summary">

        <FaBell />

        <span>

          {unreadCount === 0
            ? "You're all caught up"
            : `${unreadCount} unread notification${
                unreadCount === 1
                  ? ""
                  : "s"
              }`}

        </span>

      </div>


      {/* =================================================
          EMPTY
      ================================================= */}

      {notifications.length ===
      0 ? (

        <div className="notifications-empty">

          <div className="notifications-empty-icon">

            <FaBell />

          </div>


          <h2>
            No Notifications
          </h2>


          <p>
            New songs, albums and ministry
            updates will appear here.
          </p>

        </div>

      ) : (

        /* =================================================
           LIST
        ================================================= */

        <div className="notifications-list">

          {notifications.map(
            (
              notification,
              index
            ) => {

              const isUnread =
                !notification?.is_read &&
                !notification?.read;


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


              return (

                <button
                  type="button"
                  key={
                    notification?.id ??
                    `notification-${index}`
                  }
                  className={
                    isUnread
                      ? "notification-item unread"
                      : "notification-item"
                  }
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                >

                  <div className="notification-icon">

                    {getNotificationIcon(
                      notification
                    )}

                  </div>


                  <div className="notification-content">

                    <strong>
                      {title}
                    </strong>


                    {message && (

                      <p>
                        {message}
                      </p>

                    )}


                    {createdAt && (

                      <small>
                        {createdAt}
                      </small>

                    )}

                  </div>


                  {isUnread && (

                    <span className="notification-unread-dot" />

                  )}

                </button>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default Notifications;