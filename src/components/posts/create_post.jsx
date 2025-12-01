import { useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import useTags from "../hooks/useTags";

function CreatePostModal({ onClose, onSuccess, isDark, post }) {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [selectedTags, setSelectedTags] = useState(
    post ? post.tags.map((t) => t.id) : []
  );
  const [loading, setLoading] = useState(false);

  const { tags, loading: loadingTags } = useTags();

  const bg = isDark ? "bg-neutral-900 text-white" : "bg-white text-black";
  const inputBg = isDark ? "bg-neutral-800 text-white" : "bg-neutral-100 text-black";
  const border = isDark ? "border-neutral-700" : "border-neutral-300";

  // Toggle tag selection (max 5)
  const toggleTag = (tag) => {
    const exists = selectedTags.includes(tag.id);

    if (exists) {
      setSelectedTags(selectedTags.filter((t) => t !== tag.id));
    } else {
      if (selectedTags.length >= 5) {
        alert("You can select a maximum of 5 tags.");
        return;
      }
      setSelectedTags([...selectedTags, tag.id]);
    }
  };

  // Handle submit (create or edit)
  const handleSubmit = async () => {
    if (!content.trim()) return alert("Content is required!");

    if (title.length > 200) return alert("Title max length is 200 characters.");
    if (content.length > 8000) return alert("Content max length is 8000 characters.");

    const payload = {
      title: title || null,
      content,
      tags: selectedTags,
    };

    setLoading(true);

    try {
      let res;

      if (post) {
        // UPDATE
        res = await axiosSecure.put(
          `/v1/community/posts/${post.id}/`,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        alert("Post updated!");
      } else {
        // CREATE
        res = await axiosSecure.post(
          "/v1/community/posts/",
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        alert("Post created!");
      }

      setLoading(false);
      onSuccess(res.data);
      onClose();
    } catch (error) {
      console.log("Post error:", error.response?.data);
      alert("Action failed!");
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-xl overflow-y-auto p-6 rounded-2xl shadow-xl ${bg} border ${border}`}
      >
        <h2 className="text-xl font-semibold mb-4">
          {post ? "Edit Post" : "Create a Post"}
        </h2>

        {/* Title */}
        <h3 className="text-sm font-semibold mb-2">Title :</h3>
        <input
          type="text"
          placeholder="Write your post title here..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 mb-1 rounded border ${border} ${inputBg}`}
          minLength={3}
          maxLength={200}
        />
        <p className="text-xs opacity-60 mb-3">{title.length}/200</p>

        {/* Content */}
        <h3 className="text-sm font-semibold mb-2">Content <span className="text-red-500">*</span> :</h3>
        <textarea
          placeholder="Write your post content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 mb-1 rounded border ${border} ${inputBg}`}
          maxLength={8000}
          required
        />
        <p className="text-xs opacity-60 mb-3">{content.length}/8000</p>

        {/* TAGS */}
        <h3 className="text-sm font-semibold mb-2">Tags (max 5) :</h3>

        {loadingTags ? (
          <p className="text-xs opacity-70 mb-4">Loading Tags...</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
            {tags.map((tag) => {
              const isActive = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : `${border} ${inputBg} hover:bg-neutral-200/50`
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-neutral-500 text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            {loading ? "Saving..." : post ? "Update" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal;
