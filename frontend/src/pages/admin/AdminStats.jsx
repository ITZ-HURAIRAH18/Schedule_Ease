// src/pages/admin/AdminStats.jsx
import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Trophy, 
  TrendingUp, 
  Medal,
  Activity,
  ArrowUpRight
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, value, { 
      duration: 2, 
      ease: "circOut" 
    });
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const MetricCard = ({ label, value, icon: Icon, color, delay }) => {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-600",
      pill: "bg-indigo-100 text-indigo-700"
    },
    sky: {
      bg: "bg-sky-500/10",
      text: "text-sky-600",
      pill: "bg-sky-100 text-sky-700"
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-600",
      pill: "bg-violet-100 text-violet-700"
    }
  };

  const theme = colorMap[color] || colorMap.indigo;

  return (
    <Tilt maxTilt={5}>
      <motion.div
        variants={itemVariants}
        className="relative group h-full"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/0 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative h-full bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/40 shadow-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text} shadow-inner`}>
              <Icon className="w-8 h-8" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${theme.pill} uppercase tracking-tighter`}
            >
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </motion.div>
          </div>
          <div>
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-1">{label}</h3>
            <div className="text-5xl font-black text-gray-900 flex items-baseline gap-1">
              <AnimatedCounter value={value} />
              <span className="text-lg font-bold text-gray-400 opacity-50">+</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
};

const Leaderboard = ({ topHosts }) => {
  const getRankBadge = (idx) => {
    switch (idx) {
      case 0: return { color: "from-yellow-400 to-amber-600", text: "Gold", icon: "🥇" };
      case 1: return { color: "from-slate-300 to-slate-500", text: "Silver", icon: "🥈" };
      case 2: return { color: "from-orange-400 to-amber-700", text: "Bronze", icon: "🥉" };
      default: return { color: "from-blue-100 to-blue-200", text: `${idx + 1}th`, icon: null };
    }
  };

  const maxBookings = useMemo(() => 
    topHosts?.length ? Math.max(...topHosts.map(h => h.totalBookings)) : 1,
    [topHosts]
  );

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 shadow-2xl h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Host Leaderboard</h3>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 uppercase">
          Live Rankings
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        {topHosts?.length ? (
          topHosts.map((host, idx) => {
            const rank = getRankBadge(idx);
            return (
              <motion.div 
                key={host._id}
                whileHover={{ x: 10 }}
                className="group relative"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rank.color} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                    {rank.icon || (idx + 1)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">{host.fullName}</span>
                      <span className="text-sm font-black text-indigo-500">{host.totalBookings} Bookings</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(host.totalBookings / maxBookings) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (idx * 0.1) }}
                        className={`h-full bg-gradient-to-r ${idx < 3 ? rank.color : 'from-indigo-500 to-blue-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold italic">No rankings available yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const StatsChart = ({ data }) => {
  const chartData = useMemo(() => 
    data?.map(h => ({ name: h.fullName.split(' ')[0], bookings: h.totalBookings })) || [],
    [data]
  );

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Booking Distribution</h3>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 700 }} 
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6', radius: 10 }}
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)'
              }}
            />
            <Bar dataKey="bookings" radius={[10, 10, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="url(#barGradient)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalHosts, setTotalHosts] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get("/admin/stats"),
        axiosInstance.get("/admin/users"),
      ]);
      setStats(statsRes.data);
      const hosts = usersRes.data.filter((u) => u.role === "host");
      setTotalHosts(hosts.length);
    } catch {
      setStats(null);
      setTotalHosts(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <MeshBackground />
      <AdminHeader />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
                <LayoutDashboard className="w-5 h-5" />
                <span className="uppercase tracking-[0.3em] text-[10px]">Administrative Intelligence</span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Analytics</span>
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchStats}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 font-bold text-gray-700 hover:text-indigo-600 transition-all"
            >
              <Activity className="w-4 h-4" />
              Refresh Metrics
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-indigo-600 font-black animate-pulse">Computing real-time analytics...</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {!stats ? (
                  <div className="text-center py-32 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/50">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold text-xl">No statistical data discovered.</p>
                  </div>
                ) : (
                  <>
                    {/* Top Row: Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <MetricCard
                        label="Total Bookings"
                        value={stats.totalBookings || 0}
                        icon={CalendarCheck}
                        color="indigo"
                      />
                      <MetricCard
                        label="Active Hosts"
                        value={totalHosts}
                        icon={Users}
                        color="sky"
                      />
                      <MetricCard
                        label="Host Partners"
                        value={stats.topHosts?.length || 0}
                        icon={Medal}
                        color="violet"
                      />
                    </div>

                    {/* Middle Row: Leaderboard & Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                      <div className="lg:col-span-2">
                        <Leaderboard topHosts={stats.topHosts} />
                      </div>
                      <div className="lg:col-span-3">
                        <StatsChart data={stats.topHosts} />
                      </div>
                    </div>

                    {/* Bottom CTA / Banner */}
                    <motion.div
                      variants={itemVariants}
                      className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-indigo-200"
                    >
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <h2 className="text-3xl font-black mb-4">Export Full Data Report</h2>
                          <p className="text-indigo-100 font-medium max-w-md">
                            Generate comprehensive performance reports for all hosts and bookings in CSV or PDF format.
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-3"
                        >
                          Generate Report
                          <ArrowUpRight className="w-6 h-6" />
                        </motion.button>
                      </div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminStats;
