// src/pages/Comments.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosSecure from "../utils/axiosSecure";
import useCommentLike from "../hooks/useCommentLike";

import { BiLike, BiSolidLike } from "react-icons/bi";

import { useSelector, useDispatch } from "react-redux";
import { clearPostViewState } from "../../redux/slices/postViewSlice";

import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

/* -------------------------------------------------------
   Reusable Reply Input Component
--------------------------------------------------------- */
function ReplyInput({ replyContent, setReplyContent, onSubmit, onCancel, border, card, text }) {
  return (
    <div className="mt-3 ml-3">
      <textarea
        rows="1"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        className={`w-full p-2 rounded border ${border} ${card} ${text}`}
      />
      <div className="flex gap-3 mt-2">
        <button
          onClick={onSubmit}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-neutral-600 text-white rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Comments({ theme }) {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.data);
  const postView = useSelector((state) => state.postView);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null); // can be comment.id or reply-key

  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const loaderRef = useRef(null);

  const isDark = theme === "dark";
  const text = isDark ? "text-white" : "text-black";
  const card = isDark ? "bg-neutral-800" : "bg-white";
  const border = isDark ? "border-neutral-700" : "border-neutral-300";
  const subtle = isDark ? "text-neutral-400" : "text-neutral-600";

  /* -------------------------------------------------------
      LIKE HOOK
  --------------------------------------------------------- */
  const { handleCommentLike } = useCommentLike(
    setComments,
    () => localStorage.getItem("access_token"),
    () => alert("Please log in.")
  );

  /* -------------------------------------------------------
      FETCH POST DETAILS
  --------------------------------------------------------- */
  const fetchPostDetails = async () => {
    try {
      const res = await axiosSecure.get(`/v1/community/posts/${postId}/`);
      setPost(res.data);
    } catch (err) {
      console.log("Post load error:", err);
    }
  };

  /* -------------------------------------------------------
      FETCH COMMENTS
  --------------------------------------------------------- */
  const fetchComments = async () => {
    try {
      const res = await axiosSecure.get(`/v1/community/posts/${postId}/comments/`);

      const formatted = res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      }));

      setComments(formatted);
      setNextCursor(res.data.next);
    } catch (err) {
      console.log("Comments load error:", err);
    }
  };

  /* -------------------------------------------------------
      LOAD MORE COMMENTS
  --------------------------------------------------------- */
  const loadMoreComments = async () => {
    if (!nextCursor) return;

    try {
      const res = await axiosSecure.get(nextCursor);

      const formatted = res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      }));

      setComments((prev) => [...prev, ...formatted]);
      setNextCursor(res.data.next);
    } catch (err) {
      console.log("Load more error:", err);
    }
  };

  /* -------------------------------------------------------
      LOAD REPLIES
  --------------------------------------------------------- */
  const loadReplies = async (commentId) => {
    if (openReplies[commentId]) {
      setOpenReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

      const res = await axiosSecure.get(`/v1/community/comments/${commentId}/replies/`);

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: res.data.results,
                reply_count: res.data.results.length,
              }
            : c
        )
      );

      setOpenReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (err) {
      console.log("Replies load error:", err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  /* -------------------------------------------------------
      ADD COMMENT
  --------------------------------------------------------- */
  const addComment = async () => {
    if (!user) return alert("Please log in.");
    if (!content.trim()) return;

    try {
      const res = await axiosSecure.post(`/v1/community/posts/${postId}/comments/`, {
        content,
      });

      setComments((prev) => [
        { ...res.data, replies: [], reply_count: 0 },
        ...prev,
      ]);

      setContent("");
    } catch (err) {
      console.log("Add comment error:", err);
    }
  };

  /* -------------------------------------------------------
      ADD REPLY
  --------------------------------------------------------- */
  const addReply = async (commentId) => {
    if (!user) return alert("Please log in.");
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
    } catch (err) {
      console.log("Reply error:", err);
    }
  };

  /* -------------------------------------------------------
      DELETE COMMENT
  --------------------------------------------------------- */
 const deleteComment = (commentId) => {
  showConfirm({
    title: "Delete Comment?",
    message: "Are you sure you want to delete this comment?",
    type: "danger",
    confirmText: "Delete",
    cancelText: "Cancel",

    onConfirm: async () => {
      try {
        await axiosSecure.delete(`/v1/community/comments/${commentId}/`);

        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showAlert("Comment deleted.", "success");
      } catch (err) {
        console.log("Delete comment error:", err);
      }
    },
  });
};


  /* -------------------------------------------------------
      DELETE REPLY
  --------------------------------------------------------- */
  const deleteReply = (replyId, commentId) => {
  showConfirm({
    title: "Delete Reply?",
    message: "Are you sure you want to delete this reply?",
    type: "danger",
    confirmText: "Delete",
    cancelText: "Cancel",

    onConfirm: async () => {
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
        showAlert("Reply deleted.", "success");
      } catch (err) {
        console.log("Delete reply error:", err);
      }
    },
  });
};


  /* -------------------------------------------------------
      INITIAL LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);

  /* -------------------------------------------------------
      INFINITE SCROLL
  --------------------------------------------------------- */
  useEffect(() => {
    if (!loaderRef.current) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreComments();
      },
      { threshold: 1 }
    );

    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [nextCursor]);

  /* -------------------------------------------------------
      UI
  --------------------------------------------------------- */

  if (!post) return <p className={text}>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-15 p-4">

      {/* BACK BUTTON */}
      <button
        onClick={() => {
          const view = postView;
          dispatch(clearPostViewState());
          navigate(-1);

          setTimeout(() => {
            if (view.from === "normal-profile") {
              sessionStorage.setItem("normalProfileTab", view.tab || "posts");
              window.scrollTo(0, view.scroll || 0);
            }
            if (view.from === "expert-profile") {
              sessionStorage.setItem("expertActiveTab", view.tab || "posts");
              window.scrollTo(0, view.scroll || 0);
            }
          }, 150);
        }}
        className="mb-4 px-3 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-black dark:text-white"
      >
        ← Back
      </button>

      {/* POST CARD */}
      <div className={`p-6 rounded-xl shadow border ${border} ${card}`}>
        <h1 className={`text-2xl font-bold ${text}`}>{post.title}</h1>
        <p className={`${text} mt-2 leading-relaxed`}>{post.content}</p>

        {/* TAGS */}
{post.tags?.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {post.tags.map((tag) => (
      <span
        key={tag.id}
        className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
      >
        #{tag.name}
      </span>
    ))}
  </div>
)}


        {post.image && (
          <img
            src={post.image}
            className="mt-4 rounded-xl max-h-96 object-cover shadow"
            alt=""
          />
        )}

        <p className={`mt-3 text-sm ${subtle}`}>Posted by @{post.author.username}</p>
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
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Post Comment
        </button>
      </div>

      <h2 className={`text-xl font-bold mt-10 mb-4 ${text}`}>Comments</h2>

      {/* COMMENT LIST */}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className={`p-4 rounded-xl border ${border} ${card} shadow-sm`}>

            {/* HEADER */}
            <div className="flex justify-between items-center">
              <p className={`${text} font-semibold`}>@{c.author.username}</p>

              {user?.id === c.author.id && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            <p className={`${text} mt-2 leading-relaxed`}>{c.content}</p>
            <p className={`text-xs mt-1 ${subtle}`}>
              {new Date(c.created_at).toLocaleString()}
            </p>

            {/* ACTIONS */}
            <div className="flex items-center gap-5 mt-3">
              {/* LIKE */}
              <button
                onClick={() => handleCommentLike(c.id)}
                className="flex items-center gap-1 text-blue-500"
              >
                {c.is_liked ? <BiSolidLike /> : <BiLike />}
                <span className="text-sm">{c.total_likes}</span>
              </button>

              {/* REPLY */}
              <button
                className="text-blue-500 text-sm hover:underline"
                onClick={() => {
                  setActiveReplyBox(`comment-${c.id}`);
                  setReplyContent("");
                }}
              >
                Reply
              </button>

              {/* SHOW REPLIES */}
              {c.reply_count > 0 && (
                <button
                  className="text-blue-500 text-sm hover:underline"
                  onClick={() => loadReplies(c.id)}
                >
                  {openReplies[c.id]
                    ? "Hide Replies"
                    : loadingReplies[c.id]
                    ? "Loading..."
                    : `Show Replies (${c.reply_count})`}
                </button>
              )}
            </div>

            {/* REPLY INPUT FOR COMMENT */}
            {activeReplyBox === `comment-${c.id}` && (
              <ReplyInput
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmit={() => addReply(c.id)}
                onCancel={() => {
                  setActiveReplyBox(null);
                  setReplyContent("");
                }}
                border={border}
                card={card}
                text={text}
              />
            )}

            {/* REPLIES SECTION */}
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
                          className="text-red-400 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className={`${text} mt-1 leading-relaxed`}>{r.content}</p>

                    <p className={`text-xs mt-1 ${subtle}`}>
                      {new Date(r.created_at).toLocaleString()}
                    </p>

                    <div className="flex items-center gap-5 mt-2">
                      {/* LIKE REPLY */}
                      <button
                        onClick={() => {
                          handleCommentLike(r.id);
                        }}
                        className="flex items-center gap-1 text-blue-500"
                      >
                        {r.is_liked ? <BiSolidLike /> : <BiLike />}
                        <span>{r.total_likes}</span>
                      </button>

                      {/* REPLY TO REPLY */}
                      <button
                        className="text-blue-500 text-xs hover:underline"
                        onClick={() => {
                          setActiveReplyBox(`reply-${r.id}`);
                          setReplyContent(`@${r.author.username} `);
                        }}
                      >
                        Reply
                      </button>
                    </div>

                    {/* REPLY INPUT FOR REPLY */}
                    {activeReplyBox === `reply-${r.id}` && (
                      <ReplyInput
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        onSubmit={() => addReply(c.id)}
                        onCancel={() => {
                          setActiveReplyBox(null);
                          setReplyContent("");
                        }}
                        border={border}
                        card={card}
                        text={text}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* LOADER */}
      <div ref={loaderRef} className="h-12 flex justify-center items-center text-gray-400">
        {nextCursor ? "Loading more..." : "No more comments"}
      </div>

      {comments.length === 0 && (
        <p className={`${text} opacity-60 mt-4`}>No comments yet.</p>
      )}
    </div>
  );
}
