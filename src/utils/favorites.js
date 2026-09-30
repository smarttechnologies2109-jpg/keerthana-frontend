const FAVORITES_KEY = "keerthana_favorite_songs";

/**
 * Get all favorite songs
 */
export const getFavorites = () => {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);

    if (!saved) {
      return [];
    }

    const favorites = JSON.parse(saved);

    return Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
};

/**
 * Check whether a song is favorite
 */
export const isFavorite = (songId) => {
  const favorites = getFavorites();

  return favorites.some(
    (song) => String(song.id) === String(songId)
  );
};

/**
 * Add a song to favorites
 */
export const addFavorite = (song) => {
  if (!song?.id) {
    return false;
  }

  const favorites = getFavorites();

  const alreadyExists = favorites.some(
    (item) => String(item.id) === String(song.id)
  );

  if (alreadyExists) {
    return false;
  }

  const updatedFavorites = [song, ...favorites];

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(updatedFavorites)
  );

  window.dispatchEvent(
    new CustomEvent("favoritesChanged")
  );

  return true;
};

/**
 * Remove a song from favorites
 */
export const removeFavorite = (songId) => {
  const favorites = getFavorites();

  const updatedFavorites = favorites.filter(
    (song) => String(song.id) !== String(songId)
  );

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(updatedFavorites)
  );

  window.dispatchEvent(
    new CustomEvent("favoritesChanged")
  );

  return true;
};

/**
 * Toggle favorite
 */
export const toggleFavorite = (song) => {
  if (!song?.id) {
    return false;
  }

  if (isFavorite(song.id)) {
    removeFavorite(song.id);
    return false;
  }

  addFavorite(song);
  return true;
};

/**
 * Clear all favorites
 */
export const clearFavorites = () => {
  localStorage.removeItem(FAVORITES_KEY);

  window.dispatchEvent(
    new CustomEvent("favoritesChanged")
  );
};

/**
 * Get number of favorites
 */
export const getFavoritesCount = () => {
  return getFavorites().length;
};