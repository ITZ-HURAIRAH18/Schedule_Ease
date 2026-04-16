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
  ChevronRight
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";

// --- Sub-components ---

const ShimmerRow = () => (
  <div className="flex items-center gap-4 px-8 py-5 border-b border-[#E8E4DF] animate-pulse">
    <div className="w-10 h-10 rounded-full bg-[#F5F3F0]" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-[#F5F3F0] rounded w-1/4" />
      <div className="h-3 bg-[#F5F3F0] rounded w-1/3" />
    </div>
    <div className="w-20 h-6 bg-[#F5F3F0] rounded-full" />
    <div className="w-20 h-6 bg-[#F5F3F0] rounded-full" />
    <div className="flex gap-2">
      <div className="w-8 h-8 bg-[#F5F3F0] rounded-lg" />
      <div className="w-8 h-8 bg-[#F5F3F0] rounded-lg" />
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = "danger", loading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/35"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-white border border-[#E8E4DF] rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-xl ${type === 'danger' ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#FEF3E2] text-[#B45309]'}`}>
                <AlertCircle size={24} />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#F5F3F0] rounded-lg transition-colors">
                <X size={20} className="text-[#8A8A8A]" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{title}</h3>
            <p className="text-[#4A4A4A] text-[14px] leading-relaxed">{message}</p>
          </div>
          
          <div className="p-6 bg-[#F5F3F0] border-t border-[#E8E4DF] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#E8E4DF] text-[#4A4A4A] font-medium text-[13px] hover:bg-[#FAFAF8] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-[1.5] px-4 py-2.5 rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 transition-all ${
                type === 'danger' 
                  ? 'bg-[#B91C1C] text-white hover:bg-[#991B1B]' 
                  : 'bg-[#C8622A] text-white hover:bg-[#A84E20]'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const RoleBadge = ({ role }) => {
  const getStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-[#1A1A1A] text-white";
      case "host": return "bg-[#F5F3F0] text-[#92694A]";
      case "user": return "bg-[#FDF0EA] text-[#C8622A]";
      default: return "bg-[#F5F3F0] text-[#4A4A4A]";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-medium uppercase tracking-wider ${getStyle(role)}`}>
      {role || "user"}
    </span>
  );
};

const StatusBadge = ({ suspended }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium uppercase tracking-wider border ${
    suspended 
      ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FCCACA]" 
      : "bg-[#EDF7F1] text-[#2D7D52] border-[#C6F6D5]"
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${suspended ? "bg-[#B91C1C]" : "bg-[#2D7D52]"}`} />
    {suspended ? "Suspended" : "Active"}
  </span>
);

const UserRow = ({ user, index, onSuspend, onUnsuspend, onDelete }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
    className="group hover:bg-[#FAFAF8] transition-colors"
  >
    <td className="px-8 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F5F3F0] text-[#92694A] flex items-center justify-center text-sm font-semibold">
          {(user.fullName || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#1A1A1A]">{user.fullName}</p>
          <p className="text-[12px] text-[#8A8A8A]">{user.email}</p>
        </div>
      </div>
    </td>
    <td className="px-8 py-4">
      <RoleBadge role={user.role} />
    </td>
    <td className="px-8 py-4">
      <StatusBadge suspended={user.suspended} />
    </td>
    <td className="px-8 py-4">
      <div className="flex items-center justify-end gap-2">
        {!user.suspended ? (
          <button
            onClick={onSuspend}
            className="p-2 rounded-md bg-[#FEF3E2] text-[#B45309] hover:bg-[#FDDCAA] transition-colors"
            title="Suspend User"
          >
            <UserX size={16} />
          </button>
        ) : (
          <button
            onClick={onUnsuspend}
            className="p-2 rounded-md bg-[#EDF7F1] text-[#2D7D52] hover:bg-[#C6F6D5] transition-colors"
            title="Unsuspend User"
          >
            <UserCheck size={16} />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 rounded-md bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FCCACA] transition-colors"
          title="Delete User"
        >
          <Trash2 size={16} />
        </button>
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
    { id: "all", label: "All Users" },
    { id: "admin", label: "Admins" },
    { id: "host", label: "Hosts" },
    { id: "user", label: "Clients" }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-['Inter'] selection:bg-[#FDF0EA] selection:text-[#C8622A]">
      <AdminHeader />

      <motion.main 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="pt-24 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header & Controls */}
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] tracking-tight mb-6">
              Manage Platform Users
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-6 border-b border-[#E8E4DF]">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setFilteredRole(role.id)}
                    className={`pb-3 text-[14px] font-medium transition-all relative ${
                      filteredRole === role.id
                        ? "text-[#C8622A]"
                        : "text-[#8A8A8A] hover:text-[#4A4A4A]"
                    }`}
                  >
                    {role.label}
                    {filteredRole === role.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8622A]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E4DF] rounded-lg text-[14px] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#C8622A] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#E8E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F3F0]">
                    <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A8A]">User Identity</th>
                    <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A8A]">Security Role</th>
                    <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A8A]">Access Status</th>
                    <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A8A] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DF]">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={`shimmer-${i}`}>
                          <td colSpan={4}><ShimmerRow /></td>
                        </tr>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <tr key="empty">
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users size={40} className="text-[#E8E4DF]" />
                            <p className="text-[#8A8A8A] font-medium">No users found</p>
                          </div>
                        </td>
                      </tr>
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
              <div className="px-8 py-4 bg-[#FAFAF8] border-t border-[#E8E4DF] flex items-center justify-between">
                <p className="text-[12px] font-medium text-[#8A8A8A]">
                  Showing <span className="text-[#1A1A1A]">{filteredUsers.length}</span> users
                </p>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#C8622A] cursor-pointer hover:gap-2 transition-all">
                  View Audit Logs <ChevronRight size={14} />
                </div>
              </div>
            )}
          </div>
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
