
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaFlag,
  FaMusic,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaUser,
  FaTimesCircle,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/admin/adminSongReports.css";


import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

function AdminSongReports() {

  const [reports, setReports] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [updatingReportId, setUpdatingReportId] =
    useState(null);

  const [deletingReportId, setDeletingReportId] =
    useState(null);


  /* =====================================================
     LOAD REPORTS
  ===================================================== */

  const loadReports = useCallback(
    async (isRefresh = false) => {

      try {

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await API.get(
            "/admin/songs/reports"
          );

        if (
          response.data?.success
        ) {

          setReports(
            Array.isArray(
              response.data.reports
            )
              ? response.data.reports
              : []
          );

        } else {

          setError(
            response.data?.message ||
              "Unable to load song reports."
          );

        }

      } catch (err) {

        console.error(
          "Load song reports error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data?.message ||
            "Unable to load song reports. Please try again."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadReports();

  }, [loadReports]);


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "—";
    }

    try {

      return new Date(
        date
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    } catch {
      return "—";
    }

  };


  /* =====================================================
     FILTER REPORTS
  ===================================================== */

  const filteredReports =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {

          const matchesStatus =
            statusFilter === "all" ||
            String(
              report.status || ""
            ).toLowerCase() ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!searchText) {
            return true;
          }

          const searchableText =
            [
              report.song_title,
              report.report_type,
              report.message,
              report.user_name,
              report.user_email,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            searchText
          );

        }
      );

    }, [
      reports,
      search,
      statusFilter,
    ]);


  /* =====================================================
     COUNTS
  ===================================================== */

  const pendingCount =
    reports.filter(
      (report) =>
        String(
          report.status || ""
        ).toLowerCase() ===
        "pending"
    ).length;


  const resolvedCount =
    reports.filter(
      (report) =>
        String(
          report.status || ""
        ).toLowerCase() ===
        "resolved"
    ).length;


  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (
    status
  ) => {

    const value =
      String(
        status || "pending"
      ).toLowerCase();

    if (
      value === "resolved"
    ) {
      return "resolved";
    }

    if (
      value === "rejected"
    ) {
      return "rejected";
    }

    return "pending";

  };


  /* =====================================================
     STATUS LABEL
  ===================================================== */

  const getStatusLabel = (
    status
  ) => {

    const value =
      String(
        status || "pending"
      ).toLowerCase();

    if (
      value === "resolved"
    ) {
      return "Resolved";
    }

    if (
      value === "rejected"
    ) {
      return "Rejected";
    }

    return "Pending";

  };


  /* =====================================================
     UPDATE REPORT STATUS
  ===================================================== */

  const handleStatusChange = async (
    reportId,
    newStatus
  ) => {

    if (!reportId || !newStatus) {
      return;
    }

    try {

      setUpdatingReportId(
        reportId
      );

      const response =
        await API.put(
          `/admin/songs/reports/${reportId}`,
          {
            status: newStatus,
          }
        );

      if (
        response.data?.success
      ) {

        const updatedReport =
          response.data.report;

        setReports(
          (currentReports) =>
            currentReports.map(
              (report) =>
                report.id === reportId
                  ? {
                      ...report,
                      status:
                        updatedReport?.status ||
                        newStatus,
                    }
                  : report
            )
        );

      } else {

        alert(
          response.data?.message ||
            "Unable to update report status."
        );

      }

    } catch (err) {

      console.error(
        "Update report status error:",
        err.response?.data ||
          err.message
      );

      alert(
        err.response?.data?.message ||
          "Unable to update report status. Please try again."
      );

    } finally {

      setUpdatingReportId(null);

    }

  };


  /* =====================================================
     DELETE REPORT
  ===================================================== */

  const handleDeleteReport = async (
    reportId
  ) => {

    if (!reportId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this song report?\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingReportId(
        reportId
      );

      const response =
        await API.delete(
          `/admin/songs/reports/${reportId}`
        );

      if (
        response.data?.success
      ) {

        setReports(
          (currentReports) =>
            currentReports.filter(
              (report) =>
                report.id !== reportId
            )
        );

      } else {

        alert(
          response.data?.message ||
            "Unable to delete report."
        );

      }

    } catch (err) {

      console.error(
        "Delete report error:",
        err.response?.data ||
          err.message
      );

      alert(
        err.response?.data?.message ||
          "Unable to delete report. Please try again."
      );

    } finally {

      setDeletingReportId(null);

    }

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="admin-song-reports-page">

          <AdminSidebar />
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="admin-song-reports-header">

         {/* <AdminHeader /> */}

        <div>

          <div className="admin-song-reports-eyebrow">

            <FaFlag />

            SONG REPORTS

          </div>


          <h1>
            Song Reports
          </h1>


          <p>
            Review corrections and issues
            submitted by KEERTHANA users.
          </p>

        </div>


        <button
          type="button"
          className="admin-song-reports-refresh"
          onClick={() =>
            loadReports(true)
          }
          disabled={refreshing}
        >

          <FaSyncAlt
            className={
              refreshing
                ? "is-spinning"
                : ""
            }
          />

          <span>
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </span>

        </button>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="admin-song-reports-summary">


        {/* TOTAL */}

        <div className="admin-report-summary-card">

          <div className="admin-report-summary-icon total">

            <FaFlag />

          </div>

          <div>

            <span>
              Total Reports
            </span>

            <strong>
              {reports.length}
            </strong>

          </div>

        </div>


        {/* PENDING */}

        <div className="admin-report-summary-card">

          <div className="admin-report-summary-icon pending">

            <FaClock />

          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>

        </div>


        {/* RESOLVED */}

        <div className="admin-report-summary-card">

          <div className="admin-report-summary-icon resolved">

            <FaCheckCircle />

          </div>

          <div>

            <span>
              Resolved
            </span>

            <strong>
              {resolvedCount}
            </strong>

          </div>

        </div>


      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="admin-song-reports-toolbar">


        {/* SEARCH */}

        <div className="admin-song-reports-search">

          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search song, user, report..."
          />

        </div>


        {/* STATUS */}

        <select
          className="admin-song-reports-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All Status
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="resolved">
            Resolved
          </option>

          <option value="rejected">
            Rejected
          </option>

        </select>


      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="admin-song-reports-error">

          <FaExclamationCircle />

          <div>

            <strong>
              Unable to load reports
            </strong>

            <span>
              {error}
            </span>

          </div>


          <button
            type="button"
            onClick={() =>
              loadReports()
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

        <div className="admin-song-reports-loading">

          <div className="admin-report-spinner" />

          <span>
            Loading song reports...
          </span>

        </div>

      ) : filteredReports.length === 0 ? (

        /* =================================================
           EMPTY
        ================================================= */

        <div className="admin-song-reports-empty">

          <div className="admin-report-empty-icon">

            <FaFlag />

          </div>


          <h2>
            No Reports Found
          </h2>


          <p>

            {reports.length === 0
              ? "There are no song reports yet."
              : "No reports match your current search or filter."}

          </p>

        </div>

      ) : (

        /* =================================================
           REPORT LIST
        ================================================= */

        <div className="admin-song-reports-list">

          {filteredReports.map(
            (report) => {

              const statusClass =
                getStatusClass(
                  report.status
                );

              const isUpdating =
                updatingReportId ===
                report.id;

              const isDeleting =
                deletingReportId ===
                report.id;


              return (

                <article
                  key={report.id}
                  className="admin-song-report-card"
                >


                  {/* CARD HEADER */}

                  <div className="admin-song-report-card-header">


                    <div className="admin-song-report-song">


                      <div className="admin-song-report-song-icon">

                        <FaMusic />

                      </div>


                      <div>

                        <h2>

                          {report.song_title ||
                            "Unknown Song"}

                        </h2>


                        <span>

                          Report #
                          {report.id}

                        </span>

                      </div>


                    </div>


                    <div
                      className={`admin-song-report-status ${statusClass}`}
                    >

                      {statusClass ===
                      "resolved" ? (
                        <FaCheckCircle />
                      ) : statusClass ===
                        "rejected" ? (
                        <FaTimesCircle />
                      ) : (
                        <FaClock />
                      )}

                      <span>
                        {getStatusLabel(
                          report.status
                        )}
                      </span>

                    </div>


                  </div>


                  {/* REPORT TYPE */}

                  <div className="admin-song-report-type">

                    <span>
                      Report Type
                    </span>

                    <strong>
                      {report.report_type ||
                        "Other"}
                    </strong>

                  </div>


                  {/* MESSAGE */}

                  <div className="admin-song-report-message">

                    <span>
                      Message
                    </span>

                    <p>
                      {report.message ||
                        "No message provided."}
                    </p>

                  </div>


                  {/* FOOTER */}

                  <div className="admin-song-report-footer">


                    <div className="admin-song-report-user">

                      <FaUser />

                      <div>

                        <strong>

                          {report.user_name ||
                            "Unknown User"}

                        </strong>

                        <span>

                          {report.user_email ||
                            "No email available"}

                        </span>

                      </div>

                    </div>


                    <time>

                      {formatDate(
                        report.created_at
                      )}

                    </time>


                  </div>


                  {/* =================================================
                      ADMIN ACTIONS
                  ================================================= */}

                  <div className="admin-song-report-actions">


                    {/* STATUS */}

                    <div className="admin-song-report-status-control">

                      <label htmlFor={`status-${report.id}`}>
                        Status
                      </label>

                      <select
                        id={`status-${report.id}`}
                        value={
                          String(
                            report.status ||
                              "pending"
                          ).toLowerCase()
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            report.id,
                            event.target.value
                          )
                        }
                        disabled={
                          isUpdating ||
                          isDeleting
                        }
                      >

                        <option value="pending">
                          Pending
                        </option>

                        <option value="resolved">
                          Resolved
                        </option>

                        <option value="rejected">
                          Rejected
                        </option>

                      </select>

                    </div>


                    {/* DELETE */}

                    <button
                      type="button"
                      className="admin-song-report-delete"
                      onClick={() =>
                        handleDeleteReport(
                          report.id
                        )
                      }
                      disabled={
                        isDeleting ||
                        isUpdating
                      }
                    >

                      <FaTrash />

                      <span>
                        {isDeleting
                          ? "Deleting..."
                          : "Delete Report"}
                      </span>

                    </button>


                  </div>


                </article>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default AdminSongReports;

