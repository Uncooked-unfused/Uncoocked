"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, AlertTriangle, Shield, Globe, Edit3, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    visibility: "Public",
    capacity: 100,
    waitlist: true,
  });

  const [managers, setManagers] = useState([]);
  const [newManagerEmail, setNewManagerEmail] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchEventSettings = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (data.success && data.event && isMounted) {
          setSettings({
            visibility: data.event.archived ? "Private" : "Public",
            capacity: data.event.capacity || 100,
            waitlist: data.event.waitlistEnabled ?? true,
          });
        }
      } catch (err) {
        console.error("Failed to load event settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEventSettings();
    return () => { isMounted = false; };
  }, [eventId]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capacity: Number(settings.capacity),
          waitlistEnabled: Boolean(settings.waitlist),
          archived: settings.visibility === "Private" || settings.visibility === "Unlisted"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  const handleAddManager = (e) => {
    e.preventDefault();
    if (!newManagerEmail) return;
    setManagers([
      ...managers, 
      { id: `mgr-${Date.now()}`, name: newManagerEmail.split('@')[0], email: newManagerEmail, role: "Coordinator" }
    ]);
    setNewManagerEmail("");
    toast.success(`Invited ${newManagerEmail} as Event Coordinator`);
  };

  const removeManager = (id) => {
    if (confirm("Remove this manager?")) {
      setManagers(managers.filter(m => m.id !== id));
      toast.info("Manager access removed");
    }
  };

  const handleArchiveEvent = async () => {
    if (!confirm("Are you sure you want to archive this event? It will be hidden from public matrices.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });
      if (res.ok) {
        toast.success("Event successfully archived.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to archive event.");
      }
    } catch (e) {
      toast.error("Error archiving event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!confirm("Are you sure you want to mark this event as completed? It will be moved to event history.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/complete`, { method: 'POST' });
      if (res.ok) {
        toast.success("Event marked as completed.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to mark event as completed.");
      }
    } catch (e) {
      toast.error("Error completing event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("DANGER: Are you sure you want to permanently delete this event and all its attendee records? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Event permanently deleted.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to delete event.");
      }
    } catch (e) {
      toast.error("Error deleting event.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-dark-card border border-dark-border rounded-xl animate-pulse" />
        <div className="h-64 bg-dark-card border border-dark-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Event Settings</h1>
          <p className="text-xs text-gray-400 mt-1">Configure visibility, registration rules, team permissions, and lifecycle operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/dashboard/organizer/new?edit=${eventId}`} 
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-dark-border text-white text-xs font-bold rounded-lg hover:border-neon-purple/50 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-neon-purple" /> Edit Details
          </Link>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-neon-purple text-white text-xs font-bold rounded-lg hover:bg-neon-purple/90 transition-all shadow-neon cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* General Configuration */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border bg-black/20 flex items-center gap-3">
          <Globe className="w-5 h-5 text-neon-purple" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">General Configuration</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-gray-400 mb-2 font-bold text-xs">Event Visibility</label>
              <select 
                value={settings.visibility} 
                onChange={e => setSettings({...settings, visibility: e.target.value})}
                className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-xs text-white focus:border-neon-purple outline-none cursor-pointer"
              >
                <option value="Public">Public (Listed in Community Feed)</option>
                <option value="Private">Private (Direct Link Only)</option>
                <option value="Unlisted">Unlisted (Archived / Hidden)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 font-bold text-xs">Total Capacity</label>
              <input 
                type="number" 
                value={settings.capacity} 
                onChange={e => setSettings({...settings, capacity: Number(e.target.value)})}
                className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-xs text-white focus:border-neon-purple outline-none"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-dark-border/40">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={settings.waitlist}
                onChange={e => setSettings({...settings, waitlist: e.target.checked})}
                className="w-4 h-4 rounded border-dark-border bg-black text-neon-purple focus:ring-neon-purple"
              />
              <div>
                <div className="text-xs font-bold text-white">Enable Waitlist</div>
                <div className="text-[11px] text-gray-500">Allow attendees to join a queue once capacity is exhausted</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border bg-black/20 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Team & Permissions</h2>
        </div>
        <div className="p-6 space-y-6">
          <form onSubmit={handleAddManager} className="flex gap-3">
            <input 
              type="email" 
              placeholder="Enter co-host or coordinator email..." 
              value={newManagerEmail}
              onChange={e => setNewManagerEmail(e.target.value)}
              className="flex-1 bg-black border border-dark-border rounded-lg p-2.5 text-xs text-white focus:border-neon-purple outline-none"
            />
            <button 
              type="submit" 
              disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newManagerEmail)}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newManagerEmail) 
                  ? "bg-neon-purple text-white border border-neon-purple shadow-[0_0_15px_rgba(191,64,255,0.4)] hover:bg-neon-purple/90 cursor-pointer" 
                  : "bg-zinc-900 border border-dark-border text-gray-500 cursor-not-allowed"
              }`}
            >
              Add
            </button>
          </form>
          <div className="space-y-3">
            {managers.length === 0 ? (
              <p className="text-xs text-gray-500">No additional coordinators added. Only primary host has access.</p>
            ) : (
              managers.map(mgr => (
                <div key={mgr.id} className="flex items-center justify-between p-3 border border-dark-border rounded-lg bg-black/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                      {mgr.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{mgr.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{mgr.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-zinc-900 border border-dark-border rounded px-2 py-1 text-[11px] font-bold text-white">
                      {mgr.role || "Coordinator"}
                    </span>
                    <button 
                      onClick={() => removeManager(mgr.id)} 
                      className="text-gray-500 hover:text-red-400 text-xs font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Lifecycle */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border bg-black/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Event Lifecycle</h2>
        </div>
        <div className="p-6">
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 p-4 border border-emerald-900/30 rounded-xl bg-black/40">
            <div>
              <h3 className="text-sm font-bold text-white">Mark Event as Completed</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Officially conclude this event. It will be archived to historical records for attendees.</p>
            </div>
            <button 
              disabled={actionLoading} 
              onClick={handleCompleteEvent} 
              className="px-4 py-2 border border-emerald-900/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {actionLoading ? 'Processing...' : 'Mark Completed'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-red-900/30 bg-red-950/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 p-4 border border-red-900/20 rounded-xl bg-black/40">
            <div>
              <h3 className="text-sm font-bold text-white">Archive Event</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Hide the event from the public feed while preserving telemetry and attendee records.</p>
            </div>
            <button 
              disabled={actionLoading} 
              onClick={handleArchiveEvent} 
              className="px-4 py-2 border border-amber-900/50 text-amber-500 bg-amber-950/20 hover:bg-amber-950/40 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Processing...' : 'Archive Event'}
            </button>
          </div>
          
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 p-4 border border-red-900/20 rounded-xl bg-black/40">
            <div>
              <h3 className="text-sm font-bold text-white">Delete Event</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Permanently purge this event along with all ticket tiers, registrations, and analytics.</p>
            </div>
            <button 
              disabled={actionLoading} 
              onClick={handleDeleteEvent} 
              className="px-4 py-2 border border-red-900/50 text-red-400 bg-red-950/20 hover:bg-red-950/40 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Processing...' : 'Delete Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
