"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase"; 
import FeedPost from "./components/FeedPost";
import { Loader2, User, Settings, LogOut, Camera, Bell, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = 'feed' | 'profile' | 'settings';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Navigation & Menu States
  const [currentView, setCurrentView] = useState<ViewState>('feed');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Composer States
  const [isComposing, setIsComposing] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Settings States
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("Just exploring the Shimaru network.");

  const springConfig = { type: "spring" as const, stiffness: 450, damping: 40 };

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
      } else {
        const name = session.user.user_metadata?.first_name || session.user.email?.split('@')[0];
        setCurrentUser(name);
        setEditName(name); // Pre-fill settings
        
        const pic = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
        setAvatarUrl(pic);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:8000/posts");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!postContent.trim() || !currentUser) return;
    
    setIsPosting(true);
    try {
      const res = await fetch("http://localhost:8000/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          author: currentUser, 
          author_avatar: avatarUrl, 
          content: postContent 
        }),
      });
      
      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      setPostContent("");
      setIsComposing(false);
    } catch (err) {
      alert("Failed to publish post. Is your backend running?");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Filter posts for the Profile view
  const myPosts = posts.filter(post => (post.author_username || post.author) === currentUser);

  if (!currentUser && isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-slate-50 selection:bg-indigo-100 pb-20">
      
      {/* Light Ambient Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-[20%] right-[10%] w-[300px] h-[300px] bg-pink-400/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-center pt-4 sm:pt-8 relative z-50">
          <div className="cursor-pointer" onClick={() => setCurrentView('feed')}>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shimaru</h1>
            <p className="text-gray-500 text-sm mt-1">Your global friend feed</p>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block bg-white/60 backdrop-blur-md border border-white/60 text-gray-800 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                @{currentUser}
              </div>
              
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md border-2 border-white/80 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all focus:outline-none flex items-center justify-center cursor-pointer"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={currentUser} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-600 font-bold text-lg uppercase">{currentUser.charAt(0)}</span>
                )}
              </button>
            </div>

            {/* FLOATING DROPDOWN MENU */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-56 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
                >
                  <div className="p-3 border-b border-white/40">
                    <p className="text-sm font-semibold text-gray-900 truncate">{currentUser}</p>
                    <p className="text-xs text-gray-500 truncate">Logged in via Supabase</p>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => { setCurrentView('profile'); setShowDropdown(false); }}
                      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${currentView === 'profile' ? 'bg-white/60 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-white/40'}`}
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button 
                      onClick={() => { setCurrentView('settings'); setShowDropdown(false); }}
                      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${currentView === 'settings' ? 'bg-white/60 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-white/40'}`}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/40">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* --- DYNAMIC VIEW CONTROLLER --- */}
        <AnimatePresence mode="wait">
          
          {/* VIEW: MAIN FEED */}
          {currentView === 'feed' && (
            <motion.div 
              key="view-feed"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={springConfig}
              className="flex flex-col gap-6"
            >
              {/* Composer */}
              <div className="relative w-full">
                <AnimatePresence mode="popLayout" initial={false}>
                  {!isComposing ? (
                    <motion.button
                      key="collapsed-composer" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={springConfig} onClick={() => setIsComposing(true)}
                      className="w-full flex items-center gap-3 p-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/60 transition-colors origin-top"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center shadow-sm overflow-hidden">
                        {avatarUrl ? <img src={avatarUrl} alt="You" className="w-full h-full object-cover" /> : <span className="text-indigo-500 font-bold uppercase">{currentUser.charAt(0)}</span>}
                      </div>
                      <span className="text-gray-500 font-medium">What's going on?</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="expanded-composer" layout initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} transition={springConfig}
                      className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col gap-4 origin-top"
                    >
                      <textarea 
                        autoFocus value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="What's going on?" 
                        className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-4 text-gray-900 placeholder:text-gray-500 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none min-h-[120px] transition-all shadow-sm"
                      />
                      <div className="flex items-center justify-between">
                        <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-white/40">
                          <Camera className="w-5 h-5" /> <span className="text-sm font-medium">Photo</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setIsComposing(false); setPostContent(""); }} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">Cancel</button>
                          <button onClick={handlePost} disabled={isPosting || !postContent.trim()} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Feed Posts */}
              <motion.div layout transition={springConfig} className="flex flex-col gap-5">
                {isFetching ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <FeedPost key={post.id} id={post.id} author={post.author_username || post.author} authorAvatar={post.author_avatar} content={post.content} initialLikes={post.likes || []} commentCount={post.comment_count || 0} currentUser={currentUser} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10">No posts yet. Be the first to share something!</p>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* VIEW: PROFILE (ACCOUNT) */}
          {currentView === 'profile' && (
            <motion.div 
              key="view-profile"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springConfig}
              className="flex flex-col gap-6"
            >
              {/* Profile Header */}
              <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-200/50 to-purple-200/50" />
                <div className="relative z-10 flex flex-col items-center mt-12">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white/80 shadow-lg overflow-hidden mb-4">
                    {avatarUrl ? <img src={avatarUrl} alt={currentUser} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 uppercase">{currentUser.charAt(0)}</div>}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentUser}</h2>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">{editBio}</p>
                  <div className="flex gap-4 mt-6">
                    <div className="flex flex-col items-center"><span className="font-bold text-gray-900">{myPosts.length}</span><span className="text-xs text-gray-500 uppercase tracking-wider">Posts</span></div>
                    <div className="w-px bg-white/50" />
                    <div className="flex flex-col items-center"><span className="font-bold text-gray-900">12</span><span className="text-xs text-gray-500 uppercase tracking-wider">Friends</span></div>
                  </div>
                </div>
              </div>

              {/* User's Posts */}
              <div className="flex flex-col gap-5">
                <h3 className="font-semibold text-gray-700 px-2">Your Activity</h3>
                {myPosts.length > 0 ? (
                  myPosts.map((post) => (
                    <FeedPost key={post.id} id={post.id} author={post.author_username || post.author} authorAvatar={post.author_avatar} content={post.content} initialLikes={post.likes || []} commentCount={post.comment_count || 0} currentUser={currentUser} />
                  ))
                ) : (
                  <div className="bg-white/30 backdrop-blur-md rounded-2xl p-10 text-center border border-white/40">
                    <p className="text-gray-500">You haven't posted anything yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <motion.div 
              key="view-settings"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springConfig}
              className="flex flex-col gap-6"
            >
              <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" /> Account Settings
                </h2>

                <div className="space-y-6">
                  {/* Avatar Edit */}
                  <div className="flex items-center gap-4 pb-6 border-b border-white/40">
                    <div className="w-16 h-16 rounded-full bg-white/60 border-2 border-white/80 shadow-sm overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-400 uppercase">{currentUser.charAt(0)}</div>}
                    </div>
                    <div>
                      <button className="bg-white/50 hover:bg-white/80 text-sm font-medium text-gray-800 px-4 py-2 rounded-lg border border-white/60 transition-all shadow-sm">Change Picture</button>
                      <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  {/* Info Form */}
                  <div className="space-y-4 pb-6 border-b border-white/40">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input 
                        type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-3 text-gray-900 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea 
                        value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                        className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-3 text-gray-900 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="space-y-3 pb-6 border-b border-white/40">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Preferences</h3>
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/40">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div><p className="text-sm font-medium text-gray-900">Notifications</p><p className="text-xs text-gray-500">Receive alerts for likes and replies</p></div>
                      </div>
                      <div className="w-10 h-6 bg-indigo-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/40">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <div><p className="text-sm font-medium text-gray-900">Private Account</p><p className="text-xs text-gray-500">Only approved friends can see posts</p></div>
                      </div>
                      <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setCurrentView('feed')} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">Cancel</button>
                    <button onClick={() => alert("Settings saved! (Connecting to database next...)")} className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-md">
                      Save Changes
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </main>
  );
}