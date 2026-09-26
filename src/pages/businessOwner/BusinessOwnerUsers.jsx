
import React, { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";

import API from "../../services/api";

import "../../assets/css/businessOwner/BusinessOwnerUsers.css";

const BusinessOwnerUsers = () => {
  const navigate = useNavigate();

  /* =========================================================
     USERS
  ========================================================= */

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  /* =========================================================
     CREATE STATE
  ========================================================= */

  const [creating, setCreating] = useState(false);

  const [showModal, setShowModal] = useState(false);

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
     EDIT STATE
  ========================================================= */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

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

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/owner/users");

      if (response.data?.success) {
        setUsers(response.data.users || []);
      } else {
        setError(
          response.data?.message ||
            "Unable to load users."
        );
      }
    } catch (err) {
      console.error("Load users error:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Unable to load users."
        );
      } else {
        setError(
          "Backend server is not responding."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      return (
        String(user.id || "")
          .toLowerCase()
          .includes(value) ||
        String(user.name || "")
          .toLowerCase()
          .includes(value) ||
        String(user.email || "")
          .toLowerCase()
          .includes(value) ||
        String(user.mobile || "")
          .toLowerCase()
          .includes(value) ||
        String(user.role || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [users, search]);

  /* =========================================================
     CREATE FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
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

    setError("");
  };

  /* =========================================================
     CREATE USER
  ========================================================= */

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email
      .trim()
      .toLowerCase();

    const mobile = formData.mobile.trim();
    const role = formData.role;

    const password = formData.password;
    const confirmPassword =
      formData.confirmPassword;

    /* VALIDATION */

    if (!name) {
      setError("Please enter user name.");
      return;
    }

    if (!email) {
      setError("Please enter email address.");
      return;
    }

    if (!role) {
      setError("Please select a user role.");
      return;
    }

    if (!password) {
      setError("Please enter password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setCreating(true);

      const response = await API.post(
        "/owner/users",
        {
          name,
          email,
          mobile: mobile || null,
          role,
          password,
        }
      );

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "User created successfully."
        );

        await loadUsers();

        setTimeout(() => {
          setShowModal(false);

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
        }, 700);
      } else {
        setError(
          response.data?.message ||
            "Failed to create user."
        );
      }
    } catch (err) {
      console.error(
        "Create user error:",
        err
      );

      if (err.response?.status === 409) {
        setError(
          err.response.data?.message ||
            "A user with this information already exists."
        );
      } else if (err.response) {
        setError(
          err.response.data?.message ||
            "Failed to create user."
        );
      } else {
        setError(
          "Backend server is not responding."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
     DELETE USER
  ========================================================= */

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(
        `/owner/users/${userId}`
      );

      setSuccess(
        "User deleted successfully."
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const handleEditUser = (user) => {
    setError("");
    setSuccess("");

    setEditingUser(user);

    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role: user.role || "USER",
      password: "",
    });

    setEditShowPassword(false);

    setShowEditModal(true);
  };

  /* =========================================================
     EDIT FORM CHANGE
  ========================================================= */

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
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

    setError("");
  };

  /* =========================================================
     UPDATE USER
  ========================================================= */

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = editFormData.name.trim();

    const email = editFormData.email
      .trim()
      .toLowerCase();

    const mobile =
      editFormData.mobile.trim();

    const role = editFormData.role;

    const password =
      editFormData.password;

    /* VALIDATION */

    if (!name) {
      setError("Please enter user name.");
      return;
    }

    // if (!email) {
    //   setError("Please enter email address.");
    //   return;
    // }

    if (!role) {
      setError("Please select a user role.");
      return;
    }

    if (password && password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!editingUser?.id) {
      setError("Invalid user selected.");
      return;
    }

    try {
      setUpdating(true);

      const response = await API.put(
        `/owner/users/${editingUser.id}`,
        {
          name,
          email,
          mobile: mobile || null,
          role,
          ...(password
            ? { password }
            : {}),
        }
      );

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "User updated successfully."
        );

        await loadUsers();

        setTimeout(() => {
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

          setSuccess("");
        }, 700);
      } else {
        setError(
          response.data?.message ||
            "Failed to update user."
        );
      }
    } catch (err) {
      console.error(
        "Update user error:",
        err
      );

      if (err.response?.status === 409) {
        setError(
          err.response.data?.message ||
            "A user with this email or mobile number already exists."
        );
      } else if (err.response) {
        setError(
          err.response.data?.message ||
            "Failed to update user."
        );
      } else {
        setError(
          "Backend server is not responding."
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="owner-users-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="owner-users-header">

        <div className="owner-users-header-left">

          <button
            className="owner-back-btn"
            onClick={() =>
              navigate(
                "/owner/dashboard"
              )
            }
          >
            <FaArrowLeft />
            <span>Dashboard</span>
          </button>

          <div className="owner-users-title-wrapper">

            <div className="owner-users-title-icon">
              <FaUsers />
            </div>

            <div>
              <h1>Users</h1>
              <p>
                Manage registered users
              </p>
            </div>

          </div>

        </div>

        <button
          className="create-user-btn"
          onClick={openCreateModal}
        >
          <FaPlus />
          <span>Create User</span>
        </button>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="owner-users-main">

        {/* ===================================================
            TOP SECTION
        =================================================== */}

        <section className="users-top-section">

          <div className="users-count-box">

            <div className="users-count-icon">
              <FaUsers />
            </div>

            <div>
              <span>Total Users</span>
              <strong>
                {users.length}
              </strong>
            </div>

          </div>

          <div className="users-search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search users by name, email, mobile..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() =>
                  setSearch("")
                }
              >
                <FaTimes />
              </button>
            )}

          </div>

        </section>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (
          <div className="users-alert users-alert-error">
            <FaTimes />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="users-alert users-alert-success">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ===================================================
            TABLE
        =================================================== */}

        <section className="users-table-card">

          <div className="users-table-header">

            <div>
              <h2>
                Registered Users
              </h2>

              <p>
                {filteredUsers.length} user
                {filteredUsers.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <div className="users-header-actions">

              <button
                type="button"
                className="refresh-users-btn"
                onClick={loadUsers}
                disabled={loading}
              >
                Refresh
              </button>

              <button
                type="button"
                className="table-create-user-btn"
                onClick={
                  openCreateModal
                }
              >
                <FaPlus />
                Add User
              </button>

            </div>

          </div>

          {loading ? (

            <div className="users-loading">

              <div className="loading-spinner"></div>

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
                {search
                  ? "Try changing your search."
                  : "Create your first user to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  className="empty-create-btn"
                  onClick={
                    openCreateModal
                  }
                >
                  <FaPlus />
                  Create User
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
                    <th className="actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map(
                    (user) => (

                      <tr
                        key={user.id}
                      >

                        <td>
                          <span className="user-id">
                            #{user.id}
                          </span>
                        </td>

                        <td>

                          <div className="user-name-cell">

                            <div className="user-avatar">

                              {user.profile_image ? (
                                <img
                                  src={
                                    user.profile_image
                                  }
                                  alt={
                                    user.name
                                  }
                                />
                              ) : (
                                <FaUser />
                              )}

                            </div>

                            <div>

                              <strong>
                                {
                                  user.name ||
                                  "-"
                                }
                              </strong>

                              <small>
                                User ID:{" "}
                                {user.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="user-contact">

                            <FaEnvelope />

                            <span>
                              {
                                user.email ||
                                "-"
                              }
                            </span>

                          </div>

                        </td>

                        <td>

                          <div className="user-contact">

                            <FaPhone />

                            <span>
                              {
                                user.mobile ||
                                "-"
                              }
                            </span>

                          </div>

                        </td>

                        <td>

                          <span
                            className={`role-badge ${
                              user.role ===
                              "BUSINESS_OWNER"
                                ? "role-owner"
                                : user.role ===
                                  "ADMIN"
                                ? "role-admin"
                                : user.role ===
                                  "EMPLOYEE"
                                ? "role-employee"
                                : "role-user"
                            }`}
                          >
                            {
                              user.role ||
                              "USER"
                            }
                          </span>

                        </td>

                        <td>

                          <span className="created-date">
                            {formatDate(
                              user.created_at
                            )}
                          </span>

                        </td>

                        <td className="actions-column">

                          <div className="user-actions">

                            <button
                              type="button"
                              className="edit-user-btn"
                              title="Edit User"
                              onClick={() =>
                                handleEditUser(
                                  user
                                )
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className="delete-user-btn"
                              title="Delete User"
                              onClick={() =>
                                handleDeleteUser(
                                  user.id
                                )
                              }
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

        </section>

      </main>

      {/* =====================================================
          CREATE USER MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="owner-modal-overlay"
          onClick={
            closeCreateModal
          }
        >

          <div
            className="owner-create-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="owner-modal-header">

              <div>

                <div className="modal-title-icon">
                  <FaUser />
                </div>

                <div>
                  <h2>
                    Create New User
                  </h2>

                  <p>
                    Add a new user account
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

            {/* CREATE FORM */}

            <form
              className="owner-create-form"
              onSubmit={
                handleCreateUser
              }
            >

              {/* FULL NAME */}

              <div className="form-group">

                <label>
                  <FaUser />
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    creating
                  }
                  autoComplete="name"
                />

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  <FaEnvelope />
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    creating
                  }
                  autoComplete="email"
                />

              </div>

              {/* MOBILE */}

              <div className="form-group">

                <label>

                  <FaPhone />

                  Mobile Number

                  <span className="optional-text">
                    Optional
                  </span>

                </label>

                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={
                    formData.mobile
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    creating
                  }
                  autoComplete="tel"
                />

              </div>

              {/* ROLE */}

              <div className="form-group">

                <label>
                  <FaUser />
                  Role
                </label>

                <select
                  name="role"
                  value={
                    formData.role
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    creating
                  }
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
                </select>

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label>
                  <FaLock />
                  Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      creating
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={
                      creating
                    }
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

                <label>
                  <FaLock />
                  Confirm Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      creating
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={
                      creating
                    }
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>

              {/* CREATE ERROR */}

              {error && (
                <div className="modal-error">
                  <FaTimes />
                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* CREATE SUCCESS */}

              {success && (
                <div className="modal-success">
                  ✓ {success}
                </div>
              )}

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    creating
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-create-btn"
                  disabled={
                    creating
                  }
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

      {showEditModal && (

        <div
          className="owner-modal-overlay"
          onClick={
            closeEditModal
          }
        >

          <div
            className="owner-create-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="owner-modal-header">

              <div>

                <div className="modal-title-icon">
                  <FaEdit />
                </div>

                <div>
                  <h2>
                    Edit User
                  </h2>

                  <p>
                    Update user account details
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={
                  closeEditModal
                }
                disabled={
                  updating
                }
              >
                <FaTimes />
              </button>

            </div>

            {/* EDIT FORM */}

            <form
              className="owner-create-form"
              onSubmit={
                handleUpdateUser
              }
            >

              {/* FULL NAME */}

              <div className="form-group">

                <label>
                  <FaUser />
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={
                    editFormData.name
                  }
                  onChange={
                    handleEditChange
                  }
                  disabled={
                    updating
                  }
                  autoComplete="name"
                />

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  <FaEnvelope />
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={
                    editFormData.email
                  }
                  onChange={
                    handleEditChange
                  }
                  disabled={
                    updating
                  }
                  autoComplete="email"
                />

              </div>

              {/* MOBILE */}

              <div className="form-group">

                <label>

                  <FaPhone />

                  Mobile Number

                  <span className="optional-text">
                    Optional
                  </span>

                </label>

                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={
                    editFormData.mobile
                  }
                  onChange={
                    handleEditChange
                  }
                  disabled={
                    updating
                  }
                  autoComplete="tel"
                />

              </div>

              {/* ROLE */}

              <div className="form-group">

                <label>
                  <FaUser />
                  Role
                </label>

                <select
                  name="role"
                  value={
                    editFormData.role
                  }
                  onChange={
                    handleEditChange
                  }
                  disabled={
                    updating
                  }
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
                </select>

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label>
                  <FaLock />
                  New Password

                  <span className="optional-text">
                    Optional
                  </span>
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      editShowPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Leave blank to keep current password"
                    value={
                      editFormData.password
                    }
                    onChange={
                      handleEditChange
                    }
                    disabled={
                      updating
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setEditShowPassword(
                        !editShowPassword
                      )
                    }
                    disabled={
                      updating
                    }
                  >
                    {editShowPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>

              {/* EDIT ERROR */}

              {error && (
                <div className="modal-error">
                  <FaTimes />
                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* EDIT SUCCESS */}

              {success && (
                <div className="modal-success">
                  ✓ {success}
                </div>
              )}

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={
                    closeEditModal
                  }
                  disabled={
                    updating
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-create-btn"
                  disabled={
                    updating
                  }
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
