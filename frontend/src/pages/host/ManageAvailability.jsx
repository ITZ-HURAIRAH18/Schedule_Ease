// src/pages/host/ManageAvailability.jsx
import React, { useEffect, useState } from "react";
import { 
  Globe, 
  Pencil, 
  Trash2, 
  Eye, 
  Plus, 
  X,
  Clock,
  Timer,
  Calendar
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import { useNavigate } from "react-router-dom";

const ManageAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const navigate = useNavigate();

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const fetchAvailability = async () => {
    try {
      const res = await axiosInstance.get("/host/availability/me");
      setAvailability(res.data.availability || []);
    } catch {
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleEdit = (id) => navigate(`/host/edit-availability/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this availability permanently?")) return;
    try {
      await axiosInstance.delete(`/host/availability/delete/${id}`);
      setAvailability(prev => prev.filter(item => item._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <HostHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8E4DF] border-t-[#C8622A] rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] page-enter">
      <HostHeader />
      
      <main className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Manage Availability</h1>
            <p className="text-[#4A4A4A] mt-1 text-[14px]">Manage your schedules and booking windows.</p>
          </div>

          <button
            onClick={() => navigate("/host/add-availability")}
            className="flex items-center gap-2 bg-[#C8622A] hover:bg-[#A84E20] text-white px-5 py-2.5 rounded-[10px] font-medium text-[14px] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Schedule</span>
          </button>
        </header>

        {availability.length === 0 ? (
          <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F5F3F0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#8A8A8A]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-2">No schedules found</h3>
            <p className="text-[14px] text-[#8A8A8A] max-w-xs mx-auto mb-8">
              You haven't set up any availability yet. Create your first schedule to start accepting bookings.
            </p>
            <button
              onClick={() => navigate("/host/add-availability")}
              className="bg-[#C8622A] hover:bg-[#A84E20] text-white px-6 py-3 rounded-[10px] font-medium text-[15px] transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availability.map((item) => (
              <AvailabilityCard
                key={item._id}
                item={item}
                onEdit={() => handleEdit(item._id)}
                onDelete={() => handleDelete(item._id)}
                onView={() => setViewData(item)}
              />
            ))}
          </div>
        )}
      </main>

      {viewData && (
        <ViewModal 
          data={viewData} 
          formatTime={formatTime} 
          onClose={() => setViewData(null)} 
        />
      )}
    </div>
  );
};

const AvailabilityCard = ({ item, onEdit, onDelete, onView }) => {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 hover-card flex flex-col shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FDF0EA] text-[#C8622A] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#1A1A1A]">{item.timezone}</h3>
        </div>
        
        <div className="flex gap-2">
          <IconButton icon={<Eye className="w-4 h-4" />} onClick={onView} />
          <IconButton icon={<Pencil className="w-4 h-4" />} onClick={onEdit} />
          <IconButton icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {item.weekly.slice(0, 3).map((w, i) => (
          <div key={i} className="flex justify-between items-center text-[13px]">
            <span className="text-[#92694A] font-medium capitalize">{w.day}</span>
            <span className="text-[#4A4A4A]">{w.start} — {w.end}</span>
          </div>
        ))}
        {item.weekly.length > 3 && (
          <p className="text-[12px] text-[#8A8A8A] font-medium">+{item.weekly.length - 3} more days</p>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-[#E8E4DF] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-[#8A8A8A]">
          <Timer className="w-3.5 h-3.5" />
          <span>{item.durations[0]}m session</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#8A8A8A]">
          <Clock className="w-3.5 h-3.5" />
          <span>Buffers: {item.bufferBefore}/{item.bufferAfter}m</span>
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-8 h-8 rounded-full bg-[#F5F3F0] text-[#4A4A4A] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors shadow-sm"
  >
    {icon}
  </button>
);

const ViewModal = ({ data, formatTime, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div onClick={onClose} className="absolute inset-0 bg-black/35" />
      <div className="relative w-full max-w-lg bg-white rounded-[20px] shadow-2xl p-8 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-[#F5F3F0] text-[#8A8A8A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-[22px] font-semibold text-[#1A1A1A] mb-8">Schedule Details</h2>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <ModalInfo label="Timezone" value={data.timezone} icon={<Globe />} />
            <ModalInfo label="Duration" value={`${data.durations[0]} minutes`} icon={<Timer />} />
            <ModalInfo label="Buffers" value={`${data.bufferBefore}m / ${data.bufferAfter}m`} icon={<Clock />} />
            <ModalInfo label="Daily Max" value={`${data.maxPerDay} bookings`} icon={<Calendar />} />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#92694A] block mb-4">Weekly Schedule</span>
            <div className="space-y-3 bg-[#F5F3F0]/50 p-4 rounded-xl border border-[#E8E4DF]">
              {data.weekly.map((w, i) => (
                <div key={i} className="flex justify-between items-center text-[13px]">
                  <span className="text-[#92694A] font-medium capitalize">{w.day}</span>
                  <span className="text-[#4A4A4A] font-medium">{formatTime(w.start)} — {formatTime(w.end)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 mt-10 bg-[#C8622A] hover:bg-[#A84E20] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
};

const ModalInfo = ({ label, value, icon }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-[#8A8A8A]">
      <span className="w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
    </div>
    <p className="text-[14px] font-semibold text-[#1A1A1A]">{value}</p>
  </div>
);

export default ManageAvailability;
