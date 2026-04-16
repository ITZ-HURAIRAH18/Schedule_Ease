import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  ChevronDown,
  Bell
} from "lucide-react";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Stats", path: "/admin/stats", icon: BarChart3 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <motion.div
        initial={false}
        animate={{
          width: isScrolled ? "90%" : "100%",
          maxWidth: isScrolled ? "1100px" : "100%",
          padding: isScrolled ? "0.6rem 1.5rem" : "1rem 2rem",
          borderRadius: isScrolled ? "24px" : "0px",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(12px)",
          border: isScrolled ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid transparent",
          boxShadow: isScrolled ? "0 10px 30px rgba(0, 0, 0, 0.1)" : "none",
        }}
        className="flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto"
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <LayoutDashboard size={20} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-gray-900 leading-none text-lg tracking-tight">Nexagen</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-2">
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <button className="hidden sm:flex p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <Bell size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/50 border border-white/50 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                {(user?.fullName || "A").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-[11px] font-extrabold text-gray-900 leading-none">{user?.fullName || "Admin"}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{user?.role}</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-0 cursor-default" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-3 w-56 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 z-10 overflow-hidden"
                  >
                    <div className="px-4 py-3 mb-1 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="p-1 space-y-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate("/admin/dashboard");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all duration-200 group"
                      >
                        <User size={18} className="group-hover:scale-110 transition-transform" />
                        My Profile
                      </button>
                      
                      <div className="h-px bg-gray-100 mx-2 my-1" />
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-200 group"
                      >
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default AdminHeader;
