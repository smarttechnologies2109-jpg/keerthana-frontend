import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaChartBar,
  FaMusic,
  FaPlay,
  FaHeart,
  FaSyncAlt,
  FaCalendarAlt,
  FaGlobe,
  FaUserShield,
  FaUpload,
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen,
  FaMicrophone,
  FaTags,
  FaBuilding,
  FaExternalLinkAlt,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessowner/BusinessOwnerStatistics.css";


/* =========================================================
   LANGUAGES
========================================================= */

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Malayalam",
  "Kannada",
  "Tamil",
];


/* =========================================================
   LANGUAGE CLASS
========================================================= */

const getLanguageClass = (language) => {
  return String(language || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
};


/* =========================================================
   BUSINESS OWNER STATISTICS
========================================================= */

const BusinessOwnerStatistics = () => {
  const navigate = useNavigate();


  /* =======================================================
     CURRENT DATE
  ======================================================= */

  const now = new Date();

  const initialMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const initialDate = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;


  /* =======================================================
     STATE
  ======================================================= */

  const [statistics, setStatistics] = useState(null);

  const [selectedMonth, setSelectedMonth] =
    useState(initialMonth);

  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

const [selectedMusicLanguage, setSelectedMusicLanguage] =
  useState("All Languages");

  const dailyStatisticsRef = useRef(null);
const calendarScrollPositionRef = useRef(0);
const statisticsLoadedRef = useRef(false);


  /* =======================================================
     FETCH STATISTICS
  ======================================================= */
const fetchStatistics = useCallback(
  async (isRefresh = false) => {
    try {

      /*
       * Only show the full-page loading screen
       * when statistics have never been loaded.
       */
      if (!statisticsLoadedRef.current) {
        setLoading(true);
      }

      /*
       * For refresh/date changes, keep the page
       * visible and only show refreshing state.
       */
      if (
        isRefresh ||
        statisticsLoadedRef.current
      ) {
        setRefreshing(true);
      }

      setError("");


      const response = await API.get(
        "/owner/statistics",
        {
          params: {
            month: selectedMonth,
            date: selectedDate,
          },
        }
      );


      console.log(
        "Business Owner Statistics:",
        response.data
      );


      setStatistics(
        response.data?.statistics || null
      );


      /*
       * Statistics are now loaded.
       */
      statisticsLoadedRef.current = true;

    } catch (err) {

      console.error(
        "Business owner statistics error:",
        err
      );


      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load statistics.";


      setError(message);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  },
  [
    selectedMonth,
    selectedDate,
  ]
);


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

useLayoutEffect(() => {

  if (!selectedDate) {
    return;
  }

  const savedScrollPosition =
    calendarScrollPositionRef.current;


  if (
    savedScrollPosition <= 0
  ) {
    return;
  }


  /*
   * Restore after React has finished
   * updating the DOM.
   */
  requestAnimationFrame(() => {

    window.scrollTo({
      top: savedScrollPosition,
      left: 0,
      behavior: "auto",
    });


    /*
     * Second frame handles cases where
     * the API/data update changes the layout.
     */
    requestAnimationFrame(() => {

      window.scrollTo({
        top: savedScrollPosition,
        left: 0,
        behavior: "auto",
      });

    });

  });

}, [selectedDate]);
  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {
    fetchStatistics(true);
  };


  /* =======================================================
     FORMAT NUMBER
  ======================================================= */

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };


  /* =======================================================
     OWNER MUSIC NAVIGATION
  ======================================================= */

  const navigateTo = (
    path,
    language = ""
  ) => {
    if (language) {
      navigate(
        `${path}?language=${encodeURIComponent(
          language
        )}`
      );
    } else {
      navigate(path);
    }
  };


  /* =======================================================
     OVERVIEW
  ======================================================= */

  const overview = {
    totalUsers: Number(
      statistics?.users?.total || 0
    ),

    totalSongs: Number(
      statistics?.music?.totalSongs || 0
    ),

    totalAlbums: Number(
      statistics?.music?.totalAlbums || 0
    ),

    totalArtists: Number(
      statistics?.music?.totalArtists || 0
    ),

    totalCategories: Number(
      statistics?.music?.totalCategories || 0
    ),

    totalMinistries: Number(
      statistics?.music?.totalMinistries || 0
    ),

    totalPlays: Number(
      statistics?.listening?.totalPlays || 0
    ),

    totalLikes: Number(
      statistics?.likes?.totalLikes || 0
    ),
  };

/* =======================================================
   MUSIC COLLECTION LANGUAGE DATA
======================================================= */

const musicByLanguage =
  statistics?.musicByLanguage || [];

const getMusicLanguageData = (
  language
) => {
  if (language === "All Languages") {
    return {
      songs: overview.totalSongs,
      albums: overview.totalAlbums,
      artists: overview.totalArtists,
      categories: overview.totalCategories,
      ministries: overview.totalMinistries,
    };
  }

  const item =
    musicByLanguage.find(
      (entry) =>
        String(
          entry.language || ""
        ).toLowerCase() ===
        String(language).toLowerCase()
    ) || {};

  return {
    songs: Number(
      item.songs || 0
    ),

    albums: Number(
      item.albums || 0
    ),

    artists: Number(
      item.artists || 0
    ),

    categories: Number(
      item.categories || 0
    ),

    ministries: Number(
      item.ministries || 0
    ),
  };
};

const selectedMusicLanguageData =
  getMusicLanguageData(
    selectedMusicLanguage
  );
  /* =======================================================
     LANGUAGE STATISTICS
  ======================================================= */

  const languageStats =
    statistics?.languages || [];


  /* =======================================================
     TODAY
  ======================================================= */

  const today = {
    total: Number(
      statistics?.today?.total || 0
    ),

    Telugu: Number(
      statistics?.today?.Telugu || 0
    ),

    Hindi: Number(
      statistics?.today?.Hindi || 0
    ),

    English: Number(
      statistics?.today?.English || 0
    ),

    Malayalam: Number(
      statistics?.today?.Malayalam || 0
    ),

    Kannada: Number(
      statistics?.today?.Kannada || 0
    ),

    Tamil: Number(
      statistics?.today?.Tamil || 0
    ),
  };


  /* =======================================================
     ADMIN CONTRIBUTIONS
  ======================================================= */

  const admins =
    statistics?.adminContributions || [];


  /* =======================================================
     SELECTED DATE
  ======================================================= */

  const selectedDateStats = {
    total: Number(
      statistics?.selectedDate?.total || 0
    ),

    languages:
      statistics?.selectedDate?.languages ||
      {},

    admins:
      statistics?.selectedDate?.admins ||
      [],
  };


  /* =======================================================
     CALENDAR DATA
  ======================================================= */

  const calendarDays =
    statistics?.calendar?.days || [];


  const calendarMap = useMemo(() => {
    const map = {};

    calendarDays.forEach((day) => {
      const key = String(
        day.date
      ).slice(0, 10);

      map[key] = day;
    });

    return map;
  }, [calendarDays]);


  /* =======================================================
     CALENDAR CELLS
  ======================================================= */

  const calendarCells = useMemo(() => {
    const [year, month] =
      selectedMonth
        .split("-")
        .map(Number);

    if (!year || !month) {
      return [];
    }

    const firstDay = new Date(
      year,
      month - 1,
      1
    );

    const lastDay = new Date(
      year,
      month,
      0
    );

    const startingWeekday =
      firstDay.getDay();

    const totalDays =
      lastDay.getDate();

    const cells = [];


    /* Empty cells */

    for (
      let i = 0;
      i < startingWeekday;
      i++
    ) {
      cells.push(null);
    }


    /* Actual days */

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      const dateKey =
        `${year}-${String(month).padStart(
          2,
          "0"
        )}-${String(day).padStart(
          2,
          "0"
        )}`;

      cells.push({
        day,
        dateKey,
        data:
          calendarMap[dateKey] ||
          null,
      });
    }

    return cells;
  }, [
    selectedMonth,
    calendarMap,
  ]);


  /* =======================================================
     MONTH LABEL
  ======================================================= */

  const monthLabel = useMemo(() => {
    const [year, month] =
      selectedMonth
        .split("-")
        .map(Number);

    if (!year || !month) {
      return selectedMonth;
    }

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );
  }, [selectedMonth]);


  /* =======================================================
     CHANGE MONTH
  ======================================================= */
