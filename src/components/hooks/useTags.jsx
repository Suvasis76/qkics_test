// src/components/hooks/useTags.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTags } from "../../redux/slices/tagsSlice";

// Tags almost never change, so they're stored in Redux and fetched once.
// Any component calling useTags() after the first will get the cached data
// instantly with no network request.
export default function useTags() {
  const dispatch = useDispatch();
  const { items: tags, loading } = useSelector((state) => state.tags);

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  return { tags, loading };
}