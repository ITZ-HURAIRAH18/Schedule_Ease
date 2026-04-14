// src/pages/admin/AdminStats.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import {
  CalendarDaysIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalHosts, setTotalHosts] = useState(0);
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get("/admin/stats"),
        axiosInstance.get("/admin/users"),          // ← pull users
      ]);
      setStats(statsRes.data);

      // count hosts
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

  if (loading)
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center text-blue-600">Loading…</div>
      </>
    );

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-blue-900">Admin Statistics</h1>
            <p className="text-blue-700 mt-1">Key metrics at a glance</p>
          </header>

          {!stats ? (
            <div className="text-center text-blue-600">No stats available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Bookings */}
              <MetricCard
                label="Total Bookings"
                value={stats.totalBookings}
                icon={<CalendarDaysIcon className="w-7 h-7" />}
                gradient="from-blue-50 to-blue-100"
                text="text-blue-700"
              />

              {/* Active Hosts */}
              {/* Total Hosts */}
              <MetricCard
                label="Total Hosts"
                value={totalHosts}
                icon={<UserGroupIcon className="w-7 h-7" />}
                gradient="from-cyan-50 to-cyan-100"
                text="text-cyan-700"
              />

              {/* Top Hosts */}
              <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-6 bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-200/60 flex items-center justify-center">
                    <TrophyIcon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold">Top Hosts</h3>
                </div>
                <ul className="space-y-2">
                  {stats.topHosts?.length ? (
                    stats.topHosts.map((host, idx) => (
                      <li key={host._id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{host.fullName}</span>
                        <span className="px-2.5 py-1 rounded-full bg-sky-200 text-sky-800 text-xs font-medium">
                          {host.totalBookings} bookings
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-sky-600">No data</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ---------- sub-components ---------- */
const MetricCard = ({ label, value, icon, gradient, text }) => (
  <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-6 flex items-center gap-5 bg-gradient-to-br ${gradient} ${text}`}>
    <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

export default AdminStats;