// src/components/posts/useTags.jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    try {
      const res = await axios.get("/api/v1/community/tags/");
      setTags(res.data);
    } catch (err) {
      console.log("Tag load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return { tags, loading };
}
