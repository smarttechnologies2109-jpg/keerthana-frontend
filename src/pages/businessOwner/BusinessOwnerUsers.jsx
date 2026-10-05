import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaUsers,
  FaSearch,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaPlus,
  FaTimes,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaEdit,
  FaFilter,
  FaUserShield,
  FaUserTie,
  FaBriefcase,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessOwner/BusinessOwnerUsers.css";


/* =========================================================
   ROLE FILTERS
========================================================= */

const ROLE_FILTERS = [
  {
    value: "ALL",
    label: "All Roles",
  },
  {
    value: "USER",
    label: "Users",
  },
  {
    value: "ADMIN",
    label: "Admins",
  },
  {
    value: "EMPLOYEE",
    label: "Employees",
  },
  {
    value: "BUSINESS_OWNER",
    label: "Business Owners",
  },
];


/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (role) => {
  return String(role || "USER")
    .trim()
    .toUpperCase();
};


const formatRole = (role) => {
  const normalizedRole = normalizeRole(role);

  const roleNames = {
    USER: "User",
    ADMIN: "Admin",
    EMPLOYEE: "Employee",
    BUSINESS_OWNER: "Business Owner",
  };

  return roleNames[normalizedRole] || normalizedRole;
};


const getRoleClass = (role) => {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "BUSINESS_OWNER":
      return "role-owner";

    case "ADMIN":
      return "role-admin";

    case "EMPLOYEE":
      return "role-employee";

    case "USER":
    default:
      return "role-user";
  }
};


/* =========================================================
   COMPONENT
========================================================= */

