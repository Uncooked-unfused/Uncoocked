"use client";

import { useState, useEffect, use } from "react";
import { Search, Download, Filter, CheckCircle2, XCircle, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { exportAttendeesData } from "@/lib/excelExport";
import { toast } from "sonner";

export default function AttendeesPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const { user } = useUser();
  
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAttendees = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/registrations?eventId=${eventId}${user ? `&requesterEmail=${encodeURIComponent(user)}` : ""}`);
      const data = await res.json();
      if (data.success) {
        const formatted = (data.registrations || []).map(r => ({
          id: r.id,
          name: r.user?.name || r.user?.email?.split('@')?.[0] || "Attendee",
          email: r.user?.email || "-",
          date: r.registeredAt ? new Date(r.registeredAt).toISOString().split('T')[0] : "-",
          ticketType: r.ticketTier?.name || "General Admission",
          paymentStatus: r.coupon ? "Discounted" : "Paid",
          coupon: r.coupon?.code || "-",
          teamName: r.teamName || "-",
          track: r.track || "-",
          status: r.status || "Confirmed",
          checkedIn: Boolean(r.checkInStatus)
        }));
        setAttendees(formatted);
        if (isManualRefresh) toast.success("Attendee list refreshed");
      } else {
        toast.error(data.error || "Failed to load attendees");
      }
    } catch (err) {
      console.error("Failed to load attendees:", err);
      toast.error("Error fetching attendee records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, [eventId, user]);

  const filteredAttendees = attendees.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      a.name.toLowerCase().includes(term) || 
      a.email.toLowerCase().includes(term) ||
      a.teamName.toLowerCase().includes(term) ||
      a.ticketType.toLowerCase().includes(term) ||
      a.coupon.toLowerCase().includes(term);
    
    const matchesStatus = 
      statusFilter === "All" || 
      a.status === statusFilter || 
      (statusFilter === "Checked In" && a.checkedIn);
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = (format = "excel") => {
    if (filteredAttendees.length === 0) {
      toast.error("No attendees to export with current filters");
      return;
    }
    exportAttendeesData(filteredAttendees, eventId, "event", format);
    toast.success(`Exported ${filteredAttendees.length} attendees to ${format === "excel" ? "Excel (.xls)" : "CSV"}`);
  };

  const handleCheckIn = async (id) => {
    try {
      const res = await fetch(`/api/registrations/${id}/checkin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkedIn: true })
      });
      if (res.ok) {
        setAttendees(prev => prev.map(a => a.id === id ? { ...a, checkedIn: true } : a));
        toast.success("Attendee checked in successfully");
      } else {
        toast.error("Failed to check in attendee");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with check-in service");
    }
  };

  const handleCancelRegistration = async (id) => {
    if (!confirm("Are you sure you want to cancel this registration?")) return;
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAttendees(prev => prev.filter(a => a.id !== id));
        toast.success("Registration cancelled");
      } else {
        toast.error("Failed to cancel registration");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cancelling registration");
    }
  };

  const getStatusBadge = (status, checkedIn) => {
    if (checkedIn) {
      return (
        <span className="px-2.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Checked In
        </span>
      );
    }
    switch(status) {
      case "Confirmed":
        return <span className="px-2.5 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-800/40 rounded-full text-[10px] font-bold uppercase">Confirmed</span>;
      case "Pending":
        return <span className="px-2.5 py-0.5 bg-yellow-950/40 text-yellow-400 border border-yellow-800/40 rounded-full text-[10px] font-bold uppercase">Pending</span>;
      case "Waitlisted":
        return <span className="px-2.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-800/40 rounded-full text-[10px] font-bold uppercase">Waitlisted</span>;
      case "Cancelled":
        return <span className="px-2.5 py-0.5 bg-red-950/40 text-red-400 border border-red-800/40 rounded-full text-[10px] font-bold uppercase">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-zinc-800 text-gray-300 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  const totalCount = attendees.length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const confirmedCount = attendees.filter(a => a.status === "Confirmed").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Attendee Management</h1>
          <p className="text-xs text-gray-400 mt-1">Manage registrations, check-ins, ticket tiers, and export records.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => fetchAttendees(true)}
            disabled={refreshing}
            className="p-2 bg-zinc-900 border border-dark-border hover:border-gray-500 text-gray-400 hover:text-white rounded-lg transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-neon-purple" : ""}`} />
          </button>
          <button 
            onClick={() => handleExport("excel")} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export to Excel (.xls)
          </button>
          <button 
            onClick={() => handleExport("csv")} 
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-dark-border hover:border-gray-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Quick Filter Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-card border border-dark-border p-3.5 rounded-xl">
          <div className="text-[10px] font-mono text-gray-400 uppercase">Total Registrations</div>
          <div className="text-xl font-black text-white mt-0.5">{totalCount}</div>
        </div>
        <div className="bg-dark-card border border-dark-border p-3.5 rounded-xl">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">Checked In</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{checkedInCount}</div>
        </div>
        <div className="bg-dark-card border border-dark-border p-3.5 rounded-xl">
          <div className="text-[10px] font-mono text-blue-400 uppercase">Confirmed</div>
          <div className="text-xl font-black text-blue-400 mt-0.5">{confirmedCount}</div>
        </div>
        <div className="bg-dark-card border border-dark-border p-3.5 rounded-xl">
          <div className="text-[10px] font-mono text-purple-400 uppercase">Attendance Rate</div>
          <div className="text-xl font-black text-purple-400 mt-0.5">
            {totalCount > 0 ? `${Math.round((checkedInCount / totalCount) * 100)}%` : "0%"}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-dark-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search name, email, team, tier, coupon..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black border border-dark-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-purple font-mono"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-black border border-dark-border rounded-lg text-xs text-white focus:outline-none focus:border-neon-purple cursor-pointer"
              >
                <option value="All">All Statuses ({totalCount})</option>
                <option value="Checked In">Checked In ({checkedInCount})</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <span className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
              Showing {filteredAttendees.length} of {totalCount}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-400">
            <thead className="bg-black/50 border-b border-dark-border text-gray-300 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Attendee</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Ticket Tier</th>
                <th className="px-6 py-4">Team & Track</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 animate-pulse font-mono text-xs">
                    Loading attendee database...
                  </td>
                </tr>
              ) : filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-xs">
                    {searchTerm || statusFilter !== "All" 
                      ? "No attendees match your filter criteria." 
                      : "No attendees registered for this event yet."}
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{attendee.name}</div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">{attendee.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">{attendee.date}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{attendee.ticketType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] text-gray-300">
                        {attendee.teamName !== "-" ? `Team: ${attendee.teamName}` : "Individual"}
                      </div>
                      {attendee.track !== "-" && (
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">Track: {attendee.track}</div>
                      )}
                      {attendee.coupon !== "-" && (
                        <div className="text-[10px] text-neon-purple font-mono mt-0.5">🏷️ {attendee.coupon}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={attendee.paymentStatus === 'Paid' ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>
                        {attendee.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(attendee.status, attendee.checkedIn)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!attendee.checkedIn && attendee.status !== "Cancelled" && (
                        <button 
                          onClick={() => handleCheckIn(attendee.id)} 
                          title="Check In Attendee" 
                          className="p-1.5 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 rounded-lg border border-emerald-800/40 transition-colors inline-block cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleCancelRegistration(attendee.id)} 
                        title="Cancel Registration" 
                        className="p-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/60 rounded-lg border border-red-800/40 transition-colors inline-block cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
