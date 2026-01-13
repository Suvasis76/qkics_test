import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaUser, FaRegComment, FaRegHeart } from "react-icons/fa";
import { HiOutlineHashtag } from "react-icons/hi";

import useSearchPosts from "../components/hooks/useSearch";
import useSearchProfiles from "../components/hooks/useSearchProfiles";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "posts";

  const {
    searchPosts,
    results: postResults,
    loading: postLoading,
  } = useSearchPosts();

  const {
    searchProfiles,
    results: profileResults,
    loading: profileLoading,
  } = useSearchProfiles();

  // THEME COLORS
  const bg = isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]";
  const cardBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const text = isDark ? "text-[#eaeaea]" : "text-[#111111]";
  const mutedText = isDark ? "text-neutral-500" : "text-neutral-500";
  const borderColor = isDark ? "border-white/10" : "border-black/5";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";

  /* 🔄 Fetch when query or tab changes */
  useEffect(() => {
    if (!query.trim()) return;

    if (type === "posts") {
      searchPosts(query);
    } else if (type === "profiles") {
      searchProfiles(query);
    }
  }, [query, type, searchPosts, searchProfiles]);

  const switchTab = (nextType) => {
    const next = new URLSearchParams(searchParams);
    next.set("type", nextType);
    setSearchParams(next);
  };

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${text}`}>
            Search results for <span className="text-red-500">“{query}”</span>
          </h1>
          <p className={`${mutedText} text-sm mt-1`}>
            Showing {type === "posts" ? postResults.length : profileResults.length} results
          </p>
        </div>

        {/* TABS */}
        <div className={`flex gap-6 border-b ${borderColor} mb-8`}>
          <button
            onClick={() => switchTab("posts")}
            className={`pb-3 text-sm font-semibold transition-all relative ${type === "posts" ? "text-red-500" : `${mutedText} hover:${text}`
              }`}
          >
            Posts
            {type === "posts" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => switchTab("profiles")}
            className={`pb-3 text-sm font-semibold transition-all relative ${type === "profiles" ? "text-red-500" : `${mutedText} hover:${text}`
              }`}
          >
            People
            {type === "profiles" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* RESULTS */}
        <div className="space-y-4">
          {/* POSTS */}
          {type === "posts" && (
            <>
              {postLoading && (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-32 rounded-2xl animate-pulse ${cardBg} border ${borderColor}`} />
                  ))}
                </div>
              )}

              {!postLoading && postResults.length === 0 && (
                <div className={`text-center py-20 rounded-2xl ${cardBg} border ${borderColor}`}>
                  <p className={mutedText}>No posts found matching your search.</p>
                </div>
              )}

              {!postLoading &&
                postResults.map((post) => (
                  <article
                    key={post.id}
                    className={`p-5 rounded-2xl border ${borderColor} ${cardBg} ${hoverBg} transition-all cursor-pointer group`}
                    onClick={() => navigate(`/post/${post.id}/comments`)}
                  >
                    <div className="flex gap-4">
                      {post.image && (
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/5">
                          <img src={post.image} className="w-full h-full object-cover" alt="" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full`}>
                            Post
                          </span>
                          <span className={`text-xs ${mutedText}`}>@{post.author.username}</span>
                        </div>
                        <h3 className={`font-bold ${text} mb-2 line-clamp-1 group-hover:text-red-500 transition-colors`}>
                          {post.title}
                        </h3>
                        <p className={`text-sm ${mutedText} line-clamp-2 leading-relaxed`}>
                          {post.content}
                        </p>

                        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          <span className="flex items-center gap-1"><FaRegHeart /> {post.total_likes}</span>
                          <span className="flex items-center gap-1"><FaRegComment /> {post.total_comments}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </>
          )}

          {/* PROFILES */}
          {type === "profiles" && (
            <>
              {profileLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-20 rounded-2xl animate-pulse ${cardBg} border ${borderColor}`} />
                  ))}
                </div>
              )}

              {!profileLoading && profileResults.length === 0 && (
                <div className={`text-center py-20 rounded-2xl ${cardBg} border ${borderColor}`}>
                  <p className={mutedText}>No people found matching your search.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!profileLoading &&
                  profileResults.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border ${borderColor} ${cardBg} ${hoverBg} transition-all cursor-pointer`}
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      <div className="relative">
                        <img
                          src={
                            user.profile_picture ||
                            `https://ui-avatars.com/api/?name=${user.first_name || user.username}&background=random`
                          }
                          alt={user.username}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/5"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-[#1a1a1a]" />
                      </div>

                      <div className="min-w-0">
                        <p className={`font-bold ${text} truncate`}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p className={`text-xs ${mutedText} truncate`}>
                          @{user.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-tighter bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                            {user.user_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
