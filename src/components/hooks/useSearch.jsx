import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function useSearchPosts() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const searchPosts = async (query) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");

      const res = await axios.get(
        `${API_BASE_URL}/community/search/?q=${query}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      setResults(res.data);
    } catch (err) {
      setError(err.response?.data || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return { searchPosts, results, loading, error };
}
