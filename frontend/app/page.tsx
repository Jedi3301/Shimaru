"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase"; 
import FeedPost from "./components/FeedPost";
import CreatePost from "./components/CreatePost";
import AccountDropdown from "./components/AccountDropdown";
import Background from "./components/Background";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = 'feed' | 'profile' | 'settings';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Store the full user profile data
  const [profileData, setProfileData] = useState<any>(null); 
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>('feed');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const springConfig = { type: "spring" as const, stiffness: 450, damping: 40 };

  // Handle clicking outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check Authentication and Fetch Profile Data
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/login");
        return;
      } 
      
      const name = session.user.user_metadata?.first_name || session.user.email?.split('@')[0];
      setCurrentUser(name);
      
      const pic = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
      setAvatarUrl(pic);

      // Fetch the full profile from FastAPI
      try {
        const profileRes = await fetch(`http://127.0.0.1:8000/profiles/${name}`);
        if (profileRes.ok) {
          const fetchedProfile = await profileRes.json();
          setProfileData(fetchedProfile);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    checkAuthAndFetchProfile();
  }, [router]);

  // Fetch Feed Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/posts");
        const data = await res.json();
        if (Array.isArray(data)) setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts", err);
        setPosts([]);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPosts();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const myPosts = posts.filter(post => (post.author_username || post.author) === currentUser);

  // Full Screen Loading State
  if (!currentUser && isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Background />
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 relative z-10" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-slate-50 selection:bg-indigo-100 pb-20">
      
      <Background />

      {/* Dynamic Container Width based on current view */}
      <div className={`relative z-10 mx-auto flex flex-col gap-6 p-4 sm:p-8 transition-all duration-500 ease-out ${currentView === 'feed' ? 'max-w-2xl' : 'max-w-5xl w-full'}`}>
        
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
              <button onClick={() => setShowDropdown(!showDropdown)} className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-md border-2 border-white/80 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all focus:outline-none flex items-center justify-center cursor-pointer">
                {avatarUrl ? <img src={avatarUrl} alt={currentUser} className="w-full h-full object-cover" /> : <span className="text-indigo-600 font-bold text-lg uppercase">{currentUser.charAt(0)}</span>}
              </button>
            </div>

            <AccountDropdown isOpen={showDropdown} onClose={() => setShowDropdown(false)} currentUser={currentUser} onNavigate={(v: ViewState) => { setCurrentView(v); setShowDropdown(false); }} onLogout={handleLogout} />
          </div>
        </header>

        {/* VIEW CONTROLLER */}
        <AnimatePresence mode="wait">
          
          {/* MAIN FEED */}
          {currentView === 'feed' && (
            <motion.div key="view-feed" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={springConfig} className="flex flex-col gap-6">
              
              <div className="w-full">
                <CreatePost currentUser={currentUser} avatarUrl={avatarUrl} onPostCreated={(newPost: any) => setPosts([newPost, ...posts])} />
              </div>
              
              <motion.div layout transition={springConfig} className="flex flex-col gap-5">
                {isFetching ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <FeedPost 
                      key={post.id} 
                      id={post.id} 
                      author={post.author_username || post.author} 
                      authorAvatar={post.author_avatar} 
                      content={post.content} 
                      imageUrl={post.image_url} 
                      initialLikes={post.likes || []} 
                      commentCount={post.comment_count || 0} 
                      currentUser={currentUser} 
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10">No posts yet. Be the first to share something!</p>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {currentView === 'profile' && (
            <motion.div key="view-profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springConfig} className="flex flex-col gap-6">
              <ProfileView user={currentUser} avatar={avatarUrl} profileData={profileData} posts={myPosts} currentUser={currentUser} />
            </motion.div>
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <motion.div key="view-settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springConfig} className="flex flex-col gap-6 w-full">
              <SettingsView currentUser={currentUser} avatarUrl={avatarUrl} profileData={profileData} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}