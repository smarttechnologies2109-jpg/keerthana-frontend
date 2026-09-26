import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaSearch,
  FaShieldAlt,
  FaUser,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

import API
  from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";

import "../../assets/css/manageUsers.css";


function ManageUsers() {

  /* =====================================================
     AUTH
  ===================================================== */

  const {
    user: currentUser,
  } = useAuth();


  /* =====================================================
     STATE
  ===================================================== */

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("all");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  /* =====================================================
     LOAD USERS
  ===================================================== */

  const loadUsers =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get(
            "/admin/users"
          );


        setUsers(
          response.data.users ||
          []
        );


      } catch (error) {

        console.error(
          "Load users error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          "Unable to load users."
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadUsers();

  }, []);


  /* =====================================================
     CHANGE ROLE
  ===================================================== */

  const changeRole = async (
    targetUser,
    newRole
  ) => {

    if (
      targetUser.role ===
      newRole
    ) {

      return;

    }


    if (
      Number(targetUser.id) ===
        Number(currentUser?.id) &&
      newRole !== "admin"
    ) {

      setError(
        "You cannot remove your own admin role."
      );

      return;

    }


    const confirmed =
      window.confirm(
        `Change ${targetUser.name} from ${targetUser.role} to ${newRole}?`
      );


    if (!confirmed) {

      return;

    }


    try {

      setUpdatingId(
        targetUser.id
      );

      setError("");

      setSuccess("");


      const response =
        await API.patch(
          `/admin/users/${targetUser.id}/role`,
          {
            role: newRole,
          }
        );


      const updatedUser =
        response.data.user;


      setUsers(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              updatedUser.id
                ? updatedUser
                : item
          )
      );


      setSuccess(
        `${updatedUser.name}'s role changed to ${updatedUser.role}.`
      );


    } catch (error) {

      console.error(
        "Update user role error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to update user role."
      );


    } finally {

      setUpdatingId(null);

    }

  };


  /* =====================================================
     FILTER USERS
  ===================================================== */

  const filteredUsers =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return users.filter(
          (user) => {

            const matchesSearch =
              !query ||
              user.name
                ?.toLowerCase()
                .includes(query) ||
              user.email
                ?.toLowerCase()
                .includes(query);


            const matchesRole =
              roleFilter === "all" ||
              user.role ===
                roleFilter;


            return (
              matchesSearch &&
              matchesRole
            );

          }
        );

      },
      [
        users,
        search,
        roleFilter,
      ]
    );


  /* =====================================================
     COUNTS
  ===================================================== */

  const adminCount =
    users.filter(
      (user) =>
        user.role === "admin"
    ).length;


  const normalUserCount =
    users.filter(
      (user) =>
        user.role === "USER"
    ).length;


  /* =====================================================
     DATE
  ===================================================== */

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Users...

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

          <span>
            KEERTHANA ADMIN
          </span>

          <h1>
            Manage Users
          </h1>

          <p>
            View registered users
            and manage account roles.
          </p>

        </div>

      </div>


      {/* MESSAGES */}

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


      {/* USER STATS */}

      <div className="admin-user-stats">


        <UserStat
          icon={<FaUsers />}
          title="Total Users"
          value={
            users.length
          }
        />


        <UserStat
          icon={
            <FaUserShield />
          }
          title="Admins"
          value={
            adminCount
          }
        />


        <UserStat
          icon={<FaUser />}
          title="Users"
          value={
            normalUserCount
          }
        />


      </div>


      {/* TOOLBAR */}

      <div className="admin-users-toolbar">


        <div className="admin-song-search">

          <FaSearch />


          <input
            type="text"

            value={
              search
            }

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }

            placeholder="Search name or email..."
          />

        </div>


        <select
          className="admin-role-filter"

          value={
            roleFilter
          }

          onChange={(event) =>
            setRoleFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All Roles
          </option>

          <option value="admin">
            Admin
          </option>

          <option value="user">
            User
          </option>

        </select>


      </div>


      {/* TABLE */}

      {filteredUsers.length ===
        0 ? (

        <div className="admin-empty-state">

          <FaUsers />

          <h2>
            No Users Found
          </h2>

          <p>
            No users match
            your current search.
          </p>

        </div>

      ) : (

        <div className="admin-table-wrapper">

          <table className="admin-song-table">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Email
                </th>

                <th>
                  Joined
                </th>

                <th>
                  Role
                </th>

                <th>
                  Change Role
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredUsers.map(
                (user) => {

                  const isCurrentUser =
                    Number(user.id) ===
                    Number(
                      currentUser?.id
                    );


                  return (

                    <tr
                      key={
                        user.id
                      }
                    >


                      {/* USER */}

                      <td>

                        <div className="admin-user-cell">

                          <div className="admin-user-avatar">

                            {user.role ===
                            "admin" ? (

                              <FaUserShield />

                            ) : (

                              <FaUser />

                            )}

                          </div>


                          <div>

                            <strong>

                              {user.name}

                            </strong>


                            {isCurrentUser && (

                              <span className="admin-you-label">

                                You

                              </span>

                            )}

                          </div>

                        </div>

                      </td>


                      {/* EMAIL */}

                      <td>

                        {user.email}

                      </td>


                      {/* DATE */}

                      <td>

                        {formatDate(
                          user.created_at
                        )}

                      </td>


                      {/* ROLE */}

                      <td>

                        <span
                          className={
                            user.role ===
                            "admin"
                              ? "admin-role-badge admin"
                              : "admin-role-badge user"
                          }
                        >

                          {user.role ===
                          "admin" ? (

                            <FaShieldAlt />

                          ) : (

                            <FaUser />

                          )}

                          {user.role}

                        </span>

                      </td>


                      {/* CHANGE ROLE */}

                      <td>

                        <select
                          className="admin-role-select"

                          value={
                            user.role
                          }

                          disabled={
                            updatingId ===
                              user.id ||
                            isCurrentUser
                          }

                          onChange={(event) =>
                            changeRole(
                              user,
                              event.target.value
                            )
                          }
                        >

                          <option value="user">
                            User
                          </option>

                          <option value="admin">
                            Admin
                          </option>

                        </select>


                        {updatingId ===
                          user.id && (

                          <span className="admin-updating-text">

                            Updating...

                          </span>

                        )}

                      </td>


                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      )}


    </div>

  );

}


/* =========================================================
   STAT CARD
========================================================= */

function UserStat({
  icon,
  title,
  value,
}) {

  return (

    <div className="admin-user-stat-card">

      <div className="admin-user-stat-icon">

        {icon}

      </div>


      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>

  );

}


export default ManageUsers;