"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Download,
  Filter,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

function ApplicationsQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchActionModal, setBatchActionModal] = useState(null); // { action: "APPROVE" | "REJECT" | "REQUEST_INFO" }
  const [batchNotes, setBatchNotes] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Applications Queue
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (currentStatus !== "ALL") query.set("status", currentStatus);
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (sortBy) query.set("sortBy", sortBy);
      query.set("page", page.toString());
      query.set("limit", "10");

      const res = await fetch(`/api/admin/applications?${query.toString()}`);
      const result = await res.json();

      if (res.ok) {
        setApplications(result.data || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalCount(result.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      toast.error("Failed to load applications queue");
    } finally {
      setLoading(false);
    }
  }, [currentStatus, debouncedSearch, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusFilter = (status) => {
    setPage(1);
    setSelectedIds([]);
    if (status === "ALL") {
      router.push("/admin/applications");
    } else {
      router.push(`/admin/applications?status=${status}`);
    }
  };

  // Row Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((app) => app.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Action Execution
  const handleExecuteBatchAction = async () => {
    if (!batchActionModal || selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      const res = await fetch("/api/admin/applications/batch-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: selectedIds,
          action: batchActionModal.action,
          notes: batchNotes,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully processed ${data.processed} applications!`);
        setSelectedIds([]);
        setBatchActionModal(null);
        setBatchNotes("");
        fetchApplications();
      } else {
        toast.error(`Batch process failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // CSV Export Handler
  const exportQueueCSV = () => {
    if (!applications.length) return;
    const headers = ["Applicant Name", "Applicant Email", "Organization Name", "Organization Type", "Submitted Date", "Status"];
    const rows = applications.map((app) => [
      `"${app.user?.name || app.user?.fullName || "N/A"}"`,
      app.user?.email || "N/A",
      `"${app.organizationName || "N/A"}"`,
      `"${app.organizationType || "N/A"}"`,
      new Date(app.createdAt).toLocaleDateString(),
      app.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  const statusTabs = [
    { label: "ALL", value: "ALL" },
    { label: "PENDING", value: "PENDING" },
    { label: "UNDER REVIEW", value: "UNDER_REVIEW" },
    { label: "NEEDS MORE INFO", value: "NEEDS_MORE_INFORMATION" },
    { label: "APPROVED", value: "APPROVED" },
    { label: "REJECTED", value: "REJECTED" },
    { label: "SUSPENDED", value: "SUSPENDED" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Host Verification Queue</h1>
          <p className="text-xs text-gray-400 mt-1">
            Review, approve, or reject incoming organizer host verification applications.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg border border-neutral-800 transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-4">
        {/* Search Bar, Sort Dropdown & Export Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by organization name, applicant name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Sort Control */}
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
              <option value="orgName_asc">Org Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-gray-500 font-mono">
              Total: <strong className="text-white">{totalCount}</strong>
            </span>
            <button
              onClick={exportQueueCSV}
              disabled={!applications.length}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-bold px-4 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  isActive
                    ? "bg-amber-500 text-black shadow-md"
                    : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <CheckSquare className="w-4 h-4" /> Selected <span className="underline">{selectedIds.length}</span> applications
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchActionModal({ action: "APPROVE" })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Approve
            </button>
            <button
              onClick={() => setBatchActionModal({ action: "REQUEST_INFO" })}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Request Info
            </button>
            <button
              onClick={() => setBatchActionModal({ action: "REJECT" })}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Reject
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white underline ml-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-gray-400 font-semibold uppercase tracking-wider">
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                  {selectedIds.length > 0 && selectedIds.length === applications.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4">Applicant</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Submitted Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Loading applications queue...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No host applications found matching your current filter criteria.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const isSelected = selectedIds.includes(app.id);
                return (
                  <tr key={app.id} className={`hover:bg-neutral-800/40 transition ${isSelected ? "bg-amber-500/5" : ""}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelectRow(app.id)} className="text-gray-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 font-medium">
                      <div>
                        <p className="font-bold text-white">
                          {app.user?.name || app.user?.fullName || "N/A"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">{app.user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-200 font-semibold">{app.organizationName || "N/A"}</p>
                      <p className="text-[10px] text-gray-500">{app.organizationType || "N/A"}</p>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          app.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : app.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : app.status === "SUSPENDED"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : app.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 text-[11px]"
                      >
                        Review Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
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
              Page <strong className="text-white">{page}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
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

      {/* Batch Action Confirmation Modal */}
      {batchActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Confirm Bulk Action: <span className="text-amber-400">{batchActionModal.action}</span>
            </h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to perform bulk action <strong className="text-white">{batchActionModal.action}</strong> on <strong className="text-white">{selectedIds.length}</strong> selected applications?
            </p>
            <textarea
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Enter optional bulk review notes..."
              className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBatchActionModal(null)}
                className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBatchAction}
                disabled={batchSubmitting}
                className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg disabled:opacity-50"
              >
                {batchSubmitting ? "Processing..." : "Execute Bulk Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading applications queue...</div>}>
      <ApplicationsQueueContent />
    </Suspense>
  );
}