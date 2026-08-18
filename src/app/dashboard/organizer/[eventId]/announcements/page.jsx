"use client";

import { useState, useEffect, use } from "react";
import { Megaphone, Plus, Trash2, Pin, Eye, EyeOff, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

export default function AnnouncementsPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState("All");

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/announcements`);
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}/announcements`);
        const data = await res.json();
        if (!ignore && res.ok) {
          setAnnouncements(data.announcements || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch announcements:", err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message content");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: message.trim(),
          visibility,
          isPinned: false
        })
      });
      
      const data = await res.json();
      if (res.ok && data.announcement) {
        const newAnn = {
          id: data.announcement.id,
          title: data.announcement.title,
          content: data.announcement.content,
          visibility: visibility,
          isPinned: false,
          date: formatDate(data.announcement.postedAt || Date.now())
        };
        setAnnouncements(prev => [newAnn, ...prev]);
        setTitle("");
        setMessage("");
        setVisibility("All");
        setShowForm(false);
        toast.success("Announcement broadcasted successfully!");
      } else {
        toast.error(data.error || "Failed to post announcement");
      }
    } catch (err) {
      console.error("Error posting announcement:", err);
      toast.error("Error posting announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}/announcements?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast.success("Announcement removed");
      } else {
        toast.error("Failed to delete announcement from server");
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      toast.error("Network error deleting announcement");
    }
  };

  const togglePin = (id) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    toast.info("Pinned status updated locally");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Bulletin & Announcements</h1>
          <p className="text-xs text-gray-400 mt-1">Broadcast updates, schedule changes, and alerts directly to attendee dashboards.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-neon-purple text-white text-xs font-bold rounded-lg hover:bg-neon-purple/90 transition-all shadow-neon cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="bg-dark-card border border-neon-purple/40 p-5 rounded-2xl shadow-[0_0_20px_rgba(191,64,255,0.08)] space-y-4 relative">
          <button 
            type="button" 
            onClick={() => setShowForm(false)} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Create Broadcast Update</h2>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-bold">Title</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                type="text" 
                className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-white focus:border-neon-purple outline-none" 
                placeholder="e.g. Schedule Update / Room Assignment" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1 font-bold">Message Content</label>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                rows={4} 
                className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-white focus:border-neon-purple outline-none leading-relaxed" 
                placeholder="Write your announcement message..." 
                required 
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1 font-bold">Audience</label>
              <select 
                value={visibility} 
                onChange={e => setVisibility(e.target.value)} 
                className="w-full sm:w-1/2 bg-black border border-dark-border rounded-lg p-2.5 text-white focus:border-neon-purple outline-none cursor-pointer"
              >
                <option value="All">All Visitors & Attendees</option>
                <option value="Registered Users">Registered Attendees Only</option>
                <option value="VIP">VIP Ticket Holders</option>
              </select>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="px-4 py-2 bg-zinc-900 border border-dark-border text-gray-300 font-bold text-xs rounded-lg hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-neon-purple text-white font-bold text-xs rounded-lg shadow-neon hover:bg-neon-purple/90 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-dark-card border border-dark-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-dark-card border border-dark-border border-dashed p-10 text-center rounded-2xl">
            <Megaphone className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-bold">No announcements posted yet.</p>
            <p className="text-xs text-gray-500 mt-1">Post updates to keep registered attendees informed before and during the event.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`bg-dark-card border ${ann.isPinned ? 'border-neon-purple/40' : 'border-dark-border'} rounded-xl p-5 relative group transition-all hover:border-neon-purple/30`}>
              {ann.isPinned && (
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-neon-purple text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-neon flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </div>
              )}
              
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => togglePin(ann.id)} 
                    className={`p-1.5 rounded hover:bg-white/5 cursor-pointer ${ann.isPinned ? 'text-neon-purple' : 'text-gray-500'}`} 
                    title={ann.isPinned ? "Unpin" : "Pin"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => deleteAnnouncement(ann.id)} 
                    className="p-1.5 text-gray-500 rounded hover:bg-red-950/30 hover:text-red-400 cursor-pointer" 
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              
              <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-gray-500 border-t border-dark-border/40 pt-3">
                <span>{formatDate(ann.date || ann.postedAt || ann.createdAt)}</span>
                <span className="flex items-center gap-1 bg-black px-2 py-0.5 rounded-full border border-dark-border">
                  {ann.visibility === 'All' ? <Eye className="w-3 h-3 text-neon-purple" /> : <EyeOff className="w-3 h-3 text-amber-500" />}
                  {ann.visibility}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
