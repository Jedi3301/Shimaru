"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Save, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import imageCompression from 'browser-image-compression';

type SettingsProps = {
  currentUser: string;
  avatarUrl: string | null;
  profileData: any;
};

export default function SettingsView({ currentUser, avatarUrl, profileData }: SettingsProps) {
  // Profile Form States
  const [bio, setBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Avatar Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Populate form with existing data when it loads
  useEffect(() => {
    if (profileData) {
      setBio(profileData.bio || "");
      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
    }
    setLocalAvatar(avatarUrl);
  }, [profileData, avatarUrl]);

  // --- HANDLE AVATAR UPLOAD ---
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploadingAvatar(true);

    try {
      // 1. Compress the image (Avatar sizes can be much smaller!)
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5, // Half a megabyte is plenty for an avatar
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      // 2. Upload to the new 'avatars' bucket
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${currentUser}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 4. Update the user's Supabase Auth Metadata directly!
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Update local UI immediately
      setLocalAvatar(publicUrl);
      setSaveMessage("Profile picture updated! (Refresh to see changes everywhere)");
      setTimeout(() => setSaveMessage(""), 4000);

    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      alert("Failed to upload avatar: " + error.message);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- HANDLE PROFILE TEXT SAVE ---
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      // Send the updated text data to our FastAPI backend
      const response = await fetch(`http://127.0.0.1:8000/profiles/${currentUser}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bio: bio,
          first_name: firstName,
          last_name: lastName
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile data");
      
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      alert("Failed to save settings. Make sure your Python server is running.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Profile Settings</h2>
      
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Left Column: Avatar Upload */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/60 flex items-center justify-center text-4xl font-bold text-indigo-300 transition-all group-hover:blur-[2px]">
              {localAvatar ? (
                <img src={localAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {isUploadingAvatar ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 font-medium">Click to change picture</p>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
          />
        </div>

        {/* Right Column: Text Settings */}
        <div className="flex-1 flex flex-col gap-5">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-2.5 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-2.5 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-4 py-3 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm min-h-[120px] resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-white/40">
            <span className="text-sm font-medium text-green-600">{saveMessage}</span>
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gray-900/90 text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}