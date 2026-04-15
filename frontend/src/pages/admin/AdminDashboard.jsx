// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import { io } from "socket.io-client";

import {
  UserGroupIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// Use empty string so socket.io connects to the current origin (e.g. localhost:5173)
// and the Vite dev server proxy forwards /socket.io to the backend.
const socket = io("", {
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

  /* ---------- helpers ---------- */
  const statCards = [
    {
      label: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: <UserGroupIcon className="w-6 h-6" />,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Bookings",
      value: data?.totalBookings ?? 0,
      icon: <CalendarDaysIcon className="w-6 h-6" />,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Recent Sign-ups",
      value: data?.recentUsers?.length ?? 0,
      icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
      gradient: "from-sky-500 to-sky-600",
    },
  ];

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-blue-900">Admin Dashboard</h1>
            <p className="text-blue-700 mt-1">Real-time platform overview</p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-blue-600">Loading…</div>
          ) : !data ? (
            <div className="text-center text-blue-600">No dashboard data available.</div>
          ) : (
            <div className="space-y-10">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>

              {/* Recent Users */}
              <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" /> Recent Sign-ups
                </h2>
                {data.recentUsers?.length ? (
                  <div className="divide-y divide-blue-100">
                    {data.recentUsers.map((user) => (
                      <UserRow key={user._id} user={user} />
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-600 text-sm">No recent users.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ---------- sub-components ---------- */
const StatCard = ({ label, value, icon, gradient }) => (
  <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-6 flex items-center gap-5 bg-gradient-to-br ${gradient} text-white`}>
    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-sm text-white/80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

const UserRow = ({ user }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
        {(user.fullName || "U").charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="font-semibold text-blue-900">{user.fullName || "Unknown"}</p>
        <p className="text-xs text-blue-600">{user.email}</p>
      </div>
    </div>
    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
      {user.role || "user"}
    </span>
  </div>
);

export default AdminDashboard;