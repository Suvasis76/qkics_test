// src/components/hooks/useCommentLike.js
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";

export default function useCommentLike(setComments, tokenGetter, openLoginModal) {
  
  /* ---------------------------------------
      GET TOKEN (LocalStorage + Memory Fallback)
  ----------------------------------------- */
  const getToken = () => {
    if (typeof tokenGetter === "function") {
      return tokenGetter() || localStorage.getItem("access_token") || getAccessToken();
    }
    return tokenGetter || localStorage.getItem("access_token") || getAccessToken();
  };

  /* ---------------------------------------
      NORMALIZE SERVER-LIKE RESPONSE
  ----------------------------------------- */
  const normalize = (data) => ({
    id: Number(data.id),
    parent: data.parent ? Number(data.parent) : null,
    total_likes: Number(data.total_likes || 0),
    is_liked: data.is_liked === true || data.is_liked === "true" || data.is_liked === 1,
  });

  /* ---------------------------------------
      LIKE HANDLER
  ----------------------------------------- */
  const handleCommentLike = async (commentId) => {
    const token = getToken();

    if (!token) {
      openLoginModal?.(); // optional & safe
      return;
    }

    try {
      const res = await axiosSecure.post(`/v1/community/comments/${commentId}/like/`);

      const updated = normalize(res.data.data);

      /* ---------------------------------------
          UPDATE UI ACCORDING TO COMMENT TYPE
      ----------------------------------------- */
      setComments((prev) =>
        prev.map((comment) => {
          // 1️⃣ CASE: Parent comment
          if (comment.id === updated.id && updated.parent === null) {
            return {
              ...comment,
              total_likes: updated.total_likes,
              is_liked: updated.is_liked,
            };
          }

          // 2️⃣ CASE: Reply inside this comment
          if (comment.replies?.some((r) => r.id === updated.id)) {
            return {
              ...comment,
              replies: comment.replies.map((r) =>
                r.id === updated.id
                  ? {
                      ...r,
                      total_likes: updated.total_likes,
                      is_liked: updated.is_liked,
                    }
                  : r
              ),
            };
          }

          return comment;
        })
      );
    } catch (err) {
      console.log("Comment like error:", err);
    }
  };

  return { handleCommentLike };
}
