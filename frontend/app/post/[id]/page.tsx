"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import FeedPost from "../../components/FeedPost";
import Background from "../../components/Background";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function DedicatedPostPage() {
  const params = useParams();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState("");
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Verify User
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
      } else {
        const name = session.user.user_metadata?.first_name || session.user.email?.split('@')[0];
        setCurrentUser(name);
      }
    };
    checkAuth();
  }, [router]);

  // 2. Fetch the Single Post
  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/posts/${params.id}`);
        if (!res.ok) throw new Error("Post not found");
        
        const data = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSinglePost();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Background />
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 relative z-10" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-slate-50 selection:bg-indigo-100 py-10 px-4">
      <Background />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/40 hover:bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 transition-all shadow-sm font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </button>
        </div>

        {error ? (
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-10 rounded-2xl shadow-sm text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Post not found</h2>
            <p className="text-gray-500">It may have been deleted by the author.</p>
          </div>
        ) : post ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <FeedPost 
              id={post.id} 
              author={post.author_username || post.author} 
              authorAvatar={post.author_avatar} 
              content={post.content} 
              imageUrl={post.image_url} 
              initialLikes={post.likes || []} 
              commentCount={post.comment_count || 0} 
              currentUser={currentUser} 
              isIsolated={true} 
            />
          </motion.div>
        ) : null}

      </div>
    </main>
  );
}