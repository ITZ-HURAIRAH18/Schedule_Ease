import React from "react";
import { motion } from "framer-motion";

const MeshBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Mesh Orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/20 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 150, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#4F46E5]/15 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-[#C026D3]/10 blur-[100px] rounded-full"
      />
    </div>
  );
};

export default MeshBackground;