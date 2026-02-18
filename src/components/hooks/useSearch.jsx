// src/hooks/useSearch.jsx
import { useState, useRef, useCallback } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

export default function useSearchPosts() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const searchPosts = useCallback(async (query) => {
    // Minimum 3 characters
    if (!query || query.trim().length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();

      const token = getAccessToken();
      const client = token ? axiosSecure : axios;
      const prefix = token ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;

      const res = await client.get(
        `${prefix}/community/search/?q=${encodeURIComponent(query)}&limit=5`,
        { signal: controllerRef.current.signal }
      );

      const data = res.data?.results || res.data || [];
      setResults(data.map(normalizePost));
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchPosts, results, setResults, loading, error };
}