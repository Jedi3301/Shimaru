"use client";

import { motion } from "framer-motion";

export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50">
      {/* Top Left Purple Orb */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/40 rounded-full blur-[120px]"
      />

      {/* Bottom Right Indigo Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, -40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-400/40 rounded-full blur-[120px]"
      />

      {/* Center Right Pink Orb */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-pink-400/30 rounded-full blur-[100px]"
      />
      
      {/* Bottom Left Blue Orb */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[100px]"
      />
    </div>
  );
}