// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminHeader from "../../components/AdminHeader";
import { Search, Trash2, Ban, CheckCircleIcon, XCircleIcon } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredRole, setFilteredRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------- data ---------- */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/users");
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ---------- actions ---------- */
  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this user?")) return;
    await axiosInstance.patch(`/admin/user/${id}/suspend`);
    fetchUsers();
  };

  const handleUnSuspend = async (id) => {
    if (!window.confirm("Unsuspend this user?")) return;
    await axiosInstance.patch(`/admin/user/${id}/unsuspend`);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await axiosInstance.delete(`/admin/user/${id}`);
    fetchUsers();
  };

  /* ---------- helpers ---------- */
  const roleStyles = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "host":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-green-100 text-green-700 border border-green-200";
    }
  };

  const statusStyles = (suspended) =>
    suspended
      ? "bg-red-100 text-red-700 border border-red-200"
      : "bg-emerald-100 text-emerald-700 border border-emerald-200";

  const filteredUsers = users
    .filter((u) => (filteredRole === "all" ? true : u.role === filteredRole))
    .filter(
      (u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  /* ---------- render ---------- */
  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Manage Users</h1>
              <p className="text-blue-100 mt-1">Suspend, delete or review accounts</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Role Filter */}
              <select
                value={filteredRole}
                onChange={(e) => setFilteredRole(e.target.value)}
                className="px-4 py-2 rounded-lg border border-blue-300 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="text-blue-900">All Roles</option>
                <option value="admin" className="text-blue-900">Admin</option>
                <option value="host" className="text-blue-900">Host</option>
                <option value="user" className="text-blue-900">User</option>
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-white/80">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Desktop Table */}
              <table className="hidden md:table w-full text-sm text-left text-gray-700">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <UserRowDesktop
                      key={user._id}
                      user={user}
                      onSuspend={() => handleSuspend(user._id)}
                      onUnSuspend={() => handleUnSuspend(user._id)}
                      onDelete={() => handleDelete(user._id)}
                      roleStyles={roleStyles}
                      statusStyles={statusStyles}
                    />
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <UserCardMobile
                    key={user._id}
                    user={user}
                    onSuspend={() => handleSuspend(user._id)}
                    onUnSuspend={() => handleUnSuspend(user._id)}
                    onDelete={() => handleDelete(user._id)}
                    roleStyles={roleStyles}
                    statusStyles={statusStyles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ---------- sub-components ---------- */
const EmptyState = () => (
  <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/20 p-8 text-center">
    <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
    <h3 className="mt-3 text-lg font-semibold text-gray-900">No users found</h3>
    <p className="mt-1 text-gray-600">Try adjusting filters or search.</p>
  </div>
);

const UserRowDesktop = ({ user, onSuspend, onUnSuspend, onDelete, roleStyles, statusStyles }) => (
  <tr className="hover:bg-gray-50 transition">
    <td className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
          {(user.fullName || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
    </td>
    <td className="p-4 text-gray-600">{user.email}</td>
    <td className="p-4">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyles(user.role)}`}>
        {user.role}
      </span>
    </td>
    <td className="p-4">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles(user.suspended)}`}>
        {user.suspended ? "Suspended" : "Active"}
      </span>
    </td>
    <td className="p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        {!user.suspended ? (
          <button onClick={onSuspend} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 transition">
            <Ban className="w-4 h-4" /> Suspend
          </button>
        ) : (
          <button onClick={onUnSuspend} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition">
            <CheckCircleIcon className="w-4 h-4" /> Unsuspend
          </button>
        )}
        <button onClick={onDelete} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </td>
  </tr>
);

const UserCardMobile = ({ user, onSuspend, onUnSuspend, onDelete, roleStyles, statusStyles }) => (
  <div className="p-4 hover:bg-gray-50 transition">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
          {(user.fullName || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${roleStyles(user.role)}`}>{user.role}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusStyles(user.suspended)}`}>
          {user.suspended ? "Suspended" : "Active"}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-end gap-2">
      {!user.suspended ? (
        <button onClick={onSuspend} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 transition">
          <Ban className="w-4 h-4" /> Suspend
        </button>
      ) : (
        <button onClick={onUnSuspend} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition">
          <CheckCircleIcon className="w-4 h-4" /> Unsuspend
        </button>
      )}
      <button onClick={onDelete} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition">
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  </div>
);

export default AdminUsers;