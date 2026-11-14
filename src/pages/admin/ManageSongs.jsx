
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
  FaTimes,
  FaFilter,
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

  // FILTER 1: LANGUAGE
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  // FILTER 2: ADVANCED
  const [selectedAdvancedFilter, setSelectedAdvancedFilter] =
    useState("All");

  const [deletingId, setDeletingId] = useState(null);

  const ALL = "All";

  /* =====================================================
     LANGUAGE OPTIONS
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
     NORMALIZE TEXT
  ===================================================== */

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  /* =====================================================
     GET SONG FIELD VALUES

     Supports text and common object responses.
  ===================================================== */

  const getValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      return (
        value.name ??
        value.title ??
        value.artist_name ??
        value.album_name ??
        value.ministry_name ??
        value.category_name ??
        ""
      );
    }

    return value;
  };

  const getArtist = (song) =>
    getValue(
      song.artist_name ??
      song.artist ??
      ""
    );

  const getAlbum = (song) =>
    getValue(
      song.album_title ??
      song.album_name ??
      song.album ??
      ""
    );

  const getMinistry = (song) =>
    getValue(
      song.ministry_name ??
      song.ministry_title ??
      song.ministry ??
      ""
    );

  const getCategory = (song) =>
    getValue(
      song.category_name ??
      song.category_title ??
      song.category ??
      ""
    );

  /* =====================================================
     EMPTY VALUE CHECK
  ===================================================== */

  const isEmptyValue = (value) => {
    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );
  };

  /* =====================================================
     UNKNOWN VALUE CHECK

     Empty and Unknown are different.

     Unknown Artist
     Unknown Album
     Unknown Ministry
     Unknown Category
  ===================================================== */

  const isUnknownValue = (value, field) => {
    const normalized = normalizeText(value);

    return (
      normalized === "unknown" ||
      normalized === `unknown ${field}`
    );
  };

  /* =====================================================
     LANGUAGE NORMALIZATION
  ===================================================== */

  const normalizeLanguage = (value) => {
    const language = String(value || "")
      .trim()
      .toLowerCase();

    const match = languageOptions.find(
      (item) =>
        item.value.toLowerCase() === language
    );

    return match ? match.value : "";
  };

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

      console.log("MANAGE SONGS RESPONSE:", response.data);

      const songData = Array.isArray(response.data)
        ? response.data
        : response.data?.songs || [];

      setSongs(songData);

    } catch (error) {
      console.error("LOAD SONGS ERROR:", error);

      setError(
        error.response?.data?.message ||
        "Unable to load songs. Please check your internet connection."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  /* =====================================================
     LANGUAGE COUNTS
  ===================================================== */

  const languageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      languageOptions.map((item) => [
        item.value,
        0,
      ])
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
     ADVANCED FILTER GROUPS

     ONLY 8 OPTIONS.

     ARTIST:
       Empty Artist
       Unknown Artist

     ALBUM:
       Empty Album
       Unknown Album

     MINISTRY:
       Empty Ministry
       Unknown Ministry

     CATEGORY:
       Empty Category
       Unknown Category

     NO INDIVIDUAL NAMES.
  ===================================================== */

  const advancedFilterGroups = [
    {
      label: "ARTIST",
      options: [
        {
          value: "artist|empty",
          label: "Empty Artist",
        },
        {
          value: "artist|unknown",
          label: "Unknown Artist",
        },
      ],
    },
    {
      label: "ALBUM",
      options: [
        {
          value: "album|empty",
          label: "Empty Album",
        },
        {
          value: "album|unknown",
          label: "Unknown Album",
        },
      ],
    },
    {
      label: "MINISTRY",
      options: [
        {
          value: "ministry|empty",
          label: "Empty Ministry",
        },
        {
          value: "ministry|unknown",
          label: "Unknown Ministry",
        },
      ],
    },
    {
      label: "CATEGORY",
      options: [
        {
          value: "category|empty",
          label: "Empty Category",
        },
        {
          value: "category|unknown",
          label: "Unknown Category",
        },
      ],
    },
  ];

  /* =====================================================
     GET FIELD VALUE
  ===================================================== */

  const getFieldValue = (song, field) => {
    switch (field) {
      case "artist":
        return getArtist(song);

      case "album":
        return getAlbum(song);

      case "ministry":
        return getMinistry(song);

      case "category":
        return getCategory(song);

      default:
        return "";
    }
  };

  /* =====================================================
     ADVANCED FILTER MATCHING
  ===================================================== */

  const matchesAdvancedFilter = (song, filter) => {
    if (filter === ALL) {
      return true;
    }

    const [field, filterType] = filter.split("|");

    const value = getFieldValue(song, field);

    // EMPTY ONLY
    if (filterType === "empty") {
      return isEmptyValue(value);
    }

    // UNKNOWN ONLY
    if (filterType === "unknown") {
      return isUnknownValue(value, field);
    }

    return true;
  };

  /* =====================================================
     SEARCH + LANGUAGE + ADVANCED FILTER
  ===================================================== */

  const filteredSongs = useMemo(() => {
    const query = normalizeText(search);

    const matchingSongs = songs.filter((song) => {

      // LANGUAGE FILTER
      const songLanguage = normalizeLanguage(song.language);

      if (
        selectedLanguage !== ALL &&
        songLanguage !== selectedLanguage
      ) {
        return false;
      }

      // ADVANCED FILTER
      if (
        !matchesAdvancedFilter(
          song,
          selectedAdvancedFilter
        )
      ) {
        return false;
      }

      // SEARCH
      if (!query) {
        return true;
      }

      const searchableValues = [
        song.title,
        song.title_english,
        getArtist(song),
        getAlbum(song),
        getMinistry(song),
        getCategory(song),
        song.language,
      ];

      return searchableValues.some((value) =>
        normalizeText(value).includes(query)
      );
    });

    // ALPHABETICAL SORT
    return [...matchingSongs].sort((a, b) => {
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

  }, [
    songs,
    search,
    selectedLanguage,
    selectedAdvancedFilter,
  ]);

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters = () => {
    setSearch("");
    setSelectedLanguage(ALL);
    setSelectedAdvancedFilter(ALL);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedLanguage !== ALL ||
    selectedAdvancedFilter !== ALL;

  /* =====================================================
     DELETE SONG
  ===================================================== */

  const handleDelete = async (song) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(song.id);
      setError("");
      setSuccess("");

      await API.delete(`/admin/songs/${song.id}`);

      setSongs((previous) =>
        previous.filter(
          (item) => item.id !== song.id
        )
      );

      setSuccess(
        `"${song.title}" deleted successfully.`
      );

    } catch (error) {
      console.error("DELETE SONG ERROR:", error);

      setError(
        error.response?.data?.message ||
        "Unable to delete song. Please try again."
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
     DISPLAY EMPTY VALUES
  ===================================================== */

  const displayValue = (value, label) => {
    if (isEmptyValue(value)) {
      return label;
    }

    return value;
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
     PAGE RENDER
  ===================================================== */

  return (
    <div className="admin-page">

      {/* HEADER */}

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
          onClick={() =>
            navigate("/admin/songs/add")
          }
        >
          <FaPlus />
          Add Song
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="admin-success" role="status">
          {success}
        </div>
      )}

      {/* =================================================
          LANGUAGE SUMMARY CARDS
      ================================================= */}

      <section
        className="admin-song-language-section"
        aria-label="Song language summary"
      >

        {/* TOTAL SONGS */}

        <button
          type="button"
          className={`admin-song-language-card admin-song-total-card ${
            selectedLanguage === ALL ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage(ALL)}
          aria-pressed={selectedLanguage === ALL}
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

        {/* LANGUAGE CARDS */}

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
                  ? ALL
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
          SEARCH + TWO FILTER DROPDOWNS
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
            aria-label="Search songs"
          />
        </div>

        {/* FILTER 1: LANGUAGE */}

        <div className="admin-song-language-filter">

          <label htmlFor="admin-song-language-select">
            Language
          </label>

          <select
            id="admin-song-language-select"
            value={selectedLanguage}
            onChange={(event) =>
              setSelectedLanguage(event.target.value)
            }
            aria-label="Filter by language"
          >
            <option value={ALL}>
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

        {/* FILTER 2: ADVANCED FILTER */}

        <div className="admin-song-language-filter admin-song-advanced-filter">

          <label htmlFor="admin-song-advanced-select">
            <FaFilter />
            Advanced Filter
          </label>

          <select
            id="admin-song-advanced-select"
            value={selectedAdvancedFilter}
            onChange={(event) =>
              setSelectedAdvancedFilter(event.target.value)
            }
            aria-label="Filter by artist, album, ministry or category"
          >
            <option value={ALL}>
              All Filters
            </option>

            {advancedFilterGroups.map((group) => (
              <optgroup
                key={group.label}
                label={group.label}
              >
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}

          </select>

        </div>

        {/* CLEAR FILTERS */}

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-primary-button admin-song-clear-filters"
            onClick={clearFilters}
          >
            <FaTimes />
            Clear Filters
          </button>
        )}

        {/* SONG COUNT */}

        <div className="admin-song-count">
          <FaMusic />

          <span>
            {filteredSongs.length} of {songs.length} Songs
          </span>
        </div>

      </div>

      {/* FILTER STATUS */}

      {hasActiveFilters && (
        <div className="admin-song-filter-summary">
          <FaFilter />

          <span>
            Showing {filteredSongs.length} matching songs
          </span>
        </div>
      )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filteredSongs.length === 0 ? (

        <div className="admin-empty-state">

          <FaMusic />

          <h2>
            {hasActiveFilters
              ? "No Songs Found"
              : "No Songs Yet"}
          </h2>

          <p>
            {hasActiveFilters
              ? "No songs match your selected filters. Try another option or clear filters."
              : "Add your first song to KEERTHANA."}
          </p>

          {hasActiveFilters ? (

            <button
              type="button"
              className="admin-primary-button"
              onClick={clearFilters}
            >
              <FaTimes />
              Clear Filters
            </button>

          ) : (

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
                <th>Ministry</th>
                <th>Category</th>
                <th>Language</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredSongs.map((song, index) => {

                const cover = getCover(song);

                const artist = getArtist(song);
                const album = getAlbum(song);
                const ministry = getMinistry(song);
                const category = getCategory(song);

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
                              alt={song.title || "Song cover"}
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
                      {displayValue(
                        artist,
                        "Unknown Artist"
                      )}
                    </td>

                    {/* ALBUM */}

                    <td>
                      {displayValue(
                        album,
                        "Unknown Album"
                      )}
                    </td>

                    {/* MINISTRY */}

                    <td>
                      {displayValue(
                        ministry,
                        "Unknown Ministry"
                      )}
                    </td>

                    {/* CATEGORY */}

                    <td>
                      {displayValue(
                        category,
                        "Unknown Category"
                      )}
                    </td>

                    {/* LANGUAGE */}

                    <td>
                      <span className="admin-song-language-badge">
                        {getLanguageLabel(song.language)}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="admin-table-actions">

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

                        <button
                          type="button"
                          className="admin-action-button delete"
                          title="Delete Song"
                          disabled={deletingId === song.id}
                          onClick={() =>
                            handleDelete(song)
                          }
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
