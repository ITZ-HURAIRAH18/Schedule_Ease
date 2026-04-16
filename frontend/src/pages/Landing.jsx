import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { User, Users, Shield, ArrowRight, CheckCircle2, Zap, Star } from 'lucide-react';

const TypewriterSubheading = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 min-h-[3rem]">
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-0.5 h-5 ml-1 bg-blue-400 align-middle"
      />
    </p>
  );
};

const RoleCard = ({ title, description, icon: Icon, loginPath, signupPath, color, delay }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 0, rotateY: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative group h-full"
    >
      <div 
        className="h-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between"
        style={{ transform: "translateZ(50px)" }}
      >
        <div style={{ transform: "translateZ(75px)" }}>
          <div className={`w-16 h-16 mb-6 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
          <p className="text-blue-100/60 mb-8 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-3" style={{ transform: "translateZ(60px)" }}>
          <Link 
            to={loginPath} 
            className="flex items-center justify-center w-full bg-white text-indigo-950 py-3.5 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all group/btn"
          >
            Log In
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to={signupPath} 
            className="flex items-center justify-center w-full bg-white/10 border border-white/10 py-3.5 rounded-xl font-bold hover:bg-white/20 active:scale-95 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const FloatingShape = ({ className, delay, duration }) => (
  <motion.div
    initial={{ y: 0, x: 0 }}
    animate={{ 
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 10, 0]
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
  />
);

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050816] text-white flex flex-col items-center justify-center py-20 px-6">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingShape className="w-[500px] h-[500px] bg-purple-600 top-[-10%] left-[-10%]" delay={0} duration={15} />
        <FloatingShape className="w-[400px] h-[400px] bg-blue-600 bottom-[-5%] right-[-5%]" delay={2} duration={18} />
        <FloatingShape className="w-[300px] h-[300px] bg-indigo-600 top-[20%] right-[10%]" delay={5} duration={12} />
        
        {/* Particle Stars */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <div className="mb-8 inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-blue-200">
            <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
            The next generation of scheduling
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500">
              NexGen
            </span>
            <br />
            <span className="text-white">Schedule</span>
          </h1>
          
          <TypewriterSubheading text="Effortlessly manage your time, appointments, and meetings in one unified platform built for speed and clarity." />
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full [perspective:1000px]">
          <RoleCard 
            title="User"
            description="Book and manage your appointments seamlessly with a personal dashboard and automated reminders."
            icon={User}
            loginPath="/login/user"
            signupPath="/signup/user"
            color="from-cyan-400 to-blue-600"
            delay={0.2}
          />
          <RoleCard 
            title="Host"
            description="Create availability, manage your calendar, and let others book your time with professional ease."
            icon={Users}
            loginPath="/login/host"
            signupPath="/signup/host"
            color="from-purple-500 to-indigo-600"
            delay={0.4}
          />
          <RoleCard 
            title="Admin"
            description="Oversee the entire platform, manage user accounts, and monitor system-wide scheduling statistics."
            icon={Shield}
            loginPath="/login/admin"
            signupPath="/signup/admin" // Note: Signup for admin might not be standard but keeping it as per generic requirement
            color="from-amber-400 to-orange-600"
            delay={0.6}
          />
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-24 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="font-bold tracking-widest text-sm uppercase">Ultra Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold tracking-widest text-sm uppercase">Secure Core</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="font-bold tracking-widest text-sm uppercase">Global Scale</span>
          </div>
        </motion.div>

        <p className="mt-16 text-xs text-blue-100/30">
          © 2024 NexGen Schedule. Powered by Modern Web Technology.
        </p>
      </div>
    </div>
  );
};

export default Landing;