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
function ReplyInput({
  replyContent,
  setReplyContent,
  onSubmit,
  onCancel,
  border,
  card,
  text,
}) {
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

export default function Comments() {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const dispatch = useDispatch();
  const { data: user, theme } = useSelector((state) => state.user);
  const postView = useSelector((state) => state.postView);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const [replyNextCursor, setReplyNextCursor] = useState({});


  const loaderRef = useRef(null);

  const isDark = theme === "dark";
  const text = isDark ? "text-white" : "text-black";
  const card = isDark ? "bg-neutral-800" : "bg-white";
  const border = isDark ? "border-neutral-700" : "border-neutral-300";
  const subtle = isDark ? "text-neutral-400" : "text-neutral-600";


  const normalizeContent = (text, previewLimit = 300, fullLimit = 5000) => {
    const normalized = text.slice(0, fullLimit);

    return {
      preview_content: normalized.slice(0, previewLimit),
      full_content: normalized,
    };
  };


  /* -------------------------------------------------------
      LIKE HOOK
  --------------------------------------------------------- */
  const { handleCommentLike } = useCommentLike(
    setComments,
    () => localStorage.getItem("access_token"),
    () => alert("Please log in.")
  );

  /* -------------------------------------------------------
      FETCH POST
  --------------------------------------------------------- */
  const fetchPostDetails = async () => {
    const res = await axiosSecure.get(`/v1/community/posts/${postId}/`);
    setPost(res.data);
  };

  /* -------------------------------------------------------
      FETCH COMMENTS
  --------------------------------------------------------- */
  const fetchComments = async () => {
    const res = await axiosSecure.get(
      `/v1/community/posts/${postId}/comments/`
    );

    setComments(
      res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      }))
    );
    setNextCursor(res.data.next);
  };

  /* -------------------------------------------------------
      LOAD MORE COMMENTS
  --------------------------------------------------------- */
  const loadMoreComments = async () => {
    if (!nextCursor) return;

    const res = await axiosSecure.get(nextCursor);

    setComments((prev) => [
      ...prev,
      ...res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      })),
    ]);
    setNextCursor(res.data.next);
  };

  /* -------------------------------------------------------
      LOAD REPLIES
  --------------------------------------------------------- */
  const loadReplies = async (commentId, cursor = null) => {
    // toggle close
    if (openReplies[commentId] && !cursor) {
      setOpenReplies((p) => ({ ...p, [commentId]: false }));
      return;
    }

    setLoadingReplies((p) => ({ ...p, [commentId]: true }));

    const url = cursor
      ? cursor
      : `/v1/community/comments/${commentId}/replies/`;

    const res = await axiosSecure.get(url);

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
            ...c,
            replies: cursor
              ? [...c.replies, ...res.data.results]
              : res.data.results,
          }
          : c
      )
    );

    setReplyNextCursor((p) => ({
      ...p,
      [commentId]: res.data.next,
    }));

    setOpenReplies((p) => ({ ...p, [commentId]: true }));
    setLoadingReplies((p) => ({ ...p, [commentId]: false }));
  };



  /* -------------------------------------------------------
      ADD COMMENT
  --------------------------------------------------------- */
  const addComment = async () => {
    if (!user || !content.trim()) return;

    const payload = normalizeContent(content, 300, 5000);

    const res = await axiosSecure.post(
      `/v1/community/posts/${postId}/comments/`,
      payload
    );

    setComments((p) => [
      { ...res.data, replies: [], reply_count: 0 },
      ...p,
    ]);

    setContent("");
  };


  /* -------------------------------------------------------
      ADD REPLY
  --------------------------------------------------------- */
  const addReply = async (commentId) => {
    if (!user || !replyContent.trim()) return;

    const payload = normalizeContent(replyContent, 300, 5000);

    const res = await axiosSecure.post(
      `/v1/community/comments/${commentId}/replies/`,
      payload
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
    setOpenReplies((p) => ({ ...p, [commentId]: true }));
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
        await axiosSecure.delete(
          `/v1/community/comments/${commentId}/`
        );
        setComments((p) => p.filter((c) => c.id !== commentId));
        showAlert("Comment deleted", "success");
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
        await axiosSecure.delete(
          `/v1/community/replies/${replyId}/`
        );
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
        showAlert("Reply deleted", "success");
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
      (e) => e[0].isIntersecting && loadMoreComments(),
      { threshold: 1 }
    );

    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [nextCursor]);

  if (!post) return <p className={text}>Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-15">

      {/* BACK BUTTON */}
      <button
        onClick={() => {
          const view = postView;
          dispatch(clearPostViewState());
          navigate(-1);

          setTimeout(() => {
            if (view.from === "normal-profile") {
              sessionStorage.setItem(
                "normalProfileTab",
                view.tab || "posts"
              );
            }
            if (view.from === "expert-profile") {
              sessionStorage.setItem(
                "expertActiveTab",
                view.tab || "posts"
              );
            }
            window.scrollTo(0, view.scroll || 0);
          }, 150);
        }}
        className="mb-4 px-3 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-black dark:text-white"
      >
        ← Back
      </button>

      {/* 50 / 50 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — POST */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className={`p-5 rounded-xl border ${border} ${card}`}>
            <h1 className={`text-xl font-bold ${text}`}>{post.title}</h1>

            <p className={`${text} mt-3 leading-relaxed`}>
              {post.content}
            </p>

            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    // onClick={() => applySearch(tag.slug)} // 🔥 tag → search
                    className={`px-3 py-1 text-xs  rounded-full border 
                          ${isDark
                        ? "bg-blue-900/30 text-blue-300 border-blue-800"
                        : "bg-blue-100 text-blue-700 border-blue-300"
                      } hover:bg-blue-200/40`}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {post.image && (
              <img
                src={post.image}
                alt="post"
                className="mt-4 w-full max-h-[420px] object-contain rounded-lg"
              />
            )}

            <p className={`mt-4 text-sm ${subtle}`}>
              Posted by @{post.author.username}
            </p>
          </div>
        </div>

        {/* RIGHT — COMMENTS */}
        <div>

          {/* ADD COMMENT */}
          <div className={`p-4 rounded-xl border ${border} ${card}`}>
            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className={`w-full p-3 rounded border ${border} ${card} ${text}`}
            />
            <button
              onClick={addComment}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Post Comment
            </button>
          </div>

          {/* COMMENTS LIST */}
          <div className="mt-6 space-y-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border ${border} ${card}`}
              >
                <div className="flex justify-between">
                  <p className={`${text} font-semibold`}>
                    @{c.author.username}
                  </p>

                  {user?.id === c.author.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className={`${text} mt-2`}>{c.content}</p>

                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleCommentLike(c.id)}
                    className="flex items-center gap-1 text-blue-500"
                  >
                    {c.is_liked ? <BiSolidLike /> : <BiLike />}
                    {c.total_likes}
                  </button>

                  <button
                    className="text-blue-500 text-sm hover:underline"
                    onClick={() => {
                      setActiveReplyBox(`comment-${c.id}`);
                      setReplyContent("");
                    }}
                  >
                    Reply
                  </button>

                  {c.reply_count > 0 && (
                    <button
                      className="text-blue-500 text-sm hover:underline"
                      onClick={() => loadReplies(c.id)}
                    >
                      {openReplies[c.id]
                        ? "Hide Replies"
                        : `Show Replies (${c.reply_count})`}
                    </button>
                  )}
                </div>

                {activeReplyBox === `comment-${c.id}` && (
                  <ReplyInput
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    onSubmit={() => addReply(c.id)}
                    onCancel={() => setActiveReplyBox(null)}
                    border={border}
                    card={card}
                    text={text}
                  />
                )}

                {openReplies[c.id] && (
                  <div className="ml-6 mt-4 space-y-3 border-l pl-4">
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

                        <p className={`${text}`}>{r.content}</p>

                        <div className="flex gap-4 mt-1">
                          <button
                            onClick={() => handleCommentLike(r.id)}
                            className="flex items-center gap-1 text-blue-500"
                          >
                            {r.is_liked ? <BiSolidLike /> : <BiLike />}
                            {r.total_likes}
                          </button>

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

                        {activeReplyBox === `reply-${r.id}` && (
                          <ReplyInput
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmit={() => addReply(c.id)}
                            onCancel={() => setActiveReplyBox(null)}
                            border={border}
                            card={card}
                            text={text}
                          />
                        )}
                      </div>
                    ))}

                    {/* LOAD MORE REPLIES */}
                    {replyNextCursor[c.id] && (
                      <button
                        onClick={() => loadReplies(c.id, replyNextCursor[c.id])}
                        className="text-blue-500 text-sm mt-2 hover:underline"
                      >
                        {loadingReplies[c.id] ? "Loading..." : "Load more replies"}
                      </button>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* LOADER */}
          <div
            ref={loaderRef}
            className="h-12 flex justify-center items-center text-gray-400"
          >
            {nextCursor ? "Loading more..." : "No more comments"}
          </div>
        </div>
      </div>
    </div>
  );
}
