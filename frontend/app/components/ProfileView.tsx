"use client";

import FeedPost from "./FeedPost";
import { Calendar, User as UserIcon } from "lucide-react";

export default function ProfileView({ 
  user, 
  avatar, 
  profileData, 
  posts, 
  currentUser,
  friendsCount = 0 
}: any) {
  
  // Extract data from the database object
  const bio = profileData?.bio;
  const firstName = profileData?.first_name || user;
  const lastName = profileData?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const dob = profileData?.dob;

  return (
    <div className="flex flex-col gap-6">
      
      {/* --- PROFILE HEADER CARD --- */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 opacity-70" />
        
        <div className="relative z-10 flex flex-col items-center mt-12">
          
          <div className="w-28 h-28 rounded-full bg-white border-4 border-white/80 shadow-xl overflow-hidden mb-4">
            {avatar ? (
              <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-4xl font-bold text-indigo-500 uppercase">
                {fullName.charAt(0)}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{fullName}</h2>
          <p className="text-sm font-medium text-indigo-600 mt-1">@{user}</p>
          
          <p className={`mt-3 text-center max-w-md leading-relaxed ${bio ? 'text-gray-700' : 'text-gray-400 italic'}`}>
            {bio || "This user hasn't written a bio yet."}
          </p>

          {/* New Details Section for DOB */}
          {dob && (
            <div className="flex items-center gap-4 mt-5 text-sm font-medium text-gray-600 bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Born {new Date(dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* Profile Stats */}
          <div className="flex gap-12 mt-6 pt-6 border-t border-white/50 w-full justify-center">
            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">
                {posts?.length || 0}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Posts</span>
            </div>
            
            <div className="w-px bg-gray-300/50" />
            
            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">
                {friendsCount}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- USER'S POSTS FEED --- */}
      <div className="flex flex-col gap-5">
        <h3 className="font-bold text-gray-800 px-2 text-lg">Your Activity</h3>
        
        {posts && posts.length > 0 ? (
          posts.map((p: any) => (
            <FeedPost key={p.id} id={p.id} author={p.author_username || p.author} authorAvatar={p.author_avatar} content={p.content} initialLikes={p.likes || []} commentCount={p.comment_count || 0} currentUser={currentUser} />
          ))
        ) : (
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-12 text-center border border-white/40 shadow-sm">
            <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No posts yet</h3>
            <p className="text-gray-500 text-sm">When you share your thoughts, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}