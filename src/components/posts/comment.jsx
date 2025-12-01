import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import useCommentLike from "../hooks/useCommentLike";
import { BiLike, BiSolidLike } from "react-icons/bi";

function Comments({ theme }) {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [content, setContent] = useState("");

  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isDark = theme === "dark";
  const text = isDark ? "text-white" : "text-black";
  const card = isDark ? "bg-neutral-800" : "bg-white";
  const border = isDark ? "border-neutral-700" : "border-neutral-300";

  // Like hook
  const { handleCommentLike } = useCommentLike(setComments);

  /* ------------------ LOAD POST ------------------ */
  const fetchPostDetails = async () => {
    try {
      const res = await axios.get(`/api/v1/community/posts/${postId}/`);
      setPost(res.data);
    } catch (error) {
      console.log("Post load error:", error);
    }
  };

  /* ------------------ LOAD COMMENTS ------------------ */
  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/v1/community/posts/${postId}/comments/`);

      const commentsFixed = res.data.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies, // FIX: reply count always correct
      }));

      setComments(commentsFixed);
    } catch (error) {
      console.log("Comments load error:", error);
    }
  };

  /* ------------------ LOAD REPLIES ------------------ */
  const loadReplies = async (commentId) => {
    if (openReplies[commentId]) {
      setOpenReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

      const res = await axios.get(
        `/api/v1/community/comments/${commentId}/replies/`
      );

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: res.data,
                reply_count: res.data.length, // FIX: update count
              }
            : c
        )
      );

      setOpenReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.log("Replies load error:", error);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  /* ------------------ ADD COMMENT ------------------ */
  const addComment = async () => {
    if (!content.trim()) return;

    try {
      const res = await axiosSecure.post(
        `/v1/community/posts/${postId}/comments/`,
        { content }
      );

      setComments((prev) => [
        { ...res.data, replies: [], reply_count: 0 },
        ...prev,
      ]);

      setContent("");
    } catch (error) {
      console.log("Add comment error:", error);
    }
  };

  /* ------------------ ADD REPLY ------------------ */
  const addReply = async (commentId) => {
    if (!replyContent.trim()) return;

    try {
      const res = await axiosSecure.post(
        `/v1/community/comments/${commentId}/replies/`,
        { content: replyContent }
      );

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [...c.replies, res.data],
                reply_count: c.reply_count + 1,
              }
            : c
        )
      );

      setReplyContent("");
      setActiveReplyBox(null);
      setOpenReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.log("Reply error:", error);
    }
  };

  /* ------------------ DELETE COMMENT ------------------ */
  const deleteComment = async (commentId) => {
    try {
      await axiosSecure.delete(`/v1/community/comments/${commentId}/`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.log("Delete comment error:", error);
    }
  };

  /* ------------------ DELETE REPLY ------------------ */
  const deleteReply = async (replyId, commentId) => {
    try {
      await axiosSecure.delete(`/v1/community/replies/${replyId}/`);

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: c.replies.filter((r) => r.id !== replyId),
                reply_count: c.reply_count - 1,
              }
            : c
        )
      );
    } catch (error) {
      console.log("Delete reply error:", error);
    }
  };

  /* ------------------ INIT LOAD ------------------ */
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);

  if (!post) return <p className={text}>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-15 p-4">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-black dark:text-white"
      >
        ← Back
      </button>

      {/* POST DETAILS */}
      <div className={`p-6 rounded-xl border ${border} ${card}`}>
        <h1 className={`text-2xl font-bold ${text}`}>{post.title}</h1>
        <p className={`${text} mt-2`}>{post.content}</p>

        {post.image && (
          <img
            src={post.image}
            className="mt-4 rounded-xl max-h-96 object-cover"
          />
        )}

        <p className={`mt-3 text-sm opacity-60 ${text}`}>
          Posted by @{post.author.username}
        </p>

        {/* TAGS */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className={`px-3 py-1 text-sm rounded-full border border-blue-400/40 
                ${isDark ? "bg-blue-900/30 text-white" : "bg-blue-100/40 text-blue-600"}`}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ADD COMMENT */}
      <div className={`mt-8 p-4 rounded-xl border ${border} ${card}`}>
        <textarea
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className={`w-full p-3 rounded border ${border} ${card} ${text}`}
        />
        <button
          onClick={addComment}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Post Comment
        </button>
      </div>

      {/* COMMENTS */}
      <h2 className={`text-xl font-bold mt-10 mb-4 ${text}`}>Comments</h2>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className={`p-4 rounded-xl border ${border} ${card}`}>

            {/* Header */}
            <div className="flex justify-between">
              <p className={`${text} font-semibold`}>@{c.author.username}</p>

              {user?.id === c.author.id && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              )}
            </div>

            <p className={`${text} mt-2`}>{c.content}</p>

            <p className="text-xs opacity-50 mt-1">
              {new Date(c.created_at).toLocaleString()}
            </p>

            {/* INLINE BUTTONS */}
            <div className="flex items-center gap-5 mt-3">

              {/* LIKE */}
              <button
                onClick={() => handleCommentLike(c.id)}
                className="flex items-center gap-1 text-blue-500"
              >
                {c.is_liked ? <BiSolidLike /> : <BiLike />}
                <span className="text-sm">{c.total_likes}</span>
              </button>

              {/* Reply */}
              <button
                className="text-blue-500 text-sm"
                onClick={() => {
                  setActiveReplyBox(c.id);
                  setReplyContent("");
                }}
              >
                Reply
              </button>

              {/* Show / Hide */}
              <button
                className="text-purple-500 text-sm"
                onClick={() => loadReplies(c.id)}
              >
                {openReplies[c.id]
                  ? "Hide Replies"
                  : loadingReplies[c.id]
                  ? "Loading..."
                  : `Show Replies (${c.reply_count})`}
              </button>
            </div>

            {/* REPLY BOX */}
            {activeReplyBox === c.id && (
              <div className="mt-3 ml-3">
                <textarea
                  rows="1"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className={`w-full p-2 rounded border ${border} ${card} ${text}`}
                />
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => addReply(c.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => {
                      setActiveReplyBox(null);
                      setReplyContent("");
                    }}
                    className="px-3 py-1 bg-neutral-600 text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- REPLIES ----------------- */}
            {openReplies[c.id] && c.replies.length > 0 && (
              <div className="mt-4 ml-6 border-l pl-4 space-y-3">
                {c.replies.map((r) => (
                  <div key={r.id}>
                    <div className="flex justify-between">
                      <p className={`${text} font-semibold`}>
                        @{r.author.username}
                      </p>

                      {user?.id === r.author.id && (
                        <button
                          onClick={() => deleteReply(r.id, c.id)}
                          className="text-red-400 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className={`${text} mt-1`}>{r.content}</p>

                    <p className="text-xs opacity-50 mt-1">
                      {new Date(r.created_at).toLocaleString()}
                    </p>

                    {/* Reply layer */}
                    <div className="flex items-center gap-5 mt-2">

                      {/* Like reply */}
                      <button
                        onClick={() => {
                          handleCommentLike(r.id);
                          setOpenReplies((prev) => ({
                            ...prev,
                            [c.id]: true, // FIX: keep replies open
                          }));
                        }}
                        className="flex items-center gap-1 text-blue-500"
                      >
                        {r.is_liked ? <BiSolidLike /> : <BiLike />}
                        <span>{r.total_likes}</span>
                      </button>

                      {/* Reply to reply */}
                      <button
                        className="text-blue-500 text-xs"
                        onClick={() => {
                          setActiveReplyBox(r.id);
                          setReplyContent(`@${r.author.username} `);
                        }}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Nested reply box */}
                    {activeReplyBox === r.id && (
                      <div className="mt-2 ml-3">
                        <textarea
                          rows="1"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className={`w-full p-2 rounded border ${border} ${card} ${text}`}
                        />
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => addReply(c.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded"
                          >
                            Post Reply
                          </button>
                          <button
                            onClick={() => {
                              setActiveReplyBox(null);
                              setReplyContent("");
                            }}
                            className="px-3 py-1 bg-neutral-600 text-white rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <p className={`${text} opacity-60 mt-4`}>No comments yet.</p>
      )}
    </div>
  );
}

export default Comments;
