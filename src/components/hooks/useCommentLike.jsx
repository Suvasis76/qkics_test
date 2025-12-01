import axiosSecure from "../utils/axiosSecure";

export default function useCommentLike(setComments) {
  const handleCommentLike = async (commentId) => {
    try {
      const res = await axiosSecure.post(
        `/v1/community/comments/${commentId}/like/`
      );

      const updated = res.data.data;

      setComments((prev) =>
        prev.map((c) => {
          // 1️⃣ If parent comment liked → replace only parent, keep replies same
          if (c.id === updated.id && updated.parent === null) {
            return {
              ...c,
              total_likes: updated.total_likes,
              is_liked: updated.is_liked,
            };
          }

          // 2️⃣ If reply liked → update only that reply
          const replyExists = c.replies?.some((r) => r.id === commentId);

          if (replyExists) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? {
                      ...r,
                      total_likes: updated.total_likes,
                      is_liked: updated.is_liked,
                    }
                  : r
              ),
            };
          }

          return c;
        })
      );
    } catch (error) {
      console.log("Comment like error:", error);
    }
  };

  return { handleCommentLike };
}
