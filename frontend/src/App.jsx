import React from 'react';
import { motion } from 'framer-motion';

const App = () => {
  return (
    <div className="relative">
      <motion.div className="fixed top-0 left-0 w-full h-full bg-gradient-to-r from-violet-500 to-indigo-500 opacity-20 animate-backgroundOrbs" />
      {/* Other components and routes here */}
    </div>
  );
};

export default App;