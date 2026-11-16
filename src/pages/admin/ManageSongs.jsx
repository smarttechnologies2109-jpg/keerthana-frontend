
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

  const [selectedLanguage, setSelectedLanguage] =
    useState("All");

  const [selectedAdvancedFilter, setSelectedAdvancedFilter] =
    useState("All");

  const [deletingId, setDeletingId] = useState(null);

  const ALL = "All";

  /* =====================================================
     LANGUAGE OPTIONS
     ALL LABELS IN ENGLISH
  ===================================================== */

  const languageOptions = [
    { value: "Telugu", label: "Telugu" },
    { value: "Hindi", label: "Hindi" },
    { value: "English", label: "English" },
    { value: "Malayalam", label: "Malayalam" },
    { value: "Kannada", label: "Kannada" },
    { value: "Tamil", label: "Tamil" },
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
     GET ENGLISH DISPLAY NAMES
  ===================================================== */

  // Manage Songs is an English-only admin list.
  // Never fall back to native-language database fields.
  const getArtist = (song) =>
    song.artist_name_english || "";

  const getAlbum = (song) =>
    song.album_name_english || "";

  const getMinistry = (song) =>
    song.ministry_name_english || "";

  const getCategory = (song) =>
    song.category_name_english || "";

  /* =====================================================
     EMPTY VALUE CHECK
  ===================================================== */

  const isEmptyValue = (value) =>
    value === null ||
    value === undefined ||
    String(value).trim() === "";

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

  /* =====================================================
     LANGUAGE LABEL
  ===================================================== */

  const getLanguageLabel = (value) => {
    return normalizeLanguage(value) || "Unknown";
  };

  /* =====================================================
     LOAD SONGS
  ===================================================== */

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/songs");

      console.log(
        "MANAGE SONGS API RESPONSE:",
        response.data
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.songs || [];

      setSongs(data);

    } catch (error) {
      console.error("LOAD SONGS ERROR:", error);

      setError(
        error.response?.data?.message ||
        "Unable to load songs. Please try again."
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
     ADVANCED FILTER OPTIONS

     ONLY EMPTY + UNKNOWN

     NO INDIVIDUAL NAMES
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
     ADVANCED FILTER MATCHING

     BACKEND FLAGS ARE USED.

     This avoids confusing text values,
     IDs and missing relationships.
  ===================================================== */

  const matchesAdvancedFilter = (song, filter) => {
    if (filter === ALL) {
      return true;
    }

    const [field, type] = filter.split("|");

    const flag = `${field}_is_${type}`;

    if (typeof song[flag] === "boolean") {
      return song[flag];
    }

    // Fallback for older API responses
    const fieldValues = {
      artist: getArtist(song),
      album: getAlbum(song),
      ministry: getMinistry(song),
      category: getCategory(song),
    };

    const value = fieldValues[field];

    if (type === "empty") {
      const id = song[`${field}_id`];

      return (
        id === null ||
        id === undefined ||
        isEmptyValue(value)
      );
    }

    if (type === "unknown") {
      const normalized = normalizeText(value);

      return (
        normalized === "unknown" ||
        normalized === `unknown ${field}`
      );
    }

    return true;
  };

  /* =====================================================
     SEARCH + LANGUAGE + ADVANCED FILTER
  ===================================================== */

  const filteredSongs = useMemo(() => {
    const query = normalizeText(search);

    const result = songs.filter((song) => {

      // LANGUAGE FILTER
      if (
        selectedLanguage !== ALL &&
        normalizeLanguage(song.language) !== selectedLanguage
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

    // ENGLISH ALPHABETICAL ORDER
    return [...result].sort((a, b) => {
      const titleA = String(a.title_english || "");
      const titleB = String(b.title_english || "");

      return titleA.localeCompare(
        titleB,
        "en",
        {
          sensitivity: "base",
          numeric: true,
        }
      );
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
      `Are you sure you want to delete "${song.title_english || "this song"}"?`
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
        `"${song.title_english || "Song"}" deleted successfully.`
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
     DISPLAY VALUE
  ===================================================== */

  const displayValue = (value, fallback) => {
    return isEmptyValue(value) ? fallback : value;
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

      {/* ERROR */}

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="admin-success" role="status">
          {success}
        </div>
      )}

      {/* LANGUAGE SUMMARY */}

      <section
        className="admin-song-language-section"
        aria-label="Song language summary"
      >

        <button
          type="button"
          className={`admin-song-language-card admin-song-total-card ${
            selectedLanguage === ALL ? "active" : ""
          }`}
          onClick={() => setSelectedLanguage(ALL)}
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

      {/* SEARCH + TWO FILTERS */}

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

        {/* FILTER 2: ADVANCED */}

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

        {/* CLEAR */}

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

        {/* COUNT */}

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

      {/* EMPTY STATE */}

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

        /* SONGS TABLE */

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
                              alt={song.title_english || "Song cover"}
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
                            {displayValue(
                              song.title_english,
                              "Untitled Song"
                            )}
                          </strong>

                        </div>

                      </div>
                    </td>

                    {/* ARTIST */}

                    <td>
                      {displayValue(
                        getArtist(song),
                        "Unknown Artist"
                      )}
                    </td>

                    {/* ALBUM */}

                    <td>
                      {displayValue(
                        getAlbum(song),
                        "Unknown Album"
                      )}
                    </td>

                    {/* MINISTRY */}

                    <td>
                      {displayValue(
                        getMinistry(song),
                        "Unknown Ministry"
                      )}
                    </td>

                    {/* CATEGORY */}

                    <td>
                      {displayValue(
                        getCategory(song),
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
