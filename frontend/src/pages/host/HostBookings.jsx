// src/pages/host/HostBookings.jsx
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
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
  Mail,
  RefreshCcw,
  X
} from "lucide-react";
import { formatDate, formatTime } from "../../utils/timeUtils";

const HostBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const itemsPerPage = 8;

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
    if (updatingId) return; // prevent multiple simultaneous requests
    
    setUpdatingId(id);
    try {
      await axiosInstance.put(`/host/bookings/update-status/${id}`, { status: newStatus });
      setBookings((prev) => prev.map((bk) => (bk._id === id ? { ...bk, status: newStatus } : bk)));
      if (selected && selected._id === id) {
        setSelected((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success("Status updated successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update status";
      toast.error(errorMsg);
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const guestName = (b.guest?.name || "").toLowerCase();
      const guestEmail = (b.guest?.email || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = guestName.includes(search) || guestEmail.includes(search);
      const matchesFilter = filterStatus === "All" || b.status.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusMap = {
    confirmed: { bg: "#EDF7F1", text: "#2D7D52", icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { bg: "#FEF2F2", text: "#B91C1C", icon: <XCircle className="w-3 h-3" /> },
    rejected: { bg: "#FEF2F2", text: "#B91C1C", icon: <XCircle className="w-3 h-3" /> },
    pending: { bg: "#FEF3E2", text: "#B45309", icon: <AlertCircle className="w-3 h-3" /> },
    rescheduled: { bg: "#F5F3F0", text: "#92694A", icon: <RefreshCcw className="w-3 h-3" /> },
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] page-enter">
      <Toaster position="bottom-right" />
      <HostHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Booking Management</h1>
            <p className="text-[14px] text-[#4A4A4A] mt-1">Review and manage your guest schedules.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A] transition-all placeholder:text-[#B0B0B0]"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-8 border-b border-[#E8E4DF] mb-8">
          {["All", "Confirmed", "Pending", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              className={`pb-4 text-[14px] font-medium transition-all relative ${
                filterStatus === status ? "text-[#C8622A]" : "text-[#8A8A8A] hover:text-[#1A1A1A]"
              }`}
            >
              {status}
              {filterStatus === status && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8622A]" />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E8E4DF] rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F3F0]">
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-[0.06em]">Guest Information</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-[0.06em]">Schedule</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-[0.06em]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-[0.06em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DF]">
                {paginatedBookings.length > 0 ? (
                  paginatedBookings.map((b) => {
                    const statusStyle = statusMap[b.status] || statusMap.pending;
                    return (
                      <tr key={b._id} className="hover:bg-[#FAFAF8] transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#F5F3F0] text-[#92694A] flex items-center justify-center font-semibold text-[15px]">
                              {(b.guest?.name || "G").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#1A1A1A]">{b.guest?.name || "Anonymous"}</p>
                              <p className="text-[12px] text-[#8A8A8A]">{b.guest?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[13px] text-[#1A1A1A] font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#C8622A]" />
                              <span>{formatDate(b.start)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-[#4A4A4A]">
                              <Clock className="w-3.5 h-3.5 text-[#8A8A8A]" />
                              <span>{formatTime(b.start)} – {formatTime(b.end)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="relative inline-block w-full group">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateStatus(b._id, e.target.value)}
                              disabled={updatingId === b._id}
                              className="w-full px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider border border-transparent hover:border-[#C8622A] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#C8622A] focus:ring-offset-0 appearance-none bg-no-repeat"
                              style={{
                                backgroundColor: updatingId === b._id ? "#F5F3F0" : statusMap[b.status]?.bg || statusMap.pending.bg,
                                color: statusMap[b.status]?.text || statusMap.pending.text,
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${(statusMap[b.status]?.text || statusMap.pending.text).replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundPosition: "right 6px center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "16px",
                                paddingRight: "28px"
                              }}
                            >
                              <option value="pending" style={{ color: "#000" }}>PENDING</option>
                              <option value="confirmed" style={{ color: "#000" }}>CONFIRMED</option>
                              <option value="cancelled" style={{ color: "#000" }}>CANCELLED</option>
                              <option value="rescheduled" style={{ color: "#000" }}>RESCHEDULED</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelected(b)}
                            className="text-[#C8622A] text-[13px] font-medium hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-[#F5F3F0] rounded-full flex items-center justify-center">
                          <Filter className="w-6 h-6 text-[#8A8A8A]" />
                        </div>
                        <h3 className="text-[#1A1A1A] font-semibold text-[16px]">No bookings found</h3>
                        <p className="text-[#8A8A8A] text-[14px]">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-[13px] text-[#8A8A8A]">
              Showing <span className="text-[#1A1A1A] font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#1A1A1A] font-medium">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="text-[#1A1A1A] font-medium">{filteredBookings.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#4A4A4A] hover:border-[#C8622A] hover:text-[#C8622A] disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#4A4A4A] hover:border-[#C8622A] hover:text-[#C8622A] disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            booking={selected}
            onClose={() => setSelected(null)}
            onUpdateStatus={handleUpdateStatus}
            statusMap={statusMap}
            updatingId={updatingId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailModal = ({ booking, onClose, onUpdateStatus, statusMap, updatingId }) => {
  const { guest, createdByUserId, start, end, status, availabilityId, _id } = booking;
  const statusStyle = statusMap[status] || statusMap.pending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#F5F3F0] text-[#92694A] flex items-center justify-center font-semibold text-[20px]">
                {(guest?.name || "G").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">{guest?.name || "Guest User"}</h2>
                <p className="text-[14px] text-[#8A8A8A]">{guest?.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-[#F5F3F0] rounded-lg transition-colors text-[#8A8A8A]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="py-4 border-b border-[#E8E4DF]">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A] block mb-4">Update Booking Status</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onUpdateStatus(_id, "confirmed")}
                  disabled={updatingId === _id || status === "confirmed"}
                  className={`h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                    status === "confirmed"
                      ? "bg-[#EDF7F1] text-[#2D7D52] border border-transparent"
                      : "bg-white border border-[#E8E4DF] text-[#1A1A1A] hover:border-[#2D7D52] hover:text-[#2D7D52]"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm
                </button>
                <button
                  onClick={() => onUpdateStatus(_id, "cancelled")}
                  disabled={updatingId === _id || status === "cancelled"}
                  className={`h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                    status === "cancelled"
                      ? "bg-[#FEF2F2] text-[#B91C1C] border border-transparent"
                      : "bg-white border border-[#E8E4DF] text-[#1A1A1A] hover:border-[#B91C1C] hover:text-[#B91C1C]"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={() => onUpdateStatus(_id, "rescheduled")}
                  disabled={updatingId === _id || status === "rescheduled"}
                  className="col-span-2 h-11 rounded-xl bg-white border border-[#E8E4DF] text-[#1A1A1A] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F5F3F0] transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Mark for Rescheduling
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <InfoItem icon={<Calendar />} label="Date" value={formatDate(start)} />
              <InfoItem icon={<Clock />} label="Time" value={`${formatTime(start)} — ${formatTime(end)}`} />
              <InfoItem icon={<User />} label="Booked By" value={createdByUserId?.fullName || "Guest"} />
              <InfoItem icon={<Globe />} label="Timezone" value={availabilityId?.timezone || "UTC"} />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-12 mt-10 bg-[#C8622A] hover:bg-[#A84E20] text-white font-medium text-[14px] rounded-[10px] transition-all"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-[#8A8A8A]">
      {icon && <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
    </div>
    <p className="text-[14px] font-medium text-[#1A1A1A]">{value}</p>
  </div>
);

export default HostBookings;
