
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import {
  FaArrowLeft,
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaPlus,
  FaVolumeUp,
  FaMusic,
  FaMinus,
  FaRedo,
  FaFileAlt,
  FaDownload,
  FaCheck,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaShareAlt,
  FaFlag,
  FaMoon,
  FaTimes,
  FaClock,
  FaStopwatch,
} from "react-icons/fa";
import { usePlayer } from "../context/usePlayer";
import { useAuth } from "../context/AuthContext";
import { getMediaUrl } from "../utils/media";
import "../assets/css/songDetails.css";

import {
  isFavorite,
  toggleFavorite,
} from "../utils/favorites";

function SongDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // AUTH
  // =====================================================

  const { user } = useAuth();

  // =====================================================
  // PLAYER
  // =====================================================

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    playSong,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    changeVolume,
    isSongOffline,
    downloadSongOffline,
    removeOfflineSong,
    offlineDownloadingId,
  } = usePlayer();

  // =====================================================
  // SONG STATE
  // =====================================================

  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  // =====================================================
  // PRAYER MODE
  // =====================================================

  const [prayerMode, setPrayerMode] = useState(false);

  // =====================================================
  // SLEEP MODE
  // =====================================================

  const [sleepModeOpen, setSleepModeOpen] = useState(false);
  const [sleepEndTime, setSleepEndTime] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);

  const isPlayingRef = useRef(isPlaying);
  const currentSongIdRef = useRef(currentSong?.id);
  const togglePlayRef = useRef(togglePlay);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    currentSongIdRef.current = currentSong?.id;
    togglePlayRef.current = togglePlay;
  }, [isPlaying, currentSong, togglePlay]);

  // =====================================================
  // LYRICS SETTINGS
  // =====================================================

  const [fontSize, setFontSize] = useState(22);
  const [lineSpacing, setLineSpacing] = useState(1.9);
  const [textAlign, setTextAlign] = useState("left");

  // =====================================================
  // SHARE
  // =====================================================

  const [sharingLyrics, setSharingLyrics] = useState(false);

  // =====================================================
  // OFFLINE
  // =====================================================

  const [offline, setOffline] = useState(false);
  const [offlineActionLoading, setOfflineActionLoading] =
    useState(false);

  // =====================================================
  // REPORT
  // =====================================================

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] =
    useState("Incorrect lyrics");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");


  const [favorite, setFavorite] = useState(false);

  // =====================================================
  // LOAD LYRICS SETTINGS
  // =====================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "keerthanaLyricsSettings"
      );

      if (!saved) return;

      const settings = JSON.parse(saved);

      if (Number.isFinite(Number(settings.fontSize))) {
        setFontSize(
          Math.min(
            34,
            Math.max(16, Number(settings.fontSize))
          )
        );
      }

      if (Number.isFinite(Number(settings.lineSpacing))) {
        const spacing = Number(settings.lineSpacing);

        if ([1.5, 1.9, 2.3].includes(spacing)) {
          setLineSpacing(spacing);
        }
      }

      if (
        ["left", "center", "right"].includes(
          settings.textAlign
        )
      ) {
        setTextAlign(settings.textAlign);
      }
    } catch (err) {
      console.error("Lyrics settings load error:", err);
    }
  }, []);

  // =====================================================
  // SAVE LYRICS SETTINGS
  // =====================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "keerthanaLyricsSettings",
        JSON.stringify({
          fontSize,
          lineSpacing,
          textAlign,
        })
      );
    } catch (err) {
      console.error("Lyrics settings save error:", err);
    }
  }, [fontSize, lineSpacing, textAlign]);

  // =====================================================
  // LOAD SONG
  // =====================================================

  useEffect(() => {
    const loadSong = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/songs/${id}`);

        setSong(response.data.song);
      } catch (err) {
        console.error("Song details error:", err);
        setError("Unable to load song");
      } finally {
        setLoading(false);
      }
    };

    loadSong();
  }, [id]);

  // =====================================================
  // CHECK LIKED STATUS
  // =====================================================

  useEffect(() => {
    if (!user || !song) {
      setLiked(false);
      return;
    }

    const checkLiked = async () => {
      try {
        const response = await API.get("/liked-songs");

        const likedSongs = response.data.songs || [];

        const exists = likedSongs.some(
          (item) => Number(item.id) === Number(song.id)
        );

        setLiked(exists);
      } catch (err) {
        console.error("Liked songs check error:", err);
      }
    };

    checkLiked();
  }, [user, song]);

  // =====================================================
  // CHECK OFFLINE STATUS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const checkOffline = async () => {
      if (!song?.id) {
        setOffline(false);
        return;
      }

      try {
        const result = await isSongOffline(song.id);

        if (!cancelled) {
          setOffline(Boolean(result));
        }
      } catch (err) {
        console.error("Offline status error:", err);

        if (!cancelled) {
          setOffline(false);
        }
      }
    };

    checkOffline();

    return () => {
      cancelled = true;
    };
  }, [song, isSongOffline]);


  useEffect(() => {
  if (song?.id) {
    setFavorite(isFavorite(song.id));
  }
}, [song]);
  // =====================================================
  // CURRENT SONG
  // =====================================================

  const isCurrentSong =
    Boolean(song) &&
    Boolean(currentSong) &&
    Number(currentSong.id) === Number(song.id);

  // =====================================================
  // OFFLINE DOWNLOADING
  // =====================================================

  const isDownloading =
    Boolean(song) &&
    Number(offlineDownloadingId) === Number(song.id);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (seconds) => {
    if (!Number.isFinite(Number(seconds))) {
      return "0:00";
    }

    const total = Math.max(
      0,
      Math.floor(Number(seconds))
    );

    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    return `${minutes}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // PLAY SONG
  // =====================================================

  const handlePlay = () => {
    if (!song) return;

    if (isCurrentSong) {
      togglePlay();
      return;
    }

    playSong(song, [song]);
  };

  // =====================================================
  // PRAYER MODE
  // =====================================================

  const handleOpenPrayerMode = () => {
    if (!song) return;

    setPrayerMode(true);
    document.body.classList.add("prayer-mode-active");
  };

  const handleClosePrayerMode = () => {
    setPrayerMode(false);
    document.body.classList.remove("prayer-mode-active");
  };

  // =====================================================
  // SLEEP MODE - START
  // =====================================================

  const startSleepTimer = (minutes) => {
    const numericMinutes = Number(minutes);

    if (
      !Number.isFinite(numericMinutes) ||
      numericMinutes <= 0
    ) {
      return;
    }

    const endTime =
      Date.now() + numericMinutes * 60 * 1000;

    setSleepEndTime(endTime);
    setSleepRemaining(numericMinutes * 60);
    setSleepModeOpen(false);
  };

  // =====================================================
  // SLEEP MODE - CANCEL
  // =====================================================

  const cancelSleepTimer = () => {
    setSleepEndTime(null);
    setSleepRemaining(0);
  };

  // =====================================================
  // SLEEP MODE - COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (!sleepEndTime) {
      return undefined;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (sleepEndTime - Date.now()) / 1000
        )
      );

      setSleepRemaining(remaining);

      if (remaining <= 0) {
        setSleepEndTime(null);
        setSleepRemaining(0);

        if (isPlayingRef.current) {
          togglePlayRef.current();
        }
      }
    };

    updateTimer();

    const timer = window.setInterval(
      updateTimer,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [sleepEndTime]);

  // =====================================================
  // SLEEP TIMER DISPLAY
  // =====================================================

  const formatSleepTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const secs = safeSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    if (!prayerMode && !sleepModeOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (sleepModeOpen) {
        setSleepModeOpen(false);
      } else if (prayerMode) {
        handleClosePrayerMode();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [prayerMode, sleepModeOpen]);

  // =====================================================
  // PRAYER MODE CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      document.body.classList.remove(
        "prayer-mode-active"
      );
    };
  }, []);

  // =====================================================
  // OFFLINE DOWNLOAD
  // =====================================================

  const handleDownloadOffline = async () => {
    if (!song || offline || isDownloading) {
      return;
    }

    try {
      setOfflineActionLoading(true);

      await downloadSongOffline(song);

      const result = await isSongOffline(song.id);

      setOffline(Boolean(result));
    } catch (err) {
      console.error(
        "Offline download error:",
        err
      );

      alert(
        "Unable to download this song for offline use."
      );
    } finally {
      setOfflineActionLoading(false);
    }
  };

  // =====================================================
  // REMOVE OFFLINE
  // =====================================================

  const handleRemoveOffline = async () => {
    if (!song || !offline) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this song from offline storage?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setOfflineActionLoading(true);

      await removeOfflineSong(song.id);

      setOffline(false);
    } catch (err) {
      console.error(
        "Remove offline song error:",
        err
      );

      alert(
        "Unable to remove this song from offline storage."
      );
    } finally {
      setOfflineActionLoading(false);
    }
  };

  // =====================================================
  // LIKE / UNLIKE
  // =====================================================

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!song) return;

    try {
      if (liked) {
        await API.delete(
          `/liked-songs/${song.id}`
        );

        setLiked(false);
      } else {
        await API.post(
          "/liked-songs",
          {
            song_id: song.id,
          }
        );

        setLiked(true);
      }
    } catch (err) {
      console.error(
        "Like song error:",
        err.response?.data || err.message
      );
    }
  };

  // =====================================================
  // PLAYLIST
  // =====================================================

  const handleAddPlaylist = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!song) return;

    navigate(`/playlists?song=${song.id}`);
  };

  // =====================================================
  // FONT CONTROLS
  // =====================================================

  const increaseFont = () => {
    setFontSize((current) =>
      Math.min(34, current + 2)
    );
  };

  const decreaseFont = () => {
    setFontSize((current) =>
      Math.max(16, current - 2)
    );
  };

  const resetLyricsSettings = () => {
    setFontSize(22);
    setLineSpacing(1.9);
    setTextAlign("left");
  };

  // =====================================================
  // REPORT
  // =====================================================

  const handleSubmitReport = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!song) return;

    const message = reportMessage.trim();

    if (!message) {
      alert(
        "Please describe the problem or correction."
      );
      return;
    }

    try {
      setReportSubmitting(true);
      setReportSuccess("");

      await API.post(
        "/song-reports",
        {
          song_id: song.id,
          song_title: song.title,
          report_type: reportType,
          message,
        }
      );

      setReportSuccess(
        "Thank you! Your report has been submitted successfully."
      );

      setReportMessage("");
      setReportType("Incorrect lyrics");

      window.setTimeout(() => {
        setShowReportForm(false);
        setReportSuccess("");
      }, 2000);
    } catch (err) {
      console.error(
        "Song report error:",
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
          "Unable to submit your report. Please try again."
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  // =====================================================
  // SHARE LYRICS
  // =====================================================

  const handleShareLyrics = async () => {
    if (!song?.lyrics) {
      return;
    }

    try {
      setSharingLyrics(true);

      if (
        document.fonts &&
        document.fonts.ready
      ) {
        await document.fonts.ready;
      }

      const canvas =
        document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      const canvasWidth = 1200;
      const horizontalPadding = 90;

      const contentWidth =
        canvasWidth -
        horizontalPadding * 2;

      const lyricFontSize = Math.max(
        38,
        Number(fontSize) * 2
      );

      const lyricLineHeight =
        lyricFontSize * Number(lineSpacing);

      const titleFontSize = 64;
      const subtitleFontSize = 34;
      const artistFontSize = 30;

      const title = String(
        song.title || "Christian Song"
      );

      const englishTitle = String(
        song.title_english || ""
      );

      const artist = String(
        song.artist_name || "KEERTHANA"
      );

      const lyrics = String(
        song.lyrics || ""
      );

      ctx.font = `500 ${lyricFontSize}px "Noto Sans Telugu", "Noto Serif Telugu", sans-serif`;

      const wrapText = (
        text,
        maxWidth
      ) => {
        const lines = [];
        const paragraphs =
          text.split("\n");

        paragraphs.forEach(
          (paragraph) => {
            if (!paragraph.trim()) {
              lines.push("");
              return;
            }

            let currentLine = "";

            for (const char of paragraph) {
              const testLine =
                currentLine + char;

              const width =
                ctx.measureText(
                  testLine
                ).width;

              if (
                width > maxWidth &&
                currentLine
              ) {
                lines.push(currentLine);
                currentLine = char;
              } else {
                currentLine = testLine;
              }
            }

            if (currentLine) {
              lines.push(currentLine);
            }
          }
        );

        return lines;
      };

      const lyricLines = wrapText(
        lyrics,
        contentWidth
      );

      const topArea = 320;
      const bottomArea = 110;

      const lyricHeight =
        lyricLines.length *
        lyricLineHeight;

      const canvasHeight = Math.max(
        1200,
        Math.ceil(
          topArea +
            lyricHeight +
            bottomArea
        )
      );

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const backgroundGradient =
        ctx.createLinearGradient(
          0,
          0,
          canvasWidth,
          canvasHeight
        );

      backgroundGradient.addColorStop(
        0,
        "#12372a"
      );

      backgroundGradient.addColorStop(
        0.5,
        "#0b281e"
      );

      backgroundGradient.addColorStop(
        1,
        "#061b14"
      );

      ctx.fillStyle =
        backgroundGradient;

      ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      ctx.beginPath();

      ctx.arc(
        canvasWidth - 80,
        100,
        180,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "rgba(201,164,92,0.08)";

      ctx.fill();

      ctx.beginPath();

      ctx.arc(
        40,
        canvasHeight - 80,
        220,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "rgba(201,164,92,0.06)";

      ctx.fill();

      ctx.fillStyle = "#c9a45c";

      ctx.fillRect(
        horizontalPadding,
        70,
        150,
        7
      );

      ctx.font =
        "700 24px Arial, sans-serif";

      ctx.fillStyle = "#c9a45c";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      ctx.fillText(
        "KEERTHANA",
        horizontalPadding,
        125
      );

      ctx.font = `700 ${titleFontSize}px "Noto Sans Telugu", "Noto Serif Telugu", sans-serif`;

      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        title,
        horizontalPadding,
        195
      );

      let lyricStartY = 270;

      if (englishTitle) {
        ctx.font =
          `500 ${subtitleFontSize}px Arial, sans-serif`;

        ctx.fillStyle =
          "rgba(255,255,255,0.75)";

        ctx.fillText(
          englishTitle,
          horizontalPadding,
          245
        );

        lyricStartY = 315;
      }

      ctx.font =
        `600 ${artistFontSize}px Arial, sans-serif`;

      ctx.fillStyle = "#c9a45c";

      ctx.fillText(
        artist,
        horizontalPadding,
        lyricStartY
      );

      lyricStartY += 70;

      ctx.fillStyle =
        "rgba(201,164,92,0.5)";

      ctx.fillRect(
        horizontalPadding,
        lyricStartY,
        contentWidth,
        2
      );

      lyricStartY += 60;

      ctx.textAlign = textAlign;

      let lyricX = horizontalPadding;

      if (textAlign === "center") {
        lyricX = canvasWidth / 2;
      }

      if (textAlign === "right") {
        lyricX =
          canvasWidth -
          horizontalPadding;
      }

      ctx.font =
        `500 ${lyricFontSize}px "Noto Sans Telugu", "Noto Serif Telugu", sans-serif`;

      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "top";

      let currentY = lyricStartY;

      lyricLines.forEach((line) => {
        if (!line) {
          currentY += lyricLineHeight;
          return;
        }

        ctx.fillText(
          line,
          lyricX,
          currentY
        );

        currentY += lyricLineHeight;
      });

      ctx.textAlign = "center";

      ctx.font =
        "500 22px Arial, sans-serif";

      ctx.fillStyle =
        "rgba(255,255,255,0.6)";

      ctx.fillText(
        "Shared from KEERTHANA",
        canvasWidth / 2,
        canvasHeight - 55
      );

      const blob =
        await new Promise((resolve) =>
          canvas.toBlob(
            resolve,
            "image/png",
            1
          )
        );

      if (!blob) {
        throw new Error(
          "Unable to create lyrics image."
        );
      }

      const safeTitle = title
        .replace(
          /[\\/:*?"<>|]+/g,
          ""
        )
        .trim()
        .replace(/\s+/g, "-");

      const fileName =
        `${safeTitle || "lyrics"}-keerthana.png`;

      const file = new File(
        [blob],
        fileName,
        {
          type: "image/png",
        }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title,
          text:
            `Lyrics of ${title} - KEERTHANA`,
          files: [file],
        });
      } else {
        const imageUrl =
          URL.createObjectURL(blob);

        const downloadLink =
          document.createElement("a");

        downloadLink.href = imageUrl;
        downloadLink.download = fileName;

        document.body.appendChild(
          downloadLink
        );

        downloadLink.click();

        document.body.removeChild(
          downloadLink
        );

        URL.revokeObjectURL(
          imageUrl
        );

        alert(
          "Lyrics card created. The image has been downloaded because image sharing is not supported in this browser."
        );
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      console.error(
        "Share lyrics error:",
        err
      );

      alert(
        "Unable to create the lyrics sharing card."
      );
    } finally {
      setSharingLyrics(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="song-details-page">
        <div className="song-details-loading">
          <FaMusic />
          <h2>Loading Song...</h2>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !song) {
    return (
      <div className="song-details-page">
        <div className="song-details-error">
          <FaMusic />
          <h2>Song not found</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }



  const handleFavorite = () => {
  if (!song?.id) {
    return;
  }

  const newFavoriteState = toggleFavorite(song);

  setFavorite(newFavoriteState);
};
  // =====================================================
  // COVER
  // =====================================================

  const cover = song.cover_url
    ? getMediaUrl(song.cover_url)
    : "/images/default-cover.png";

  // =====================================================
  // PLAYER VALUES
  // =====================================================

  const displayedTime = isCurrentSong
    ? currentTime
    : 0;

  const displayedDuration = isCurrentSong
    ? duration
    : Number(song.duration) || 0;

  // =====================================================
  // OFFLINE BUTTON
  // =====================================================

  const offlineButtonText =
    isDownloading ||
    offlineActionLoading
      ? "Downloading..."
      : offline
        ? "Available Offline"
        : "Download Offline";




  // =====================================================
  // SLEEP MODE MODAL
  // =====================================================

  const sleepModeModal = sleepModeOpen ? (
    <div
      className="sleep-mode-overlay"
      onClick={() => setSleepModeOpen(false)}
    >
      <div
        className="sleep-mode-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="sleep-mode-modal-header">
          <div>
            <span>PEACEFUL LISTENING</span>
            <h2>Sleep Mode</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setSleepModeOpen(false)
            }
            aria-label="Close Sleep Mode"
          >
            <FaTimes />
          </button>
        </div>

        <div className="sleep-mode-icon">
          <FaMoon />
        </div>

        <p className="sleep-mode-description">
          Set a timer and KEERTHANA will
          automatically pause the music when
          the timer ends.
        </p>

        {sleepEndTime && (
          <div className="sleep-current-timer">
            <FaStopwatch />

            <div>
              <span>Current timer</span>
              <strong>
                {formatSleepTime(
                  sleepRemaining
                )}
              </strong>
            </div>
          </div>
        )}

        <div className="sleep-timer-options">
          {[15, 30, 45, 60].map(
            (minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() =>
                  startSleepTimer(minutes)
                }
              >
                <strong>{minutes}</strong>
                <span>minutes</span>
              </button>
            )
          )}
        </div>

        {sleepEndTime && (
          <button
            type="button"
            className="sleep-cancel-button"
            onClick={() => {
              cancelSleepTimer();
              setSleepModeOpen(false);
            }}
          >
            <FaTimes />
            Cancel Current Timer
          </button>
        )}

        <p className="sleep-mode-footer">
          The timer can pause playback even
          when you enter Prayer Mode.
        </p>
      </div>
    </div>
  ) : null;

  // =====================================================
  // PRAYER MODE
  // =====================================================

  if (prayerMode) {
    return (
      <>
        <div className="prayer-mode-page">
          <header className="prayer-mode-header">
            <div className="prayer-mode-brand">
              <div className="prayer-mode-brand-icon">
                <FaMoon />
              </div>

              <div>
                <span>PRAYER MODE</span>
                <strong>KEERTHANA</strong>
              </div>
            </div>

            <div className="prayer-mode-header-actions">
              {sleepEndTime && (
                <div className="prayer-active-timer">
                  <FaStopwatch />
                  <span>
                    {formatSleepTime(
                      sleepRemaining
                    )}
                  </span>
                </div>
              )}

              <button
                type="button"
                className="prayer-sleep-button"
                onClick={() =>
                  setSleepModeOpen(true)
                }
                title="Sleep Timer"
              >
                <FaClock />
                <span>
                  {sleepEndTime
                    ? "Sleep Timer"
                    : "Sleep Mode"}
                </span>
              </button>

              <button
                type="button"
                className="prayer-mode-close"
                onClick={
                  handleClosePrayerMode
                }
                aria-label="Exit Prayer Mode"
                title="Exit Prayer Mode"
              >
                <FaTimes />
              </button>
            </div>
          </header>

          <div className="prayer-mode-song-info">
            <div className="prayer-mode-cover">
              <img
                src={cover}
                alt={song.title}
                onError={(event) => {
                  event.currentTarget.onerror =
                    null;

                  event.currentTarget.src =
                    "/images/default-cover.png";
                }}
              />
            </div>

            <div className="prayer-mode-song-text">
              <span>NOW PLAYING</span>

              <h1>{song.title}</h1>

              {song.title_english && (
                <h2>
                  {song.title_english}
                </h2>
              )}

              <p>
                {song.artist_name ||
                  "KEERTHANA"}
              </p>
            </div>
          </div>

          <div
            className="prayer-mode-lyrics"
            style={{
              fontSize: `${Math.max(
                fontSize,
                24
              )}px`,
              lineHeight: lineSpacing,
              textAlign,
            }}
          >
            {song.lyrics ? (
              song.lyrics
            ) : (
              <div className="prayer-mode-no-lyrics">
                <FaMusic />
                <p>
                  Lyrics not available
                </p>
              </div>
            )}
          </div>
<div className="prayer-mode-player">

  {/* PROGRESS */}
  <div className="prayer-mode-progress">
    <span>
      {formatTime(displayedTime)}
    </span>

    <input
      type="range"
      min="0"
      max={displayedDuration || 0}
      step="1"
      value={Math.min(
        displayedTime,
        displayedDuration || 0
      )}
      disabled={
        !isCurrentSong ||
        !displayedDuration
      }
      onChange={(event) =>
        seek(Number(event.target.value))
      }
      aria-label="Song progress"
    />

    <span>
      {formatTime(displayedDuration)}
    </span>
  </div>

  {/* SONG TOOLBAR */}
  <div className="prayer-mode-song-toolbar">

    <button
      type="button"
      onClick={previousSong}
      disabled={!isCurrentSong}
      title="Previous song"
      aria-label="Previous song"
    >
      <FaStepBackward />
    </button>

    <button
      type="button"
      className="prayer-mode-play"
      onClick={handlePlay}
      title={
        isCurrentSong && isPlaying
          ? "Pause"
          : "Play"
      }
      aria-label={
        isCurrentSong && isPlaying
          ? "Pause"
          : "Play"
      }
    >
      {isCurrentSong && isPlaying ? (
        <FaPause />
      ) : (
        <FaPlay />
      )}
    </button>

    <button
      type="button"
      onClick={nextSong}
      disabled={!isCurrentSong}
      title="Next song"
      aria-label="Next song"
    >
      <FaStepForward />
    </button>

    <button
      type="button"
      className={sleepEndTime ? "active" : ""}
      onClick={() => setSleepModeOpen(true)}
      title="Sleep Mode"
      aria-label="Sleep Mode"
    >
      <FaClock />
    </button>

    <button
      type="button"
      onClick={handleClosePrayerMode}
      title="Exit Prayer Mode"
      aria-label="Exit Prayer Mode"
    >
      <FaTimes />
    </button>

  </div>

  {/* VOLUME */}
  <div className="prayer-mode-volume">
    <FaVolumeUp />

    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={(event) =>
        changeVolume(
          Number(event.target.value)
        )
      }
      aria-label="Volume"
    />
  </div>

  {/* SLEEP TIMER STATUS */}
  {sleepEndTime && (
    <div className="prayer-mode-sleep-status">

      <FaMoon />

      <span>
        Sleep timer:
        {" "}
        <strong>
          {formatSleepTime(
            sleepRemaining
          )}
        </strong>
      </span>

      <button
        type="button"
        onClick={cancelSleepTimer}
      >
        Cancel
      </button>

    </div>
  )}

  {/* PRAYER HINT */}
  <div className="prayer-mode-hint">
    <FaMoon />

    <span>
      Take a moment to worship
      and pray
    </span>
  </div>

</div>
        </div>

        {sleepModeModal}
      </>
    );
  }

  // =====================================================
  // NORMAL PAGE
  // =====================================================

  return (
    <div className="song-details-page">
      {/* TOP BAR */}

      <div className="song-details-topbar">
        <button
          type="button"
          className="song-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <div>
          <span>NOW PLAYING</span>
          <strong>KEERTHANA</strong>
        </div>
      </div>

      {/* HERO */}

      <section className="song-details-hero">
        <div className="song-details-cover">
          <img
            src={cover}
            alt={song.title}
            onError={(event) => {
              event.currentTarget.onerror =
                null;

              event.currentTarget.src =
                "/images/default-cover.png";
            }}
          />
        </div>

        <div className="song-details-info">
          <span className="song-type">
            CHRISTIAN MUSIC
          </span>

          <h1>{song.title}</h1>

          {song.title_english && (
            <h2>
              {song.title_english}
            </h2>
          )}

          <div className="song-meta">
            <button
              type="button"
              onClick={() => {
                if (song.artist_id) {
                  navigate(
                    `/artists/${song.artist_id}`
                  );
                }
              }}
            >
              {song.artist_name ||
                "KEERTHANA"}
            </button>

            {song.album_title && (
              <>
                <span>•</span>

                <button
                  type="button"
                  onClick={() => {
                    if (song.album_id) {
                      navigate(
                        `/albums/${song.album_id}`
                      );
                    }
                  }}
                >
                  {song.album_title}
                </button>
              </>
            )}

            {song.category_name && (
              <>
                <span>•</span>
                <span>
                  {song.category_name}
                </span>
              </>
            )}
          </div>

          {/* SONG ACTIONS
              Prayer Mode and Sleep Mode
              are kept ONLY here. */}

          <div className="song-actions">
            <button
              type="button"
              className="song-main-play"
              onClick={handlePlay}
              title={
                isCurrentSong &&
                isPlaying
                  ? "Pause"
                  : "Play"
              }
              aria-label={
                isCurrentSong &&
                isPlaying
                  ? "Pause"
                  : "Play"
              }
            >
              {isCurrentSong &&
              isPlaying ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}
            </button>

            <button
              type="button"
              className="song-lyrics-button"
              onClick={() => {
                document
                  .getElementById(
                    "lyrics-section"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
            >
              <FaFileAlt />
              <span>Lyrics</span>
            </button>

            <button
              type="button"
              className="song-prayer-mode-button"
              onClick={
                handleOpenPrayerMode
              }
              title="Open distraction-free Prayer Mode"
            >
              <FaMoon />
              <span>Prayer Mode</span>
            </button>
{/* LIKE */}
<button
  type="button"
  className={liked ? "song-like active" : "song-like"}
  onClick={handleLike}
  title={
    liked
      ? "Remove from Liked Songs"
      : "Add to Liked Songs"
  }
  aria-label={
    liked
      ? "Remove from Liked Songs"
      : "Add to Liked Songs"
  }
>
  {liked ? <FaHeart /> : <FaRegHeart />}
</button>

{/* FAVORITE */}
<button
  type="button"
  className={
    favorite
      ? "song-favorite active"
      : "song-favorite"
  }
  onClick={handleFavorite}
  title={
    favorite
      ? "Remove from Favorites"
      : "Add to Favorites"
  }
  aria-label={
    favorite
      ? "Remove from Favorites"
      : "Add to Favorites"
  }
>
  {favorite ? <FaBookmark /> : <FaRegBookmark />}
</button> 
         <button
              type="button"
              className="song-add-playlist"
              onClick={
                handleAddPlaylist
              }
            >
              <FaPlus />
              <span>Add to Playlist</span>
            </button>

            <button
              type="button"
              className="song-sleep-button"
              onClick={() =>
                setSleepModeOpen(true)
              }
              title="Set Sleep Mode"
            >
              <FaClock />

              <span>
                {sleepEndTime
                  ? `Sleep ${formatSleepTime(
                      sleepRemaining
                    )}`
                  : "Sleep Mode"}
              </span>
            </button>

            {!offline ? (
              <button
                type="button"
                className="song-offline-button"
                onClick={
                  handleDownloadOffline
                }
                disabled={
                  isDownloading ||
                  offlineActionLoading
                }
                title="Download song for offline listening"
              >
                <FaDownload />

                <span>
                  {offlineButtonText}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="song-offline-button offline-active"
                onClick={
                  handleRemoveOffline
                }
                disabled={
                  offlineActionLoading
                }
                title="Remove offline song"
              >
                <FaCheck />

                <span>
                  Available Offline
                </span>
              </button>
            )}

            <button
              type="button"
              className="song-report-button"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }

                setReportSuccess("");
                setReportMessage("");
                setReportType(
                  "Incorrect lyrics"
                );
                setShowReportForm(true);
              }}
              title="Report incorrect lyrics or audio"
            >
              <FaFlag />

              <span>
                Report / Suggest Correction
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FULL PLAYER */}

      <section className="song-full-player">
        <div className="song-player-controls">
          <button
            type="button"
            onClick={previousSong}
            disabled={!isCurrentSong}
            title="Previous song"
            aria-label="Previous song"
          >
            <FaStepBackward />
          </button>

          <button
            type="button"
            className="song-player-main"
            onClick={handlePlay}
            title={
              isCurrentSong &&
              isPlaying
                ? "Pause"
                : "Play"
            }
            aria-label={
              isCurrentSong &&
              isPlaying
                ? "Pause"
                : "Play"
            }
          >
            {isCurrentSong &&
            isPlaying ? (
              <FaPause />
            ) : (
              <FaPlay />
            )}
          </button>

          <button
            type="button"
            onClick={nextSong}
            disabled={!isCurrentSong}
            title="Next song"
            aria-label="Next song"
          >
            <FaStepForward />
          </button>
        </div>

        <div className="song-progress-area">
          <span>
            {formatTime(displayedTime)}
          </span>

          <input
            type="range"
            min="0"
            max={displayedDuration || 0}
            step="1"
            value={Math.min(
              displayedTime,
              displayedDuration || 0
            )}
            disabled={
              !isCurrentSong ||
              !displayedDuration
            }
            onChange={(event) =>
              seek(
                Number(event.target.value)
              )
            }
          />

          <span>
            {formatTime(
              displayedDuration
            )}
          </span>
        </div>

        <div className="song-volume">
          <FaVolumeUp />

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) =>
              changeVolume(
                Number(event.target.value)
              )
            }
            aria-label="Volume"
          />
        </div>
      </section>

      {/* LYRICS */}

      <section
        id="lyrics-section"
        className="lyrics-section"
      >
        <div className="lyrics-heading">
          <div>
            <span>LYRICS</span>
            <h2>Song Lyrics</h2>
          </div>

          {/* IMPORTANT:
              Prayer Mode and Sleep Mode
              are NOT duplicated here. */}

          <div className="lyrics-tools">
            <button
              type="button"
              className="lyrics-share-button"
              onClick={
                handleShareLyrics
              }
              disabled={
                !song.lyrics ||
                sharingLyrics
              }
              title="Share complete lyrics"
            >
              <FaShareAlt />

              <span>
                {sharingLyrics
                  ? "Creating..."
                  : "Share Lyrics"}
              </span>
            </button>

            <div className="lyrics-control-group">
              <span className="lyrics-control-label">
                Font
              </span>

              <button
                type="button"
                onClick={decreaseFont}
                title="Decrease Telugu font size"
                aria-label="Decrease Telugu font size"
              >
                <FaMinus />
              </button>

              <span className="lyrics-font-value">
                {fontSize}px
              </span>

              <button
                type="button"
                onClick={increaseFont}
                title="Increase Telugu font size"
                aria-label="Increase Telugu font size"
              >
                <FaPlus />
              </button>
            </div>

            <div className="lyrics-control-group">
              <span className="lyrics-control-label">
                Spacing
              </span>

              <button
                type="button"
                className={
                  lineSpacing === 1.5
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLineSpacing(1.5)
                }
              >
                Compact
              </button>

              <button
                type="button"
                className={
                  lineSpacing === 1.9
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLineSpacing(1.9)
                }
              >
                Normal
              </button>

              <button
                type="button"
                className={
                  lineSpacing === 2.3
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLineSpacing(2.3)
                }
              >
                Wide
              </button>
            </div>

            <div className="lyrics-control-group">
              <span className="lyrics-control-label">
                Align
              </span>

              <button
                type="button"
                className={
                  textAlign === "left"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTextAlign("left")
                }
                aria-label="Align left"
              >
                <FaAlignLeft />
              </button>

              <button
                type="button"
                className={
                  textAlign === "center"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTextAlign("center")
                }
                aria-label="Align center"
              >
                <FaAlignCenter />
              </button>

              <button
                type="button"
                className={
                  textAlign === "right"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTextAlign("right")
                }
                aria-label="Align right"
              >
                <FaAlignRight />
              </button>
            </div>

            <button
              type="button"
              className="lyrics-reset-button"
              onClick={
                resetLyricsSettings
              }
              title="Reset lyrics settings"
              aria-label="Reset lyrics settings"
            >
              <FaRedo />
            </button>
          </div>
        </div>

        {song.lyrics ? (
          <div
            className="song-lyrics"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              textAlign,
            }}
          >
            {song.lyrics}
          </div>
        ) : (
          <div className="no-lyrics">
            <FaMusic />

            <h3>
              Lyrics not available
            </h3>

            <p>
              Lyrics for this song
              will be added soon.
            </p>
          </div>
        )}
      </section>

      {/* REPORT MODAL */}

      {showReportForm && (
        <div
          className="song-report-overlay"
          onClick={() => {
            if (!reportSubmitting) {
              setShowReportForm(false);
            }
          }}
        >
          <div
            className="song-report-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="song-report-header">
              <div>
                <span>
                  HELP US IMPROVE
                </span>

                <h2>Report Song</h2>
              </div>

              <button
                type="button"
                className="song-report-close"
                onClick={() => {
                  if (!reportSubmitting) {
                    setShowReportForm(false);
                  }
                }}
                disabled={reportSubmitting}
                aria-label="Close report form"
              >
                <FaTimes />
              </button>
            </div>

            <div className="song-report-song">
              <FaMusic />

              <div>
                <strong>
                  {song.title}
                </strong>

                {song.title_english && (
                  <span>
                    {song.title_english}
                  </span>
                )}
              </div>
            </div>

            <form
              onSubmit={
                handleSubmitReport
              }
              className="song-report-form"
            >
              <label htmlFor="report-type">
                What would you like to report?
              </label>

              <select
                id="report-type"
                value={reportType}
                onChange={(event) =>
                  setReportType(
                    event.target.value
                  )
                }
                disabled={reportSubmitting}
              >
                <option value="Incorrect lyrics">
                  Incorrect lyrics
                </option>

                <option value="Incorrect audio">
                  Incorrect audio
                </option>

                <option value="Incorrect song title">
                  Incorrect song title
                </option>

                <option value="Missing lyrics">
                  Missing lyrics
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              <label htmlFor="report-message">
                Describe the problem
              </label>

              <textarea
                id="report-message"
                value={reportMessage}
                onChange={(event) =>
                  setReportMessage(
                    event.target.value
                  )
                }
                placeholder={
                  reportType ===
                  "Incorrect lyrics"
                    ? "Example: The second line of the chorus has an incorrect word..."
                    : "Please describe the problem..."
                }
                rows={5}
                maxLength={2000}
                disabled={reportSubmitting}
              />

              <div className="song-report-character-count">
                {reportMessage.length}/2000
              </div>

              {reportSuccess && (
                <div className="song-report-success">
                  <FaCheck />

                  <span>
                    {reportSuccess}
                  </span>
                </div>
              )}

              <div className="song-report-actions">
                <button
                  type="button"
                  className="song-report-cancel"
                  onClick={() =>
                    setShowReportForm(false)
                  }
                  disabled={reportSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="song-report-submit"
                  disabled={
                    reportSubmitting ||
                    !reportMessage.trim()
                  }
                >
                  <FaFlag />

                  <span>
                    {reportSubmitting
                      ? "Submitting..."
                      : "Submit Report"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLEEP MODE */}

      {sleepModeModal}
    </div>
  );
}

export default SongDetails;