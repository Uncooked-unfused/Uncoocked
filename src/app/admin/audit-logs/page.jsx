"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Download,
  Filter,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Clock,
} from "lucide-react";

import { getCachedAdminData, fetchWithClientCache } from "@/lib/clientCache";

function AuditLogsContent() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (actionFilter !== "ALL") query.set("action", actionFilter);
      if (debouncedSearch) query.set("search", debouncedSearch);
      query.set("page", page.toString());
      query.set("limit", "15");

      const url = `/api/admin/audit-logs?${query.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache: isManualRefresh,
        ttl: 15_000,
      });

      if (result.success && result.data) {
        setLogs(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalCount(result.data.pagination.total || 0);
        }
      } else if (!result.fromCache) {
        toast.error("Failed to load audit logs");
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [actionFilter, debouncedSearch, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Admin User", "Action", "Target Organization / Detail", "Previous State", "New State", "Reason / Notes"];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.adminId || "System Admin",
      log.action,
      `"${log.application?.organizationName || "N/A"}"`,
      log.previousStatus || "N/A",
      log.newStatus || "N/A",
      `"${(log.reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit Log CSV downloaded");
  };

  const actionOptions = [
    { label: "All Actions", value: "ALL" },
    { label: "Host Application Review", value: "HOST_APPLICATION_REVIEW" },
    { label: "User Role Updates", value: "USER_ROLE_UPDATED" },
    { label: "Account Suspensions", value: "USER_ACCOUNT_SUSPENDED" },
    { label: "Event Moderation", value: "EVENT_SUSPENDED" },
    { label: "Document Previews", value: "DOCUMENT_VIEWED" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Immutable Audit & Security Log
          </div>
          <h1 className="text-3xl font-black">Audit Log Center</h1>
          <p className="text-xs text-gray-400 mt-1">Complete system activity trail for compliance, governance, and security audits.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg border border-neutral-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={exportCSV}
            disabled={!logs.length}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Search & Action Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by action, reason, state transition, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500 shrink-0"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 font-mono shrink-0">
          Total Audit Records: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-gray-400 font-semibold uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action Type</th>
              <th className="p-4">Target / Organization</th>
              <th className="p-4">State Transition</th>
              <th className="p-4">Reason / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Loading system audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No audit entries found matching current query criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-800/40 transition">
                  <td className="p-4 text-gray-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-amber-400 text-[11px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-200 font-semibold">
                    {log.application?.organizationName || "System Target"}
                  </td>
                  <td className="p-4 font-mono text-[11px]">
                    {log.previousStatus ? (
                      <>
                        <span className="text-gray-400">{log.previousStatus}</span>
                        <span className="text-gray-600 mx-1.5">→</span>
                        <span className="text-emerald-400 font-bold">{log.newStatus}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-300 truncate max-w-sm" title={log.reason}>
                    {log.reason || "-"}
                  </td>
                </tr>
              ))
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
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading audit log directory...</div>}>
      <AuditLogsContent />
    </Suspense>
  );
}