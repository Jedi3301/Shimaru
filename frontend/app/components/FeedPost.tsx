"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // NEW
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Trash2, Flag } from "lucide-react";

type PostProps = {
  id: number;
  author: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string; 
  initialLikes: string[];
  commentCount: number;
  currentUser: string; 
  isIsolated?: boolean; // NEW: Tells the component if it's already on the dedicated page
};

type Comment = {
  id: number;
  author_username: string;
  content: string;
};

export default function FeedPost({ id, author, authorAvatar, content, imageUrl, initialLikes, commentCount, currentUser, isIsolated = false }: PostProps) {
  const router = useRouter(); // NEW
  
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isHovering, setIsHovering] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // If we are on the isolated page, show comments by default!
  const [showComments, setShowComments] = useState(isIsolated);
  
  const [replyText, setReplyText] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);

  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasLiked = likes.includes(currentUser);
  const isAuthor = currentUser === author;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch comments automatically if isolated
  useEffect(() => {
    if (isIsolated) {
      fetchComments();
    }
  }, [isIsolated]);

  const fetchComments = async () => {
    if (localCommentCount === 0) return;
    setIsFetchingComments(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/posts/${id}/comments`);
      const data = await res.json();
      if (Array.isArray(data)) setCommentsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingComments(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/posts/${id}?username=${currentUser}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIsDeleted(true);
      
      // If we are on the dedicated page and delete it, go back home
      if (isIsolated) router.push('/');
      
    } catch (error) {
      alert("Failed to delete post.");
      setIsDeleting(false);
    }
  };

  if (isDeleted) return null;

  const handleLike = async () => {
    if (!currentUser || currentUser === "Anonymous") return alert("Log in to like posts!");
    setLikes(hasLiked ? likes.filter((name) => name !== currentUser) : [...likes, currentUser]);
    try {
      await fetch(`http://127.0.0.1:8000/posts/${id}/like`, {
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
      fetchComments();
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || currentUser === "Anonymous") return;
    setIsPostingReply(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/posts/${id}/comments`, {
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

  // NEW: Navigate to the post page
  const handleNavigate = () => {
    if (!isIsolated) {
      router.push(`/post/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
      className={`bg-white/40 backdrop-blur-2xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all ${isIsolated ? 'bg-white/60' : 'hover:bg-white/50'} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white/60 flex items-center justify-center text-indigo-700 font-bold uppercase shadow-sm overflow-hidden">
            {authorAvatar ? <img src={authorAvatar} alt={author} className="w-full h-full object-cover" /> : author.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{author}</h2>
            <p className="text-xs text-gray-500">Just now</p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-white/60 transition-colors focus:outline-none">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-10 w-40 bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl py-2 z-50 overflow-hidden">
                {isAuthor ? (
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"><Trash2 className="w-4 h-4" /> Delete Post</button>
                ) : (
                  <button onClick={() => { setShowMenu(false); alert("Reported."); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left"><Flag className="w-4 h-4" /> Report Post</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NEW: Clickable Content Wrapper */}
      <div 
        onClick={handleNavigate} 
        className={!isIsolated ? "cursor-pointer group" : ""}
      >
        {content && (
          <p className={`text-gray-800 text-[15px] leading-relaxed mb-4 ml-1 whitespace-pre-wrap ${!isIsolated ? "group-hover:text-gray-900 transition-colors" : ""}`}>
            {content}
          </p>
        )}

        {imageUrl && (
          <div className={`mb-4 mt-2 rounded-xl overflow-hidden border border-white/40 shadow-sm bg-white/20 ${!isIsolated ? "group-hover:opacity-90 transition-opacity" : ""}`}>
            <img src={imageUrl} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 pt-3 border-t border-white/40">
        <div className="relative flex items-center" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike} className={`flex items-center gap-2 group transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
            <div className={`p-2 rounded-full transition-colors ${hasLiked ? 'bg-red-50' : 'group-hover:bg-white/60'}`}><Heart className="w-4 h-4" fill={hasLiked ? "currentColor" : "none"} strokeWidth={hasLiked ? 0 : 2} /></div>
            <span className="text-sm font-medium">{likes.length > 0 ? likes.length : ''}</span>
          </motion.button>
          <AnimatePresence>
            {isHovering && likes.length > 0 && <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full left-0 mb-2 whitespace-nowrap bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">Liked by {likes.join(", ")}</motion.div>}
          </AnimatePresence>
        </div>
        
        {/* If isolated, clicking comments shouldn't collapse them, it's just an icon */}
        <button onClick={!isIsolated ? toggleComments : undefined} className={`flex items-center gap-2 text-gray-500 group transition-colors ${!isIsolated ? 'hover:text-indigo-500' : 'cursor-default'}`}>
          <div className="p-2 rounded-full group-hover:bg-white/60 transition-colors"><MessageCircle className="w-4 h-4" /></div>
          <span className="text-sm font-medium">{localCommentCount > 0 ? localCommentCount : ''}</span>
        </button>
        
        <button onClick={handleShare} className="flex items-center gap-2 text-gray-500 hover:text-green-500 group transition-colors ml-auto">
          <div className="p-2 rounded-full group-hover:bg-white/60 transition-colors"><Share2 className="w-4 h-4" /></div>
          <span className="text-sm font-medium">{copied ? "Copied" : ""}</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm" />
                <button type="submit" disabled={!replyText.trim() || isPostingReply} className="bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
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