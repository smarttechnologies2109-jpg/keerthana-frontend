
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaEdit,
  FaMusic,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import API from "../../services/api";

import { getMediaUrl } from "../../utils/media";

import "../../assets/css/admin/manageSongs.css";

function ManageSongs() {
  const navigate = useNavigate();

  /* =====================================================
     STATE
  ===================================================== */

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [deletingId, setDeletingId] = useState(null);

  /* =====================================================
     LANGUAGE CONFIGURATION
     Native language names
  ===================================================== */

  const languageOptions = [
    { value: "Telugu", label: "తెలుగు" },
    { value: "Hindi", label: "हिन्दी" },
    { value: "English", label: "English" },
    { value: "Malayalam", label: "മലയാളം" },
    { value: "Kannada", label: "ಕನ್ನಡ" },
    { value: "Tamil", label: "தமிழ்" },
  ];

  /* =====================================================
     NORMALIZE LANGUAGE
  ===================================================== */

  const normalizeLanguage = (value) => {
    const language = String(value || "").trim().toLowerCase();

    const match = languageOptions.find(
      (item) => item.value.toLowerCase() === language
    );

    return match ? match.value : "";
  };

  /* =====================================================
     GET NATIVE LANGUAGE LABEL
  ===================================================== */

  const getLanguageLabel = (value) => {
    const normalized = normalizeLanguage(value);

    const match = languageOptions.find(
      (item) => item.value === normalized
    );

    return match ? match.label : value || "—";
  };

  /* =====================================================
     LOAD SONGS
  ===================================================== */

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/songs");

      console.log("Admin songs:", response.data);

      setSongs(response.data.songs || []);
    } catch (error) {
      console.error("Load songs error:", error);

      setError(
        error.response?.data?.message ||
        "Unable to load songs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  /* =====================================================
     LANGUAGE-WISE SONG COUNTS
  ===================================================== */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      languageOptions.map((item) => [item.value, 0])
    );

    songs.forEach((song) => {
      const language = normalizeLanguage(song.language);

      if (language) {
        counts[language] += 1;
      }
    });

    return counts;
  }, [songs]);

  /* =====================================================
     SEARCH + LANGUAGE FILTER
  ===================================================== */

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchingSongs = songs.filter((song) => {
      const songLanguage = normalizeLanguage(song.language);

      // Language filter
      if (
        selectedLanguage !== "All" &&
        songLanguage !== selectedLanguage
      ) {
        return false;
      }

      // Search filter
      if (!query) return true;

      const values = [
        song.title,
        song.title_english,
        song.artist_name,
        song.artist,
        song.album_title,
        song.album,
        song.category_name,
        song.category,
        song.language,
      ];

      return values
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });

    // Alphabetical sorting
    return matchingSongs.sort((a, b) => {
      const titleA = String(
        a.title_english || a.title || ""
      ).trim();

      const titleB = String(
        b.title_english || b.title || ""
      ).trim();

      return titleA.localeCompare(titleB, "en", {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [songs, search, selectedLanguage]);

  /* =====================================================
     DELETE SONG
  ===================================================== */

  const handleDelete = async (song) => {
    const confirmed = window.confirm(
      `Delete "${song.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(song.id);
      setError("");
      setSuccess("");

      await API.delete(`/admin/songs/${song.id}`);

      setSongs((previous) =>
        previous.filter((item) => item.id !== song.id)
      );

      setSuccess(
        `"${song.title}" deleted successfully.`
      );
    } catch (error) {
      console.error("Delete song error:", error);

      setError(
        error.response?.data?.message ||
        "Unable to delete song."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     COVER URL
  ===================================================== */

  const getCover = (song) => {
    if (!song.cover_url) {
      return null;
    }

    if (
      song.cover_url.startsWith("http://") ||
      song.cover_url.startsWith("https://")
    ) {
      return song.cover_url;
    }

    return getMediaUrl(song.cover_url);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading Songs...
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="admin-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-header">
        <div>
          <span>KEERTHANA ADMIN</span>

          <h1>Manage Songs</h1>

          <p>
            Add, edit and manage songs in KEERTHANA.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => navigate("/admin/songs/add")}
        >
          <FaPlus />
          Add Song
        </button>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {/* =================================================
          TOTAL SONGS + LANGUAGE SUMMARY CARDS
      ================================================= */}

      <section
        className="admin-song-language-section"
        aria-label="Song language summary"
      >

        {/* TOTAL SONGS */}

        <button
          type="button"
          className={`admin-song-language-card admin-song-total-card ${
            selectedLanguage === "All" ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage("All")}
          aria-pressed={selectedLanguage === "All"}
        >
          <span className="admin-song-language-card-top">
            <span className="admin-song-language-card-label">
              TOTAL SONGS
            </span>

            <FaMusic />
          </span>

          <strong>{songs.length}</strong>

          <span className="admin-song-language-card-caption">
            All Languages
          </span>
        </button>

        {/* LANGUAGE-WISE CARDS */}

        {languageOptions.map((language) => (
          <button
            type="button"
            key={language.value}
            className={`admin-song-language-card ${
              selectedLanguage === language.value
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedLanguage((current) =>
                current === language.value
                  ? "All"
                  : language.value
              )
            }
            aria-pressed={
              selectedLanguage === language.value
            }
          >
            <span className="admin-song-language-card-top">
              <span className="admin-song-language-card-label">
                {language.label}
              </span>
            </span>

            <strong>
              {languageCounts[language.value] || 0}
            </strong>

            <span className="admin-song-language-card-caption">
              Songs
            </span>
          </button>
        ))}

      </section>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="admin-song-toolbar">

        {/* SEARCH */}

        <div className="admin-song-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search songs, artists, albums..."
          />
        </div>

        {/* LANGUAGE DROPDOWN */}

        <div className="admin-song-language-filter">
          <label htmlFor="admin-song-language-select">
            Filter by language
          </label>

          <select
            id="admin-song-language-select"
            value={selectedLanguage}
            onChange={(event) =>
              setSelectedLanguage(event.target.value)
            }
            aria-label="Filter songs by language"
          >
            <option value="All">
              All Languages
            </option>

            {languageOptions.map((language) => (
              <option
                key={language.value}
                value={language.value}
              >
                {language.label}
              </option>
            ))}
          </select>
        </div>

        {/* SONG COUNT */}

        <div className="admin-song-count">
          <FaMusic />

          <span>
            {filteredSongs.length} of {songs.length} Songs
          </span>
        </div>

      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filteredSongs.length === 0 ? (

        <div className="admin-empty-state">

          <FaMusic />

          <h2>
            {search || selectedLanguage !== "All"
              ? "No Songs Found"
              : "No Songs Yet"}
          </h2>

          <p>
            {search || selectedLanguage !== "All"
              ? "Try another search or select a different language."
              : "Add your first song to KEERTHANA."}
          </p>

          {!search && selectedLanguage === "All" && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={() =>
                navigate("/admin/songs/add")
              }
            >
              <FaPlus />
              Add Song
            </button>
          )}

        </div>

      ) : (

        /* =================================================
           SONGS TABLE
        ================================================= */

        <div className="admin-table-wrapper">

          <table className="admin-song-table">

            <thead>
              <tr>
                <th className="admin-song-number-heading">
                  No.
                </th>

                <th>Song</th>

                <th>Artist</th>

                <th>Album</th>

                <th>Category</th>

                <th>Language</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredSongs.map((song, index) => {
                const cover = getCover(song);

                return (
                  <tr key={song.id}>

                    {/* NUMBER */}

                    <td className="admin-song-number">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* SONG */}

                    <td>
                      <div className="admin-song-cell">

                        <div className="admin-song-cover">

                          {cover ? (
                            <img
                              src={cover}
                              alt={song.title}
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <FaMusic />
                          )}

                        </div>

                        <div className="admin-song-info">

                          <strong>
                            {song.title || "Untitled Song"}
                          </strong>

                          {song.title_english && (
                            <span>
                              {song.title_english}
                            </span>
                          )}

                        </div>

                      </div>
                    </td>

                    {/* ARTIST */}

                    <td>
                      {song.artist_name || song.artist || "—"}
                    </td>

                    {/* ALBUM */}

                    <td>
                      {song.album_title || song.album || "—"}
                    </td>

                    {/* CATEGORY */}

                    <td>
                      {song.category_name || song.category || "—"}
                    </td>

                    {/* NATIVE LANGUAGE */}

                    <td>
                      <span className="admin-song-language-badge">
                        {getLanguageLabel(song.language)}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="admin-table-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="admin-action-button edit"
                          title="Edit Song"
                          onClick={() =>
                            navigate(
                              `/admin/songs/${song.id}/edit`
                            )
                          }
                        >
                          <FaEdit />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="admin-action-button delete"
                          title="Delete Song"
                          disabled={deletingId === song.id}
                          onClick={() => handleDelete(song)}
                        >
                          <FaTrash />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default ManageSongs;
