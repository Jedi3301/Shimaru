"use client";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";

export default function AccountDropdown({ isOpen, onClose, currentUser, onNavigate, onLogout }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 mt-3 w-56 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden z-50"
        >
          <div className="p-3 border-b border-white/40">
            <p className="text-sm font-semibold text-gray-900 truncate">{currentUser}</p>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <button onClick={() => { onNavigate('profile'); onClose(); }} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-white/40"><User className="w-4 h-4" /> Profile</button>
            <button onClick={() => { onNavigate('settings'); onClose(); }} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-white/40"><Settings className="w-4 h-4" /> Settings</button>
          </div>
          <div className="p-2 border-t border-white/40">
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Log out</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}