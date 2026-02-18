// src/components/hooks/useFeed.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

export default function useFeed(_, searchQuery) {
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const extractResults = (data) => {
    if (Array.isArray(data)) return { results: data, next: null };
    return { results: data.results || [], next: data.next || null };
  };

  const getClient = () => {
    const token = getAccessToken();
    return token ? axiosSecure : axios;
  };

  /** -----------------------------
   * LOAD FEED (NORMAL OR SEARCH)
   -------------------------------- */
  const loadFeed = async () => {
    const client = getClient();
    const token = getAccessToken();
    let url = "";

    if (searchQuery && searchQuery.trim() !== "") {
      const cleanQuery = searchQuery.replace(/-/g, " ");
      const prefix = token ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;
      url = `${prefix}/community/search/?q=${cleanQuery}`;
    } else {
      const prefix = token ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;
      url = `${prefix}/community/posts/`;
    }

    setPosts([]);
    setNext(null);

    const res = await client.get(url);
    const parsed = extractResults(res.data);
    setPosts(parsed.results.map(normalizePost));
    setNext(parsed.next);
  };

  /** -----------------------------
   * INFINITE LOAD MORE
   -------------------------------- */
  const loadMore = async () => {
    if (!next) return;

    const client = getClient();
    const res = await client.get(next);
    const parsed = extractResults(res.data);

    setPosts((prev) => [...prev, ...parsed.results.map(normalizePost)]);
    setNext(parsed.next);
  };

  /** -----------------------------
   * INFINITE SCROLL OBSERVER
   -------------------------------- */
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [next]);

  /** -----------------------------
   * RELOAD FEED WHEN SEARCH CHANGES
   -------------------------------- */
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadFeed();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return { posts, setPosts, loaderRef, next };
}