import React from 'react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <motion.h1 className="text-5xl font-bold text-gradient animate-text">
        NexGen Schedule
      </motion.h1>
      <motion.h2 className="mt-4 text-2xl text-gray-600">
        Your time, perfectly orchestrated.
      </motion.h2>
      <div className="flex space-x-4 mt-8">
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold">User</h3>
          <p className="text-gray-500">Manage your schedule effortlessly.</p>
        </motion.div>
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold">Host</h3>
          <p className="text-gray-500">Host meetings seamlessly.</p>
        </motion.div>
        <motion.div className="card glass p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold">Admin</h3>
          <p className="text-gray-500">Oversee the entire platform.</p>
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