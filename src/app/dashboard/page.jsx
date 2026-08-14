"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import TicketModal from "@/components/event/TicketModal";
import { toast } from "sonner";
import { mergeWithMockEvents } from "@/lib/mockData";
import {
  Calendar,
  MapPin,
  Briefcase,
  XCircle,
  Activity,
  Users,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  History,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Image from "next/image";

// getInitialHostedEvents is obsolete, handled by seed or empty start

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
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { data: session } = useSession();
  const [registrations, setRegistrations] = useState([]);
  const [hostedEvents, setHostedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostInfo, setHostInfo] = useState(null);

  // Modal State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedEventForTicket, setSelectedEventForTicket] = useState(null);

  // Guest List Expansion State
  const [expandedGuestLists, setExpandedGuestLists] = useState({});
  // Announcement Input States
  const [announcementTitles, setAnnouncementTitles] = useState({});
  const [announcementContents, setAnnouncementContents] = useState({});
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("attended");

  const loadDashboardData = async () => {
    if (typeof window !== "undefined" && user) {
      try {
        setLoading(true);
        // 1. Fetch Events from Backend
        const res = await fetch("/api/events?includeArchived=true");
        const data = await res.json();

        const fetchedEvents = Array.isArray(data?.events) ? data.events : [];

        // Merge DB events with the mock fallback (deduped by id), then format.
        const combinedEvents = mergeWithMockEvents(fetchedEvents).map((ev) => {
          const d = ev.dateISO ? new Date(ev.dateISO) : new Date(ev.date);
          const valid = !isNaN(d.getTime());
          return {
            ...ev,
            dateStr: ev.date, // keep original date string
            date: valid
              ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : ev.date,
            ts: valid ? d.getTime() : 0,
          };
        });
        setAllEvents(combinedEvents);

        // Filter Hosted Events
        const hosted = combinedEvents.filter((ev) => ev.organizer?.email === user || ev.organizerId === user);
        setHostedEvents(hosted);

        // 2. Fetch user's registrations from API
        const resReg = await fetch(`/api/registrations?email=${user}`);
        const regData = await resReg.json();
        if (regData.success) {
          setRegistrations(regData.registrations.map(r => ({
            ...r,
            email: r.user.email,
            name: r.user.name,
            ts: new Date(r.registeredAt).getTime()
          })));
        }

        // 3. Fetch user's host verification status
        const hostRes = await fetch("/api/host/status");
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          const isVerified =
            hostData.userRole === "SUPER_ADMIN" ||
            (hostData.userRole === "ORGANIZER" && hostData.application?.status === "APPROVED");
          setHostInfo({
            isVerified,
            hasApplication: hostData.hasApplication,
            status: hostData.application?.status || null,
            application: hostData.application,
            userRole: hostData.userRole,
          });
        }

      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      setTimeout(() => loadDashboardData(), 0);
      const handleStorageChange = () => {
        setTimeout(() => loadDashboardData(), 0);
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, [user]);

  const handleCancelRegistration = async (eventId) => {
    if (typeof window !== "undefined" && user) {
      try {
        const regToCancel = registrations.find(r => r.email === user && r.eventId === eventId);
        if (!regToCancel) return;
        const res = await fetch(`/api/registrations/${regToCancel.id}`, { method: "DELETE" });
        if (res.ok) {
          await loadDashboardData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenHostModal = async () => {
    try {
      const res = await fetch("/api/host/status");
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login?callbackUrl=/dashboard/organizer/new");
        return;
      }
      const isVerified =
        data.userRole === "SUPER_ADMIN" ||
        (data.userRole === "ORGANIZER" && data.application?.status === "APPROVED");

      if (isVerified) {
        router.push("/dashboard/organizer/new");
      } else {
        toast.info("Host verification is required to publish events.");
        router.push("/host/status");
      }
    } catch {
      router.push("/host/status");
    }
  };

  const handleCompleteEvent = async (eventId) => {
    if (typeof window !== "undefined" && user) {
      if (!confirm("Mark this event as successfully completed? It will be moved to your history.")) return;
      try {
        const res = await fetch(`/api/events/${eventId}/complete`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to complete event");
        await loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditHostedEventClick = (e, hev) => {
    e.stopPropagation();
    router.push(`/dashboard/organizer/new?edit=${hev.id}`);
  };

  const handleCancelHostedEvent = async (eventId) => {
    if (typeof window !== "undefined" && user) {
      if (
        !confirm(
          "Are you sure you want to cancel and delete this hosted event? All student bookings will be removed.",
        )
      )
        return;
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete event from database");



        await loadDashboardData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete event. Please check the logs.");
      }
    }
  };

  const handleAddAnnouncement = async (eventId) => {
    const title = announcementTitles[eventId]?.trim();
    const content = announcementContents[eventId]?.trim();
    if (!title || !content) return;

    try {
      const res = await fetch(`/api/events/${eventId}/bulletins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) throw new Error("Failed to add announcement");

      // Reset inputs
      setAnnouncementTitles((prev) => ({ ...prev, [eventId]: "" }));
      setAnnouncementContents((prev) => ({ ...prev, [eventId]: "" }));

      await loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post announcement. Please check logs.");
    }
  };

  // Check if logged in
  if (isLoading) {
    return (
      <div className="min-h-[80vh] bg-black flex items-center justify-center py-12 px-4">
        <div className="w-7 h-7 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-black w-full min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <span className="text-4xl shrink-0">🔐</span>
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-semibold text-white">
                You need to sign in
              </h2>
              <p className="text-[13px] text-white/45 leading-relaxed">
                Sign in to your campus account to view your registered and
                hosted events.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-5 py-2.5 bg-[#A855F7] text-white text-[13px] font-semibold rounded-lg hover:bg-[#C084FC] transition-colors duration-150"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter campus events the user is attending (registered for)
  const attendingEvents = allEvents.filter((ev) =>
    registrations.some((reg) => reg.eventId === ev.id),
  );

  const getGuestList = (eventId) => {
    // Note: getGuestList logic moved to API. But to keep the synchronous render working,
    // we should ideally fetch guest lists for hosted events and store them.
    // For now, it will be empty in this view until they open the organizer console.
    // Let's rely on registrations state if it had all registrations. But registrations state only has user's regs.
    // Better to fetch guest lists for all hosted events if we want them here, or redirect to organizer dashboard.
    // We will just return [] here and let them use the Organizer Console for accurate lists.
    return [];
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Checked In":
        return "bg-emerald-500/8 text-emerald-400 border border-emerald-500/20";
      case "Confirmed":
        return "bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20";
      case "Pending":
      default:
        return "bg-amber-500/8 text-amber-400 border border-amber-500/20";
    }
  };

  const username = session?.user?.name || (user ? user.split("@")[0] : "Guest");

  const now = new Date().getTime();
  
  const activeAttendingEvents = attendingEvents.filter(ev => ev.status !== "Completed");
  const historyAttendingEvents = attendingEvents.filter(ev => ev.status === "Completed");
  
  const activeHostedEvents = hostedEvents.filter(ev => ev.status !== "Completed");
  const historyHostedEvents = hostedEvents.filter(ev => ev.status === "Completed");

  const upcomingEvents = activeAttendingEvents.filter(ev => ev.ts > now + 86400000); // More than 24 hours in future
  const ongoingEvents = activeAttendingEvents.filter(ev => Math.abs(ev.ts - now) <= 86400000); // Within 24 hours
  const pastActiveEvents = activeAttendingEvents.filter(ev => ev.ts < now - 86400000); // More than 24 hours in past

  const renderEventGroup = (groupTitle, events, emptyMessage) => {
    if (events.length === 0) return null;
    return (
      <div className="space-y-3 mb-8">
        <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">{groupTitle} ({events.length})</h3>
        <div className="space-y-3">
          {events.map((ev) => {
            const regDetails = registrations.find((r) => r.eventId === ev.id);
            return (
              <div
                key={ev.id}
                className="bg-[#111111] border border-white/8 hover:border-white/16 rounded-xl p-4 shadow-sm transition-all duration-150 flex flex-col justify-between min-h-[160px] group cursor-pointer hover:-translate-y-px hover:shadow-md"
                onClick={() => router.push(`/event?id=${ev.id}`)}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20 rounded-full">
                      {ev.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(regDetails?.status)}`}
                    >
                      {regDetails?.status || "Confirmed"}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-white leading-snug group-hover:text-white/70 transition-colors duration-150">
                    {ev.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-[11px] text-white/35 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-white/25 shrink-0" />
                      <span>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-white/25 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-white/25 shrink-0" />
                      <span className="truncate">Organizer: {ev.organizer?.name || ev.organizer?.email?.split('@')?.[0] || ev.organizerId || "Campus Host"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2.5 pt-3 border-t border-white/6 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href="/opportunities"
                    className="flex-1 py-2 bg-[#1a1a1a] border border-white/8 hover:border-white/16 text-white/50 hover:text-white/80 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150"
                  >
                    <Briefcase className="h-3.5 w-3.5 hidden sm:block" />
                    <span>
                      Opportunit
                      <span className="hidden sm:inline">ies</span>
                    </span>
                  </Link>

                  {(regDetails?.status === "Confirmed" ||
                    regDetails?.status === "Checked In") &&
                    regDetails?.id && (
                      <button
                        onClick={() => {
                          setSelectedTicket(regDetails);
                          setSelectedEventForTicket(ev);
                          setTicketModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-[#A855F7] text-white hover:bg-[#C084FC] text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors duration-150"
                      >
                        <span>View Ticket</span>
                      </button>
                    )}

                  <button
                    onClick={() => handleCancelRegistration(ev.id)}
                    className="px-3 py-2 border border-red-500/15 bg-red-500/8 hover:bg-red-500/15 text-red-400 hover:text-red-300 text-[11px] font-semibold rounded-lg flex items-center justify-center transition-all duration-150"
                    title={
                      regDetails?.status === "Waitlisted"
                        ? "Leave Waitlist"
                        : "Cancel"
                    }
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-black w-full min-h-[85vh] py-8 sm:py-12">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Block */}
        <DashboardHeader 
          username={username}
          attendingCount={attendingEvents.length}
          hostedCount={hostedEvents.length}
          loading={loading}
        />

        {/* Side-by-Side Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* LEFT COLUMN: ATTENDING EVENTS */}
          <div className="space-y-4">
            <div className="bg-[#111111] border border-white/8 rounded-xl p-4">
              <h2 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                🎫 Events You Are Attending
              </h2>
              <p className="text-[12px] text-white/40">
                Official bookings and timelines for your registered fests,
                parties, and workshops.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="bg-[#111111] border border-white/6 rounded-xl p-6 animate-pulse h-36"
                  />
                ))}
              </div>
            ) : attendingEvents.length === 0 ? (
              <div className="bg-[#111111]/40 border border-white/6 border-dashed rounded-xl p-10 text-center space-y-4">
                <span className="text-3xl block">🎟️</span>
                <p className="text-[13px] text-white/40 leading-normal">
                  You aren&apos;t registered for any campus events yet.
                </p>
                <Link
                  href="/event"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A855F7] text-white text-[12px] font-semibold rounded-lg hover:bg-[#C084FC] transition-colors duration-150"
                >
                  Browse Event Matrix <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div>
                {renderEventGroup("Ongoing Events", ongoingEvents, "")}
                {renderEventGroup("Upcoming Events", upcomingEvents, "")}
                {renderEventGroup("Past Events", pastActiveEvents, "")}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: HOSTED EVENTS */}
          <div className="space-y-4">
            <div className="bg-[#111111] border border-white/8 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  📢 Events You Are Hosting
                </h2>
                <p className="text-[12px] text-white/40">
                  Manage guest lists, edit descriptions, and publish event
                  announcements.
                </p>
              </div>
              <button
                onClick={handleOpenHostModal}
                className="px-3 py-2 bg-[#A855F7] hover:bg-[#C084FC] text-white rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-semibold shrink-0 transition-colors duration-150"
                title="Host New Event"
              >
                <Plus className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">Host Event</span>
              </button>
            </div>

            {/* Host Verification Status Banner */}
            {hostInfo && !hostInfo.isVerified && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-amber-400">Host Verification Required</span>
                    {hostInfo.hasApplication && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {hostInfo.status?.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50">
                    {hostInfo.hasApplication
                      ? "Your host verification application is currently active. View details or check required updates."
                      : "You need to be a verified host to publish and manage campus events."}
                  </p>
                </div>
                <button
                  onClick={() => router.push(hostInfo.hasApplication ? "/host/status" : "/host/apply")}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold rounded-lg shrink-0 transition"
                >
                  {hostInfo.hasApplication ? "View Status" : "Apply to Host"}
                </button>
              </div>
            )}

            {activeHostedEvents.length === 0 ? (
              <div className="bg-[#111111]/40 border border-white/6 border-dashed rounded-xl p-10 text-center space-y-4">
                <span className="text-3xl block">📣</span>
                <p className="text-[13px] text-white/40 leading-normal">
                  You aren&apos;t hosting any active events yet.
                </p>
                <button
                  onClick={handleOpenHostModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A855F7] text-white text-[12px] font-semibold rounded-lg hover:bg-[#C084FC] transition-colors duration-150"
                >
                  {hostInfo && !hostInfo.isVerified ? "Complete Host Verification" : "Create First Event"}{" "}
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {activeHostedEvents.map((hev) => {
                  const guestList = getGuestList(hev.id);
                  const isGuestListExpanded = !!expandedGuestLists[hev.id];
                  const isAnnounceExpanded = !!expandedAnnouncements[hev.id];

                  return (
                    <div
                      key={hev.id}
                      className="bg-[#111111] border border-white/8 hover:border-white/16 rounded-xl overflow-hidden shadow-sm transition-all duration-150 cursor-pointer hover:-translate-y-px hover:shadow-md flex flex-col group"
                      onClick={() => router.push(`/dashboard/organizer/${hev.id}`)}
                    >
                      {/* Event Card Banner Preview */}
                      <div className="relative h-28 w-full overflow-hidden bg-[#0A0A0A]">
                        {hev.bannerUrl ? (
                          <Image
                            src={hev.bannerUrl}
                            alt={hev.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[10px] text-white/30">
                            CAMPUS EVENT PREVIEW
                          </div>
                        )}
                        {/* Category Tag overlaid on the banner */}
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-semibold px-2.5 py-1 bg-black/70 border border-white/10 text-white/70 rounded-full">
                            {hev.type}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-4">
                        {/* Event Header details */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-semibold text-white group-hover:text-white/70 transition-colors duration-150 pt-0.5">
                              {hev.title}
                            </h3>
                          </div>
                          <div
                            className="flex items-center gap-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteEvent(hev.id); }}
                              className="text-white/25 hover:text-emerald-400 p-1.5 hover:bg-emerald-500/8 rounded-lg transition-all duration-150"
                              title="Mark Completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) =>
                                handleEditHostedEventClick(e, hev)
                              }
                              className="text-white/25 hover:text-white/70 p-1.5 hover:bg-white/5 rounded-lg transition-all duration-150"
                              title="Edit Event"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleCancelHostedEvent(hev.id)}
                              className="text-white/25 hover:text-red-400 p-1.5 hover:bg-red-500/8 rounded-lg transition-all duration-150"
                              title="Cancel Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/35 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-white/25 shrink-0" />
                            <span>{hev.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-white/25 shrink-0" />
                            <span className="truncate">{hev.location}</span>
                          </div>
                        </div>

                        {/* Row of Action Toggles */}
                        <div
                          className="flex items-center gap-2 pt-3 border-t border-white/6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setExpandedAnnouncements((prev) => ({
                                ...prev,
                                [hev.id]: !prev[hev.id],
                              }))
                            }
                            className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                              isAnnounceExpanded
                                ? "bg-[#A855F7]/10 border-[#A855F7]/30 text-[#C084FC]"
                                : "bg-[#1a1a1a] border-white/8 text-white/40 hover:text-white/70 hover:border-white/16"
                            }`}
                          >
                            <Megaphone className="h-3.5 w-3.5" />
                            <span>Announce</span>
                            {isAnnounceExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>


                        {/* Expandable Announcements / Bulletins Area */}
                        {isAnnounceExpanded && (
                          <div
                            className="bg-[#0A0A0A] rounded-xl p-4 border border-white/6 animate-fadeIn space-y-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h4 className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5">
                              📢 Post Event Bulletin Update
                            </h4>

                            {/* Create Form */}
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Announcement Title"
                                value={announcementTitles[hev.id] || ""}
                                onChange={(e) =>
                                  setAnnouncementTitles((prev) => ({
                                    ...prev,
                                    [hev.id]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-[#111111] border border-white/8 rounded-lg text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/25 focus:border-[#A855F7]/40 transition-all duration-150"
                              />

                              <textarea
                                placeholder="Announcement details..."
                                rows={2}
                                value={announcementContents[hev.id] || ""}
                                onChange={(e) =>
                                  setAnnouncementContents((prev) => ({
                                    ...prev,
                                    [hev.id]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-[#111111] border border-white/8 rounded-lg text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/25 focus:border-[#A855F7]/40 transition-all duration-150 resize-none"
                              />

                              <button
                                onClick={() => handleAddAnnouncement(hev.id)}
                                className="w-full py-2 bg-[#A855F7] hover:bg-[#C084FC] text-white text-[11px] font-semibold rounded-lg transition-colors duration-150"
                              >
                                Publish Bulletin announcement
                              </button>
                            </div>

                            {/* Existing Updates List */}
                            <div className="space-y-2 pt-3 border-t border-white/6">
                              <span className="text-[10px] uppercase font-semibold text-white/30 block tracking-wider">
                                Announcement History
                              </span>
                              {!hev.bulletinUpdates ||
                              hev.bulletinUpdates.length === 0 ? (
                                <p className="text-[11px] text-white/30 italic">
                                  No announcements published yet.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                                  {hev.bulletinUpdates.map((up) => (
                                    <div
                                      key={up.id}
                                      className="bg-[#111111] border border-white/6 p-3 rounded-lg text-[11px]"
                                    >
                                      <div className="flex justify-between items-center text-[10px] text-[#C084FC] font-medium mb-1">
                                        <span>{up.title}</span>
                                        <span className="text-white/30">{up.date}</span>
                                      </div>
                                      <p className="text-white/45 leading-relaxed">
                                        {up.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* View History Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#111111] border border-white/8 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white/80 hover:border-white/20 transition-all duration-150 hover:-translate-y-px"
          >
            <History className="h-4 w-4" />
            View Event History
          </button>
        </div>
      </div>

      {selectedTicket && selectedEventForTicket && (
        <TicketModal
          open={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          eventTitle={selectedEventForTicket.title}
          eventDate={selectedEventForTicket.date}
          eventLocation={selectedEventForTicket.location}
          attendeeName={selectedTicket.name}
          ticketId={selectedTicket.ticketId || "TKT-000000"}
          ticketType={selectedEventForTicket.ticketType || "Free"}
        />
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 w-full max-w-2xl rounded-2xl p-6 shadow-xl relative my-8 animate-slideUp">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors duration-150 p-1"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <h2 className="text-[18px] font-bold text-white mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-white/40" />
              Event History
            </h2>

            <div className="flex border-b border-white/8 mb-5">
              <button
                onClick={() => setHistoryTab("attended")}
                className={`pb-3 px-4 text-[12px] font-semibold border-b-2 transition-colors duration-150 ${
                  historyTab === "attended"
                    ? "border-[#A855F7] text-white"
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
              >
                Attended ({historyAttendingEvents.length})
              </button>
              <button
                onClick={() => setHistoryTab("hosted")}
                className={`pb-3 px-4 text-[12px] font-semibold border-b-2 transition-colors duration-150 ${
                  historyTab === "hosted"
                    ? "border-[#A855F7] text-white"
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
              >
                Hosted ({historyHostedEvents.length})
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {historyTab === "attended" && (
                historyAttendingEvents.length === 0 ? (
                  <p className="text-[13px] text-white/30 italic text-center py-8">No attended events in history yet.</p>
                ) : (
                  historyAttendingEvents.map(ev => (
                    <div key={ev.id} className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/12 transition-colors duration-150">
                      <div>
                        <h4 className="text-[14px] font-semibold text-white">{ev.title}</h4>
                        <div className="text-[11px] text-white/35 flex items-center gap-2 mt-1">
                          <span>{ev.date}</span>
                          <span>·</span>
                          <span>{ev.location}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-white/5 text-white/35 border border-white/8 rounded-full text-[10px] font-semibold self-start sm:self-auto">Completed</span>
                    </div>
                  ))
                )
              )}

              {historyTab === "hosted" && (
                historyHostedEvents.length === 0 ? (
                  <p className="text-[13px] text-white/30 italic text-center py-8">No hosted events in history yet.</p>
                ) : (
                  historyHostedEvents.map(ev => (
                    <div key={ev.id} className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/12 transition-colors duration-150">
                      <div>
                        <h4 className="text-[14px] font-semibold text-white">{ev.title}</h4>
                        <div className="text-[11px] text-white/35 flex items-center gap-2 mt-1">
                          <span>{ev.date}</span>
                          <span>·</span>
                          <span>{ev.type}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/8 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold self-start sm:self-auto flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" /> Successfully Hosted
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
