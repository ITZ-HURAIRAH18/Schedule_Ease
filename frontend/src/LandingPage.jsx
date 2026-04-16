import React from 'react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-violet-500 to-indigo-500 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>
      <motion.h1 className="text-6xl font-bold text-white text-shadow animate-text">
        NexGen Schedule
      </motion.h1>
      <motion.h2 className="mt-4 text-3xl text-white">
        Your time, perfectly orchestrated.
      </motion.h2>
      <div className="flex space-x-4 mt-8">
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-white">User</h3>
          <p className="text-gray-200">Manage your schedule effortlessly.</p>
        </motion.div>
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-white">Host</h3>
          <p className="text-gray-200">Host meetings seamlessly.</p>
        </motion.div>
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-white">Admin</h3>
          <p className="text-gray-200">Oversee the entire platform.</p>
        </motion.div>
      </div>
      <div className="flex space-x-4 mt-6">
        <motion.button className="btn-primary">Login</motion.button>
        <motion.button className="btn-secondary">Sign Up</motion.button>
      </div>
    </div>
  );
};

export default LandingPage;