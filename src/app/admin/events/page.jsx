"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Plus,
  Edit3,
  CheckCircle2,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { fetchWithClientCache, invalidateClientCache } from "@/lib/clientCache";
import { formatDate } from "@/lib/dateUtils";
import GenZLoader from "@/components/ui/GenZLoader";

function EventModerationQueueContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch Moderation State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchModal, setBatchModal] = useState(null); // { action: "SUSPEND" | "RESTORE" | "ARCHIVE" | "COMPLETE" }
  const [batchReason, setBatchReason] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Tweak Registration Count State
  const [tweakModal, setTweakModal] = useState(null); // { event, count: number | string }
  const [tweakSubmitting, setTweakSubmitting] = useState(false);

  const openTweakModal = (event) => {
    setTweakModal({
      event,
      count:
        event.customRegistrationCount !== null && event.customRegistrationCount !== undefined
          ? event.customRegistrationCount
          : (event._count?.registrations ?? 0),
    });
  };

  const handleSaveTweak = async (e) => {
    if (e) e.preventDefault();
    if (!tweakModal?.event) return;
    setTweakSubmitting(true);
    try {
      const rawVal = tweakModal.count;
      const isReset = rawVal === "" || rawVal === null;
      let parsedVal = null;
      if (!isReset) {
        parsedVal = parseInt(rawVal, 10);
        if (isNaN(parsedVal) || parsedVal < 0 || parsedVal > 10000000) {
          toast.error("Please enter a valid non-negative number up to 10,000,000");
          setTweakSubmitting(false);
          return;
        }
      }

      const res = await fetch(`/api/admin/events/${tweakModal.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRegistrationCount: parsedVal }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          isReset
            ? `Reset "${tweakModal.event.title}" to real database count (${tweakModal.event._count?.registrations || 0}).`
            : `Updated registrations for "${tweakModal.event.title}" to ${parsedVal}.`
        );
        invalidateClientCache("/api/admin/events");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        invalidateClientCache("/api/events");
        setTweakModal(null);
        fetchEvents(true);
      } else {
        toast.error(data.error || "Failed to update registration count");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTweakSubmitting(false);
    }
  };

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Events Queue
  const fetchEvents = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (sortBy) query.set("sortBy", sortBy);
      query.set("page", page.toString());
      query.set("limit", "10");

      const url = `/api/admin/events?${query.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache: isManualRefresh,
        ttl: 15_000,
      });

      if (result.success && result.data) {
        setEvents(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalCount(result.data.pagination.total || 0);
        }
      } else if (!result.fromCache) {
        toast.error("Failed to load event moderation queue");
      }
    } catch (err) {
      console.error("Failed to fetch admin events:", err);
      toast.error("Failed to load event moderation queue");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
        invalidateClientCache("/api/admin/events");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setSelectedIds([]);
        setBatchModal(null);
        setBatchReason("");
        fetchEvents(true);
      } else {
        toast.error(`Batch moderation failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Quick One-Click Status Transition for a Single Event
  const handleQuickStatusChange = async (eventId, action) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          action === "COMPLETE"
            ? "Event marked as Completed!"
            : action === "RESTORE"
            ? "Event reactivated as Active!"
            : "Event status updated!"
        );
        invalidateClientCache("/api/admin/events");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        fetchEvents(true);
      } else {
        toast.error(data.error || "Failed to update event status");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
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
          <h1 className="text-3xl font-black">Event Moderation & Management</h1>
          <p className="text-xs text-gray-400 mt-1">Review, monitor, create, edit, suspend, complete, or archive platform events.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/events/new"
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Event
          </Link>
          <button
            onClick={() => fetchEvents(true)}
            disabled={isRefreshing}
            className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Queue"}
          </button>
        </div>
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
              onClick={() => setBatchModal({ action: "COMPLETE" })}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition"
            >
              Bulk Complete
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
                <td colSpan={7} className="p-8">
                  <GenZLoader fullScreen={false} text="Syncing event moderation queue..." />
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
                      <p className="text-gray-200 font-semibold">{e.customOrganizerName || e.organizer?.name || e.organizer?.fullName || "N/A"}</p>
                      {e.customOrganizerName ? (
                        <p className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Custom Organizer
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-500 font-mono">{e.organizer?.email || "No email"}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 font-mono text-[11px]">{formatDate(e.date)}</p>
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
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-mono text-white font-bold text-xs">
                            {e.customRegistrationCount !== null && e.customRegistrationCount !== undefined
                              ? e.customRegistrationCount
                              : (e._count?.registrations || 0)}
                          </span>
                          {e.customRegistrationCount !== null && e.customRegistrationCount !== undefined && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium"
                              title={`Real verified DB registrations: ${e._count?.registrations || 0}`}
                            >
                              Custom ({e._count?.registrations || 0} real)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openTweakModal(e)}
                          title="Tweak registration count"
                          className="p-1 hover:bg-neutral-800 rounded text-gray-400 hover:text-amber-400 transition"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTweakModal(e)}
                          title="Tweak total registrations count"
                          className="bg-neutral-800 hover:bg-amber-500 hover:text-black text-amber-400 font-bold px-2 py-1.5 rounded transition text-[11px] inline-flex items-center gap-1 border border-neutral-700 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" /> Tweak
                        </button>
                        {e.status !== "Completed" ? (
                          <button
                            onClick={() => handleQuickStatusChange(e.id, "COMPLETE")}
                            title="Mark as Completed"
                            className="bg-neutral-800 hover:bg-blue-600 hover:text-white text-blue-400 font-bold px-2 py-1.5 rounded transition text-[11px] inline-flex items-center gap-1 border border-blue-500/30 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickStatusChange(e.id, "RESTORE")}
                            title="Re-open as Active"
                            className="bg-neutral-800 hover:bg-emerald-600 hover:text-white text-emerald-400 font-bold px-2 py-1.5 rounded transition text-[11px] inline-flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Reactivate
                          </button>
                        )}
                        <Link
                          href={`/admin/events/${e.id}?tab=edit`}
                          title="Edit all details"
                          className="bg-neutral-800 hover:bg-amber-500 hover:text-black text-gray-300 font-bold px-2 py-1.5 rounded transition text-[11px] inline-flex items-center gap-1 border border-neutral-700"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </Link>
                        <Link
                          href={`/admin/events/${e.id}`}
                          title="Moderate and view audit trail"
                          className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-2.5 py-1.5 rounded transition text-[11px] inline-flex items-center gap-1 border border-neutral-700"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
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

      {/* Tweak Total Registrations Modal */}
      {tweakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tweak Total Registrations</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-1">{tweakModal.event.title}</p>
                </div>
              </div>
              <button
                onClick={() => setTweakModal(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Event Stats Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-black/60 rounded-xl border border-neutral-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Real DB Registrations</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {tweakModal.event._count?.registrations || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Event Capacity</span>
                <span className="font-mono font-bold text-white text-sm">
                  {tweakModal.event.capacity || 0} attendees
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveTweak} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Custom Registration Count <span className="text-gray-500 font-normal">(Display override)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  value={tweakModal.count}
                  onChange={(e) =>
                    setTweakModal((prev) => ({ ...prev, count: e.target.value }))
                  }
                  placeholder="Enter total registrations count..."
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500">
                  This custom count overrides the public displayed registration metric across event pages, search cards, and platform stats.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 50, 100, 250, 500].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const current = parseInt(tweakModal.count, 10) || 0;
                        setTweakModal((prev) => ({ ...prev, count: current + inc }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded border border-neutral-700/60 transition"
                    >
                      +{inc}
                    </button>
                  ))}
                  {tweakModal.event.capacity && (
                    <button
                      type="button"
                      onClick={() =>
                        setTweakModal((prev) => ({ ...prev, count: tweakModal.event.capacity }))
                      }
                      className="px-2.5 py-1 text-[11px] font-bold bg-neutral-800 hover:bg-amber-500 hover:text-black text-amber-400 rounded border border-amber-500/30 transition"
                    >
                      Fill Capacity ({tweakModal.event.capacity})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setTweakModal((prev) => ({
                        ...prev,
                        count: tweakModal.event._count?.registrations || 0,
                      }))
                    }
                    className="px-2.5 py-1 text-[11px] font-bold bg-neutral-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded border border-emerald-500/30 transition"
                  >
                    Reset to Real ({tweakModal.event._count?.registrations || 0})
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() =>
                    setTweakModal((prev) => ({ ...prev, count: "" }))
                  }
                  className="text-[11px] text-gray-400 hover:text-rose-400 underline"
                >
                  Clear Custom Override
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTweakModal(null)}
                    className="px-3.5 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tweakSubmitting}
                    className="px-4 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {tweakSubmitting ? "Saving..." : "Save Tweak"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
