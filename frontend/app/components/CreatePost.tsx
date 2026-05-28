"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; 
import { Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const username = user && user.email ? user.email.split('@')[0] : "Anonymous";

    const response = await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: username, content: content }),
    });

    setIsSubmitting(false);
    if (response.ok) {
      setContent(""); 
      router.refresh(); 
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit} 
      className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 mb-6"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's going on?"
        className="w-full p-2 bg-transparent border-none text-gray-800 text-lg placeholder:text-gray-400 focus:outline-none resize-none"
        rows={3}
      />
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
        <button 
          type="button" 
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Photo</span>
        </button>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </motion.form>
  );
}