const changeMonth = (amount) => {

  /*
   * Save current scroll position BEFORE
   * changing the month/date.
   */
  calendarScrollPositionRef.current =
    window.scrollY;


  const [year, month] =
    selectedMonth
      .split("-")
      .map(Number);


  const date = new Date(
    year,
    month - 1 + amount,
    1
  );


  const nextMonth =
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;


  const nextDate =
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-01`;


  setSelectedMonth(
    nextMonth
  );

  setSelectedDate(
    nextDate
  );

};


  /* =======================================================
     SELECT CALENDAR DATE
  ======================================================= */

const handleCalendarDate = (
  event,
  dateKey
) => {

  event.preventDefault();
  event.stopPropagation();


  /*
   * Save the current scroll position
   * BEFORE changing selectedDate.
   */
  calendarScrollPositionRef.current =
    window.scrollY;


  setSelectedDate(dateKey);

};

  /* =======================================================
     LANGUAGE TOTAL
  ======================================================= */

  const totalLanguageSongs =
    languageStats.reduce(
      (total, item) =>
        total +
        Number(
          item.count ||
          item.songs ||
          item.totalSongs ||
          0
        ),
      0
    );


  /* =======================================================
     GET LANGUAGE DATA
  ======================================================= */

  const getLanguageData = (
    language
  ) => {
    const item =
      languageStats.find(
        (entry) =>
          String(
            entry.language || ""
          ).toLowerCase() ===
          language.toLowerCase()
      ) || {};

    return {
      songs: Number(
        item.count ||
        item.songs ||
        item.totalSongs ||
        0
      ),

      albums: Number(
        item.albums ||
        item.totalAlbums ||
        0
      ),

      artists: Number(
        item.artists ||
        item.totalArtists ||
        0
      ),

      percentage: Number(
        item.percentage || 0
      ),
    };
  };


  /* =======================================================
     SELECTED DATE LABEL
  ======================================================= */

  const selectedDateLabel =
    selectedDate
      ? new Date(
          `${selectedDate}T00:00:00`
        ).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        )
      : "Selected Date";


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="owner-statistics-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="owner-statistics-header">

        <div className="statistics-header-left">

          <div className="statistics-title-icon">
            <FaChartBar />
          </div>

          <div className="statistics-title-content">

            <h1>
              Statistics
            </h1>

            <p>
              Complete Keerthana platform analytics
            </p>

          </div>

        </div>


        <div className="statistics-header-actions">

          <button
            type="button"
            className="statistics-refresh-btn"
            onClick={handleRefresh}
            disabled={
              loading ||
              refreshing
            }
          >

            <FaSyncAlt
              className={
                refreshing
                  ? "statistics-refresh-icon spinning"
                  : "statistics-refresh-icon"
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>

          </button>


          <button
            type="button"
            className="statistics-dashboard-btn"
            onClick={() =>
              navigate(
                "/owner/dashboard"
              )
            }
          >

            <FaArrowLeft />

            <span>
              Dashboard
            </span>

          </button>

        </div>

      </header>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="owner-statistics-main">


        {/* =================================================
            ERROR
        ================================================= */}

        {error &&
          !loading && (

            <div className="statistics-error">

              <div className="statistics-error-icon">
                !
              </div>

              <div className="statistics-error-content">

                <strong>
                  Unable to load statistics
                </strong>

                <p>
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  fetchStatistics()
                }
              >
                Try Again
              </button>

            </div>

          )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="statistics-loading">

            <div className="statistics-spinner"></div>

            <p>
              Loading statistics...
            </p>

          </div>

        ) : (

          <>


            {/* =============================================
                OVERVIEW
            ============================================= */}

            <section className="statistics-grid">

              <StatCard
                icon={<FaMusic />}
                title="Total Songs"
                value={
                  overview.totalSongs
                }
                type="music"
                description="Songs available"
              />

              <StatCard
                icon={<FaPlay />}
                title="Total Plays"
                value={
                  overview.totalPlays
                }
                type="plays"
                description="Recorded music plays"
              />

              <StatCard
                icon={<FaHeart />}
                title="Total Likes"
                value={
                  overview.totalLikes
                }
                type="likes"
                description="User song likes"
              />

            </section>
          {/* =============================================
    MUSIC COLLECTION
============================================= */}

<section className="analytics-section">

  <div className="music-collection-header">

    <SectionHeader
      icon={<FaMusic />}
      title="Music Collection"
      description="Current content available on the platform"
    />

    {/* LANGUAGE SELECTOR */}

    <div className="music-language-selector">

      <FaGlobe />

      <select
        value={selectedMusicLanguage}
        onChange={(event) =>
          setSelectedMusicLanguage(
            event.target.value
          )
        }
      >

        <option value="All Languages">
          All Languages
        </option>

        {LANGUAGES.map(
          (language) => (
            <option
              value={language}
              key={language}
            >
              {language}
            </option>
          )
        )}

      </select>

    </div>

  </div>


  {/* SELECTED LANGUAGE */}

  <div className="music-collection-language-label">

    <FaGlobe />

    <span>
      Showing:
    </span>

    <strong>
      {selectedMusicLanguage}
    </strong>

  </div>


  <div className="collection-grid">


    {/* SONGS */}

    <button
      type="button"
      className="collection-item collection-link"
      onClick={() =>
        navigateTo(
          "/owner/music/songs",
          selectedMusicLanguage ===
            "All Languages"
            ? ""
            : selectedMusicLanguage
        )
      }
    >

      <div className="collection-item-left">

        <FaMusic />

        <span>
          Songs
        </span>

      </div>

      <strong>
        {formatNumber(
          selectedMusicLanguageData.songs
        )}
      </strong>

      <small>

        View Songs

        <FaExternalLinkAlt />

      </small>

    </button>


    {/* ALBUMS */}

    <button
      type="button"
      className="collection-item collection-link"
      onClick={() =>
        navigateTo(
          "/owner/music/albums",
          selectedMusicLanguage ===
            "All Languages"
            ? ""
            : selectedMusicLanguage
        )
      }
    >

      <div className="collection-item-left">

        <FaFolderOpen />

        <span>
          Albums
        </span>

      </div>

      <strong>
        {formatNumber(
          selectedMusicLanguageData.albums
        )}
      </strong>

      <small>

        View Albums

        <FaExternalLinkAlt />

      </small>

    </button>


    {/* ARTISTS */}

    <button
      type="button"
      className="collection-item collection-link"
      onClick={() =>
        navigateTo(
          "/owner/music/artists",
          selectedMusicLanguage ===
            "All Languages"
            ? ""
            : selectedMusicLanguage
        )
      }
    >

      <div className="collection-item-left">

        <FaMicrophone />

        <span>
          Artists
        </span>

      </div>

      <strong>
        {formatNumber(
          selectedMusicLanguageData.artists
        )}
      </strong>

      <small>

        View Artists

        <FaExternalLinkAlt />

      </small>

    </button>


    {/* CATEGORIES */}

    <button
      type="button"
      className="collection-item collection-link"
      onClick={() =>
        navigateTo(
          "/owner/music/categories",
          selectedMusicLanguage ===
            "All Languages"
            ? ""
            : selectedMusicLanguage
        )
      }
    >

      <div className="collection-item-left">

        <FaTags />

        <span>
          Categories
        </span>

      </div>

      <strong>
        {formatNumber(
          selectedMusicLanguageData.categories
        )}
      </strong>

      <small>

        View Categories

        <FaExternalLinkAlt />

      </small>

    </button>


    {/* MINISTRIES */}

    <button
      type="button"
      className="collection-item collection-link"
      onClick={() =>
        navigateTo(
          "/owner/music/ministries",
          selectedMusicLanguage ===
            "All Languages"
            ? ""
            : selectedMusicLanguage
        )
      }
    >

      <div className="collection-item-left">

        <FaBuilding />

        <span>
          Ministries
        </span>

      </div>

      <strong>
        {formatNumber(
          selectedMusicLanguageData.ministries
        )}
      </strong>

      <small>

        View Ministries

        <FaExternalLinkAlt />

      </small>

    </button>

  </div>

</section>


            {/* =============================================
                LANGUAGE ANALYTICS
            ============================================= */}

            <section className="analytics-section">

              <SectionHeader
                icon={<FaGlobe />}
                title="Music by Language"
                description="Songs, albums and artists available in each language"
              />


              <div className="language-grid">

                {LANGUAGES.map(
                  (language) => {

                    const languageData =
                      getLanguageData(
                        language
                      );

                    return (

                      <div
                        className={`language-card language-${getLanguageClass(
                          language
                        )}`}
                        key={language}
                      >


                        {/* LANGUAGE HEADER */}

                        <div className="language-card-top">

                          <span className="language-name">
                            {language}
                          </span>

                          <span className="language-percentage">
                            {
                              languageData.percentage
                            }%
                          </span>

                        </div>


                        {/* MAIN SONG COUNT */}

                        <button
                          type="button"
                          className="language-main-count"
                          onClick={() =>
                            navigateTo(
                              "/owner/music/songs",
                              language
                            )
                          }
                          title={`View ${language} songs`}
                        >

                          <div>

                            <strong>
                              {formatNumber(
                                languageData.songs
                              )}
                            </strong>

                            <span>
                              Songs
                            </span>

                          </div>

                          <FaExternalLinkAlt />

                        </button>


                        {/* LANGUAGE DETAILS */}

                        <div className="language-content-stats">


                          {/* SONGS */}

                          <button
                            type="button"
                            className="language-detail-item"
                            onClick={() =>
                              navigateTo(
                                "/owner/music/songs",
                                language
                              )
                            }
                          >

                            <span>
                              Songs
                            </span>

                            <strong>
                              {formatNumber(
                                languageData.songs
                              )}
                            </strong>

                          </button>


                          {/* ALBUMS */}

                          <button
                            type="button"
                            className="language-detail-item"
                            onClick={() =>
                              navigateTo(
                                "/owner/music/albums",
                                language
                              )
                            }
                          >

                            <span>
                              Albums
                            </span>

                            <strong>
                              {formatNumber(
                                languageData.albums
                              )}
                            </strong>

                          </button>


                          {/* ARTISTS */}

                          <button
                            type="button"
                            className="language-detail-item"
                            onClick={() =>
                              navigateTo(
                                "/owner/music/artists",
                                language
                              )
                            }
                          >

                            <span>
                              Artists
                            </span>

                            <strong>
                              {formatNumber(
                                languageData.artists
                              )}
                            </strong>

                          </button>

                        </div>


                        {/* PROGRESS */}

                        <div className="language-progress">

                          <span
                            style={{
                              width: `${Math.min(
                                languageData.percentage,
                                100
                              )}%`,
                            }}
                          />

                        </div>


                        {/* VIEW SONGS */}

                        <button
                          type="button"
                          className="language-view-btn"
                          onClick={() =>
                            navigateTo(
                              "/owner/music/songs",
                              language
                            )
                          }
                        >

                          View {language} Songs

                          <FaExternalLinkAlt />

                        </button>

                      </div>

                    );
                  }
                )}

              </div>


              {/* TOTAL */}

              <div className="language-total">

                <span>
                  Total language-tagged songs
                </span>

                <strong>
                  {formatNumber(
                    totalLanguageSongs
                  )}
                </strong>

              </div>

            </section>


            {/* =============================================
                TODAY'S UPLOADS
            ============================================= */}

            <section className="analytics-section today-section">

              <SectionHeader
                icon={<FaUpload />}
                title="Today's Uploads"
                description="Songs added today"
              />


              <div className="today-main">

                <div className="today-total">

                  <span>
                    Songs Added Today
                  </span>

                  <strong>
                    {formatNumber(
                      today.total
                    )}
                  </strong>

                </div>


                <div className="today-language-grid">

                  {LANGUAGES.map(
                    (language) => (

                      <div
                        className="today-language"
                        key={language}
                      >

                        <span>
                          {language}
                        </span>

                        <strong>
                          {formatNumber(
                            today[language]
                          )}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              </div>

            </section>


            {/* =============================================
                DAILY SONG UPLOADS
            ============================================= */}

            <section className="date-analytics-section">


              <div className="date-analytics-header">

                <div className="analytics-section-header">

                  <div className="analytics-section-icon">
                    <FaCalendarAlt />
                  </div>

                  <div>

                    <h2>
                      Daily Song Uploads
                    </h2>

                    <p>
                      Select a date to view complete upload details
                    </p>

                  </div>

                </div>

              </div>


              <div className="date-analytics-body">


                {/* =========================================
                    SMALL CALENDAR
                ========================================= */}

                <div className="compact-calendar-card">

                  <div className="compact-calendar-toolbar">

                    <button
                      type="button"
                      onClick={() =>
                        changeMonth(-1)
                      }
                      title="Previous month"
                    >
                      <FaChevronLeft />
                    </button>


                    <strong>
                      {monthLabel}
                    </strong>


                    <button
                      type="button"
                      onClick={() =>
                        changeMonth(1)
                      }
                      title="Next month"
                    >
                      <FaChevronRight />
                    </button>

                  </div>


                  <input
                    type="month"
                    className="compact-month-input"
                    value={
                      selectedMonth
                    }
                onChange={(event) => {

  const value =
    event.target.value;


  /*
   * Save scroll position before
   * changing the month.
   */
  calendarScrollPositionRef.current =
    window.scrollY;


  setSelectedMonth(
    value
  );


  if (value) {

    setSelectedDate(
      `${value}-01`
    );

  }

}}
                  />


                  <div className="compact-calendar">

                    {[
                      "S",
                      "M",
                      "T",
                      "W",
                      "T",
                      "F",
                      "S",
                    ].map(
                      (
                        day,
                        index
                      ) => (

                        <div
                          className="compact-calendar-weekday"
                          key={`${day}-${index}`}
                        >
                          {day}
                        </div>

                      )
                    )}


                    {calendarCells.map(
                      (
                        cell,
                        index
                      ) => {

                        if (!cell) {

                          return (
                            <div
                              className="compact-calendar-empty"
                              key={`empty-${index}`}
                            />
                          );

                        }


                        const count =
                          Number(
                            cell.data
                              ?.total || 0
                          );


                        const isSelected =
                          selectedDate ===
                          cell.dateKey;


                        return (

                          <button
                            type="button"
                            key={
                              cell.dateKey
                            }
                            className={`
                              compact-calendar-day
                              ${
                                count > 0
                                  ? "has-uploads"
                                  : ""
                              }
                              ${
                                isSelected
                                  ? "selected"
                                  : ""
                              }
                            `}
                           onClick={(event) =>
  handleCalendarDate(
    event,
    cell.dateKey
  )
}
                            title={`${cell.dateKey} - ${count} songs`}
                          >

                            <span>
                              {cell.day}
                            </span>

                            {count > 0 && (

                              <small>
                                {count}
                              </small>

                            )}

                          </button>

                        );

                      }
                    )}

                  </div>


                  <div className="compact-calendar-help">

                    <span className="calendar-help-item">

                      <i className="calendar-help-dot uploads"></i>

                      Uploads

                    </span>


                    <span className="calendar-help-item">

                      <i className="calendar-help-dot selected"></i>

                      Selected

                    </span>

                  </div>

                </div>


                {/* =========================================
                    SELECTED DATE DETAILS
                ========================================= */}

                <div className="daily-statistics-card">

                  <div className="daily-statistics-header">

                    <div>

                      <span className="daily-statistics-label">
                        SELECTED DATE
                      </span>

                      <h3>
                        {selectedDateLabel}
                      </h3>

                    </div>


                    <div className="daily-total-badge">

                      <span>
                        Total Songs
                      </span>

                      <strong>
                        {formatNumber(
                          selectedDateStats.total
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* LANGUAGE BREAKDOWN */}

                  <div className="daily-subtitle">

                    <FaGlobe />

                    Songs by Language

                  </div>


                  <div className="daily-language-grid">

                    {LANGUAGES.map(
                      (language) => {

                        const count =
                          Number(
                            selectedDateStats
                              .languages?.[
                              language
                            ] || 0
                          );

                        return (

                          <div
                            className={`
                              daily-language-card
                              daily-language-${getLanguageClass(
                                language
                              )}
                            `}
                            key={
                              language
                            }
                          >

                            <span>
                              {language}
                            </span>

                            <strong>
                              {formatNumber(
                                count
                              )}
                            </strong>

                            <small>
                              {count ===
                              1
                                ? "song"
                                : "songs"}
                            </small>

                          </div>

                        );

                      }
                    )}

                  </div>


                  {/* ADMIN BREAKDOWN */}

                  <div className="daily-subtitle admin-subtitle">

                    <FaUserShield />

                    Admin Uploads

                  </div>


                  {selectedDateStats
                    .admins.length ===
                  0 ? (

                    <div className="daily-empty">

                      <FaUpload />

                      <div>

                        <strong>
                          No songs were added on this date
                        </strong>

                        <span>
                          Select another date from the calendar.
                        </span>

                      </div>

                    </div>

                  ) : (

                    <div className="daily-admin-list">

                      {selectedDateStats.admins.map(
                        (admin) => (

                          <div
                            className="daily-admin-card"
                            key={
                              admin.adminId
                            }
                          >

                            <div className="daily-admin-info">

                              <div className="daily-admin-avatar">
                                <FaUserShield />
                              </div>

                              <div>

                                <strong>
                                  {admin.adminName ||
                                    "Admin"}
                                </strong>

                                <span>
                                  {admin.adminEmail ||
                                    ""}
                                </span>

                              </div>

                            </div>


                            <div className="daily-admin-total">

                              <span>
                                Total
                              </span>

                              <strong>
                                {formatNumber(
                                  admin.totalSongs
                                )}
                              </strong>

                            </div>


                            <div className="daily-admin-languages">

                              {LANGUAGES.map(
                                (
                                  language
                                ) => {

                                  const count =
                                    Number(
                                      admin
                                        .languages?.[
                                        language
                                      ] || 0
                                    );

                                  return (

                                    <div
                                      key={
                                        language
                                      }
                                      className="daily-admin-language"
                                    >

                                      <span>
                                        {language}
                                      </span>

                                      <strong>
                                        {formatNumber(
                                          count
                                        )}
                                      </strong>

                                    </div>

                                  );

                                }
                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

            </section>


            {/* =============================================
                ADMIN CONTRIBUTIONS
            ============================================= */}

            <section className="analytics-section">

              <SectionHeader
                icon={<FaUserShield />}
                title="Admin Contributions"
                description="How many songs each admin has added"
              />


              {admins.length ===
              0 ? (

                <div className="empty-statistics">

                  <FaUserShield />

                  <h3>
                    No admin uploads found
                  </h3>

                  <p>
                    New songs will appear here after an admin uploads them.
                  </p>

                </div>

              ) : (

                <div className="admin-table-wrapper">

                  <table className="admin-statistics-table">

                    <thead>

                      <tr>

                        <th>
                          Admin
                        </th>

                        <th>
                          Total
                        </th>

                        {LANGUAGES.map(
                          (language) => (

                            <th
                              key={
                                language
                              }
                            >
                              {language}
                            </th>

                          )
                        )}

                      </tr>

                    </thead>


                    <tbody>

                      {admins.map(
                        (admin) => (

                          <tr
                            key={
                              admin.adminId
                            }
                          >

                            <td>

                              <div className="admin-name-cell">

                                <div className="admin-avatar">
                                  <FaUserShield />
                                </div>

                                <div>

                                  <strong>
                                    {admin.adminName ||
                                      "Admin"}
                                  </strong>

                                  <span>
                                    {admin.adminEmail ||
                                      ""}
                                  </span>

                                </div>

                              </div>

                            </td>


                            <td>

                              <strong className="admin-total">
                                {formatNumber(
                                  admin.totalSongs
                                )}
                              </strong>

                            </td>


                            {LANGUAGES.map(
                              (language) => (

                                <td
                                  key={
                                    language
                                  }
                                >

                                  {formatNumber(
                                    admin.languages?.[
                                      language
                                    ] || 0
                                  )}

                                </td>

                              )
                            )}

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>


            {/* =============================================
                SELECTED DATE ADMIN UPLOADS
            ============================================= */}

            <section className="analytics-section">

              <SectionHeader
                icon={<FaUserShield />}
                title="Selected Date — Admin Uploads"
                description={`Who added songs on ${selectedDate}`}
              />


              {selectedDateStats.admins.length ===
              0 ? (

                <div className="empty-statistics">

                  <FaCalendarAlt />

                  <h3>
                    No admin uploads on this date
                  </h3>

                  <p>
                    Select another date from the calendar.
                  </p>

                </div>

              ) : (

                <div className="selected-admin-grid">

                  {selectedDateStats.admins.map(
                    (admin) => (

                      <div
                        className="selected-admin-card"
                        key={
                          admin.adminId
                        }
                      >

                        <div className="selected-admin-header">

                          <div className="admin-avatar">
                            <FaUserShield />
                          </div>

                          <div>

                            <strong>
                              {admin.adminName ||
                                "Admin"}
                            </strong>

                            <span>
                              {admin.adminEmail ||
                                ""}
                            </span>

                          </div>

                        </div>


                        <div className="selected-admin-total">

                          <span>
                            Songs Added
                          </span>

                          <strong>
                            {formatNumber(
                              admin.totalSongs
                            )}
                          </strong>

                        </div>


                        <div className="selected-admin-languages">

                          {LANGUAGES.map(
                            (language) => (

                              <div
                                key={
                                  language
                                }
                              >

                                <span>
                                  {language}
                                </span>

                                <strong>
                                  {formatNumber(
                                    admin.languages?.[
                                      language
                                    ] || 0
                                  )}
                                </strong>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>


            {/* =============================================
                OLD / UNASSIGNED SONGS
            ============================================= */}

            {Number(
              statistics
                ?.unassignedSongs
                ?.total || 0
            ) > 0 && (

              <section className="old-upload-notice">

                <div className="old-upload-icon">
                  <FaMusic />
                </div>

                <div>

                  <strong>
                    {formatNumber(
                      statistics
                        .unassignedSongs
                        .total
                    )}{" "}
                    older songs have no admin assigned
                  </strong>

                  <p>
                    These songs were created before
                    admin upload tracking was enabled.
                    New uploads will automatically record
                    the admin who added them.
                  </p>

                </div>

              </section>

            )}

          </>

        )}

      </main>

    </div>
  );
};


/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon,
  title,
  value,
  type,
  description,
}) => {

  return (

    <div
      className={`statistics-card statistics-card-${type}`}
    >

      <div className="statistics-card-icon">
        {icon}
      </div>

      <div className="statistics-card-content">

        <p>
          {title}
        </p>

        <h2>
          {Number(
            value || 0
          ).toLocaleString()}
        </h2>

        <span>
          {description}
        </span>

      </div>

    </div>

  );
};


/* =========================================================
   SECTION HEADER
========================================================= */

const SectionHeader = ({
  icon,
  title,
  description,
}) => {

  return (

    <div className="analytics-section-header">

      <div className="analytics-section-icon">
        {icon}
      </div>

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>

  );
};


export default BusinessOwnerStatistics;