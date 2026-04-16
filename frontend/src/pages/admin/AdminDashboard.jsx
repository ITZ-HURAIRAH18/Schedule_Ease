import { useEffect, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import MeshBackground from "../../components/MeshBackground";
import { io } from "socket.io-client";
import { getSocketUrl } from "../../utils/apiConfig";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  TrendingUp,
  User,
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Clock,
  ArrowUpRight
} from "lucide-react";

// Connect to the backend Socket.IO server
const socket = io(getSocketUrl(), {
  secure: window.location.protocol === 'https:',
  rejectUnauthorized: false,
});

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/admin/dashboard");
        if (!isMounted) return;
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    socket.on("dashboard_updated", (updated) => setData(updated));
    return () => {
      isMounted = false;
      socket.off("dashboard_updated");
    };
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: "from-violet-600 to-indigo-600",
      shadow: "shadow-violet-200",
    },
    {
      label: "Total Bookings",
      value: data?.totalBookings ?? 0,
      icon: <Calendar className="w-6 h-6 text-white" />,
      gradient: "from-indigo-600 to-blue-600",
      shadow: "shadow-indigo-200",
    },
    {
      label: "Recent Sign-ups",
      value: data?.recentUsers?.length ?? 0,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      gradient: "from-cyan-500 to-blue-500",
      shadow: "shadow-cyan-200",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <MeshBackground />
      <AdminHeader />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <header className="mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                Platform <span className="text-indigo-600">Overview</span>
              </h1>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live activity monitoring active</span>
              </div>
            </motion.div>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[1, 2, 3].map((i) => <StatSkeleton key={i} />)}
            </div>
          ) : !data ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-white/50">
              <p className="text-gray-500 font-bold">No dashboard data available.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card, idx) => (
                  <StatCard key={card.label} {...card} delay={0.2 + idx * 0.1} />
                ))}
              </div>

              {/* Recent Users Table */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Recent Sign-ups</h2>
                      <p className="text-sm text-gray-500 font-medium">Newest platform members</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-gray-400 text-[11px] font-black uppercase tracking-widest border-b border-gray-50">
                        <th className="px-8 py-4">User</th>
                        <th className="px-8 py-4">Role</th>
                        <th className="px-8 py-4">Joined Date</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <AnimatePresence mode="popLayout">
                        {data.recentUsers?.map((user, idx) => (
                          <UserTableRow key={user._id} user={user} index={idx} />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                
                {(!data.recentUsers || data.recentUsers.length === 0) && (
                  <div className="p-20 text-center">
                    <p className="text-gray-400 font-bold">No recent users found.</p>
                  </div>
                )}
                
                <div className="p-6 bg-gray-50/50 flex justify-center">
                  <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                    View all users <ArrowRight size={16} />
                  </button>
                </div>
              </motion.section>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

/* ---------- sub-components ---------- */

const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: [0.23, 1, 0.32, 1] });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ label, value, icon, gradient, shadow, delay }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  const springConfig = { damping: 20, stiffness: 300 };
  const springX = useSpring(rotateX, springConfig);
  const springY = useSpring(rotateY, springConfig);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springX,
          rotateY: springY,
        }}
        className={`relative group h-full bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-xl ${shadow} transition-all duration-300 hover:shadow-2xl hover:bg-white`}
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-gray-900 tracking-tight">
              <AnimatedCounter value={value} />
            </h3>
            {value > 0 && (
              <span className="flex items-center text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={10} className="mr-0.5" /> 12%
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-2 rounded-xl bg-gray-50 text-gray-400">
            <ArrowRight size={16} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const UserTableRow = ({ user, index }) => {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-purple-100 text-purple-600 border-purple-200";
      case "host": return "bg-blue-100 text-blue-600 border-blue-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <motion.tr 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.05 }}
      className="group hover:bg-indigo-50/30 transition-all duration-300 cursor-default"
    >
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
              {(user.fullName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{user.fullName || "Unknown"}</p>
            <p className="text-xs text-gray-400 font-medium">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleColor(user.role)}`}>
          {user.role || "user"}
        </span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Clock size={14} className="text-gray-300" />
          <span className="text-sm">{formattedDate}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="p-2 rounded-xl text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
          <ChevronRight size={18} />
        </button>
      </td>
    </motion.tr>
  );
};

const StatSkeleton = () => (
  <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 border border-white/50 h-44 animate-pulse">
    <div className="w-14 h-14 rounded-2xl bg-gray-200 mb-4" />
    <div className="h-4 w-24 bg-gray-200 rounded-full mb-2" />
    <div className="h-8 w-16 bg-gray-200 rounded-full" />
  </div>
);

export default AdminDashboard;
