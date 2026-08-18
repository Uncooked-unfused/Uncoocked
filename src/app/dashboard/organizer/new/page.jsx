"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { CITY_ZONES } from "@/config/cities";
import { ArrowLeft } from "lucide-react";
import ImageCropper from "@/components/ui/ImageCropper";
import { toast } from "sonner";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

const BANNER_PRESETS = [
  {
    name: "Hackathon",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60",
  },
  {
    name: "Workshop",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=60",
  },
  {
    name: "Festive Night",
    url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop&q=60",
  },
  {
    name: "Concert/Party",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
  },
  {
    name: "Meetup",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=60",
  },
  {
    name: "MUN",
    url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=60",
  },
];

function HostEventForm() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [checkingHost, setCheckingHost] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Hackathon");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newGoogleMapsUrl, setNewGoogleMapsUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [newTicketType, setNewTicketType] = useState("Free");
  const [newPrice, setNewPrice] = useState(0);
  const [newCapacity, setNewCapacity] = useState(100);
  const [newWaitlistEnabled, setNewWaitlistEnabled] = useState(true);
  const [newCity, setNewCity] = useState("Lucknow"); // Hardcoded for MVP
  const [newZoneSelection, setNewZoneSelection] = useState(
    CITY_ZONES["Lucknow"] ? CITY_ZONES["Lucknow"][0] : "Custom"
  );
  const [customZone, setCustomZone] = useState("");

  // Enforce host verification guard
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login?callbackUrl=/dashboard/organizer/new");
      return;
    }

    const verifyHostStatus = async () => {
      try {
        const res = await fetch("/api/host/status");
        if (res.status === 401) {
          router.push("/login?callbackUrl=/dashboard/organizer/new");
          return;
        }
        const data = await res.json();
        const isVerified =
          data.userRole === "SUPER_ADMIN" ||
          (data.userRole === "ORGANIZER" && data.application?.status === "APPROVED");

        if (!isVerified) {
          toast.error("Host verification is required before you can create events.");
          router.replace("/host/status");
          return;
        }
        setCheckingHost(false);
      } catch (err) {
        console.error("Host verification check failed:", err);
        router.replace("/host/status");
      }
    };

    verifyHostStatus();
  }, [isLoading, user, router]);

  useEffect(() => {
    if (isEditing) {
      const fetchEvent = async () => {
        try {
          const res = await fetch("/api/events");
          const data = await res.json();
          if (data.success) {
            const event = data.events.find(ev => ev.id === editId);
            if (event) {
              setNewTitle(event.title);
              setNewType(event.type);
              setNewDate(event.date);
              setNewLocation(event.location);
              setNewGoogleMapsUrl(event.googleMapsUrl || "");
              setNewDescription(event.description);
              setNewBannerUrl(event.bannerUrl || "");
              setNewTicketType(event.ticketType || "Free");
              setNewPrice(event.price || 0);
              setNewCapacity(event.capacity || 100);
              setNewWaitlistEnabled(event.waitlistEnabled ?? true);
              setNewCity(event.city || "Lucknow");
              
              const predefinedZones = CITY_ZONES[event.city || "Lucknow"] || [];
              if (event.zone) {
                if (predefinedZones.includes(event.zone)) {
                  setNewZoneSelection(event.zone);
                  setCustomZone("");
                } else {
                  setNewZoneSelection("Custom");
                  setCustomZone(event.zone);
                }
              } else {
                setNewZoneSelection(predefinedZones[0] || "Custom");
                setCustomZone("");
              }
            }
          }
        } catch (error) {
          console.error("Failed to load event for editing:", error);
        } finally {
          setLoadingEvent(false);
        }
      };
      fetchEvent();
    }
  }, [isEditing, editId]);

  const handleHostNewEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("You must be logged in to host an event.");
      return;
    }

    setSubmitting(true);
    try {
      const eventPayload = {
        id: isEditing ? editId : `hosted-ev-${Date.now()}`,
        title: newTitle,
        type: newType,
        date: newDate,
        location: newLocation,
        googleMapsUrl: newGoogleMapsUrl,
        description: newDescription,
        bannerUrl: newBannerUrl,
        ticketType: newTicketType,
        price: newPrice,
        capacity: newCapacity,
        waitlistEnabled: newWaitlistEnabled,
        city: newCity,
        zone: newZoneSelection === "Custom" ? customZone : newZoneSelection,
        organizerId: user,
      };

      let res;
      if (isEditing) {
        res = await fetch(`/api/events/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        });
      } else {
        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        });
      }

      if (!res.ok) throw new Error("Failed to save event to database");
      
      toast.success(`Successfully ${isEditing ? 'updated' : 'launched'} event: ${newTitle}`);

      // Redirect back to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save event. Please check the logs.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || checkingHost || (!user && !loadingEvent)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 space-y-8 animate-fadeIn">
        
        <button
          type="button"
          onClick={() => goBack("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-neon-purple transition-all group w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-dark-card border border-dark-border p-8 rounded-2xl shadow-neon space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span className="text-3xl">📣</span>{" "}
              {isEditing ? "Edit Campus Event" : "Host New Campus Event"}
            </h1>
            <p className="text-sm text-gray-400">
              {isEditing
                ? "Modify the details of your hosted campus event below."
                : "Fill in the specifics below to add your event to the system and start accepting registrations."}
            </p>
          </div>

          <form onSubmit={handleHostNewEvent} className="space-y-6 font-mono">
            
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-gray-500">
                Event Title
              </label>
              <input
                required
                type="text"
                placeholder="e.g. AI Agents Hackathon 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Category Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-bold"
                >
                  <option value="Fest">Fest</option>
                  <option value="Party">Party</option>
                  <option value="Festive Night">Festive Night</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Meetup">Meetup</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="MUN">MUN (Model United Nations)</option>
                  <option value="Competition">Competition</option>
                  <option value="Seminar">Seminar</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Event Date and Time
                </label>
                <input
                  required
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  City <span className="text-neon-purple">(MVP Lock)</span>
                </label>
                <input
                  readOnly
                  type="text"
                  value={newCity}
                  className="w-full px-4 py-3 bg-zinc-900 border border-dark-border rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Zone / Region
                </label>
                <select
                  value={newZoneSelection}
                  onChange={(e) => setNewZoneSelection(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-bold"
                >
                  {(CITY_ZONES[newCity] || []).map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>
              </div>
            </div>

            {newZoneSelection === "Custom" && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Custom Zone
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bakshi Ka Talab"
                  value={customZone}
                  onChange={(e) => setCustomZone(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-gray-500">
                Full Address
              </label>
              <input
                required
                type="text"
                placeholder="e.g. IIIT Lucknow, Chak Ganjaria"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-gray-500">
                Google Maps URL <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="url"
                placeholder="e.g. https://maps.app.goo.gl/..."
                value={newGoogleMapsUrl}
                onChange={(e) => setNewGoogleMapsUrl(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase font-bold text-gray-500">
                Event Banner
              </label>
              
              <ImageCropper 
                currentImageUrl={newBannerUrl} 
                onCropCompleteCallback={(croppedBase64) => setNewBannerUrl(croppedBase64)} 
              />
              
              <div className="pt-2">
                <span className="block text-[10px] uppercase font-bold text-gray-600 mb-2">Or choose a preset URL:</span>
                <div className="flex flex-wrap gap-2">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setNewBannerUrl(preset.url)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${
                        newBannerUrl === preset.url
                          ? "bg-neon-purple/20 border-neon-purple text-neon-lavender font-bold"
                          : "bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Ticket Type
                </label>
                <select
                  value={newTicketType}
                  onChange={(e) => {
                    setNewTicketType(e.target.value);
                    if (e.target.value === "Free") setNewPrice(0);
                  }}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple font-bold"
                >
                  <option value="Free">Free Entry</option>
                  <option value="Paid">Paid Ticket</option>
                </select>
              </div>
              {newTicketType === "Paid" && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-xs uppercase font-bold text-gray-500">
                    Ticket Price (₹)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-500">
                  Total Capacity
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer h-[46px] hover:text-neon-purple transition-colors">
                  <input
                    type="checkbox"
                    checked={newWaitlistEnabled}
                    onChange={(e) => setNewWaitlistEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-dark-border bg-black text-neon-purple focus:ring-neon-purple accent-neon-purple cursor-pointer"
                  />
                  Enable Waitlist for Overflow
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-gray-500">
                Brief Description
              </label>
              <textarea
                required
                placeholder="Summarize the agenda, targets, and prizes..."
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple resize-none"
              />
            </div>

            <div className="pt-6 font-sans flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-4 bg-neon-purple hover:bg-neon-purple/90 text-white font-bold rounded-xl shadow-neon transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : isEditing ? "Save Event Changes" : "Publish & Host Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function HostEventPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
          <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <HostEventForm />
    </React.Suspense>
  );
}
