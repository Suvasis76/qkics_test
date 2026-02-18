// src/components/utils/normalizePost.js
// Single source of truth for normalizing post/comment data from the API.
// Update here if the backend response shape ever changes.

/**
 * Normalizes a post object from the API.
 * Handles inconsistent is_liked types (bool / string / int) from backend.
 */
export const normalizePost = (p) => ({
  ...p,
  is_liked:
    p.is_liked === true || p.is_liked === "true" || p.is_liked === 1,
  total_likes: Number(p.total_likes || 0),
  tags: Array.isArray(p.tags) ? p.tags : [],
});

/**
 * Normalizes a comment or reply like response from the API.
 */
export const normalizeCommentLike = (data) => ({
  id: Number(data.id),
  parent: data.parent ? Number(data.parent) : null,
  total_likes: Number(data.total_likes || 0),
  is_liked:
    data.is_liked === true || data.is_liked === "true" || data.is_liked === 1,
});