// src/pages/admin/AdminStats.jsx
import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  Users, 
  CalendarCheck, 
  Trophy, 
  Activity,
  ArrowUpRight,
  RefreshCcw,
  Target
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";

const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, value, { 
      duration: 0.6, 
      ease: "easeOut" 
    });
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const MetricCard = ({ label, value, icon: Icon, iconBg, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="group bg-white rounded-xl p-[20px_24px] border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
    >
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-[28px] font-semibold text-[#1A1A1A]">
            <AnimatedCounter value={value} />
          </h3>
          <span className="flex items-center text-[11px] font-medium text-[#2D7D52] bg-[#EDF7F1] px-2 py-0.5 rounded-md">
            <ArrowUpRight size={10} className="mr-0.5" /> 12.5%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const Leaderboard = ({ topHosts }) => {
  const maxBookings = useMemo(() => 
    topHosts?.length ? Math.max(...topHosts.map(h => h.totalBookings)) : 1,
    [topHosts]
  );

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0EA] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#C8622A]" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Top Hosts</h3>
            <p className="text-[12px] text-[#8A8A8A]">Based on total bookings</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {topHosts?.length ? (
          topHosts.map((host, idx) => (
            <div key={host._id} className="group">
              <div className="flex items-center gap-4 mb-2">
                <div className={`text-[14px] font-bold w-6 ${idx === 0 ? 'text-[#C8622A]' : 'text-[#8A8A8A]'}`}>
                  #{idx + 1}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[14px] font-medium text-[#1A1A1A]">{host.fullName}</span>
                    <span className="text-[12px] font-semibold text-[#92694A]">{host.totalBookings} Bookings</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F5F3F0] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(host.totalBookings / maxBookings) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 + (idx * 0.05) }}
                      className="h-full bg-[#C8622A] rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3 text-[#E8E4DF]" />
            <p className="text-[#8A8A8A] text-[14px]">No rankings available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatsChart = ({ data }) => {
  const chartData = useMemo(() => 
    data?.map(h => ({ name: h.fullName.split(' ')[0], bookings: h.totalBookings })) || [],
    [data]
  );

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#F7F0EA] flex items-center justify-center">
          <Target className="w-5 h-5 text-[#92694A]" />
        </div>
        <div>
          <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Booking Distribution</h3>
          <p className="text-[12px] text-[#8A8A8A]">Booking volume per top host</p>
        </div>
      </div>
      
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F3F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8A8A8A', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8A8A8A', fontSize: 11, fontWeight: 500 }} 
            />
            <Tooltip 
              cursor={{ fill: '#F5F3F0', radius: 4 }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #E8E4DF', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                backgroundColor: '#FFFFFF',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}
            />
            <Bar dataKey="bookings" radius={[4, 4, 0, 0]} barSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#C8622A" : "#92694A"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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
    <div className="min-h-screen bg-[#FAFAF8] font-['Inter'] selection:bg-[#FDF0EA] selection:text-[#C8622A]">
      <AdminHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A] mb-1">Administrative Intelligence</p>
              <h1 className="text-[28px] font-semibold text-[#1A1A1A] tracking-tight">
                Platform Analytics
              </h1>
            </div>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-[#E8E4DF] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#FAFAF8] hover:border-[#D4CEC8] transition-all shadow-sm"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#8A8A8A] font-medium text-[14px]">Computing analytics...</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {!stats ? (
                  <div className="text-center py-32 bg-white rounded-2xl border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <Users className="w-12 h-12 mx-auto text-[#E8E4DF] mb-4" />
                    <p className="text-[#8A8A8A] font-medium">No statistical data discovered.</p>
                  </div>
                ) : (
                  <>
                    {/* Top Row: Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <MetricCard
                        label="Total Bookings"
                        value={stats.totalBookings || 0}
                        icon={CalendarCheck}
                        iconBg="bg-[#C8622A]"
                        delay={0.1}
                      />
                      <MetricCard
                        label="Active Hosts"
                        value={totalHosts}
                        icon={Users}
                        iconBg="bg-[#92694A]"
                        delay={0.15}
                      />
                      <MetricCard
                        label="Host Partners"
                        value={stats.topHosts?.length || 0}
                        icon={Trophy}
                        iconBg="bg-[#1A1A1A]"
                        delay={0.2}
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
                    <div className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] p-8 md:p-10 text-white shadow-xl">
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <h2 className="text-[22px] font-semibold mb-2">Export Full Data Report</h2>
                          <p className="text-[#8A8A8A] text-[14px] max-w-md">
                            Generate comprehensive performance reports for all hosts and bookings in CSV or PDF format.
                          </p>
                        </div>
                        <button className="bg-[#C8622A] text-white px-8 py-3 rounded-lg font-medium text-[14px] hover:bg-[#A84E20] transition-all flex items-center gap-2 shadow-lg">
                          Generate Report
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Subtle pattern instead of glow */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                    </div>
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
