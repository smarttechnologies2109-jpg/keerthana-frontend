import {
  useEffect,
  useState,
} from "react";

import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaTags,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import API
  from "../../services/api";

import "../../assets/css/manageCategories.css";


function ManageCategories() {

  /* =====================================================
     STATE
  ===================================================== */

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  /* =====================================================
     MODAL
  ===================================================== */

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] = useState(null);


  /* =====================================================
     FORM
  ===================================================== */

  const [
    name,
    setName,
  ] = useState("");


  /* =====================================================
     LOAD CATEGORIES
  ===================================================== */

  const loadCategories =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await API.get(
            "/admin/categories"
          );


        setCategories(
          response.data.categories ||
          []
        );


      } catch (error) {

        console.error(
          "Load categories error:",
          error
        );


        setError(
          error.response
            ?.data
            ?.message ||
          "Unable to load categories."
        );


      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadCategories();

  }, []);


  /* =====================================================
     ADD
  ===================================================== */

  const openAdd = () => {

    setEditingCategory(null);

    setName("");

    setError("");

    setSuccess("");

    setShowForm(true);

  };


  /* =====================================================
     EDIT
  ===================================================== */

  const openEdit = (
    category
  ) => {

    setEditingCategory(
      category
    );

    setName(
      category.name || ""
    );

    setError("");

    setSuccess("");

    setShowForm(true);

  };


  /* =====================================================
     CLOSE
  ===================================================== */

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingCategory(null);

    setName("");

  };


  /* =====================================================
     SAVE
  ===================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    const cleanName =
      name.trim();


    if (!cleanName) {

      setError(
        "Category name is required."
      );

      return;

    }


    try {

      setSaving(true);

      setError("");

      setSuccess("");


      if (
        editingCategory
      ) {

        await API.put(
          `/admin/categories/${editingCategory.id}`,
          {
            name: cleanName,
          }
        );


        setSuccess(
          "Category updated successfully!"
        );

      } else {

        await API.post(
          "/admin/categories",
          {
            name: cleanName,
          }
        );


        setSuccess(
          "Category created successfully!"
        );

      }


      await loadCategories();


      setShowForm(false);

      setEditingCategory(null);

      setName("");


    } catch (error) {

      console.error(
        "Save category error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to save category."
      );


    } finally {

      setSaving(false);

    }

  };


  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (
    category
  ) => {

    const confirmed =
      window.confirm(
        `Delete category "${category.name}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(
        category.id
      );

      setError("");

      setSuccess("");


      await API.delete(
        `/admin/categories/${category.id}`
      );


      setCategories(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              category.id
          )
      );


      setSuccess(
        "Category deleted successfully!"
      );


    } catch (error) {

      console.error(
        "Delete category error:",
        error
      );


      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to delete category."
      );


    } finally {

      setDeletingId(null);

    }

  };


  /* =====================================================
     SEARCH
  ===================================================== */

  const query =
    search
      .trim()
      .toLowerCase();


  const filteredCategories =
    categories.filter(
      (category) => {

        if (!query) {
          return true;
        }


        return category.name
          ?.toLowerCase()
          .includes(
            query
          );

      }
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">

          Loading Categories...

        </div>

      </div>

    );

  }


  return (

    <div className="admin-page">


      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="admin-header">

        <div>

          <span>
            KEERTHANA ADMIN
          </span>

          <h1>
            Manage Categories
          </h1>

          <p>
            Create and manage
            song categories.
          </p>

        </div>


        <button
          type="button"

          className="admin-primary-button"

          onClick={
            openAdd
          }
        >

          <FaPlus />

          Add Category

        </button>

      </div>


      {/* ===============================================
          MESSAGES
      =============================================== */}

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


      {/* ===============================================
          SEARCH
      =============================================== */}

      <div className="admin-song-toolbar">


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

            placeholder="Search categories..."
          />

        </div>


        <div className="admin-song-count">

          <FaTags />

          <span>

            {filteredCategories.length}

            {" "}

            {filteredCategories.length === 1
              ? "Category"
              : "Categories"}

          </span>

        </div>


      </div>


      {/* ===============================================
          TABLE
      =============================================== */}

      {filteredCategories.length ===
        0 ? (

        <div className="admin-empty-state">

          <FaTags />

          <h2>
            No Categories Found
          </h2>

          <p>

            {search
              ? "Try another search."
              : "Create your first song category."}

          </p>


          {!search && (

            <button
              type="button"

              className="admin-primary-button"

              onClick={
                openAdd
              }
            >

              <FaPlus />

              Add Category

            </button>

          )}

        </div>

      ) : (

        <div className="admin-table-wrapper">

          <table className="admin-song-table">

            <thead>

              <tr>

                <th>
                  Category
                </th>

                <th>
                  Songs
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredCategories.map(
                (category) => (

                  <tr
                    key={
                      category.id
                    }
                  >

                    <td>

                      <div className="admin-category-cell">

                        <div className="admin-category-icon">

                          <FaTags />

                        </div>


                        <strong>

                          {category.name}

                        </strong>

                      </div>

                    </td>


                    <td>

                      {category.song_count ??
                        0}

                    </td>


                    <td>

                      <div className="admin-table-actions">


                        <button
                          type="button"

                          className="admin-action-button edit"

                          title="Edit Category"

                          onClick={() =>
                            openEdit(
                              category
                            )
                          }
                        >

                          <FaEdit />

                        </button>


                        <button
                          type="button"

                          className="admin-action-button delete"

                          title="Delete Category"

                          disabled={
                            deletingId ===
                            category.id
                          }

                          onClick={() =>
                            handleDelete(
                              category
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


      {/* ===============================================
          MODAL
      =============================================== */}

      {showForm && (

        <div className="admin-modal-overlay">


          <div className="admin-modal admin-category-modal">


            <div className="admin-modal-header">

              <div>

                <span>
                  KEERTHANA ADMIN
                </span>

                <h2>

                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}

                </h2>

              </div>


              <button
                type="button"

                className="admin-modal-close"

                onClick={
                  closeForm
                }
              >

                <FaTimes />

              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="admin-field">

                <label>
                  Category Name *
                </label>


                <input
                  type="text"

                  value={
                    name
                  }

                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }

                  placeholder="Example: Worship"

                  autoFocus
                />

              </div>


              <div className="admin-form-actions">


                <button
                  type="button"

                  className="admin-cancel-button"

                  disabled={
                    saving
                  }

                  onClick={
                    closeForm
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"

                  className="admin-primary-button"

                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}

                </button>


              </div>

            </form>


          </div>

        </div>

      )}


    </div>

  );

}


export default ManageCategories;