// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Trash2, 
  UserX, 
  UserCheck, 
  Shield, 
  User, 
  Crown, 
  Users,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Filter
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";

// --- Sub-components ---

const ShimmerRow = () => (
  <div className="flex items-center gap-4 px-8 py-6 border-b border-white/10 animate-pulse">
    <div className="w-14 h-14 rounded-2xl bg-gray-200/50" />
    <div className="flex-1 space-y-3">
      <div className="h-5 bg-gray-200/50 rounded-lg w-1/4" />
      <div className="h-4 bg-gray-100/50 rounded-lg w-1/3" />
    </div>
    <div className="w-28 h-8 bg-gray-200/50 rounded-full" />
    <div className="w-28 h-8 bg-gray-200/50 rounded-full" />
    <div className="flex gap-3">
      <div className="w-12 h-12 bg-gray-200/50 rounded-2xl" />
      <div className="w-12 h-12 bg-gray-200/50 rounded-2xl" />
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = "danger", loading }) => {
  if (!isOpen) return null;

  const themes = {
    danger: "from-rose-500 to-red-600 shadow-rose-200 text-white",
    warning: "from-amber-500 to-orange-600 shadow-amber-200 text-white",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-10">
            <div className="flex justify-between items-start mb-8">
              <div className={`p-5 rounded-[1.5rem] bg-gradient-to-br ${type === 'danger' ? 'from-rose-50 to-red-50 text-rose-600' : 'from-amber-50 to-orange-50 text-amber-600'} border border-white shadow-inner`}>
                <AlertCircle size={32} />
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <h3 className="text-3xl font-black text-gray-900 mb-3 leading-tight tracking-tight">{title}</h3>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">{message}</p>
          </div>
          
          <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-[1.8] px-6 py-5 rounded-2xl bg-gradient-to-br ${themes[type]} shadow-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const RoleBadge = ({ role }) => {
  const configs = {
    admin: { icon: Crown, bg: "bg-purple-100/50", text: "text-purple-600", border: "border-purple-200", label: "Admin" },
    host: { icon: Shield, bg: "bg-blue-100/50", text: "text-blue-600", border: "border-blue-200", label: "Host" },
    user: { icon: User, bg: "bg-gray-100/50", text: "text-gray-600", border: "border-gray-200", label: "User" },
  };
  const config = configs[role] || configs.user;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={12} strokeWidth={3} />
      {config.label}
    </span>
  );
};

const StatusBadge = ({ suspended }) => (
  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm ${
    suspended 
      ? "bg-rose-100/50 text-rose-600 border-rose-200" 
      : "bg-emerald-100/50 text-emerald-600 border-emerald-200"
  }`}>
    <div className={`w-2 h-2 rounded-full ${suspended ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
    {suspended ? "Suspended" : "Active"}
  </span>
);

const ActionButton = ({ onClick, icon: Icon, color, tooltip }) => {
  const themes = {
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-600 border-amber-100 shadow-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 border-emerald-100 shadow-emerald-100",
    rose: "bg-rose-50 text-rose-600 hover:bg-rose-600 border-rose-100 shadow-rose-100",
  };

  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        className={`p-4 rounded-2xl border transition-all duration-300 hover:text-white hover:shadow-xl active:scale-90 ${themes[color]}`}
      >
        <Icon size={20} strokeWidth={2.5} />
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/btn:translate-y-0 z-20 whitespace-nowrap shadow-xl">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

const EmptyState = ({ searchTerm }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-32 flex flex-col items-center justify-center text-center"
  >
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-indigo-200 blur-3xl rounded-full opacity-30 animate-pulse" />
      <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 border border-white shadow-2xl flex items-center justify-center text-indigo-500">
        <Users size={48} strokeWidth={1.5} />
      </div>
    </div>
    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No users found</h3>
    <p className="text-gray-500 text-lg font-medium max-w-sm leading-relaxed">
      {searchTerm 
        ? `We couldn't find any results for "${searchTerm}". Try a different search term.` 
        : "There are currently no users matching your filter criteria."}
    </p>
  </motion.div>
);

const UserRow = ({ user, index, onSuspend, onUnsuspend, onDelete }) => (
  <motion.tr
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.05 }}
    className="group hover:bg-white/70 transition-all duration-500"
  >
    <td className="px-8 py-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {(user.fullName || "U").charAt(0).toUpperCase()}
          </div>
          {!user.suspended && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
            {user.fullName}
          </span>
          <span className="text-sm font-bold text-gray-400 mt-0.5">
            {user.email}
          </span>
        </div>
      </div>
    </td>
    <td className="px-8 py-6">
      <RoleBadge role={user.role} />
    </td>
    <td className="px-8 py-6">
      <StatusBadge suspended={user.suspended} />
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 ease-out">
        {!user.suspended ? (
          <ActionButton
            onClick={onSuspend}
            icon={UserX}
            color="amber"
            tooltip="Suspend User"
          />
        ) : (
          <ActionButton
            onClick={onUnsuspend}
            icon={UserCheck}
            color="emerald"
            tooltip="Unsuspend User"
          />
        )}
        <ActionButton
          onClick={onDelete}
          icon={Trash2}
          color="rose"
          tooltip="Delete User"
        />
      </div>
    </td>
  </motion.tr>
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRole, setFilteredRole] = useState("all");
  
  // Modal states
  const [modal, setModal] = useState({ isOpen: false, type: "suspend", userId: null, loading: false });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => (filteredRole === "all" ? true : u.role === filteredRole))
      .filter(
        (u) =>
          u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, filteredRole, searchTerm]);

  const openModal = (type, userId) => setModal({ isOpen: true, type, userId, loading: false });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleConfirm = async () => {
    setModal(prev => ({ ...prev, loading: true }));
    try {
      const { type, userId } = modal;
      if (type === "delete") {
        await axiosInstance.delete(`/admin/user/${userId}`);
      } else if (type === "suspend") {
        await axiosInstance.patch(`/admin/user/${userId}/suspend`);
      } else if (type === "unsuspend") {
        await axiosInstance.patch(`/admin/user/${userId}/unsuspend`);
      }
      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setModal(prev => ({ ...prev, loading: false }));
    }
  };

  const roles = [
    { id: "all", label: "All Users", icon: Users },
    { id: "admin", label: "Admins", icon: Crown },
    { id: "host", label: "Hosts", icon: Shield },
    { id: "user", label: "Clients", icon: User }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] selection:bg-indigo-100 selection:text-indigo-700">
      <MeshBackground />
      <AdminHeader />

      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header & Controls Section */}
          <div className="mb-16 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                    <Users size={28} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">Administrative Control</h2>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
                  Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">Platform Users</span>
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
                  Oversee your entire community. Modify roles, audit status, and manage access permissions with precision.
                </p>
              </motion.div>

              {/* Role Segmented Control */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1 ml-1">
                  <Filter size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter by role</span>
                </div>
                <div className="p-2 bg-white/60 backdrop-blur-2xl border border-white rounded-[2rem] flex gap-1 shadow-xl shadow-gray-200/50 overflow-x-auto no-scrollbar">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setFilteredRole(role.id)}
                      className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all duration-500 whitespace-nowrap ${
                        filteredRole === role.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                          : "text-gray-500 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      <role.icon size={14} strokeWidth={2.5} />
                      {role.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Full-width Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative group w-full"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-25 transition duration-1000" />
              <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400 group-focus-within:text-indigo-600 group-focus-within:scale-110 transition-all duration-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-20 pr-10 py-8 rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-2xl text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] transition-all duration-500"
                />
              </div>
            </motion.div>
          </div>

          {/* Table Container with Tilt */}
          <Tilt className="w-full" maxTilt={3}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl rounded-[4rem] border border-white/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-100/50">
                      <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">User Identity</th>
                      <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Security Role</th>
                      <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Access Status</th>
                      <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <motion.tr key={`shimmer-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td colSpan={4}><ShimmerRow /></td>
                          </motion.tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={4}><EmptyState searchTerm={searchTerm} /></td>
                        </motion.tr>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <UserRow 
                            key={user._id} 
                            user={user} 
                            index={index}
                            onSuspend={() => openModal("suspend", user._id)}
                            onUnsuspend={() => openModal("unsuspend", user._id)}
                            onDelete={() => openModal("delete", user._id)}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              {!loading && filteredUsers.length > 0 && (
                <div className="px-10 py-6 bg-gray-50/30 border-t border-gray-100/50 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-400">
                    Showing <span className="text-gray-900">{filteredUsers.length}</span> users
                  </p>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
                    View Audit Logs <ChevronRight size={16} />
                  </div>
                </div>
              )}
            </motion.div>
          </Tilt>
        </div>
      </motion.main>

      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        loading={modal.loading}
        title={
          modal.type === "delete" ? "Destroy Account?" : 
          modal.type === "suspend" ? "Restrict Access?" : "Restore Access?"
        }
        message={
          modal.type === "delete" 
            ? "This will permanently remove this user and all associated data from our servers. This action is irreversible." 
            : modal.type === "suspend"
              ? "The user will be immediately logged out and barred from accessing platform features until manually reinstated."
              : "Access privileges will be fully restored. The user will be able to log in and use all features immediately."
        }
        confirmText={
          modal.type === "delete" ? "Permanently Delete" : 
          modal.type === "suspend" ? "Confirm Suspension" : "Restore Account"
        }
        type={modal.type === "delete" ? "danger" : "warning"}
      />
    </div>
  );
};

export default AdminUsers;
