// src/components/hooks/useLike.jsx
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

export default function useLike(setPosts, tokenGetter, openLoginModal) {
  const handleLike = async (postId) => {
    const token =
      typeof tokenGetter === "function"
        ? tokenGetter()
        : tokenGetter || getAccessToken();

    if (!token) return openLoginModal();

    try {
      const res = await axiosSecure.post(`/v1/community/posts/${postId}/like/`);
      const updated = normalizePost(res.data.data);

      // Only update like state, not the entire post object
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: updated.is_liked,
                total_likes: updated.total_likes,
              }
            : post
        )
      );
    } catch (error) {
      console.log("like-error:", error);
    }
  };

  return { handleLike };
}