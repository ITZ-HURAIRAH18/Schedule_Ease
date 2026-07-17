import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, Shield, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

const MAX_U32 = 4294967295;

function hashInt(seed) {
  let x = (seed << 13) >>> 0;
  x = ((x * 48271) >>> 0) % 2147483647;
  x = (x * 16807) >>> 0;
  return x >>> 0;
}

function hashFloat(seed) {
  return hashInt(seed) / MAX_U32;
}

const Landing = () => {
  const [showRoles, setShowRoles] = useState(false);

  const handleGetStarted = () => {
    setShowRoles(true);
    setTimeout(() => {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const dots = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => {
      const seed = i + 1;
      const size = 3 + hashFloat(seed) * 8;
      const left = hashFloat(seed + 100) * 100;
      const top = hashFloat(seed + 200) * 100;
      const delay = hashFloat(seed + 300) * 6;
      const duration = 4 + hashFloat(seed + 400) * 8;
      const opacity = 0.2 + hashFloat(seed + 500) * 0.4;
      const animIndex = i % 3;
      const animation = animIndex === 0 ? 'dotPulse' : animIndex === 1 ? 'dotFloat' : 'dotDrift';
      return { size, left, top, delay, duration, opacity, animation, key: i };
    })
  , []);

  const roles = [
    {
      name: 'User',
      description: 'Book meetings and manage your schedule with experts.',
      path: '/login/user',
      icon: <Users className="w-5 h-5 text-white" />,
    },
    {
      name: 'Host',
      description: 'Share your availability and host professional meetings.',
      path: '/login/host',
      icon: <Calendar className="w-5 h-5 text-white" />,
    },
    {
      name: 'Admin',
      description: 'Manage users, view statistics and control the platform.',
      path: '/login/admin',
      icon: <Shield className="w-5 h-5 text-white" />,
    },
  ];

  const features = [
    {
      icon: <Calendar className="w-5 h-5 text-[#FC6C26]" />,
      title: 'Smart Scheduling',
      desc: 'Intelligent calendar management that adapts to your availability.',
    },
    {
      icon: <Users className="w-5 h-5 text-[#FC6C26]" />,
      title: 'Seamless Collaboration',
      desc: 'Connect with clients, team members, and partners effortlessly.',
    },
    {
      icon: <Clock className="w-5 h-5 text-[#FC6C26]" />,
      title: 'Real-time Sync',
      desc: 'Instant updates across all devices. Never double-book again.',
    },
    {
      icon: <Shield className="w-5 h-5 text-[#FC6C26]" />,
      title: 'Enterprise Security',
      desc: 'End-to-end encryption and enterprise-grade data protection.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF4D6]">
      <style>{`
        @keyframes dotPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0.6; }
        }
        @keyframes dotFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }
        @keyframes dotDrift {
          0%, 100% { transform: translate(-50%, -50%) translateX(0) translateY(0); }
          25% { transform: translate(-50%, -50%) translateX(15px) translateY(-10px); }
          50% { transform: translate(-50%, -50%) translateX(0) translateY(-20px); }
          75% { transform: translate(-50%, -50%) translateX(-15px) translateY(-10px); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -15px); }
          66% { transform: translate(-10px, 10px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-18px, 12px); }
          66% { transform: translate(12px, -18px); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(15px, 18px); }
          66% { transform: translate(-20px, -8px); }
        }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF4D6]/90 backdrop-blur-xl border-b border-[#FC6C26]/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FC6C26] flex items-center justify-center shadow-lg shadow-[#FC6C26]/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#1A1A1A] font-semibold text-sm tracking-tight">NexGen</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGetStarted}
              className="text-[13px] text-[#4A4A4A] font-medium hover:text-[#FC6C26] transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="text-[13px] bg-[#FC6C26] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#E05A1A] transition-all shadow-lg shadow-[#FC6C26]/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="hero"
        className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-4 md:px-6 overflow-hidden"
        style={{ minHeight: '520px' }}
      >
        {/* Floating gradient orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '10%', left: '5%', width: '320px', height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252,108,38,0.10) 0%, transparent 70%)',
            zIndex: 0,
            animation: 'orbFloat 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '55%', right: '3%', width: '280px', height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252,108,38,0.08) 0%, transparent 70%)',
            zIndex: 0,
            animation: 'orbFloat2 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '10%', left: '35%', width: '220px', height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,244,214,0.25) 0%, transparent 70%)',
            zIndex: 0,
            animation: 'orbFloat3 7s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '30%', right: '25%', width: '180px', height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252,108,38,0.06) 0%, transparent 70%)',
            zIndex: 0,
            animation: 'orbFloat 9s ease-in-out infinite 1s',
          }}
        />

        {/* Radial overlay — keeps center clean */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: `radial-gradient(
              ellipse 58% 48% at 50% 45%,
              #FFF4D6 0%,
              rgba(255, 244, 214, 0.94) 28%,
              rgba(255, 244, 214, 0.5) 52%,
              rgba(255, 244, 214, 0.1) 75%,
              transparent 100%
            )`,
          }}
        />

        {/* Scattered dots */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {dots.map(dot => (
            <span
              key={dot.key}
              style={{
                position: 'absolute',
                left: `${dot.left}%`,
                top: `${dot.top}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                borderRadius: '50%',
                backgroundColor: '#FC6C26',
                opacity: dot.opacity,
                pointerEvents: 'none',
                animation: `${dot.animation} ${dot.duration}s ease-in-out infinite ${dot.delay}s`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(252,108,38,0.4)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto text-center" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FC6C26]/20 text-[#FC6C26] text-xs font-medium mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Premium Scheduling Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[40px] md:text-[64px] font-bold leading-[1.1] tracking-tight mb-5"
          >
            <span className="text-[#1A1A1A]">Schedule Smarter.</span>
            <br />
            <span className="text-[#FC6C26]">Meet Better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[16px] md:text-[18px] text-[#4A4A4A] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The premium platform for modern professionals. Book meetings, manage availability, 
            and collaborate seamlessly — all in one beautiful experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="inline-flex items-center gap-2 bg-[#FC6C26] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl hover:bg-[#E05A1A] transition-all shadow-xl shadow-[#FC6C26]/25"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center gap-2 text-[#4A4A4A] text-[15px] font-medium px-8 py-3.5 rounded-xl border-2 border-[#E8DCC0] hover:border-[#FC6C26]/30 hover:text-[#FC6C26] transition-all">
              Learn More
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* ROLE SELECTOR */}
          <AnimatePresence>
            {showRoles && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-8"
              >
                <div className="pt-2">
                  <p className="text-[13px] text-[#8A8A8A] font-medium mb-4">Choose how you want to join</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    {roles.map((role, i) => (
                      <motion.div
                        key={role.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                      >
                        <Link
                          to={role.path}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[#E8DCC0] hover:border-[#FC6C26]/30 hover:shadow-lg hover:shadow-[#FC6C26]/5 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#FC6C26] flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-[#FC6C26]/20 transition-all">
                            {role.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A1A]">{role.name}</p>
                            <p className="text-[11px] text-[#8A8A8A] truncate">{role.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#FC6C26] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 md:py-24 px-4 md:px-6 border-t border-[#FC6C26]/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-[28px] md:text-[36px] font-bold text-[#1A1A1A] mb-3">
              Everything you need to <span className="text-[#FC6C26]">stay booked</span>
            </h2>
            <p className="text-[15px] text-[#4A4A4A] max-w-xl mx-auto">
              Powerful features that make scheduling and meeting management effortless.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
                className="p-6 rounded-2xl bg-white border border-[#E8DCC0] hover:border-[#FC6C26]/20 hover:shadow-lg hover:shadow-[#FC6C26]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FC6C26]/10 flex items-center justify-center mb-4 group-hover:bg-[#FC6C26]/15 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
                <p className="text-[13px] text-[#8A8A8A] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-[#FC6C26]/5 to-[#FFF4D6] border border-[#FC6C26]/20 rounded-3xl p-10 md:p-16"
        >
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#1A1A1A] mb-4">
            Ready to transform your scheduling?
          </h2>
          <p className="text-[15px] text-[#4A4A4A] mb-8 max-w-lg mx-auto">
            Join thousands of professionals who trust NexGen for their meeting management.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 bg-[#FC6C26] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl hover:bg-[#E05A1A] transition-all shadow-xl shadow-[#FC6C26]/25"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#FC6C26]/10 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#FC6C26] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] text-[#4A4A4A] font-medium">NexGen</span>
          </div>
          <p className="text-[12px] text-[#8A8A8A]">
            &copy; {new Date().getFullYear()} NexGen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
