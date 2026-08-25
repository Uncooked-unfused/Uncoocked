"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw,
  Mail,
  Calendar,
  X,
} from "lucide-react";

import { getCachedAdminData, fetchWithClientCache, invalidateClientCache } from "@/lib/clientCache";

function UsersManagementContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch Action State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchModal, setBatchModal] = useState(null); // { action: "SUSPEND" | "REACTIVATE" | "SET_ROLE_ORGANIZER" }
  const [batchReason, setBatchReason] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // User Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [updatingUser, setUpdatingUser] = useState(false);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Users List
  const fetchUsers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (roleFilter !== "ALL") query.set("role", roleFilter);
      if (sortBy) query.set("sortBy", sortBy);
      query.set("page", page.toString());
      query.set("limit", "10");

      const url = `/api/admin/users?${query.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache: isManualRefresh,
        ttl: 15_000,
      });

      if (result.success && result.data) {
        setUsers(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalCount(result.data.pagination.total || 0);
        }
      } else if (!result.fromCache) {
        toast.error("Failed to load user management directory");
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load user management directory");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, roleFilter, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchUsers();
  }, [fetchUsers]);

  // Batch Select Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Batch Action
  const handleExecuteBatchAction = async () => {
    if (!batchModal || selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      const res = await fetch("/api/admin/users/batch-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedIds,
          action: batchModal.action,
          reason: batchReason,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully updated ${data.processedCount} users!`);
        invalidateClientCache("/api/admin/users");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setSelectedIds([]);
        setBatchModal(null);
        setBatchReason("");
        fetchUsers(true);
      } else {
        toast.error(`Batch action failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Single User Role Update
  const handleUpdateRole = async (userId, newRole) => {
    setUpdatingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole, reason: actionReason }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`User role updated to ${newRole}!`);
        invalidateClientCache("/api/admin/users");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setActionReason("");
        if (selectedUser?.id === userId) setSelectedUser(null);
        fetchUsers(true);
      } else {
        toast.error(`Failed to update role: ${data.error}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Single User Status Toggle (Suspend / Reactivate)
  const handleToggleStatus = async (userId, isSuspended) => {
    const action = isSuspended ? "REACTIVATE" : "SUSPEND";
    setUpdatingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: actionReason }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`User account ${action.toLowerCase()}d!`);
        invalidateClientCache("/api/admin/users");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setActionReason("");
        if (selectedUser?.id === userId) setSelectedUser(null);
        fetchUsers(true);
      } else {
        toast.error(`Failed to update status: ${data.error}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUpdatingUser(false);
    }
  };

  const rolePills = [
    { label: "ALL ROLES", value: "ALL" },
    { label: "USERS", value: "USER" },
    { label: "ORGANIZERS", value: "ORGANIZER" },
    { label: "SUPER ADMINS", value: "SUPER_ADMIN" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Role Governance & User Directory
          </div>
          <h1 className="text-3xl font-black">User Management</h1>
          <p className="text-xs text-gray-400 mt-1">Manage user roles, organizer privileges, and account security status.</p>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={isRefreshing}
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Users"}
        </button>
      </div>

      {/* Search & Role Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, department, or club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500 shrink-0"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          <span className="text-xs text-gray-500 font-mono shrink-0">
            Total Users: <strong className="text-white">{totalCount}</strong>
          </span>
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
          {rolePills.map((pill) => {
            const isActive = roleFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => {
                  setRoleFilter(pill.value);
                  setPage(1);
                  setSelectedIds([]);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  isActive
                    ? "bg-amber-500 text-black shadow-md"
                    : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:text-white"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Batch Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <CheckSquare className="w-4 h-4" /> Selected <span className="underline">{selectedIds.length}</span> users
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBatchModal({ action: "SET_ROLE_SUPER_ADMIN" })}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Make Super Admins
            </button>
            <button
              onClick={() => setBatchModal({ action: "SET_ROLE_ORGANIZER" })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Make Organizers
            </button>
            <button
              onClick={() => setBatchModal({ action: "SET_ROLE_USER" })}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs px-3 py-1.5 rounded-md border border-neutral-700 transition"
            >
              Make Users
            </button>
            <button
              onClick={() => setBatchModal({ action: "SUSPEND" })}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => setBatchModal({ action: "REACTIVATE" })}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Reactivate
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-white underline ml-2">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* User Directory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-gray-400 font-semibold uppercase tracking-wider">
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                  {selectedIds.length > 0 && selectedIds.length === users.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Host Application</th>
              <th className="p-4">Events</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading user directory...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No users found matching filter criteria.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                const isSuspended = Boolean(u.lockedUntil && new Date(u.lockedUntil) > new Date());
                const roleUpper = (u.role || "USER").toUpperCase();

                return (
                  <tr key={u.id} className={`hover:bg-neutral-800/40 transition ${isSelected ? "bg-amber-500/5" : ""}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelectRow(u.id)} className="text-gray-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 font-medium">
                      <div>
                        <p className="font-bold text-white flex items-center gap-1.5">
                          {u.name || u.fullName || "N/A"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          roleUpper === "SUPER_ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : roleUpper === "ORGANIZER"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-neutral-800 text-gray-300 border-neutral-700"
                        }`}
                      >
                        {roleUpper}
                      </span>
                    </td>
                    <td className="p-4">
                      {isSuspended ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.hostApplication ? (
                        <Link
                          href={`/admin/applications/${u.hostApplication.id}`}
                          className="text-amber-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                        >
                          {u.hostApplication.status} <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-600 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-gray-300">{u._count?.organizedEvents || 0}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {roleUpper !== "SUPER_ADMIN" && (
                          <button
                            disabled={updatingUser}
                            onClick={() => handleUpdateRole(u.id, "SUPER_ADMIN")}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-md transition text-[11px] flex items-center gap-1 shrink-0 disabled:opacity-50"
                            title="Promote user to Super Admin"
                          >
                            <ShieldCheck className="w-3 h-3" /> Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded-md transition text-[11px] shrink-0"
                        >
                          Manage User
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-800 text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 transition"
            >
              ← Previous
            </button>
            <span className="text-gray-400">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Single User Detail & Governance Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">{selectedUser.name || selectedUser.fullName || "User Profile"}</h3>
                <p className="text-xs text-gray-400 font-mono">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">User ID</span>
                <span className="font-mono text-gray-300 text-[11px] truncate block">{selectedUser.id}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Current Role</span>
                <span className="font-bold text-amber-400">{(selectedUser.role || "USER").toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Department / Club</span>
                <span className="text-gray-300">{selectedUser.department || selectedUser.clubAssociation || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Events Organized</span>
                <span className="font-bold text-white">{selectedUser._count?.organizedEvents || 0}</span>
              </div>
            </div>

            {/* Role & Status Update Form */}
            <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
                Privilege & Account Status Controls
              </h4>

              <input
                type="text"
                placeholder="Reason for role/status change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />

              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Assign Account Role</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={updatingUser}
                    onClick={() => handleUpdateRole(selectedUser.id, "SUPER_ADMIN")}
                    className={`font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 ${
                      (selectedUser.role || "").toUpperCase() === "SUPER_ADMIN"
                        ? "bg-purple-600 text-white ring-2 ring-purple-400 font-extrabold"
                        : "bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/60"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {(selectedUser.role || "").toUpperCase() === "SUPER_ADMIN" ? "Current: SUPER_ADMIN" : "Assign SUPER_ADMIN"}
                  </button>

                  <button
                    disabled={updatingUser}
                    onClick={() => handleUpdateRole(selectedUser.id, "ORGANIZER")}
                    className={`font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 ${
                      (selectedUser.role || "").toUpperCase() === "ORGANIZER"
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-400 font-extrabold"
                        : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {(selectedUser.role || "").toUpperCase() === "ORGANIZER" ? "Current: ORGANIZER" : "Assign ORGANIZER"}
                  </button>

                  <button
                    disabled={updatingUser}
                    onClick={() => handleUpdateRole(selectedUser.id, "USER")}
                    className={`font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 ${
                      (selectedUser.role || "").toUpperCase() === "USER"
                        ? "bg-neutral-700 text-white ring-2 ring-neutral-400 font-extrabold"
                        : "bg-neutral-800 hover:bg-neutral-700 text-gray-300 border border-neutral-700"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {(selectedUser.role || "").toUpperCase() === "USER" ? "Current: USER" : "Assign USER"}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                {Boolean(selectedUser.lockedUntil && new Date(selectedUser.lockedUntil) > new Date()) ? (
                  <button
                    disabled={updatingUser}
                    onClick={() => handleToggleStatus(selectedUser.id, true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 w-full"
                  >
                    Reactivate Account Access
                  </button>
                ) : (
                  <button
                    disabled={updatingUser}
                    onClick={() => handleToggleStatus(selectedUser.id, false)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 w-full"
                  >
                    Suspend Account Access
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Action Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Confirm Bulk Action: <span className="text-amber-400">{batchModal.action}</span>
            </h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to execute <strong className="text-white">{batchModal.action}</strong> on <strong className="text-white">{selectedIds.length}</strong> selected users?
            </p>
            <textarea
              value={batchReason}
              onChange={(e) => setBatchReason(e.target.value)}
              placeholder="Enter optional bulk action reason..."
              className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setBatchModal(null)} className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleExecuteBatchAction}
                disabled={batchSubmitting}
                className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg disabled:opacity-50"
              >
                {batchSubmitting ? "Executing..." : "Execute Bulk Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading user directory...</div>}>
      <UsersManagementContent />
    </Suspense>
  );
}
