"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2 } from "lucide-react";

type PostProps = {
  id: number;
  author: string;
  authorAvatar?: string;
  content: string;
  initialLikes: string[];
  commentCount: number;
  currentUser: string; 
};

type Comment = {
  id: number;
  author_username: string;
  content: string;
};

export default function FeedPost({ id, author, authorAvatar, content, initialLikes, commentCount, currentUser }: PostProps) {
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isHovering, setIsHovering] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);

  const hasLiked = likes.includes(currentUser);

  const handleLike = async () => {
    if (!currentUser || currentUser === "Anonymous") return alert("Log in to like posts!");
    setLikes(hasLiked ? likes.filter((name) => name !== currentUser) : [...likes, currentUser]);
    try {
      await fetch(`http://localhost:8000/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });
    } catch (error) {
      setLikes(hasLiked ? [...likes, currentUser] : likes.filter((name) => name !== currentUser));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`http://localhost:3000/post/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const toggleComments = async () => {
    const willShow = !showComments;
    setShowComments(willShow);
    
    if (willShow && commentsList.length === 0 && localCommentCount > 0) {
      setIsFetchingComments(true);
      try {
        const res = await fetch(`http://localhost:8000/posts/${id}/comments`);
        const data = await res.json();
        setCommentsList(data);
      } catch (err) {
        console.error("Failed to fetch comments");
      } finally {
        setIsFetchingComments(false);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || currentUser === "Anonymous") return;
    
    setIsPostingReply(true);
    try {
      const res = await fetch(`http://localhost:8000/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: currentUser, content: replyText }),
      });
      const newComment = await res.json();
      setCommentsList([...commentsList, newComment]);
      setLocalCommentCount(prev => prev + 1);
      setReplyText("");
    } catch (err) {
      alert("Failed to post reply");
    } finally {
      setIsPostingReply(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/40 backdrop-blur-2xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:bg-white/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white/60 flex items-center justify-center text-indigo-700 font-bold uppercase shadow-sm overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt={author} className="w-full h-full object-cover" />
            ) : (
              author.charAt(0)
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{author}</h2>
            <p className="text-xs text-gray-500">Just now</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-gray-800 text-[15px] leading-relaxed mb-4 ml-1">
        {content}
      </p>
      
      <div className="flex items-center gap-6 pt-3 border-t border-white/40">
        <div className="relative flex items-center" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            className={`flex items-center gap-2 group transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <div className={`p-2 rounded-full transition-colors ${hasLiked ? 'bg-red-50' : 'group-hover:bg-white/60'}`}>
              <Heart className="w-4 h-4" fill={hasLiked ? "currentColor" : "none"} strokeWidth={hasLiked ? 0 : 2} />
            </div>
            <span className="text-sm font-medium">{likes.length > 0 ? likes.length : ''}</span>
          </motion.button>
          
          <AnimatePresence>
            {isHovering && likes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full left-0 mb-2 whitespace-nowrap bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">
                Liked by {likes.join(", ")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={toggleComments} className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 group transition-colors">
          <div className="p-2 rounded-full group-hover:bg-white/60 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{localCommentCount > 0 ? localCommentCount : ''}</span>
        </button>

        <button onClick={handleShare} className="flex items-center gap-2 text-gray-500 hover:text-green-500 group transition-colors ml-auto">
          <div className="p-2 rounded-full group-hover:bg-white/60 transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{copied ? "Copied" : ""}</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-2 border-t border-white/40">
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {isFetchingComments ? (
                  <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                ) : commentsList.length > 0 ? (
                  commentsList.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/60 border border-white/50 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-700 uppercase shadow-sm">
                        {c.author_username.charAt(0)}
                      </div>
                      <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl rounded-tl-none px-3 py-2 text-sm text-gray-800 shadow-sm">
                        <span className="font-semibold block text-xs text-gray-900">{c.author_username}</span>
                        {c.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No comments yet. Be the first!</p>
                )}
              </div>

              <form onSubmit={handleReplySubmit} className="flex gap-3">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..." 
                  className="flex-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm" 
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim() || isPostingReply}
                  className="bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isPostingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reply"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}