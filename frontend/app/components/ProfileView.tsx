export default function ProfileView({ user, avatar, posts }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-200/50 to-purple-200/50" />
        <div className="relative z-10 flex flex-col items-center mt-12">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white/80 shadow-lg overflow-hidden mb-4">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">{user.charAt(0)}</div>}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user}</h2>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {posts.length > 0 ? posts.map((p: any) => <div key={p.id} className="p-4 bg-white/40 rounded-2xl">{p.content}</div>) : <p className="text-center text-gray-500">No posts yet.</p>}
      </div>
    </div>
  );
}