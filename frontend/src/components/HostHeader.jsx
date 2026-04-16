// src/components/HostHeader.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  LogOut,
  Calendar,
  Clock,
  Settings,
  PlusCircle,
  LayoutDashboard,
  ChevronDown,
  User,
} from "lucide-react";

const HostHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { scrollY } = useScroll();

  const headerHeight = useTransform(scrollY, [0, 50], ["80px", "64px"]);
  const headerPadding = useTransform(scrollY, [0, 50], ["1.25rem", "0.75rem"]);
  const headerBg = useTransform(
    scrollY,
    [0, 50],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"]
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/", { replace: true });
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/host/dashboard", icon: LayoutDashboard },
    { label: "Bookings", path: "/host/bookings", icon: Clock },
    {
      label: "Add Availability",
      path: "/host/add-availability",
      icon: PlusCircle,
    },
    {
      label: "Manage",
      path: "/host/manage-availability",
      icon: Calendar,
    },
    { label: "Settings", path: "/host/settings", icon: Settings },
  ];

  return (
    <motion.header
      style={{ height: headerHeight, padding: headerPadding, backgroundColor: headerBg }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center transition-all duration-300 backdrop-blur-md border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand + Role */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20"
          >
            N
          </motion.div>
          <div className="hidden sm:block">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Nexagen</span>
            <div className="flex items-center gap-1.5 mt-[-2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-violet-600">{user?.role || "HOST"}</span>
            </div>
          </div>
        </div>

        {/* NAV – centered, single line */}
        <nav className="hidden lg:flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 ` +
                (isActive ? "text-violet-700" : "text-gray-600 hover:text-gray-900")
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-600 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white/50 border border-white/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-inner">
              {(user?.name || "H").charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.name || "Host Account"}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                {user?.email || "host@nexagen.com"}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[-1]" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl shadow-indigo-500/10 overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-100/50 bg-gray-50/30">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate("/host/settings");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default HostHeader;