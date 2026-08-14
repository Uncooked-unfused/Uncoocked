"use client";

import { useState, useEffect, use } from "react";
import { Save, Eye, Layout, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ImageCropper from "@/components/ui/ImageCropper";
import Image from "next/image";
import { toast } from "sonner";

export default function ContentEditorPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bannerUrl: "",
    venue: "",
    tags: ""
  });

  useEffect(() => {
    let isMounted = true;
    const fetchEventContent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (data.success && data.event && isMounted) {
          setFormData({
            title: data.event.title || "",
            description: data.event.description || "",
            bannerUrl: data.event.bannerUrl || "",
            venue: data.event.location || "",
            tags: Array.isArray(data.event.tags) ? data.event.tags.join(", ") : (data.event.tags || "")
          });
          setLastSaved("Synced with server");
        }
      } catch (err) {
        console.error("Failed to load event content:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEventContent();
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
          description: formData.description,
          bannerUrl: formData.bannerUrl,
          location: formData.venue,
          tags: formData.tags
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastSaved(new Date().toLocaleTimeString());
        toast.success("Event content published successfully!");
      } else {
        toast.error(data.error || "Failed to update event content");
      }
    } catch (err) {
      console.error("Error saving event content:", err);
      toast.error("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-dark-card border border-dark-border rounded-xl animate-pulse" />
        <div className="h-96 bg-dark-card border border-dark-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Event Content</h1>
          <p className="text-xs text-gray-400 mt-1">Manage public-facing description, markdown agenda, and visual banner.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 font-mono">
            {lastSaved ? `Last saved: ${lastSaved}` : 'Unsaved changes'}
          </span>
          <button 
            type="button"
            onClick={() => setShowPreview(!showPreview)} 
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-dark-border text-white text-xs font-bold rounded-lg hover:border-neon-purple/50 transition-all cursor-pointer"
          >
            {showPreview ? <Layout className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Editor" : "Live Preview"}
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-neon-purple hover:bg-neon-purple/90 text-white text-xs font-bold rounded-lg transition-all shadow-neon cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Form */}
        <div className={`space-y-6 ${showPreview ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* Media & Meta */}
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Media & Meta</h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Event Banner</label>
              <ImageCropper 
                currentImageUrl={formData.bannerUrl} 
                onCropCompleteCallback={(croppedBase64) => setFormData({...formData, bannerUrl: croppedBase64})} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">Venue Location</label>
                <input 
                  type="text" 
                  value={formData.venue}
                  onChange={e => setFormData({...formData, venue: e.target.value})}
                  className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-xs text-white focus:border-neon-purple outline-none" 
                  placeholder="e.g. Main Auditorium or Online Zoom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full bg-black border border-dark-border rounded-lg p-2.5 text-xs text-white focus:border-neon-purple outline-none" 
                  placeholder="e.g. hackathon, web3, ai"
                />
              </div>
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="flex border-b border-dark-border bg-black/20">
              <div className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-neon-purple bg-neon-purple/5 w-full flex items-center justify-between">
                <span>Full Event Description (Markdown)</span>
                <span className="text-[10px] text-gray-500 font-mono font-normal">Supports # headings, lists, tables & code</span>
              </div>
            </div>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="flex-1 w-full bg-transparent p-5 text-sm text-gray-300 font-mono focus:outline-none resize-none leading-relaxed"
              placeholder="Write your full event description here. You can include your agenda, speaker lineup, rules, FAQs, and more using Markdown formatting..."
            />
          </div>
        </div>

        {/* Live Preview Pane */}
        {showPreview && (
          <div className="lg:col-span-2 bg-black border border-dark-border rounded-2xl overflow-hidden h-[800px] sticky top-6 shadow-neon relative flex flex-col">
            <div className="bg-zinc-950 border-b border-dark-border px-4 py-3 flex items-center justify-between z-10">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-neon-purple" /> Live Preview
              </span>
              <span className="text-[10px] uppercase font-bold text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded border border-neon-purple/20">
                Public Attendee View
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 relative">
              <div className="max-w-3xl mx-auto space-y-6">
                {formData.bannerUrl && (
                  <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-dark-border">
                    <Image src={formData.bannerUrl} alt="Event Banner Preview" fill className="object-cover" />
                  </div>
                )}
                {formData.venue && (
                  <div className="text-xs font-mono text-gray-400">
                    📍 Location: <span className="text-white font-bold">{formData.venue}</span>
                  </div>
                )}
                <div className="prose prose-invert prose-p:text-sm prose-h1:text-2xl prose-h2:text-xl prose-a:text-neon-lavender max-w-none">
                  <ReactMarkdown>{formData.description || "*No description provided yet.*"}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
