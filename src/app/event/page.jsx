"use client";

import { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import EventsExplorer from "@/components/explorer/EventsExplorer";
import { mockEvents } from "@/lib/mockData";
import { useUser } from "@/context/UserContext";

const TwinLayout = nextDynamic(() => import("@/components/layout/TwinLayout"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const RecommendedEvents = nextDynamic(() => import("@/components/event/RecommendedEvents"), {
  ssr: false,
});

export default function EventPage() {
  const { user } = useUser();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        // If DB has events, use them; fallback to mock only if empty
        setAllEvents(data.events.length > 0 ? data.events : mockEvents);
      }
    } catch (err) {
      console.error("Failed to load events", err);
      setAllEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear temporary onboarding flag on mount
    if (typeof window !== "undefined") {
      localStorage.removeItem("onboarding_just_completed");
    }

    setTimeout(() => {
      loadEvents();
    }, 0);
  }, []);

  // Force scroll the page back to top whenever a student selects an event
  useEffect(() => {
    if (selectedEventId && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [selectedEventId]);

  // Sync state with URL parameter on mount & handle browser back arrow navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      setSelectedEventId(id);

      if (!id) {
        setTimeout(() => {
          const explorerElement = document.getElementById("events-explorer-anchor");
          if (explorerElement) {
            explorerElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const initialId = params.get("id");
    if (initialId) {
      setTimeout(() => setSelectedEventId(initialId), 0);
    }

    const hash = window.location.hash;
    if (hash === "#command-center" && !initialId) {
      setTimeout(() => {
        const el = document.getElementById("command-center");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const handleSelectEvent = (id) => {
    setSelectedEventId(id);
    if (typeof window !== "undefined" && window.history.pushState) {
      window.history.pushState({ eventId: id }, "", `/event?id=${id}`);
    }
  };

  // Render detail view if an event ID is selected in URL
  if (selectedEventId) {
    const selectedEvent = allEvents.find(
      (e) => String(e.id || e._id) === String(selectedEventId)
    );

    if (selectedEvent) {
      const userEmail =
        user?.email || (typeof user === "string" ? user : "anonymous@student.com");
      const currentUserId = user?.id || null;

      // Normalized Anti-Scam Check: Validates IDs and organizer relationship chains
      const isOrganizerUser = !!(
        (selectedEvent.organizerId &&
          currentUserId &&
          String(selectedEvent.organizerId) === String(currentUserId)) ||
        (selectedEvent.organizer?.id &&
          currentUserId &&
          String(selectedEvent.organizer.id) === String(currentUserId)) ||
        (selectedEvent.organizer?.email &&
          userEmail &&
          String(selectedEvent.organizer.email).toLowerCase() ===
            String(userEmail).toLowerCase()) ||
        (selectedEvent.organizerId &&
          String(selectedEvent.organizerId).toLowerCase() ===
            String(userEmail).toLowerCase())
      );

      const eventData = {
        ...selectedEvent,
        isHost: isOrganizerUser,
        schedule:
          selectedEvent.schedule ||
          `
### Schedule Details
- **Day 1**: Orientation & Kickoff
- **Day 2**: Project Submissions & Coding Sprints
- **Day 3**: Judging panel evaluations & Ceremony
        `,
        prizePool:
          selectedEvent.prizePool ||
          `
### Prize Structure
- **🥇 Grand Prize Winner**: Custom Trophies & Compute Credits
- **🥈 Runner Up**: Custom swag packs & certificate of excellence
        `,
        bulletinUpdates: selectedEvent.bulletinUpdates || [],
        bannerUrl: selectedEvent.bannerUrl || "",
        organizerId: selectedEvent.organizerId || selectedEvent.organizer?.email,
      };

      const chatUserData = {
        name: user?.fullName || user?.name || "Student",
        email: userEmail,
        isHost: isOrganizerUser,
      };

      return (
        <div className="bg-[#000000] w-full min-h-screen text-white">
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-12 max-w-7xl mx-auto">
            <TwinLayout
              event={eventData}
              chatUserData={chatUserData}
              selectedEventId={selectedEventId}
              userId={currentUserId}
              onBack={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  setSelectedEventId(null);
                  window.history.pushState({}, "", "/event");
                }
              }}
            />
          </div>
        </div>
      );
    }

    // Show loading skeleton if still fetching events for the ID
    if (loading) {
      return (
        <div className="bg-[#000000] w-full min-h-screen text-white flex items-center justify-center p-8">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/50">Loading event details...</span>
          </div>
        </div>
      );
    }
  }

  // Render Explorer View
  return (
    <div className="bg-[#000000] w-full min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Events
          </h1>
          <p className="text-[12px] font-medium text-white/45 max-w-xl leading-relaxed">
            Discover workshops, hackathons, fests, competitions and campus events happening around you.
          </p>
        </div>

        <div id="events-explorer-anchor" className="pt-0" />

        <EventsExplorer
          events={allEvents}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectEvent={handleSelectEvent}
          recommendedSection={
            user && (
              <RecommendedEvents
                userEmail={typeof user === "string" ? user : user?.email}
                onSelectEvent={handleSelectEvent}
              />
            )
          }
        />
      </div>
    </div>
  );
}
