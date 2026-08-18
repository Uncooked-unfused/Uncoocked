"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Edit3,
  Trash2,
  Save,
  Ticket,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";
import ImageCropper from "@/components/ui/ImageCropper";

const EVENT_TYPES = [
  "Hackathon",
  "Fest",
  "Party",
  "Festive Night",
  "Meetup",
  "Workshop",
  "MUN",
  "Competition",
  "Seminar",
  "Other",
];

const PRESET_BANNERS = [
  { label: "Tech Hackathon", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80" },
  { label: "College Fest", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80" },
  { label: "MUN / Conference", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80" },
  { label: "Workshop / Meetup", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80" },
  { label: "Concert / Party", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80" },
];

export default function EventAdminManagementPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { goBack } = useBackNavigation();

  const [event, setEvent] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "edit"
  
  // Moderation state
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { action: string, title: string, danger?: boolean }
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: "",
    type: "Hackathon",
    category: "",
    date: "",
    location: "",
    zone: "",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    googleMapsUrl: "",
    ticketType: "Free",
    price: 0,
    capacity: 100,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
    popularityScore: 0,
    bannerUrl: "",
    description: "",
    schedule: "",
    prizePool: "",
    tags: "",
    keywords: "",
    organizerId: "",
    editReason: "",
  });

  const fetchEventDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      const result = await res.json();
      if (res.ok && result.success) {
        const ev = result.data;
        setEvent(ev);
        setAuditLogs(result.auditLogs || []);
        
        // Format ISO date to datetime-local format YYYY-MM-DDTHH:MM
        let formattedDate = "";
        if (ev.date) {
          const d = new Date(ev.date);
          if (!isNaN(d.getTime())) {
            formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
          }
        }

        // Parse tags and keywords if JSON strings
        let tagsVal = "";
        if (ev.tags) {
          try {
            const parsed = JSON.parse(ev.tags);
            tagsVal = Array.isArray(parsed) ? parsed.join(", ") : ev.tags;
          } catch {
            tagsVal = ev.tags;
          }
        }

        let keywordsVal = "";
        if (ev.keywords) {
          try {
            const parsed = JSON.parse(ev.keywords);
            keywordsVal = Array.isArray(parsed) ? parsed.join(", ") : ev.keywords;
          } catch {
            keywordsVal = ev.keywords;
          }
        }

        setEditForm({
          title: ev.title || "",
          type: ev.type || "Hackathon",
          category: ev.category || ev.type || "",
          date: formattedDate,
          location: ev.location || "",
          zone: ev.zone || "",
          city: ev.city || "Lucknow",
          state: ev.state || "Uttar Pradesh",
          country: ev.country || "India",
          googleMapsUrl: ev.googleMapsUrl || "",
          ticketType: ev.ticketType || "Free",
          price: ev.price || 0,
          capacity: ev.capacity || 100,
          waitlistEnabled: ev.waitlistEnabled ?? true,
          status: ev.status || "Active",
          archived: ev.archived || false,
          popularityScore: ev.popularityScore || 0,
          bannerUrl: ev.bannerUrl || "",
          description: ev.description || "",
          schedule: ev.schedule || "",
          prizePool: ev.prizePool || "",
          tags: tagsVal,
          keywords: keywordsVal,
          organizerId: ev.organizerId || "",
          editReason: "",
        });
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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "edit" || params.get("edit") === "true") {
        setActiveTab("edit");
      }
    }
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

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "ticketType" && value === "Free" ? { price: 0 } : {}),
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...editForm,
        price: parseFloat(editForm.price) || 0,
        capacity: parseInt(editForm.capacity, 10) || 100,
        popularityScore: parseFloat(editForm.popularityScore) || 0,
        reason: editForm.editReason || "Admin updated event details",
        tags: editForm.tags ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        keywords: editForm.keywords ? editForm.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
      };

      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Event details updated successfully!");
        await fetchEventDetail();
        setActiveTab("overview");
      } else {
        toast.error(result.error || "Failed to update event");
      }
    } catch (err) {
      console.error("Save event error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Event deleted permanently");
        router.push("/admin/events");
      } else {
        toast.error(data.error || "Failed to delete event");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  };

  const handleActionClick = (actionType) => {
    if (actionType === "SUSPEND" || actionType === "ARCHIVE" || actionType === "DELETE") {
      setConfirmModal({
        action: actionType,
        title:
          actionType === "SUSPEND"
            ? "Confirm Event Suspension"
            : actionType === "ARCHIVE"
            ? "Confirm Event Archiving"
            : "Confirm Permanent Deletion",
        danger: actionType === "DELETE" || actionType === "SUSPEND",
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
          <p className="text-xs text-gray-400 font-mono">Loading event management workspace...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-4">
        <h1 className="text-2xl font-black">Event Not Found</h1>
        <p className="text-xs text-gray-400">The requested event could not be found.</p>
        <Link href="/admin/events" className="text-xs text-amber-400 underline">
          ← Return to Event Management Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => goBack("/admin/events")}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Management
          </button>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" /> Admin Event Control
          </div>
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

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
              event.status === "Suspended"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : event.status === "Completed"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            Status: {event.status}
          </span>
          <span className="bg-neutral-800 text-gray-400 font-mono text-xs px-3 py-1.5 rounded-lg border border-neutral-700">
            ID: {event.id}
          </span>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-amber-500 text-black shadow-md"
              : "bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Overview & Moderation
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            activeTab === "edit"
              ? "bg-amber-500 text-black shadow-md"
              : "bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit All Details
        </button>
      </div>

      {activeTab === "overview" ? (
        /* ================= OVERVIEW TAB ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Event Content & Quick Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner Preview */}
            {event.bannerUrl && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.bannerUrl} alt={event.title} className="w-full h-48 sm:h-64 object-cover" />
              </div>
            )}

            {/* Event Specs Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Calendar className="w-4 h-4 text-amber-500" /> Event Details & Specs
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Event Date</span>
                  <span className="font-bold text-white">{new Date(event.date).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Ticket Type</span>
                  <span className="font-bold text-white">{event.ticketType} ({event.price ? `₹${event.price}` : "Free"})</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Capacity</span>
                  <span className="font-bold text-white">{event.capacity} Attendees</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">City & State</span>
                  <span className="font-bold text-white">{event.city}, {event.state}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Popularity Score</span>
                  <span className="font-mono text-amber-400 font-bold">{event.popularityScore}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Registrations</span>
                  <span className="font-mono text-emerald-400 font-bold">{event._count?.registrations || 0}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-800/60 text-xs space-y-1">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Description</span>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>

              {event.schedule && (
                <div className="pt-2 border-t border-neutral-800/60 text-xs space-y-1">
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Schedule</span>
                  <p className="text-gray-300 font-mono whitespace-pre-line bg-black p-3 rounded-lg border border-neutral-800">
                    {event.schedule}
                  </p>
                </div>
              )}

              {event.prizePool && (
                <div className="pt-2 border-t border-neutral-800/60 text-xs space-y-1">
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Prize Pool / Perks</span>
                  <p className="text-gray-300 font-mono whitespace-pre-line bg-black p-3 rounded-lg border border-neutral-800">
                    {event.prizePool}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Admin Quick Moderation Panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-2xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Admin Moderation Actions
              </h2>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter moderation note or reason for status transition (logged in Audit Trail)..."
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                rows={2}
              />
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Complete / Reactivate button */}
                {event.status !== "Completed" ? (
                  <button
                    disabled={submitting}
                    onClick={() => executeModeration("COMPLETE")}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Completed
                  </button>
                ) : (
                  <button
                    disabled={submitting}
                    onClick={() => executeModeration("RESTORE")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Re-open as Active
                  </button>
                )}

                {/* Suspend / Restore button */}
                {event.status !== "Suspended" ? (
                  <button
                    disabled={submitting}
                    onClick={() => handleActionClick("SUSPEND")}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Suspend Event
                  </button>
                ) : (
                  <button
                    disabled={submitting}
                    onClick={() => executeModeration("RESTORE")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Restore Active Status
                  </button>
                )}

                {/* Archive / Unarchive button */}
                {!event.archived ? (
                  <button
                    disabled={submitting}
                    onClick={() => handleActionClick("ARCHIVE")}
                    className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-neutral-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive Event
                  </button>
                ) : (
                  <button
                    disabled={submitting}
                    onClick={() => executeModeration("UNARCHIVE")}
                    className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-neutral-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Unarchive Event
                  </button>
                )}

                {/* Delete button */}
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("DELETE")}
                  className="bg-red-950 hover:bg-red-900 text-rose-300 border border-rose-900/50 text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Event
                </button>
              </div>
            </div>

            {/* Registrations List Preview */}
            {event.registrations && event.registrations.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <Users className="w-4 h-4 text-amber-500" /> Recent Registrations ({event._count?.registrations || 0} total)
                </h2>
                <div className="divide-y divide-neutral-800/60 text-xs">
                  {event.registrations.map((reg) => (
                    <div key={reg.id || reg.registeredAt} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{reg.user?.name || reg.user?.fullName || "Student"}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{reg.user?.email}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <span className="font-mono text-gray-300">{event.organizer?.email || "No email"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Role</span>
                  <span className="font-bold text-emerald-400">{(event.organizer?.role || "USER").toUpperCase()}</span>
                </div>
              </div>
              <Link
                href="/admin/users"
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold px-3 py-2 rounded-lg border border-neutral-700 transition block text-center"
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
      ) : (
        /* ================= EDIT ALL DETAILS TAB ================= */
        <form onSubmit={handleSaveEdit} className="space-y-8">
          {/* Section 1: Core Details & Status */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Core Event Information
              </h2>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Full Attribute Editing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Event Type <span className="text-rose-400">*</span>
                </label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Category Label</label>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  placeholder="e.g. Hackathon, Tech Fest"
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Event Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-bold"
                >
                  <option value="Active">Active (Live / Upcoming)</option>
                  <option value="Completed">Completed (Past Event)</option>
                  <option value="Suspended">Suspended (Moderated)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Popularity Score <span className="text-gray-500 font-normal text-[11px]">(Featured ordering weight)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="popularityScore"
                  value={editForm.popularityScore}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Assigned Organizer ID <span className="text-gray-500 font-normal text-[11px]">(User ID)</span>
                </label>
                <input
                  type="text"
                  name="organizerId"
                  value={editForm.organizerId}
                  onChange={handleEditChange}
                  placeholder="Organizer user ID"
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div className="flex items-center gap-6 pt-2 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                  <input
                    type="checkbox"
                    name="archived"
                    checked={editForm.archived}
                    onChange={handleEditChange}
                    className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-0 bg-black cursor-pointer"
                  />
                  Mark as Archived (Hidden from active discovery)
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Venue */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Schedule & Location Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-gray-300 block">
                  Event Date & Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  required
                  value={editForm.date}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Location / Venue Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={editForm.location}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Zone / Campus Area</label>
                <input
                  type="text"
                  name="zone"
                  value={editForm.zone}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">City</label>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">State</label>
                <input
                  type="text"
                  name="state"
                  value={editForm.state}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Country</label>
                <input
                  type="text"
                  name="country"
                  value={editForm.country}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-gray-300 block">Google Maps Directions URL</label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  value={editForm.googleMapsUrl}
                  onChange={handleEditChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ticketing & Capacity */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-500" /> Ticketing & Capacity Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Ticket Type</label>
                <select
                  name="ticketType"
                  value={editForm.ticketType}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="Free">Free Entry</option>
                  <option value="Paid">Paid Ticket</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Price (₹ INR)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  disabled={editForm.ticketType === "Free"}
                  value={editForm.price}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition disabled:opacity-40 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Attendee Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  max="100000"
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 md:col-span-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                  <input
                    type="checkbox"
                    name="waitlistEnabled"
                    checked={editForm.waitlistEnabled}
                    onChange={handleEditChange}
                    className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-0 bg-black cursor-pointer"
                  />
                  Enable Waitlist once capacity is reached
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Media & Rich Content */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" /> Media & Rich Content
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">
                  Event Banner (Upload Custom Media or Select Preset)
                </label>

                <ImageCropper
                  currentImageUrl={editForm.bannerUrl}
                  onCropCompleteCallback={(croppedBase64) =>
                    setEditForm((p) => ({ ...p, bannerUrl: croppedBase64 }))
                  }
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <label className="text-[11px] font-mono text-gray-400 block">
                  Or Enter External Media URL:
                </label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={editForm.bannerUrl}
                  onChange={handleEditChange}
                  placeholder="https://images.unsplash.com/... or https://cdn..."
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>

              {/* Banner Presets */}
              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 block font-mono">Quick Preset Banners:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, bannerUrl: preset.url }))}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition font-bold ${
                        editForm.bannerUrl === preset.url
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-black text-gray-400 border-neutral-800 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {editForm.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, bannerUrl: "" }))}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 bg-rose-950/40 hover:bg-rose-900 transition font-bold"
                    >
                      Clear Media
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Event Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={editForm.description}
                onChange={handleEditChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Schedule (Markdown / Text)</label>
                <textarea
                  name="schedule"
                  rows={4}
                  value={editForm.schedule}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Prize Pool / Perks</label>
                <textarea
                  name="prizePool"
                  rows={4}
                  value={editForm.prizePool}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Tags (Comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={editForm.tags}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Keywords (Comma-separated)</label>
                <input
                  type="text"
                  name="keywords"
                  value={editForm.keywords}
                  onChange={handleEditChange}
                  className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-gray-300 block">
                Update Reason / Note <span className="text-gray-500 font-normal text-[11px]">(Logged in Audit Trail)</span>
              </label>
              <input
                type="text"
                name="editReason"
                value={editForm.editReason}
                onChange={handleEditChange}
                placeholder="e.g. Corrected venue timings and prize pool"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 border-t border-neutral-800 pt-6">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className="px-5 py-3 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-gray-300 rounded-lg border border-neutral-800 transition"
            >
              Cancel Edit
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Event Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {confirmModal.danger && <AlertTriangle className="w-5 h-5 text-rose-500" />}
              {confirmModal.title}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to execute <strong className="text-white">{confirmModal.action}</strong> on event <strong className="text-white">&ldquo;{event.title}&rdquo;</strong>?
              {confirmModal.action === "DELETE" && (
                <span className="block mt-2 text-rose-400 font-bold">
                  Warning: This will permanently delete the event and its associated data. This action cannot be undone.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action === "DELETE") {
                    handleDeleteEvent();
                  } else {
                    executeModeration(confirmModal.action);
                  }
                }}
                disabled={submitting}
                className={`px-5 py-2 text-xs font-extrabold text-white rounded-lg disabled:opacity-50 cursor-pointer ${
                  confirmModal.danger
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-amber-500 hover:bg-amber-400 text-black"
                }`}
              >
                {submitting ? "Processing..." : `Yes, ${confirmModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
