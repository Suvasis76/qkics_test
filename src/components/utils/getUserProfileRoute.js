// src/components/utils/getUserProfileRoute.js
// Single source of truth for mapping user_type → profile route.
// Add new user types here — they'll be reflected everywhere automatically.

/**
 * Returns the profile route for a given user_type.
 * Used by Navbar, Home, SearchResultsPage, and any future page.
 */
export const getOwnProfileRoute = (userType) => {
  switch (userType) {
    case "expert":       return "/expert";
    case "entrepreneur": return "/entrepreneur";
    case "investor":     return "/investor";
    case "admin":        return "/admin";
    case "superadmin":   return "/superadmin";
    default:             return "/normal";
  }
};

/**
 * Resolves where to navigate when a user clicks on a profile card.
 * - If it's the logged-in user's own profile → go to their own profile page
 * - If no logged-in user, or it's someone else → go to /profile/:username
 *
 * @param {object} author       - The post/card author { username, user_type, ... }
 * @param {object|null} loggedUser  - Current logged-in user from Redux
 * @returns {string}            - The route to navigate to
 */
export const resolveProfileRoute = (author, loggedUser) => {
  if (!loggedUser || loggedUser.username !== author.username) {
    return `/profile/${author.username}`;
  }
  return getOwnProfileRoute(loggedUser.user_type);
};