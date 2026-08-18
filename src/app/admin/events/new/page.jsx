"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Calendar,
  Ticket,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

const EVENT_TYPES = [
  "Hackathon",
  "Fest",
  "Party",
  "Festive Night",
  "Meetup",
  "Workshop",
  "Competition",
  "Seminar",
  "Other",
];

const PRESET_BANNERS = [
  { label: "Tech Hackathon", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80" },
  { label: "College Fest", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80" },
  { label: "Workshop / Meetup", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80" },
  { label: "Concert / Party", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80" },
];

export default function AdminNewEventPage() {
  const router = useRouter();
  const { goBack } = useBackNavigation();

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    type: "Hackathon",
    category: "Hackathon",
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
    bannerUrl: PRESET_BANNERS[0].url,
    description: "",
    schedule: "",
    prizePool: "",
    tags: "",
    keywords: "",
    organizerId: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "type" && !prev.category ? { category: value } : {}),
      ...(name === "ticketType" && value === "Free" ? { price: 0 } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setErrorMsg("Title must be at least 3 characters long.");
      return;
    }
    if (!formData.date) {
      setErrorMsg("Event date and time is required.");
      return;
    }
    if (!formData.location.trim() || formData.location.trim().length < 3) {
      setErrorMsg("Location must be at least 3 characters long.");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setErrorMsg("Description must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity, 10) || 100,
        popularityScore: parseFloat(formData.popularityScore) || 0,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        keywords: formData.keywords ? formData.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
      };

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Event created successfully!");
        router.push(`/admin/events/${result.data.id}`);
      } else {
        setErrorMsg(result.error || "Failed to create event");
        toast.error(result.error || "Failed to create event");
      }
    } catch (err) {
      console.error("Event creation error:", err);
      setErrorMsg(`Network error: ${err.message}`);
      toast.error("Network error while creating event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8 max-w-6xl mx-auto">
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
            <ShieldCheck className="w-4 h-4" /> Super Admin Control
          </div>
          <h1 className="text-3xl font-black">Create Platform Event</h1>
          <p className="text-xs text-gray-400">
            Publish and configure full event parameters directly into the database.
          </p>
        </div>

        <Link
          href="/admin/events"
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition"
        >
          Cancel
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details & Status */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Core Event Information
            </h2>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Admin Accessible
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
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. HackEnlight 2026: AI & Systems Hackathon"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Custom Event ID / Slug <span className="text-gray-500 font-normal text-[11px]">(Optional, alphanumeric)</span>
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="e.g. hackenlight-2026 (leave empty for auto-generated ID)"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Event Type <span className="text-rose-400">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
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
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Hackathon, Tech Fest, Cultural Night"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Initial Event Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-bold"
              >
                <option value="Active">Active (Live / Upcoming)</option>
                <option value="Completed">Completed (Past Event)</option>
                <option value="Suspended">Suspended (Hidden / Moderated)</option>
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
                value={formData.popularityScore}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Assigned Organizer ID <span className="text-gray-500 font-normal text-[11px]">(Optional user ID)</span>
              </label>
              <input
                type="text"
                name="organizerId"
                value={formData.organizerId}
                onChange={handleChange}
                placeholder="Leave blank to assign to your Admin account"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            <div className="flex items-center gap-6 pt-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                <input
                  type="checkbox"
                  name="archived"
                  checked={formData.archived}
                  onChange={handleChange}
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
                value={formData.date}
                onChange={handleChange}
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
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Main Auditorium, BBD University Campus, Gomti Nagar"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Zone / Campus Area</label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                placeholder="e.g. Gomti Nagar, Alambagh, Hazratganj"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <label className="text-xs font-bold text-gray-300 block">Google Maps Directions URL</label>
              <input
                type="url"
                name="googleMapsUrl"
                value={formData.googleMapsUrl}
                onChange={handleChange}
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
                value={formData.ticketType}
                onChange={handleChange}
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
                disabled={formData.ticketType === "Free"}
                value={formData.price}
                onChange={handleChange}
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
                value={formData.capacity}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2 md:col-span-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                <input
                  type="checkbox"
                  name="waitlistEnabled"
                  checked={formData.waitlistEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-0 bg-black cursor-pointer"
                />
                Enable Waitlist once capacity is reached
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Media, Description & Schedule */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" /> Media & Rich Content
            </h2>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-300 block">Banner Image URL</label>
            <input
              type="url"
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition font-mono"
            />

            {/* Banner Presets */}
            <div className="space-y-2">
              <span className="text-[11px] text-gray-400 block font-mono">Quick Preset Banners:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, bannerUrl: preset.url }))}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border transition font-bold ${
                      formData.bannerUrl === preset.url
                        ? "bg-amber-500 text-black border-amber-500"
                        : "bg-black text-gray-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.bannerUrl && (
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.bannerUrl}
                  alt="Banner preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block">
              Event Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Comprehensive description of the event agenda, challenges, criteria, and audience..."
              className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Schedule (Markdown / Text)</label>
              <textarea
                name="schedule"
                rows={4}
                value={formData.schedule}
                onChange={handleChange}
                placeholder="### Day 1: Opening & Keynote&#10;### Day 2: Hacking & Final Pitches"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Prize Pool / Perks</label>
              <textarea
                name="prizePool"
                rows={4}
                value={formData.prizePool}
                onChange={handleChange}
                placeholder="1st Place: ₹50,000 + Swag Kits&#10;2nd Place: ₹25,000"
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
                value={formData.tags}
                onChange={handleChange}
                placeholder="AI, Web3, Hackathon, Coding, OpenSource"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Keywords (Comma-separated)</label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="lucknow, developer, student fest, robotics"
                className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 border-t border-neutral-800 pt-6">
          <Link
            href="/admin/events"
            className="px-5 py-3 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-gray-300 rounded-lg border border-neutral-800 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-lg cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                Publish Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
