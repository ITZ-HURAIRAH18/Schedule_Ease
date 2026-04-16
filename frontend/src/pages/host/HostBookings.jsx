// src/pages/host/HostBookings.jsx
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import Tilt from "../../components/Tilt";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Globe,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  RefreshCcw,
} from "lucide-react";
import { formatDate, formatTime } from "../../utils/timeUtils";

const HostBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    axiosInstance
      .get("/host/bookings")
      .then((res) => {
        if (res.data.success) setBookings(res.data.bookings);
      })
      .catch(() => { });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axiosInstance.put(`/host/bookings/update-status/${id}`, { status: newStatus });
      setBookings((prev) => prev.map((bk) => (bk._id === id ? { ...bk, status: newStatus } : bk)));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const guestName = (b.guest?.name || "").toLowerCase();
      const guestEmail = (b.guest?.email || "").toLowerCase();
      const bookedByName = (b.createdByUserId?.fullName || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        guestName.includes(search) ||
        guestEmail.includes(search) ||
        bookedByName.includes(search);

      const matchesFilter =
        filterStatus === "All" || b.status.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusColors = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    rescheduled: "bg-violet-100 text-violet-700 border-violet-200",
  };

  const statusIcons = {
    confirmed: <CheckCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
    pending: <AlertCircle className="w-4 h-4" />,
    rescheduled: <RefreshCcw className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <HostHeader />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
            <p className="text-slate-500 mt-1">Review, manage, and update your guest bookings efficiently.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all w-full md:w-64 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {["All", "Confirmed", "Pending", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-violet-200 hover:text-violet-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-600 sticky top-0 z-10">
                    <th className="px-6 py-4 text-xs font-semibold text-violet-50 uppercase tracking-wider rounded-tl-3xl">Guest Information</th>
                    <th className="px-6 py-4 text-xs font-semibold text-violet-50 uppercase tracking-wider">Booked By</th>
                    <th className="px-6 py-4 text-xs font-semibold text-violet-50 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-4 text-xs font-semibold text-violet-50 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-violet-50 uppercase tracking-wider text-center rounded-tr-3xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {paginatedBookings.length > 0 ? (
                      paginatedBookings.map((b) => (
                        <motion.tr
                          key={b._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-violet-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-200">
                                  {(b.guest?.name || "G").charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{b.guest?.name || "Anonymous"}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span>{b.guest?.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {b.createdByUserId ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-700">{b.createdByUserId.fullName}</p>
                                <p className="text-xs text-slate-400 font-mono tracking-tighter">{b.createdByUserId.email}</p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                Direct Booking
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <Calendar className="w-4 h-4 text-violet-500" />
                                <span>{formatDate(b.start)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>{formatTime(b.start)} – {formatTime(b.end)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-6">
                                <Globe className="w-3 h-3" />
                                <span>{b.availabilityId?.timezone || "UTC"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b._id, e.target.value)}
                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold border outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer ${statusColors[b.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                              >
                                <option value="pending">PENDING</option>
                                <option value="confirmed">CONFIRMED</option>
                                <option value="cancelled">CANCELLED</option>
                                <option value="rescheduled">RESCHEDULED</option>
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60">
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative group/tooltip">
                                <button
                                  onClick={() => setSelected(b)}
                                  className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all duration-300 shadow-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                  View Details
                                </span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                              <Filter className="w-8 h-8 text-slate-200" />
                            </div>
                            <h3 className="text-slate-900 font-semibold">No bookings found</h3>
                            <p className="text-slate-500 text-sm">Try adjusting your filters or search terms</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedBookings.map((b) => (
              <motion.div
                key={b._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Tilt className="h-full">
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {(b.guest?.name || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{b.guest?.name || "Guest"}</h3>
                          <p className="text-xs text-slate-500">{b.guest?.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase flex items-center gap-1.5 ${statusColors[b.status]}`}>
                        {statusIcons[b.status]}
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                          <Calendar className="w-4 h-4 text-violet-500" />
                          <span>{formatDate(b.start)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                          <Clock className="w-4 h-4 text-violet-500" />
                          <span>{formatTime(b.start)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked By</p>
                        <p className="text-xs text-slate-600 font-medium">{b.createdByUserId?.fullName || "Self"}</p>
                      </div>
                      <button
                        onClick={() => setSelected(b)}
                        className="px-6 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-200 active:scale-95 transition-all"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-violet-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.main>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            booking={selected}
            onClose={() => setSelected(null)}
            statusColors={statusColors}
            statusIcons={statusIcons}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- sub-components ---------- */

const DetailModal = ({ booking, onClose, statusColors, statusIcons }) => {
  const { guest, createdByUserId, start, end, status, availabilityId } = booking;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="bg-violet-600 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold shadow-inner">
              {(guest?.name || "G").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">{guest?.name || "Guest User"}</h2>
              <p className="text-violet-100 flex items-center gap-2 text-sm mt-1">
                <Mail className="w-4 h-4 opacity-70" />
                {guest?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Booking Information</h3>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase flex items-center gap-2 ${statusColors[status]}`}>
              {statusIcons[status]}
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
            <InfoItem
              icon={<Calendar className="w-5 h-5 text-violet-500" />}
              label="Meeting Date"
              value={new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(start))}
            />
            <InfoItem
              icon={<Clock className="w-5 h-5 text-violet-500" />}
              label="Meeting Time"
              value={`${formatTime(start)} – ${formatTime(end)}`}
            />
            <InfoItem
              icon={<User className="w-5 h-5 text-violet-500" />}
              label="Booked By"
              value={createdByUserId ? createdByUserId.fullName : "Guest"}
            />
            <InfoItem
              icon={<Globe className="w-5 h-5 text-violet-500" />}
              label="Timezone"
              value={availabilityId?.timezone || "UTC"}
            />
          </div>

          {availabilityId && (
            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-6">
               <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Buffer Before</p>
                <p className="text-slate-700 font-semibold">{availabilityId.bufferBefore || 0} min</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Buffer After</p>
                <p className="text-slate-700 font-semibold">{availabilityId.bufferAfter || 0} min</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Daily Max</p>
                <p className="text-slate-700 font-semibold">{availabilityId.maxPerDay} bookings</p>
              </div>
            </div>
          )}

          <div className="mt-10">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
            >
              Close Details
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  </div>
);

export default HostBookings;