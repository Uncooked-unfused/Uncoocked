"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDistanceToNow, isPast } from "date-fns";
import { formatDate } from "@/lib/dateUtils";
import { 
  Users, 
  BarChart2, 
  Sparkles, 
  Ticket, 
  Calendar, 
  MapPin, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Share2 
} from "lucide-react";
import { toast } from "sonner";
import TicketModal from "@/components/event/TicketModal";

export default function RegistrationCard({ 
  event, 
  user, 
  userRegistration, 
  isRegistered, 
  isSoldOut, 
  isWaitlistOnly, 
  remainingCapacity, 
  ticketsSold, 
  onRegisterClick,
  onCancelClick 
}) {
  const [timeLeft, setTimeLeft] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const isCompleted = (event.status || "").toLowerCase() === "completed";

  const effectiveTurnout =
    event.customRegistrationCount !== null && event.customRegistrationCount !== undefined
      ? event.customRegistrationCount
      : (ticketsSold || event._count?.registrations || 0);

  const capacityRate = event.capacity
    ? `${Math.min(100, Math.round((effectiveTurnout / event.capacity) * 100))}%`
    : null;

  const handleShareEvent = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event summary link copied to clipboard!");
    }
  };

  useEffect(() => {
    // Countdown timer logic
    if (!event.date || isCompleted) return;
    
    const calculateTimeLeft = () => {
      const eventDate = new Date(event.date);
      if (isPast(eventDate)) {
        return "Event Started";
      }
      return formatDistanceToNow(eventDate, { addSuffix: true });
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute
    
    return () => clearInterval(timer);
  }, [event.date, isCompleted]);

  const handleDownloadTicket = () => {
    setShowTicketModal(true);
  };

  const handleAddToCalendar = () => {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.date.replace(/-|:|\.\d\d\d/g,"")}/${event.date.replace(/-|:|\.\d\d\d/g,"")}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location)}`;
    window.open(url, "_blank");
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col rounded-2xl bg-dark-card border border-dark-border p-6 shadow-neon relative overflow-hidden group space-y-5">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-60" />

        {/* Top Status Header */}
        <div className="flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Event Concluded</span>
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Official Recap
          </span>
        </div>

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 z-10">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Turnout</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {Number(effectiveTurnout).toLocaleString()}
            </div>
            <span className="text-[10px] text-white/40 font-mono mt-1">
              Registered Delegates
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Capacity</span>
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {capacityRate || "100%"}
            </div>
            <span className="text-[10px] text-white/40 font-mono mt-1">
              {event.capacity ? `${effectiveTurnout} / ${event.capacity} seats` : "Full Participation"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Category</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {event.category || event.type || "Event"}
            </div>
            <span className="text-[10px] text-white/40 font-mono mt-1">
              Campus Format
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Admission</span>
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">
              {event.ticketType === "Paid" ? `₹${event.price}` : "Free Pass"}
            </div>
            <span className="text-[10px] text-white/40 font-mono mt-1">
              {event.ticketType === "Paid" ? "Paid Entry" : "Open Access"}
            </span>
          </div>
        </div>

        {/* Summary Meta Details */}
        <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-white/6 space-y-2.5 z-10 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-white/40 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-white/30" /> Date Held
            </span>
            <span className="text-white font-semibold">{formatDate(event.date || event.dateISO)}</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-white/40 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-white/30" /> Location
            </span>
            <span className="text-white font-semibold truncate max-w-[150px]">{event.zone || event.location || "Campus"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/40 flex items-center gap-1.5">
              <Award className="w-3 h-3 text-white/30" /> Host
            </span>
            <span className="text-white font-semibold truncate max-w-[150px]">
              {event.customOrganizerName || event.organizer?.fullName || event.organizer?.name || "Campus Host"}
            </span>
          </div>
        </div>

        {/* User Registration Pass Status (if user was a confirmed attendee) */}
        {isRegistered && userRegistration?.status === "Confirmed" && (
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Attendee</span>
              </div>
              <button
                onClick={handleDownloadTicket}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
              >
                View Pass
              </button>
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              You attended this event with Ticket #{userRegistration.ticketId || "CONFIRMED"}.
            </p>
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={handleShareEvent}
          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 z-10 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Event Recap</span>
        </button>

        {userRegistration?.status === "Confirmed" && (
          <TicketModal
            open={showTicketModal}
            onClose={() => setShowTicketModal(false)}
            eventTitle={event.title}
            eventDate={event.date}
            eventLocation={event.location}
            attendeeName={userRegistration.name}
            ticketId={userRegistration.ticketId}
            ticketType={event.ticketType || "Free"}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl bg-dark-card border border-dark-border p-6 shadow-neon relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-[50px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
      
      {/* Timer */}
      {timeLeft && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-lavender text-[10px] font-mono font-bold self-start w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />
          {timeLeft === "Event Started" ? "Happening Now" : `Starts ${timeLeft}`}
        </div>
      )}

      {isRegistered ? (
        <div className="space-y-5 z-10">
          <div className={`p-4 border rounded-xl space-y-3 ${userRegistration.status === "Waitlisted" ? "bg-yellow-950/20 border-yellow-800/40" : "bg-emerald-950/20 border-emerald-800/40"}`}>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase ${userRegistration.status === "Waitlisted" ? "text-yellow-400" : "text-emerald-400"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${userRegistration.status === "Waitlisted" ? "bg-yellow-500" : "bg-emerald-500"}`} />
              {userRegistration.status === "Waitlisted" ? "On Waitlist" : "Ticket Confirmed"}
            </div>
            
            {userRegistration.status === "Confirmed" && userRegistration.ticketId && (
              <div className="bg-white p-3 rounded-lg flex items-center justify-center my-4 w-full">
                <QRCodeSVG value={userRegistration.ticketId} size={150} />
              </div>
            )}
            
            <div className="text-[11px] text-gray-300 font-mono space-y-1.5 leading-normal">
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Name:</span> <span>{userRegistration.name}</span></div>
              <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Email:</span> <span>{userRegistration.email}</span></div>
              {userRegistration.ticketId && (
                <div className="flex justify-between pt-1"><span className="text-gray-500">Ticket ID:</span> <span className="font-bold text-white">{userRegistration.ticketId}</span></div>
              )}
            </div>
          </div>

          {userRegistration.status === "Confirmed" && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleDownloadTicket} className="py-2.5 bg-zinc-900 border border-dark-border hover:border-gray-500 text-white text-[10px] font-bold rounded-lg transition-all text-center">
                View Ticket
              </button>
              <button onClick={handleAddToCalendar} className="py-2.5 bg-zinc-900 border border-dark-border hover:border-gray-500 text-white text-[10px] font-bold rounded-lg transition-all text-center">
                Add to Calendar
              </button>
            </div>
          )}

          <button onClick={() => onCancelClick(event.id)} className="w-full py-2.5 bg-neutral-900 border border-red-950/60 hover:bg-red-950/10 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all">
            {userRegistration.status === "Waitlisted" ? "Leave Waitlist" : "Cancel Booking"}
          </button>
        </div>
      ) : (
        <div className="space-y-6 z-10">
          <div className="pb-4 border-b border-dark-border">
            <h3 className="text-2xl font-black text-white">
              {event.ticketType === "Paid" ? `₹${event.price}` : "Free"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">General Admission</p>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
            {isWaitlistOnly ? "This event is currently sold out. Join the waitlist." : "Register your spot now before it's too late."}
          </p>

          {event.capacity && !isSoldOut && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Registration Limit</span>
                <span className="text-white font-bold">{remainingCapacity} seats left</span>
              </div>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-dark-border">
                <div className="h-full bg-gradient-to-r from-neon-purple to-neon-lavender shadow-neon rounded-full" style={{ width: `${(ticketsSold / event.capacity) * 100}%` }} />
              </div>
            </div>
          )}

          {!isSoldOut || isWaitlistOnly ? (
            user ? (
              <button onClick={onRegisterClick} className="w-full py-3.5 bg-neon-purple text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-neon-purple/90 transition-all shadow-neon hover:scale-[1.02] active:scale-[0.98]">
                {isWaitlistOnly ? "Join Waitlist" : "Register Now"}
              </button>
            ) : (
              <button onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/login';
              }} className="w-full py-3.5 bg-neutral-900 border border-dark-border text-gray-400 font-extrabold text-xs uppercase tracking-wider rounded-xl hover:text-white transition-all hover:border-gray-500">
                Sign in to Register
              </button>
            )
          ) : (
            <button disabled className="w-full py-3.5 bg-zinc-900 text-gray-500 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-dark-border cursor-not-allowed">
              🚫 Sold Out
            </button>
          )}
        </div>
      )}

      {userRegistration?.status === "Confirmed" && (
        <TicketModal
          open={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
          }}
          eventTitle={event.title}
          eventDate={event.date}
          eventLocation={event.location}
          attendeeName={userRegistration.name}
          ticketId={userRegistration.ticketId}
          ticketType={event.ticketType || "Free"}
        />
      )}
    </div>
  );
}
