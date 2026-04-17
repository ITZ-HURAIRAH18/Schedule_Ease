import { useEffect, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import io from "socket.io-client";
import { getSocketUrl } from "../../utils/apiConfig";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Clock,
  ArrowUpRight
} from "lucide-react";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(getSocketUrl(), {
      secure: window.location.protocol === 'https:',
      rejectUnauthorized: false,
    });
    socketRef.current = socket;

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
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5 text-white" />,
      iconBg: "bg-[#C8622A]", // terracotta
    },
    {
      label: "Total Bookings",
      value: data?.totalBookings ?? 0,
      icon: <Calendar className="w-5 h-5 text-white" />,
      iconBg: "bg-[#92694A]", // brown
    },
    {
      label: "Recent Sign-ups",
      value: data?.recentUsers?.length ?? 0,
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      iconBg: "bg-[#1A1A1A]", // slate/dark
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-['Inter'] selection:bg-[#FDF0EA] selection:text-[#C8622A]">
      <AdminHeader />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] tracking-tight mb-1">
              Platform Overview
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D7D52]" />
              <span className="text-[13px] text-[#8A8A8A] font-medium">Live activity monitoring active</span>
            </div>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {[1, 2, 3].map((i) => <StatSkeleton key={i} />)}
            </div>
          ) : !data ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <p className="text-[#8A8A8A] font-medium">No dashboard data available.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {statCards.map((card, idx) => (
                  <StatCard key={card.label} {...card} delay={0.1 + idx * 0.05} />
                ))}
              </div>

              {/* Recent Users Table */}
              <motion.section 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="bg-white rounded-2xl border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden"
              >
                <div className="px-8 py-6 border-b border-[#E8E4DF] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Sign-ups</h2>
                    <p className="text-[13px] text-[#8A8A8A]">Newest members of your platform</p>
                  </div>
                  <a href="/admin/users" className="text-[13px] font-medium text-[#C8622A] hover:text-[#A84E20] transition-colors flex items-center gap-1.5">
                    View all users <ArrowRight size={14} />
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F5F3F0]">
                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">User</th>
                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">Role</th>
                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">Joined Date</th>
                        <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A] text-right">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4DF]">
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
                    <p className="text-[#8A8A8A]">No recent users found.</p>
                  </div>
                )}
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
    const controls = animate(count, value, { duration: 0.6, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ label, value, icon, iconBg, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="group bg-white rounded-xl p-[20px_24px] border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
    >
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-[28px] font-semibold text-[#1A1A1A]">
            <AnimatedCounter value={value} />
          </h3>
          {value > 0 && (
            <span className="flex items-center text-[11px] font-medium text-[#2D7D52] bg-[#EDF7F1] px-2 py-0.5 rounded-md">
              <ArrowUpRight size={10} className="mr-0.5" /> 12%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const UserTableRow = ({ user, index }) => {
  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-[#1A1A1A] text-white";
      case "host": return "bg-[#F5F3F0] text-[#92694A]";
      case "user": return "bg-[#FDF0EA] text-[#C8622A]";
      default: return "bg-[#F5F3F0] text-[#4A4A4A]";
    }
  };

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <motion.tr 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.03 }}
      className="group hover:bg-[#FAFAF8] transition-colors"
    >
      <td className="px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F5F3F0] text-[#92694A] flex items-center justify-center font-semibold text-sm">
            {(user.fullName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#1A1A1A]">{user.fullName || "Unknown"}</p>
            <p className="text-[12px] text-[#8A8A8A]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-4">
        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium uppercase tracking-wider ${getRoleStyle(user.role)}`}>
          {user.role || "user"}
        </span>
      </td>
      <td className="px-8 py-4 text-[13px] text-[#4A4A4A]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#D4CEC8]" />
          {formattedDate}
        </div>
      </td>
      <td className="px-8 py-4 text-right">
        <div className="text-[12px] font-medium text-[#2D7D52]">Active</div>
      </td>
    </motion.tr>
  );
};

const StatSkeleton = () => (
  <div className="bg-white rounded-xl p-[20px_24px] border border-[#E8E4DF] h-[140px] animate-pulse">
    <div className="w-9 h-9 rounded-lg bg-[#F5F3F0] mb-4" />
    <div className="h-4 w-24 bg-[#F5F3F0] rounded-md mb-2" />
    <div className="h-8 w-16 bg-[#F5F3F0] rounded-md" />
  </div>
);

export default AdminDashboard;
