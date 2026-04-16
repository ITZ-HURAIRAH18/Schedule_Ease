// src/pages/host/HostSettings.jsx
import React, { useState, useEffect } from "react";
import { 
  User, 
  Globe, 
  Link as LinkIcon, 
  Bell, 
  CheckCircle,
  Search,
  ChevronDown
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";

const timezones = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", 
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai", 
  "Asia/Kolkata", "Australia/Sydney"
];

const HostSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    username: "",
    timezone: "UTC",
    bookingLink: "",
    notificationPreferences: {
      email: true,
      sms: false
    }
  });

  const [tzSearch, setTzSearch] = useState("");
  const [showTzDropdown, setShowTzDropdown] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (res.data) {
          setSettings({
            username: res.data.username || "",
            timezone: res.data.timezone || "UTC",
            bookingLink: res.data.bookingLink || "",
            notificationPreferences: res.data.notificationPreferences || { email: true, sms: false }
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put("/host/settings", settings);
      toast.success("Settings saved successfully!", {
        icon: <CheckCircle className="w-5 h-5 text-[#2D7D52]" />,
        style: {
          borderRadius: '10px',
          background: '#FFFFFF',
          color: '#1A1A1A',
          border: '1px solid #E8E4DF',
          fontSize: '14px',
          padding: '12px 16px',
        },
      });
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const filteredTzs = timezones.filter(tz => 
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

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
      <Toaster position="bottom-right" />
      <HostHeader />

      <main className="max-w-[560px] mx-auto px-6 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Host Settings</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-2">Manage your profile and preferences.</p>
        </header>

        <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-8 shadow-sm space-y-8">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input 
                type="text"
                value={settings.username}
                onChange={(e) => setSettings({...settings, username: e.target.value})}
                placeholder="Enter username"
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A] transition-all"
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2 relative">
            <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Timezone</label>
            <button 
              onClick={() => setShowTzDropdown(!showTzDropdown)}
              className="w-full h-11 px-4 bg-white border border-[#E8E4DF] rounded-lg text-[14px] flex items-center justify-between text-[#1A1A1A] focus:border-[#C8622A] transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#8A8A8A]" />
                {settings.timezone}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#8A8A8A] transition-transform ${showTzDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showTzDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4DF] rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b border-[#E8E4DF]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" />
                    <input 
                      type="text"
                      value={tzSearch}
                      onChange={(e) => setTzSearch(e.target.value)}
                      placeholder="Search timezone..."
                      className="w-full h-8 pl-8 pr-2 bg-[#F5F3F0] border-none rounded-md text-[13px] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTzs.map(tz => (
                    <button
                      key={tz}
                      onClick={() => {
                        setSettings({...settings, timezone: tz});
                        setShowTzDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors"
                    >
                      {tz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Meeting Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input 
                type="text"
                value={settings.bookingLink}
                onChange={(e) => setSettings({...settings, bookingLink: e.target.value})}
                placeholder="https://zoom.us/j/..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A] transition-all"
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A] block">Notifications</span>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#8A8A8A]" />
                <span className="text-[14px] text-[#4A4A4A]">Email Notifications</span>
              </div>
              <Toggle 
                enabled={settings.notificationPreferences.email} 
                onChange={(val) => setSettings({...settings, notificationPreferences: {...settings.notificationPreferences, email: val}})} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#8A8A8A]" />
                <span className="text-[14px] text-[#4A4A4A]">SMS Notifications</span>
              </div>
              <Toggle 
                enabled={settings.notificationPreferences.sms} 
                onChange={(val) => setSettings({...settings, notificationPreferences: {...settings.notificationPreferences, sms: val}})} 
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 bg-[#C8622A] hover:bg-[#A84E20] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
};

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-[#C8622A]' : 'bg-[#E8E4DF]'}`}
  >
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
  </button>
);

export default HostSettings;
