"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  Archive,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function EventModerationDetailPage({ params }) {
  const { id } = use(params);
  const { goBack } = useBackNavigation();

  const [event, setEvent] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { action: string, title: string }

  const fetchEventDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setEvent(result.data);
        setAuditLogs(result.auditLogs || []);
      } else {
        toast.error(result.error || "Failed to load event details");
      }
    } catch (err) {
      console.error("Failed to fetch event detail:", err);
      toast.error("Network error loading event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchEventDetail();
  }, [fetchEventDetail]);

  const executeModeration = async (actionType) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, reason }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Moderation action ${actionType} completed!`);
        setReason("");
        setConfirmModal(null);
        await fetchEventDetail();
      } else {
        toast.error(`Moderation failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionClick = (actionType) => {
    if (actionType === "SUSPEND" || actionType === "ARCHIVE") {
      setConfirmModal({
        action: actionType,
        title: actionType === "SUSPEND" ? "Confirm Event Suspension" : "Confirm Event Archiving",
      });
    } else {
      executeModeration(actionType);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Loading event moderation workspace...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-4">
        <h1 className="text-2xl font-black">Event Not Found</h1>
        <p className="text-xs text-gray-400">The requested event could not be found for moderation.</p>
        <Link href="/admin/events" className="text-xs text-amber-400 underline">
          ← Return to Event Moderation Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => goBack("/admin/events")}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Event Moderation Queue
          </button>
          <h1 className="text-3xl font-black flex items-center gap-2">
            {event.title}
            {event.archived && (
              <span className="bg-neutral-800 text-gray-400 border border-neutral-700 px-2 py-0.5 rounded text-xs font-mono">
                Archived
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400">
            Category: <strong className="text-white">{event.type} • {event.category || "General"}</strong> | Venue:{" "}
            <span className="text-gray-300">{event.location}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${
              event.status === "Suspended"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : event.status === "Completed"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            Status: {event.status}
          </span>
          <span className="bg-neutral-800 text-gray-400 font-mono text-[11px] px-3 py-1.5 rounded-lg border border-neutral-700">
            ID: {event.id}
          </span>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Columns: Event Content & Schedule */}
        <div className="md:col-span-2 space-y-6">
          {/* Banner Preview */}
          {event.bannerUrl && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.bannerUrl} alt={event.title} className="w-full h-48 sm:h-64 object-cover" />
            </div>
          )}

          {/* Event Overview Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Calendar className="w-4 h-4 text-amber-500" /> Event Overview & Specs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Event Date</span>
                <span className="font-bold text-white">{new Date(event.date).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Ticket Type</span>
                <span className="font-bold text-white">{event.ticketType} ({event.price ? `$${event.price}` : "Free"})</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Capacity</span>
                <span className="font-bold text-white">{event.capacity} Attendees</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800/60 text-xs space-y-1">
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">Description</span>
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            </div>
          </div>

          {/* Sticky Admin Moderation Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 sticky bottom-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Admin Content Moderation Controls
            </h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter moderation note or reason for suspension/archive..."
              className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              rows={3}
            />
            <div className="flex flex-wrap gap-2.5">
              {event.status !== "Suspended" ? (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("SUSPEND")}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Suspend Event
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("RESTORE")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Restore Event
                </button>
              )}

              {!event.archived ? (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("ARCHIVE")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-neutral-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive Event
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("UNARCHIVE")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-neutral-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" /> Unarchive Event
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Organizer Profile & Audit Trail */}
        <div className="space-y-6">
          {/* Organizer Profile Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Users className="w-4 h-4 text-amber-500" /> Event Host / Organizer
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Name</span>
                <span className="font-bold text-white">{event.organizer?.name || event.organizer?.fullName || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Email</span>
                <span className="font-mono text-gray-300">{event.organizer?.email}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Role</span>
                <span className="font-bold text-emerald-400">{(event.organizer?.role || "USER").toUpperCase()}</span>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-700 transition block text-center"
            >
              View Organizer in User Directory →
            </Link>
          </div>

          {/* Event Audit Trail Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Clock className="w-4 h-4 text-amber-500" /> Moderation Audit Trail
            </h2>
            <div className="space-y-3 border-l-2 border-neutral-800 pl-3">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5 text-xs">
                    <p className="font-bold text-amber-400 font-mono text-[11px]">{log.action}</p>
                    {log.reason && <p className="text-gray-400 italic text-[11px]">&ldquo;{log.reason}&rdquo;</p>}
                    <p className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No moderation history recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to perform action <strong className="text-white">{confirmModal.action}</strong> for event <strong className="text-white">{event.title}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => executeModeration(confirmModal.action)}
                disabled={submitting}
                className="px-5 py-2 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? "Executing..." : `Yes, ${confirmModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
