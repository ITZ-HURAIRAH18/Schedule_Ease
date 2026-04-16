// src/pages/host/HostSettings.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Globe, 
  Bell, 
  Trash2, 
  Camera, 
  Check, 
  ChevronDown, 
  Search,
  UploadCloud,
  Loader2,
  X,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import MeshBackground from "../../components/MeshBackground";
import { useAuth } from "../../context/AuthContext";

/* ---------- Mock Timezones ---------- */
const TIMEZONES = [
  { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles", flag: "🇺🇸" },
  { label: "Mountain Time (US & Canada)", value: "America/Denver", flag: "🇺🇸" },
  { label: "Central Time (US & Canada)", value: "America/Chicago", flag: "🇺🇸" },
  { label: "Eastern Time (US & Canada)", value: "America/New_York", flag: "🇺🇸" },
  { label: "UTC / GMT", value: "UTC", flag: "🌐" },
  { label: "London", value: "Europe/London", flag: "🇬🇧" },
  { label: "Berlin", value: "Europe/Berlin", flag: "🇩🇪" },
  { label: "Pakistan Standard Time", value: "Asia/Karachi", flag: "🇵🇰" },
  { label: "India Standard Time", value: "Asia/Kolkata", flag: "🇮🇳" },
  { label: "Tokyo", value: "Asia/Tokyo", flag: "🇯🇵" },
  { label: "Sydney", value: "Australia/Sydney", flag: "🇦🇺" },
];

/* ---------- Floating Label Input ---------- */
const FloatingInput = ({ label, name, value, onChange, type = "text", icon: Icon }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group mb-6">
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-indigo-500' : 'text-gray-400'}`}>
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full bg-white/50 backdrop-blur-sm border-2 rounded-xl py-3 pl-10 pr-4 outline-none transition-all duration-300 peer placeholder-transparent
          ${isFocused ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-200/50 hover:border-gray-300'}`}
        placeholder={label}
      />
      <label
        className={`absolute left-10 transition-all duration-200 pointer-events-none
          ${(isFocused || value) 
            ? '-top-2.5 left-8 text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full shadow-sm' 
            : 'top-1/2 -translate-y-1/2 text-gray-500'}`}
      >
        {label}
      </label>
    </div>
  );
};

/* ---------- Timezone Select ---------- */
const SearchableSelect = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedTz = TIMEZONES.find(t => t.value === value) || TIMEZONES[0];

  const filtered = useMemo(() => 
    TIMEZONES.filter(t => t.label.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mb-6" ref={dropdownRef}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/50 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl py-3 px-4 flex items-center justify-between hover:border-gray-300 transition-all"
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{selectedTz.flag}</span>
          <span className="text-gray-700 font-medium">{selectedTz.label}</span>
        </span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  autoFocus
                  className="w-full bg-gray-50 rounded-lg py-2 pl-9 pr-4 text-sm outline-none border-none ring-0"
                  placeholder="Search timezones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filtered.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => {
                    onChange({ target: { name: "timezone", value: tz.value } });
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-indigo-50
                    ${value === tz.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'}`}
                >
                  <span className="text-xl">{tz.flag}</span>
                  <span>{tz.label}</span>
                  {value === tz.value && <Check size={16} className="ml-auto" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm italic">No results found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- Avatar Upload ---------- */
const AvatarUpload = ({ value, onChange }) => {
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      // Logic for actual upload would go here
      // onChange({ target: { name: 'avatar', value: file } });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-xl group-hover:shadow-indigo-200/50 transition-all duration-500">
            <div className="w-full h-full rounded-[1.4rem] bg-white overflow-hidden relative">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={64} />
                </div>
              )}
              <div 
                onClick={() => fileRef.current.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <Camera className="text-white" />
              </div>
            </div>
          </div>
          <button 
            onClick={() => fileRef.current.click()}
            className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-white"
          >
            <Camera size={16} />
          </button>
        </div>
        
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
          className="w-full max-w-sm border-2 border-dashed border-gray-200/50 rounded-2xl p-6 text-center hover:border-indigo-400/50 transition-colors cursor-pointer group"
          onClick={() => fileRef.current.click()}
        >
          <UploadCloud className="mx-auto text-gray-400 group-hover:text-indigo-500 transition-colors mb-2" size={32} />
          <p className="text-sm font-medium text-gray-600">Drag & drop profile picture</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
        </div>
        <input 
          type="file" 
          ref={fileRef} 
          hidden 
          accept="image/*" 
          onChange={(e) => handleFile(e.target.files[0])} 
        />
      </div>
    </div>
  );
};

const HostSettings = () => {
  const { logout } = useAuth();
  const [form, setForm] = useState({ username: "", timezone: "", notifications: true });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  /* ---------- Preload Logic ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get("/host/settings");
        setForm(prev => ({ 
          ...prev, 
          username: data.username || "", 
          timezone: data.timezone || "" 
        }));
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    })();
  }, []);

  /* ---------- Handlers ---------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put("/host/settings", form);
      toast.success("Settings updated successfully!", {
        position: "bottom-right",
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch {
      toast.error("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "timezone", label: "Timezone", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  const sidebarVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <MeshBackground />
      <Toaster />
      <HostHeader />

      <main className="max-w-6xl mx-auto px-4 py-12 pb-32">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <motion.aside 
            variants={sidebarVariants}
            initial="initial"
            animate="animate"
            className="w-full lg:w-72 space-y-2"
          >
            <div className="mb-8 px-4">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-gray-500 font-medium">Manage your host account</p>
            </div>
            
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group
                    ${activeSection === section.id 
                      ? 'bg-white shadow-lg shadow-indigo-100 text-indigo-600' 
                      : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'}`}
                >
                  <section.icon 
                    size={20} 
                    className={`transition-colors ${activeSection === section.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} 
                  />
                  {section.label}
                  {activeSection === section.id && (
                    <motion.div 
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"
                    />
                  )}
                </button>
              ))}
            </nav>
          </motion.aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 p-8 sm:p-12 relative overflow-hidden"
              >
                {/* Section Header */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {sections.find(s => s.id === activeSection)?.label}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {activeSection === "profile" && "Update your personal information and profile picture."}
                    {activeSection === "timezone" && "Set your local time to sync your availability accurately."}
                    {activeSection === "notifications" && "Choose how you want to be notified about bookings."}
                    {activeSection === "danger" && "Manage your account status and sensitive actions."}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {activeSection === "profile" && (
                    <motion.div 
                      initial="initial" 
                      animate="animate" 
                      variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
                    >
                      <motion.div variants={contentVariants}>
                        <AvatarUpload value={form.avatar} />
                      </motion.div>
                      <motion.div variants={contentVariants}>
                        <FloatingInput 
                          label="Username" 
                          name="username" 
                          value={form.username} 
                          onChange={handleChange} 
                          icon={User} 
                        />
                      </motion.div>
                      <motion.div variants={contentVariants}>
                        <FloatingInput 
                          label="Email Address" 
                          name="email" 
                          value={form.email || "host@nexagen.com"} 
                          onChange={handleChange} 
                          type="email"
                          icon={Bell} 
                        />
                      </motion.div>
                    </motion.div>
                  )}

                  {activeSection === "timezone" && (
                    <div className="max-w-md">
                      <SearchableSelect 
                        label="Your Timezone" 
                        value={form.timezone} 
                        onChange={handleChange} 
                      />
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4 mt-4">
                        <Globe className="text-indigo-500 shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-semibold text-indigo-900">Automatic Sync</p>
                          <p className="text-xs text-indigo-700/70 mt-0.5">Your schedule will be adjusted based on the selected timezone for all your clients.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "notifications" && (
                    <div className="space-y-6">
                      {[
                        { id: 'n1', title: 'Email Notifications', desc: 'Receive emails for new booking requests.' },
                        { id: 'n2', title: 'Browser Alerts', desc: 'Get real-time browser notifications for updates.' },
                        { id: 'n3', title: 'Marketing Emails', desc: 'Stay updated with Nexagen features and news.' },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                          <div className="pr-8">
                            <h3 className="font-semibold text-gray-800">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === "danger" && (
                    <div className="space-y-6">
                      <div className="p-6 border-2 border-red-100 bg-red-50/30 rounded-3xl">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                            <ShieldAlert size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-red-900">Delete Account</h3>
                            <p className="text-sm text-red-700/70 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group"
                        >
                          <Trash2 size={18} />
                          <span>Delete My Account</span>
                          <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </button>
                      </div>

                      <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-3xl flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800">Sign out of all devices</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Secures your account if you lost a device.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => logout()}
                          className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Glassy Orbs Decoration */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-white/20 p-4 z-40"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-500">Unsaved changes will be lost.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Check size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}
      </style>
    </div>
  );
};

export default HostSettings;