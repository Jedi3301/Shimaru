"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase"; 
import imageCompression from 'browser-image-compression'; // NEW: Import the library

export default function CreatePost({ currentUser, avatarUrl, onPostCreated }: any) {
  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const springConfig = { type: "spring" as const, stiffness: 450, damping: 40 };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!currentUser || (!content.trim() && !selectedImage)) return;
    setIsPosting(true);

    let finalImageUrl = null;

    try {
      if (selectedImage) {
        
        // --- NEW: COMPRESSION LOGIC ---
        // We configure it to shrink to max 1MB and scale down to 1920px max width/height
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        // Compress the file before sending it anywhere
        const compressedFile = await imageCompression(selectedImage, compressionOptions);
        // ------------------------------

        // Notice we now use 'compressedFile' instead of 'selectedImage'
        const fileExt = compressedFile.name.split('.').pop() || 'jpg'; 
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentUser}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, compressedFile); // Uploading the tiny file!

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
          
        finalImageUrl = publicUrl;
      }

      // Send to FastAPI
      const response = await fetch("http://127.0.0.1:8000/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          author: currentUser, 
          author_avatar: avatarUrl, 
          content: content,
          image_url: finalImageUrl 
        }),
      });
      
      const newPost = await response.json();
      
      if (!response.ok) {
         throw new Error(newPost.detail || "Unknown Server Error");
      }
      
      onPostCreated(newPost);
      
      setContent("");
      clearImage();
      setIsComposing(false);
      
    } catch (error: any) {
      console.error("Failed to post:", error);
      alert(`Error saving post: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="relative w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {!isComposing ? (
          <motion.button
            key="collapsed-composer"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springConfig}
            onClick={() => setIsComposing(true)}
            className="w-full flex items-center gap-3 p-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/60 transition-colors origin-top"
          >
            <div className="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center shadow-sm overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-500 font-bold uppercase">{currentUser?.charAt(0) || '?'}</span>
              )}
            </div>
            <span className="text-gray-500 font-medium">What's going on?</span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded-composer"
            layout
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={springConfig}
            className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col gap-4 origin-top"
          >
            <textarea 
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's going on?" 
              className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-4 text-gray-900 placeholder:text-gray-500 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none min-h-[120px] transition-all shadow-sm"
            />
            
            {previewUrl && (
              <div className="relative w-full rounded-xl overflow-hidden border border-white/60 shadow-sm mt-2">
                <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                <button 
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 bg-gray-900/60 hover:bg-gray-900 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-white/40"
                >
                  <Camera className="w-5 h-5" /> 
                  <span className="text-sm font-medium">Photo</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsComposing(false); setContent(""); clearImage(); }} 
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isPosting || (!content.trim() && !selectedImage)} 
                  className="bg-gray-900/80 backdrop-blur-md border border-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}