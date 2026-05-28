"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase"; 
import { Mail, Lock, User, Calendar, Loader2 } from "lucide-react";

export default function PremiumLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/"); 
      } else {
        // 1. Create the Auth Account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName, dob: dob } }
        });
        if (signUpError) throw signUpError;
        
        // 2. Derive the username and save the profile data to the database
        const username = firstName || email.split('@')[0];
        
        await fetch(`http://127.0.0.1:8000/profiles/${username}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            dob: dob,
            bio: "Just joined Shimaru! Excited to connect.",
            email_notifs: true,
            is_private: false
          }),
        });

        router.push("/"); 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:3000" }
    });
  };

  const inputStyles = "w-full bg-white/30 backdrop-blur-md border border-white/40 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all shadow-sm";
  const springConfig = { type: "spring" as const, stiffness: 450, damping: 40 };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 selection:bg-indigo-100 relative overflow-hidden bg-slate-50">
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-pink-400/40 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
        className="w-full max-w-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 bg-white/20 backdrop-blur-3xl overflow-hidden relative z-10"
      >
        <div className="flex p-2 bg-white/10 border-b border-white/20 relative">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-300 relative z-10 ${isLogin ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Log In</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-300 relative z-10 ${!isLogin ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Sign Up</button>
          
          <motion.div 
            animate={{ x: isLogin ? 0 : "100%" }}
            transition={springConfig}
            className="absolute top-2 left-2 w-[calc(50%-8px)] h-[calc(100%-16px)] bg-white/60 backdrop-blur-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-white/60 z-0"
          />
        </div>

        <div className="p-8">
          <motion.div layout transition={springConfig} className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{isLogin ? "Welcome back" : "Create an account"}</h1>
            <p className="text-sm text-gray-600 mt-2">{isLogin ? "Enter your credentials to access your feed." : "Join the inner circle today."}</p>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-100/80 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && (
                <motion.div key="signup-fields" layout initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} transition={springConfig} className="flex flex-col gap-4 w-full origin-top">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <input type="text" required={!isLogin} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`pl-9 pr-3 py-2 ${inputStyles}`} placeholder="Jedi" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <input type="text" required={!isLogin} value={lastName} onChange={(e) => setLastName(e.target.value)} className={`px-3 py-2 ${inputStyles}`} placeholder="Skywalker" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input type="date" required={!isLogin} value={dob} onChange={(e) => setDob(e.target.value)} className={`pl-9 pr-3 py-2 ${inputStyles}`} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout transition={springConfig} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-9 pr-3 py-2 ${inputStyles}`} placeholder="you@example.com" />
              </div>
            </motion.div>

            <motion.div layout transition={springConfig} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-9 pr-3 py-2 ${inputStyles}`} placeholder="••••••••" />
              </div>
            </motion.div>

            <motion.button layout transition={springConfig} disabled={isLoading} type="submit" className="w-full bg-gray-900/80 backdrop-blur-md text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-2 relative z-10 shadow-md">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
            </motion.button>
          </form>

          <motion.div layout transition={springConfig} className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px bg-gray-400/20 flex-1" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Or</span>
            <div className="h-px bg-gray-400/20 flex-1" />
          </motion.div>

          <motion.button layout transition={springConfig} onClick={handleGoogleLogin} type="button" className="mt-6 w-full bg-white/40 backdrop-blur-md border border-white/40 text-gray-800 rounded-lg py-2.5 text-sm font-medium hover:bg-white/60 transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}