const BusinessOwnerUsers = () => {
  const navigate = useNavigate();


  /* =========================================================
     USERS
  ========================================================= */

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("ALL");


  /* =========================================================
     CREATE USER MODAL
  ========================================================= */

  const [showModal, setShowModal] = useState(false);

  const [creating, setCreating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "USER",
    password: "",
    confirmPassword: "",
  });


  /* =========================================================
     EDIT USER MODAL
  ========================================================= */

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [updating, setUpdating] = useState(false);

  const [editShowPassword, setEditShowPassword] =
    useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "USER",
    password: "",
  });


  /* =========================================================
     ALERTS
  ========================================================= */

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  /* =========================================================
     LOAD USERS
  ========================================================= */

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/owner/users");

      const responseData = response?.data;

      const userList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.users)
        ? responseData.users
        : [];

      setUsers(userList);
    } catch (err) {
      console.error(
        "Failed to load users:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load users. Please try again."
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  /* =========================================================
     ROLE COUNTS
     
     IMPORTANT:
     Total Users = ONLY role USER
     Total Admins = ONLY role ADMIN
     Total Employees = ONLY role EMPLOYEE
     Total Business Owners = ONLY role BUSINESS_OWNER
  ========================================================= */

  const roleCounts = useMemo(() => {
    const counts = {
      users: 0,
      admins: 0,
      employees: 0,
      businessOwners: 0,
    };

    users.forEach((user) => {
      const role = normalizeRole(user.role);

      if (role === "USER") {
        counts.users += 1;
      } else if (role === "ADMIN") {
        counts.admins += 1;
      } else if (role === "EMPLOYEE") {
        counts.employees += 1;
      } else if (role === "BUSINESS_OWNER") {
        counts.businessOwners += 1;
      }
    });

    return counts;
  }, [users]);


  /* =========================================================
     FILTER USERS
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const userRole = normalizeRole(user.role);

      const matchesRole =
        roleFilter === "ALL" ||
        userRole === roleFilter;

      const matchesSearch =
        !query ||
        [
          user.id,
          user.name,
          user.email,
          user.mobile,
          user.role,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query)
        );

      return matchesRole && matchesSearch;
    });
  }, [
    users,
    search,
    roleFilter,
  ]);


  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
  };


  /* =========================================================
     CREATE FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =========================================================
     EDIT FORM CHANGE
  ========================================================= */

  const handleEditChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const openCreateModal = () => {
    setError("");
    setSuccess("");

    setFormData({
      name: "",
      email: "",
      mobile: "",
      role: "USER",
      password: "",
      confirmPassword: "",
    });

    setShowPassword(false);
    setShowConfirmPassword(false);

    setShowModal(true);
  };


  /* =========================================================
     CLOSE CREATE MODAL
  ========================================================= */

  const closeCreateModal = () => {
    if (creating) return;

    setShowModal(false);

    setFormData({
      name: "",
      email: "",
      mobile: "",
      role: "USER",
      password: "",
      confirmPassword: "",
    });

    setShowPassword(false);
    setShowConfirmPassword(false);
  };


  /* =========================================================
     CREATE USER
  ========================================================= */

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Please enter the user's name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter the user's email.");
      return;
    }

    if (!formData.role) {
      setError("Please select a role.");
      return;
    }

    if (!formData.password) {
      setError("Please enter a password.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setCreating(true);

      await API.post("/owner/users", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile:
          formData.mobile.trim() || null,
        role: normalizeRole(formData.role),
        password: formData.password,
      });

      closeCreateModal();

      await loadUsers();

      setSuccess(
        "User created successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Create user error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create user. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };


  /* =========================================================
     DELETE USER
  ========================================================= */

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(
        `/owner/users/${user.id}`
      );

      await loadUsers();

      setSuccess(
        "User deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete user. Please try again."
      );
    }
  };


  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditModal = (user) => {
    setError("");
    setSuccess("");

    setEditingUser(user);

    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role: normalizeRole(user.role),
      password: "",
    });

    setEditShowPassword(false);

    setShowEditModal(true);
  };


  /* =========================================================
     CLOSE EDIT MODAL
  ========================================================= */

  const closeEditModal = () => {
    if (updating) return;

    setShowEditModal(false);

    setEditingUser(null);

    setEditFormData({
      name: "",
      email: "",
      mobile: "",
      role: "USER",
      password: "",
    });

    setEditShowPassword(false);
  };


  /* =========================================================
     UPDATE USER
  ========================================================= */

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editFormData.name.trim()) {
      setError("Please enter the user's name.");
      return;
    }

    if (!editFormData.email.trim()) {
      setError(
        "Please enter the user's email."
      );
      return;
    }

    if (!editFormData.role) {
      setError("Please select a role.");
      return;
    }

    if (
      editFormData.password &&
      editFormData.password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!editingUser?.id) {
      setError("User ID is missing.");
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        mobile:
          editFormData.mobile.trim() || null,
        role: normalizeRole(editFormData.role),
      };

      if (editFormData.password.trim()) {
        payload.password =
          editFormData.password;
      }

      await API.put(
        `/owner/users/${editingUser.id}`,
        payload
      );

      closeEditModal();

      await loadUsers();

      setSuccess(
        "User updated successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Update user error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update user. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "-";

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="owner-users-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="owner-users-header">

        <div className="owner-users-header-left">

          <button
            type="button"
            className="owner-back-btn"
            onClick={() =>
              navigate("/owner/dashboard")
            }
          >
            <FaArrowLeft />
            <span>Dashboard</span>
          </button>


          <div className="owner-page-heading">

            <div className="owner-page-icon">
              <FaUsers />
            </div>

            <div>
              <h1>User Management</h1>

              <p>
                Manage users, admins, employees
                and business owners
              </p>
            </div>

          </div>

        </div>


        <button
          type="button"
          className="create-user-btn"
          onClick={openCreateModal}
        >
          <FaPlus />
          <span>Create User</span>
        </button>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="owner-users-content">


        {/* ===================================================
            ROLE STATISTICS
        =================================================== */}

        <div className="users-statistics-grid">


          {/* TOTAL USERS */}

          <div className="user-stat-card stat-users">

            <div className="user-stat-icon">
              <FaUsers />
            </div>

            <div className="user-stat-content">

              <span>Total Users</span>

              <strong>
                {roleCounts.users}
              </strong>

            </div>

          </div>


          {/* TOTAL ADMINS */}

          <div className="user-stat-card stat-admins">

            <div className="user-stat-icon">
              <FaUserShield />
            </div>

            <div className="user-stat-content">

              <span>Total Admins</span>

              <strong>
                {roleCounts.admins}
              </strong>

            </div>

          </div>


          {/* TOTAL EMPLOYEES */}

          <div className="user-stat-card stat-employees">

            <div className="user-stat-icon">
              <FaUserTie />
            </div>

            <div className="user-stat-content">

              <span>Total Employees</span>

              <strong>
                {roleCounts.employees}
              </strong>

            </div>

          </div>


          {/* TOTAL BUSINESS OWNERS */}

          <div className="user-stat-card stat-owners">

            <div className="user-stat-icon">
              <FaBriefcase />
            </div>

            <div className="user-stat-content">

              <span>Total Business Owners</span>

              <strong>
                {roleCounts.businessOwners}
              </strong>

            </div>

          </div>


        </div>


        {/* ===================================================
            SEARCH + FILTER
        =================================================== */}

        <div className="users-controls-card">

          <div className="users-search-control">

            <label htmlFor="user-search">
              Search Users
            </label>

            <div className="users-search-box">

              <FaSearch />

              <input
                id="user-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, email, mobile or ID..."
              />

              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}

            </div>

          </div>


          <div className="users-role-control">

            <label htmlFor="role-filter">
              Filter by Role
            </label>

            <div className="users-filter-box">

              <FaFilter />

              <select
                id="role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
              >

                {ROLE_FILTERS.map(
                  (role) => (
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>


          {(search ||
            roleFilter !== "ALL") && (

            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <FaTimes />

              <span>
                Clear Filters
              </span>
            </button>

          )}

        </div>


        {/* ===================================================
            RESULT BAR
        =================================================== */}

        <div className="users-result-bar">

          <div>

            Showing{" "}

            <strong>
              {filteredUsers.length}
            </strong>{" "}

            of{" "}

            <strong>
              {users.length}
            </strong>{" "}

            accounts

          </div>


          {roleFilter !== "ALL" && (

            <span className="active-filter-badge">
              {formatRole(roleFilter)}
            </span>

          )}

        </div>


        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (

          <div className="owner-alert owner-alert-error">

            <FaExclamationCircle />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Close error"
            >
              <FaTimes />
            </button>

          </div>

        )}


        {success && (

          <div className="owner-alert owner-alert-success">

            <FaCheckCircle />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              aria-label="Close success"
            >
              <FaTimes />
            </button>

          </div>

        )}


        {/* ===================================================
            USERS TABLE
        =================================================== */}

        <div className="users-table-card">

          {loading ? (

            <div className="users-loading">

              <div className="users-spinner"></div>

              <p>
                Loading users...
              </p>

            </div>

          ) : filteredUsers.length === 0 ? (

            <div className="users-empty">

              <div className="users-empty-icon">
                <FaUsers />
              </div>

              <h3>
                No users found
              </h3>

              <p>
                {search ||
                roleFilter !== "ALL"
                  ? "Try changing your search or filter."
                  : "There are no users available yet."}
              </p>

              {(search ||
                roleFilter !== "ALL") && (

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="empty-clear-btn"
                >
                  Clear Filters
                </button>

              )}

            </div>

          ) : (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map(
                    (user) => (

                      <tr key={user.id}>

                        <td>

                          <span className="user-id">
                            #{user.id}
                          </span>

                        </td>


                        <td>

                          <div className="table-user-info">

                            <div className="table-user-avatar">

                              {user.profile_image ? (

                                <img
                                  src={
                                    user.profile_image
                                  }
                                  alt={
                                    user.name ||
                                    "User"
                                  }
                                />

                              ) : (

                                <FaUser />

                              )}

                            </div>


                            <div className="table-user-details">

                              <strong>
                                {user.name ||
                                  "Unnamed User"}
                              </strong>

                              <span>
                                User ID:{" "}
                                {user.id}
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="table-contact">

                            <FaEnvelope />

                            <span>
                              {user.email ||
                                "-"}
                            </span>

                          </div>

                        </td>


                        <td>

                          <div className="table-contact">

                            <FaPhone />

                            <span>
                              {user.mobile ||
                                "-"}
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={`user-role-badge ${getRoleClass(
                              user.role
                            )}`}
                          >
                            {formatRole(
                              user.role
                            )}
                          </span>

                        </td>


                        <td>

                          <span className="created-date">

                            {formatDate(
                              user.created_at
                            )}

                          </span>

                        </td>


                        <td>

                          <div className="user-actions">

                            <button
                              type="button"
                              className="user-edit-btn"
                              onClick={() =>
                                openEditModal(
                                  user
                                )
                              }
                              title="Edit user"
                            >
                              <FaEdit />
                            </button>


                            <button
                              type="button"
                              className="user-delete-btn"
                              onClick={() =>
                                handleDeleteUser(
                                  user
                                )
                              }
                              title="Delete user"
                            >
                              <FaTrash />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          CREATE USER MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="owner-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
                event.currentTarget &&
              !creating
            ) {
              closeCreateModal();
            }

          }}
        >

          <div className="owner-modal">

            <div className="owner-modal-header">

              <div className="owner-modal-heading">

                <div className="modal-title-icon">
                  <FaPlus />
                </div>

                <div>

                  <h2>
                    Create New User
                  </h2>

                  <p>
                    Add a new user to the
                    KEERTHANA system
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="modal-close-btn"
                onClick={
                  closeCreateModal
                }
                disabled={creating}
              >
                <FaTimes />
              </button>

            </div>


            <form
              className="owner-user-form"
              onSubmit={
                handleCreateUser
              }
            >

              <div className="form-grid">


                {/* NAME */}

                <div className="form-group">

                  <label htmlFor="create-name">
                    Full Name
                  </label>

                  <div className="form-input-wrapper">

                    <FaUser />

                    <input
                      id="create-name"
                      type="text"
                      name="name"
                      value={
                        formData.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter full name"
                      disabled={creating}
                    />

                  </div>

                </div>


                {/* EMAIL */}

                <div className="form-group">

                  <label htmlFor="create-email">
                    Email Address
                  </label>

                  <div className="form-input-wrapper">

                    <FaEnvelope />

                    <input
                      id="create-email"
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter email address"
                      disabled={creating}
                    />

                  </div>

                </div>


                {/* MOBILE */}

                <div className="form-group">

                  <label htmlFor="create-mobile">
                    Mobile Number
                  </label>

                  <div className="form-input-wrapper">

                    <FaPhone />

                    <input
                      id="create-mobile"
                      type="tel"
                      name="mobile"
                      value={
                        formData.mobile
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter mobile number"
                      disabled={creating}
                    />

                  </div>

                </div>


                {/* ROLE */}

                <div className="form-group">

                  <label htmlFor="create-role">
                    Role
                  </label>

                  <div className="form-input-wrapper">

                    <FaUsers />

                    <select
                      id="create-role"
                      name="role"
                      value={
                        formData.role
                      }
                      onChange={
                        handleChange
                      }
                      disabled={creating}
                    >

                      <option value="USER">
                        User
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>

                      <option value="EMPLOYEE">
                        Employee
                      </option>

                      <option value="BUSINESS_OWNER">
                        Business Owner
                      </option>

                    </select>

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="form-group">

                  <label htmlFor="create-password">
                    Password
                  </label>

                  <div className="form-input-wrapper">

                    <FaLock />

                    <input
                      id="create-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Minimum 6 characters"
                      disabled={creating}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={creating}
                    >
                      {showPassword ? (
                        <FaEyeSlash />
                      ) : (
                        <FaEye />
                      )}
                    </button>

                  </div>

                </div>


                {/* CONFIRM PASSWORD */}

                <div className="form-group">

                  <label htmlFor="create-confirm-password">
                    Confirm Password
                  </label>

                  <div className="form-input-wrapper">

                    <FaLock />

                    <input
                      id="create-confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        formData.confirmPassword
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Confirm password"
                      disabled={creating}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={creating}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash />
                      ) : (
                        <FaEye />
                      )}
                    </button>

                  </div>

                </div>

              </div>


              <div className="owner-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={
                    closeCreateModal
                  }
                  disabled={creating}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={creating}
                >

                  {creating ? (
                    <>
                      <span className="button-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Create User
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {showEditModal &&
        editingUser && (

          <div
            className="owner-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                  event.currentTarget &&
                !updating
              ) {
                closeEditModal();
              }

            }}
          >

            <div className="owner-modal">

              <div className="owner-modal-header">

                <div className="owner-modal-heading">

                  <div className="modal-title-icon edit-modal-icon">
                    <FaEdit />
                  </div>

                  <div>

                    <h2>
                      Edit User
                    </h2>

                    <p>
                      Update user account
                      information
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={
                    closeEditModal
                  }
                  disabled={updating}
                >
                  <FaTimes />
                </button>

              </div>


              <form
                className="owner-user-form"
                onSubmit={
                  handleUpdateUser
                }
              >

                <div className="form-grid">


                  {/* NAME */}

                  <div className="form-group">

                    <label htmlFor="edit-name">
                      Full Name
                    </label>

                    <div className="form-input-wrapper">

                      <FaUser />

                      <input
                        id="edit-name"
                        type="text"
                        name="name"
                        value={
                          editFormData.name
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Enter full name"
                        disabled={updating}
                      />

                    </div>

                  </div>


                  {/* EMAIL */}

                  <div className="form-group">

                    <label htmlFor="edit-email">
                      Email Address
                    </label>

                    <div className="form-input-wrapper">

                      <FaEnvelope />

                      <input
                        id="edit-email"
                        type="email"
                        name="email"
                        value={
                          editFormData.email
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Enter email address"
                        disabled={updating}
                      />

                    </div>

                  </div>


                  {/* MOBILE */}

                  <div className="form-group">

                    <label htmlFor="edit-mobile">
                      Mobile Number
                    </label>

                    <div className="form-input-wrapper">

                      <FaPhone />

                      <input
                        id="edit-mobile"
                        type="tel"
                        name="mobile"
                        value={
                          editFormData.mobile
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Enter mobile number"
                        disabled={updating}
                      />

                    </div>

                  </div>


                  {/* ROLE */}

                  <div className="form-group">

                    <label htmlFor="edit-role">
                      Role
                    </label>

                    <div className="form-input-wrapper">

                      <FaUsers />

                      <select
                        id="edit-role"
                        name="role"
                        value={
                          editFormData.role
                        }
                        onChange={
                          handleEditChange
                        }
                        disabled={updating}
                      >

                        <option value="USER">
                          User
                        </option>

                        <option value="ADMIN">
                          Admin
                        </option>

                        <option value="EMPLOYEE">
                          Employee
                        </option>

                        <option value="BUSINESS_OWNER">
                          Business Owner
                        </option>

                      </select>

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div className="form-group form-group-full">

                    <label htmlFor="edit-password">

                      New Password

                      <span className="optional-label">
                        Optional
                      </span>

                    </label>

                    <div className="form-input-wrapper">

                      <FaLock />

                      <input
                        id="edit-password"
                        type={
                          editShowPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={
                          editFormData.password
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Leave empty to keep current password"
                        disabled={updating}
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setEditShowPassword(
                            (previous) =>
                              !previous
                          )
                        }
                        disabled={updating}
                      >
                        {editShowPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>

                    </div>

                  </div>

                </div>


                <div className="owner-modal-footer">

                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={
                      closeEditModal
                    }
                    disabled={updating}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={updating}
                  >

                    {updating ? (
                      <>
                        <span className="button-spinner"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        Update User
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

    </div>
  );
};


export default BusinessOwnerUsers;