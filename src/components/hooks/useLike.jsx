import axiosSecure from "../utils/axiosSecure";

export default function useLike(setPosts, openLoginModal) {

  const handleLike = async (postId) => {
    const token = localStorage.getItem("access");

    if (!token) {
      openLoginModal();
      return;
    }

    try {
      const res = await axiosSecure.post(
        `v1/community/posts/${postId}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPost = res.data.data;

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post))
      );

    } catch (error) {
      console.log("Like API Error:", error);
    }
  };

  return { handleLike };
}
