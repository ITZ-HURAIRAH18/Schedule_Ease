// src/pages/host/AddAvailability.jsx
import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Minus,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";

const daysOfWeek = [
  { full: "monday", short: "Mon" },
  { full: "tuesday", short: "Tue" },
  { full: "wednesday", short: "Wed" },
  { full: "thursday", short: "Thu" },
  { full: "friday", short: "Fri" },
  { full: "saturday", short: "Sat" },
  { full: "sunday", short: "Sun" },
];

const AddAvailability = () => {
  const [weekly, setWeekly] = useState([{ day: "monday", start: "09:00", end: "17:00" }]);
  const [bufferBefore, setBufferBefore] = useState(15);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [durations, setDurations] = useState(30);
  const [maxPerDay, setMaxPerDay] = useState(8);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [blockedDates, setBlockedDates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const addDay = () => setWeekly([...weekly, { day: "monday", start: "09:00", end: "17:00" }]);
  const updateDay = (i, f, v) => setWeekly((w) => w.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  const removeDay = (i) => setWeekly((w) => w.filter((_, idx) => idx !== i));

  const addBlocked = () => setBlockedDates([...blockedDates, ""]);
  const updateBlock = (i, v) => setBlockedDates((d) => d.map((dt, idx) => (idx === i ? v : dt)));
  const removeBlock = (i) => setBlockedDates((d) => d.filter((_, idx) => idx !== i));

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const hostId = storedUser?.id;
      if (!hostId) {
        toast.error("User not found — please log in again.");
        setIsSaving(false);
        return;
      }

      const payload = {
        hostId,
        weekly: weekly.filter((w) => w.day && w.start && w.end),
        bufferBefore: Number(bufferBefore),
        bufferAfter: Number(bufferAfter),
        durations: Number(durations),
        maxPerDay: Number(maxPerDay),
        timezone,
        blockedDates: blockedDates.filter(Boolean),
      };

      await axiosInstance.post("/host/availability/add", payload);
      toast.success("Availability saved successfully!");
      setIsSaving(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
      setIsSaving(false);
    }
  };

  const Stepper = ({ label, value, onChange, min = 0, max = 120, step = 5 }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">{label}</label>
      <div className="flex items-center">
        <button 
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 flex items-center justify-center border border-[#E8E4DF] border-r-0 rounded-l-lg bg-[#F5F3F0] hover:bg-[#E8E4DF] transition-colors"
        >
          <Minus className="w-4 h-4 text-[#4A4A4A]" />
        </button>
        <div className="flex-1 h-11 border border-[#E8E4DF] flex items-center justify-center bg-white text-[14px] font-medium text-[#1A1A1A]">
          {value} min
        </div>
        <button 
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-11 h-11 flex items-center justify-center border border-[#E8E4DF] border-l-0 rounded-r-lg bg-[#F5F3F0] hover:bg-[#E8E4DF] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#4A4A4A]" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] page-enter">
      <Toaster position="bottom-right" />
      <HostHeader />

      <main className="max-w-[640px] mx-auto px-6 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Add Availability</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-2">Define your working hours and preferences.</p>
        </header>

        <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-8 shadow-sm space-y-10">
          {/* Weekly Schedule */}
          <section>
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A] block mb-6">
              Weekly Schedule
            </span>
            <div className="space-y-6">
              {weekly.map((slot, i) => (
                <div key={i} className="p-6 bg-[#F5F3F0]/50 border border-[#E8E4DF] rounded-[12px] relative group">
                  <button
                    onClick={() => removeDay(i)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-[#E8E4DF] rounded-full flex items-center justify-center text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-6">
                    {/* Day Selector */}
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.full}
                          onClick={() => updateDay(i, "day", day.full)}
                          className={`h-9 px-4 rounded-full text-[13px] font-medium transition-all ${
                            slot.day === day.full
                              ? "bg-[#C8622A] text-white"
                              : "bg-[#F5F3F0] text-[#4A4A4A] hover:bg-[#E8E4DF]"
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Start Time</label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateDay(i, "start", e.target.value)}
                          className="h-11 px-4 border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A]"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">End Time</label>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateDay(i, "end", e.target.value)}
                          className="h-11 px-4 border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addDay}
                className="flex items-center gap-2 text-[#C8622A] text-[14px] font-medium hover:text-[#A84E20] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Day
              </button>
            </div>
          </section>

          {/* Preferences */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Stepper label="Buffer Before" value={bufferBefore} onChange={setBufferBefore} />
            <Stepper label="Buffer After" value={bufferAfter} onChange={setBufferAfter} />
            <Stepper label="Duration" value={durations} onChange={setDurations} min={15} max={180} />
            <Stepper label="Daily Limit" value={maxPerDay} onChange={setMaxPerDay} min={1} max={50} step={1} />
          </section>

          {/* Timezone */}
          <section className="pt-6 border-t border-[#E8E4DF]">
            <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A] block mb-2">Timezone</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#F5F3F0] border border-transparent rounded-lg text-[14px] focus:bg-white focus:border-[#C8622A] outline-none transition-all"
              />
            </div>
          </section>

          {/* Blocked Dates */}
          <section className="pt-6 border-t border-[#E8E4DF]">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A] block mb-4">
              Blocked Dates
            </span>
            <div className="space-y-3">
              {blockedDates.map((date, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => updateBlock(i, e.target.value)}
                    className="flex-1 h-11 px-4 border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A]"
                  />
                  <button
                    onClick={() => removeBlock(i)}
                    className="w-11 h-11 flex items-center justify-center bg-[#FEF2F2] text-[#B91C1C] rounded-lg hover:bg-[#FEE2E2] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addBlocked}
                className="flex items-center gap-2 text-[#C8622A] text-[13px] font-medium mt-2"
              >
                <Plus className="w-4 h-4" /> Add Blocked Date
              </button>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={save}
            disabled={isSaving}
            className="w-full h-[48px] bg-[#1A1A1A] hover:bg-black text-white font-medium text-[16px] rounded-[10px] transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AddAvailability;
