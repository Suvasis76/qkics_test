import { useState, useEffect, useRef } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";

export default function useFeed(selectedTag, searchQuery) {
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const normalize = (p) => ({
    ...p,
    is_liked:
      p.is_liked === true ||
      p.is_liked === "true" ||
      p.is_liked === 1,
    total_likes: Number(p.total_likes || 0),
    tags: Array.isArray(p.tags) ? p.tags : [],
  });

  const extractResults = (data) => {
    if (Array.isArray(data)) return { results: data, next: null };
    return { results: data.results || [], next: data.next || null };
  };

  // LOGIN → axiosSecure + /v1
  // LOGOUT → axios + /api/v1
  const getClientAndPrefix = () => {
    const token = getAccessToken();
    if (token) {
      return { client: axiosSecure, prefix: "/v1" };
    }
    return { client: axios, prefix: "/api/v1" };
  };

  // LOAD FIRST PAGE
  const loadFeed = async () => {
    const { client, prefix } = getClientAndPrefix();

    let url = `${prefix}/community/posts/`;

    if (selectedTag) url += `?tag=${selectedTag}`;
    if (searchQuery) url += `${selectedTag ? "&" : "?"}search=${searchQuery}`;

    const res = await client.get(url);
    const parsed = extractResults(res.data);
    const freshPosts = parsed.results.map(normalize);

    setPosts((prev) => {
      const map = new Map();

      prev.forEach((p) => map.set(p.id, p));

      freshPosts.forEach((p) => {
        if (map.has(p.id)) {
          const local = map.get(p.id);
          map.set(p.id, { ...p, ...local }); // preserve likes
        } else {
          map.set(p.id, p);
        }
      });

      return Array.from(map.values()).sort((a, b) => b.id - a.id);
    });

    setNext(parsed.next);
  };

  // LOAD MORE
  const loadMore = async () => {
    if (!next) return;

    const token = getAccessToken();
    const client = token ? axiosSecure : axios;

    const res = await client.get(next);
    const parsed = extractResults(res.data);

    const newPosts = parsed.results.map(normalize);

    setPosts((prev) => {
      const map = new Map();
      prev.forEach((p) => map.set(p.id, p));

      newPosts.forEach((p) => {
        if (map.has(p.id)) {
          const local = map.get(p.id);
          map.set(p.id, { ...p, ...local });
        } else {
          map.set(p.id, p);
        }
      });

      return Array.from(map.values()).sort((a, b) => b.id - a.id);
    });

    setNext(parsed.next);
  };

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && next) loadMore();
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [next]);

  useEffect(() => {
    loadFeed();
  }, [selectedTag, searchQuery]);

  return { posts, setPosts, loaderRef };
}
