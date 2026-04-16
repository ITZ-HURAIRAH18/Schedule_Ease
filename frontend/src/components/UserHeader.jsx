// src/components/UserHeader.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Calendar,
  Clock,
  User as UserIcon,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";

const UserHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
    { label: "Availability", path: "/user/availability", icon: Calendar },
    { label: "My Bookings", path: "/user/bookings", icon: Clock },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
      <motion.header
        animate={{
          padding: isScrolled ? "0.5rem 1rem" : "0.75rem 1.5rem",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.6)",
          borderRadius: "1.25rem",
        }}
        className="max-w-7xl mx-auto backdrop-blur-md border border-white/20 shadow-lg text-gray-800"
      >
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link to="/user/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg transition-transform group-hover:scale-105">
              N
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Nexagen
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium transition-colors hover:text-[#7C3AED] ${
                    isActive ? "text-[#7C3AED]" : "text-gray-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: User + Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full border border-gray-200 bg-white/50 hover:bg-white transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium hidden sm:block">
                  {user?.name || "Account"}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <UserIcon className="w-4 h-4" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    {/* Backdrop for closing */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-2xl z-20 py-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-gray-100/50 text-gray-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mt-4 overflow-hidden border-t border-gray-100 pt-4 pb-2"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
};

export default UserHeader;