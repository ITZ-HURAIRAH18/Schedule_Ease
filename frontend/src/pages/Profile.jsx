import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Globe, Bell, CheckCircle, Camera, Mail, Calendar, Shield, AtSign } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import UserHeader from "../components/UserHeader";
import HostHeader from "../components/HostHeader";
import AdminHeader from "../components/AdminHeader";

const timezones = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai",
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland", "America/Toronto",
  "Europe/Berlin", "Europe/Madrid", "Asia/Singapore", "Asia/Shanghai",
];

const roleLabels = {
  user: { name: "User", gradient: "from-[#FC6C26]/10 to-[#FFF4D6]" },
  host: { name: "Host", gradient: "from-[#FC6C26]/10 to-[#FFF4D6]" },
  admin: { name: "Admin", gradient: "from-[#FC6C26]/10 to-[#FFF4D6]" },
};

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    role: "",
    profilePicture: "",
    timezone: "UTC",
    notificationPreferences: { email: true, sms: false },
    bookingLink: "",
    createdAt: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (res.data?.user) {
          const u = res.data.user;
          setProfile({
            fullName: u.fullName || "",
            username: u.username || "",
            email: u.email || "",
            role: u.role || "",
            profilePicture: u.profilePicture || "",
            timezone: u.timezone || "UTC",
            notificationPreferences: u.notificationPreferences || { email: true, sms: false },
            bookingLink: u.bookingLink || "",
            createdAt: u.createdAt || "",
          });
          setAvatarPreview(u.profilePicture || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put("/auth/update-profile", {
        fullName: profile.fullName,
        username: profile.username,
        timezone: profile.timezone,
        profilePicture: profile.profilePicture,
        notificationPreferences: profile.notificationPreferences,
        bookingLink: profile.bookingLink,
      });
      toast.success("Profile saved successfully!", {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        style: {
          borderRadius: '10px',
          background: '#FFF4D6',
          color: '#1A1A1A',
          border: '1px solid #E8DCC0',
          fontSize: '14px',
          padding: '12px 16px',
        },
      });
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageError = () => {
    setAvatarPreview("");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const roleInfo = roleLabels[profile.role] || roleLabels.user;
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF4D6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8DCC0] border-t-[#FC6C26] rounded-full animate-spin" />
      </div>
    );
  }

  const renderHeader = () => {
    switch (profile.role) {
      case "host": return <HostHeader />;
      case "admin": return <AdminHeader />;
      default: return <UserHeader />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF4D6]">
      <Toaster position="bottom-right" />
      {renderHeader()}

      <main className="max-w-[600px] mx-auto px-6 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Profile</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">Manage your personal information and preferences.</p>
        </header>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                onError={handleImageError}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#E8DCC0]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {getInitials(profile.fullName)}
              </div>
            )}
            <label className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center cursor-pointer transition-all">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
              <input
                type="text"
                className="hidden"
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile({ ...profile, profilePicture: val });
                  setAvatarPreview(val);
                }}
              />
            </label>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={profile.profilePicture}
              onChange={(e) => {
                setProfile({ ...profile, profilePicture: e.target.value });
                setAvatarPreview(e.target.value);
              }}
              placeholder="Paste image URL..."
              className="w-56 text-center text-[12px] bg-transparent border-b border-[#E8DCC0] pb-1 text-[#8A8A8A] focus:outline-none focus:border-[#FC6C26] transition-all placeholder:text-[#C4B4A0]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E8DCC0] rounded-[16px] p-8 shadow-sm space-y-6">
          {/* Role Badge & Member Since */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E8DCC0]">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#FC6C26]" />
              <span className="text-[13px] font-medium text-[#4A4A4A] capitalize">{roleInfo.name}</span>
            </div>
            {memberSince && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#8A8A8A]" />
                <span className="text-[12px] text-[#8A8A8A]">Member since {memberSince}</span>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Your full name"
                className="w-full h-11 pl-10 pr-4 bg-[#FFF4D6] border border-[#E8DCC0] rounded-lg text-[14px] focus:outline-none focus:border-[#FC6C26] transition-all"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full h-11 pl-10 pr-4 bg-[#FFF4D6] border border-[#E8DCC0] rounded-lg text-[14px] text-[#8A8A8A] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Choose a username"
                className="w-full h-11 pl-10 pr-4 bg-[#FFF4D6] border border-[#E8DCC0] rounded-lg text-[14px] focus:outline-none focus:border-[#FC6C26] transition-all"
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Timezone</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A] z-10" />
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full h-11 pl-10 pr-4 bg-[#FFF4D6] border border-[#E8DCC0] rounded-lg text-[14px] focus:outline-none focus:border-[#FC6C26] transition-all appearance-none"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#92694A] block">Notifications</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#8A8A8A]" />
                <span className="text-[14px] text-[#4A4A4A]">Email Notifications</span>
              </div>
              <Toggle
                enabled={profile.notificationPreferences.email}
                onChange={(val) => setProfile({
                  ...profile,
                  notificationPreferences: { ...profile.notificationPreferences, email: val }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#8A8A8A]" />
                <span className="text-[14px] text-[#4A4A4A]">SMS Notifications</span>
              </div>
              <Toggle
                enabled={profile.notificationPreferences.sms}
                onChange={(val) => setProfile({
                  ...profile,
                  notificationPreferences: { ...profile.notificationPreferences, sms: val }
                })}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 mt-6 bg-[#FC6C26] hover:bg-[#E05A1A] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </main>
    </div>
  );
};

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-[#FC6C26]' : 'bg-[#E8DCC0]'}`}
  >
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
  </button>
);

export default Profile;
