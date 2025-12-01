import { useState, useEffect } from "react";
import axiosSecure from "../utils/axiosSecure";

export default function useFeed(selectedTag, searchQuery) {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  // 🔥 FIX: Load logged-in user once so ⋮ appears
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(u);
  }, []);

  const loadFeed = async () => {
    try {
      let url = "/v1/community/posts/";

      // LIVE SEARCH HAS HIGHEST PRIORITY
      if (searchQuery && searchQuery.trim() !== "") {
        url = `/v1/community/search/?q=${searchQuery}`;
      }

      // TAG FILTER (ONLY IF NOT SEARCHING)
      else if (selectedTag) {
        url = `/v1/community/tags/${selectedTag}/posts/`;
      }

      const res = await axiosSecure.get(url);
      setPosts(res.data);
    } catch (error) {
      console.log("Feed load error:", error);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [selectedTag, searchQuery]); // search triggers instantly

  return { posts, setPosts, user };
}
