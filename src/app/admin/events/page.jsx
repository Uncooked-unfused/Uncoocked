"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  Building2,
  MapPin,
  Ticket,
  Clock,
  ExternalLink,
  RefreshCw,
  Archive,
  AlertCircle,
} from "lucide-react";

function EventModerationQueueContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch Moderation State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchModal, setBatchModal] = useState(null); // { action: "SUSPEND" | "RESTORE" | "ARCHIVE" }
  const [batchReason, setBatchReason] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Events Queue
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (sortBy) query.set("sortBy", sortBy);
      query.set("page", page.toString());
      query.set("limit", "10");

      const res = await fetch(`/api/admin/events?${query.toString()}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setEvents(result.data || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalCount(result.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin events:", err);
      toast.error("Failed to load event moderation queue");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchEvents();
  }, [fetchEvents]);

  // Batch Select Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === events.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(events.map((e) => e.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Batch Moderation
  const handleExecuteBatchAction = async () => {
    if (!batchModal || selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      const res = await fetch("/api/admin/events/batch-moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: selectedIds,
          action: batchModal.action,
          reason: batchReason,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully moderated ${data.processedCount} events!`);
        setSelectedIds([]);
        setBatchModal(null);
        setBatchReason("");
        fetchEvents();
      } else {
        toast.error(`Batch moderation failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  const statusPills = [
    { label: "ALL EVENTS", value: "ALL" },
    { label: "ACTIVE", value: "ACTIVE" },
    { label: "SUSPENDED", value: "SUSPENDED" },
    { label: "ARCHIVED", value: "ARCHIVED" },
    { label: "COMPLETED", value: "COMPLETED" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Content Governance & Moderation
          </div>
          <h1 className="text-3xl font-black">Event Moderation Queue</h1>
          <p className="text-xs text-gray-400 mt-1">Review, monitor, suspend, or archive published platform events.</p>
        </div>

        <button
          onClick={fetchEvents}
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by event title, category, location, or organizer..."
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
              <option value="date_asc">Event Date (Upcoming)</option>
              <option value="popularity_desc">Popularity Score</option>
            </select>
          </div>

          <span className="text-xs text-gray-500 font-mono shrink-0">
            Total Events: <strong className="text-white">{totalCount}</strong>
          </span>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
          {statusPills.map((pill) => {
            const isActive = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => {
                  setStatusFilter(pill.value);
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

      {/* Floating Batch Moderation Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <CheckSquare className="w-4 h-4" /> Selected <span className="underline">{selectedIds.length}</span> events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchModal({ action: "RESTORE" })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Restore
            </button>
            <button
              onClick={() => setBatchModal({ action: "SUSPEND" })}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => setBatchModal({ action: "ARCHIVE" })}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs px-3 py-1.5 rounded-md border border-neutral-700 transition"
            >
              Bulk Archive
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-white underline ml-2">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Event Directory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-gray-400 font-semibold uppercase tracking-wider">
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                  {selectedIds.length > 0 && selectedIds.length === events.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4">Event Title</th>
              <th className="p-4">Organizer</th>
              <th className="p-4">Date & Venue</th>
              <th className="p-4">Status</th>
              <th className="p-4">Registrations</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading event moderation queue...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No events found matching filter criteria.
                </td>
              </tr>
            ) : (
              events.map((e) => {
                const isSelected = selectedIds.includes(e.id);
                return (
                  <tr key={e.id} className={`hover:bg-neutral-800/40 transition ${isSelected ? "bg-amber-500/5" : ""}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelectRow(e.id)} className="text-gray-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 font-medium">
                      <div>
                        <p className="font-bold text-white flex items-center gap-1.5">
                          {e.title}
                          {e.archived && (
                            <span className="bg-neutral-800 text-gray-400 border border-neutral-700 px-1.5 py-0.5 rounded text-[9px] font-mono">
                              Archived
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500">{e.type} • {e.category || "General"}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-200 font-semibold">{e.organizer?.name || e.organizer?.fullName || "N/A"}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{e.organizer?.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 font-mono text-[11px]">{new Date(e.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-xs">{e.location}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          e.status === "Suspended"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : e.status === "Completed"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-300">{e._count?.registrations || 0}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded-md transition text-[11px] inline-flex items-center gap-1"
                      >
                        Moderate <ExternalLink className="w-3 h-3" />
                      </Link>
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

      {/* Batch Action Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Confirm Bulk Moderation: <span className="text-amber-400">{batchModal.action}</span>
            </h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to execute <strong className="text-white">{batchModal.action}</strong> on <strong className="text-white">{selectedIds.length}</strong> selected events?
            </p>
            <textarea
              value={batchReason}
              onChange={(e) => setBatchReason(e.target.value)}
              placeholder="Enter optional moderation reason..."
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

export default function EventModerationQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading event moderation queue...</div>}>
      <EventModerationQueueContent />
    </Suspense>
  );
}
