// src/hooks/useSearchProfiles.js
import { useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function useSearchProfiles() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const controllerRef = useRef(null);

  const searchProfiles = async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      const res = await axios.get(
        `${API_BASE_URL}v1/auth/search/?q=${encodeURIComponent(query)}`,
        { signal: controllerRef.current.signal }
      );

      setResults(res.data?.results || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error("Profile search failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return { searchProfiles, results, loading };
}
