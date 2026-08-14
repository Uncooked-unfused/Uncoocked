"use client";

import { use, useState, useEffect } from "react";
import { Users, Ticket, DollarSign, Activity, Download, FileSpreadsheet, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { exportToExcel, exportToCSV } from "@/lib/excelExport";

const StatCard = ({ title, value, icon: Icon, trend, prefix = "" }) => (
  <div className="bg-dark-card border border-dark-border p-5 rounded-2xl shadow-sm hover:border-neon-purple/30 transition-all">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
      <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
        <Icon className="w-4 h-4 text-neon-purple" />
      </div>
    </div>
    <div className="flex items-end gap-3">
      <div className="text-3xl font-black text-white">{prefix}{value}</div>
      {trend && (
        <div className="text-[10px] font-bold text-emerald-400 mb-1.5 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
          +{trend}%
        </div>
      )}
    </div>
  </div>
);

export default function OrganizerOverviewPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    views: 0,
    registrations: 0,
    revenue: 0,
    capacityUtil: 0,
    capacity: 0,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      try {
        const res = await fetch(`/api/organizer/${eventId}/overview`);
        const data = await res.json();
        if (data.success && isMounted) {
          setStats(data.stats);
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error("Failed to load organizer overview:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOverview();
    return () => { isMounted = false; };
  }, [eventId]);

  const handleExportSummary = (format = "excel") => {
    const columns = [
      { key: "metric", label: "Event Metric" },
      { key: "value", label: "Value" },
    ];
    const data = [
      { metric: "Event ID", value: eventId },
      { metric: "Total Views", value: stats.views },
      { metric: "Total Registrations", value: stats.registrations },
      { metric: "Total Revenue (INR)", value: `₹${stats.revenue}` },
      { metric: "Max Capacity", value: stats.capacity || "Unlimited" },
      { metric: "Capacity Utilization", value: `${stats.capacityUtil}%` },
      { metric: "Report Generated At", value: new Date().toLocaleString() },
    ];

    if (format === "excel") {
      exportToExcel({
        filename: `event_${eventId}_summary`,
        sheetName: "Summary",
        columns,
        data,
      });
    } else {
      exportToCSV({
        filename: `event_${eventId}_summary`,
        columns,
        data,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-dark-card border border-dark-border rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-dark-card border border-dark-border rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const remainingTickets = stats.capacity > 0 ? Math.max(0, stats.capacity - stats.registrations) : "Unlimited";

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Event Overview</h1>
          <p className="text-xs text-gray-400 mt-1">Real-time metrics, telemetry, and recent attendee activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportSummary("excel")}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export to Excel
          </button>
          <button
            onClick={() => handleExportSummary("csv")}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-dark-border hover:border-gray-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Views" value={stats.views} icon={Activity} trend="12" />
        <StatCard title="Registrations" value={stats.registrations} icon={Users} trend="5" />
        <StatCard title="Revenue" value={stats.revenue} icon={DollarSign} prefix="₹" trend="8" />
        <StatCard title="Capacity" value={`${stats.capacityUtil}%`} icon={Ticket} />
      </div>

      {/* Main Workspace Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h2>
            <Link 
              href={`/dashboard/organizer/${eventId}/attendees`} 
              className="text-[11px] font-bold text-neon-purple hover:text-neon-lavender flex items-center gap-1 transition"
            >
              <span>View All Attendees</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-sm">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No recent activity recorded yet.
              </div>
            ) : (
              activities.map((act, i) => (
                <div key={act.id || i} className={`p-4 flex items-center justify-between ${i !== activities.length - 1 ? 'border-b border-dark-border' : ''} hover:bg-white/[0.02] transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${act.type === 'REGISTER' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-blue-950/40 text-blue-400 border border-blue-800/30'}`}>
                      {act.type === 'REGISTER' ? <Users className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs text-white">
                        <span className="font-bold">{act.user}</span> {act.type === 'REGISTER' ? 'registered for a ticket' : 'viewed the event page'}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{act.time}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 border border-dark-border text-gray-400">
                    {act.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Milestones & Quick Health */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Milestones & Health</h2>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-5">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-purple shadow-[0_0_10px_rgba(191,64,255,0.8)]" />
                <div className="w-px h-10 bg-dark-border my-1" />
              </div>
              <div className="-mt-1">
                <h4 className="text-xs font-bold text-white">Event Created</h4>
                <p className="text-[10px] text-emerald-400 font-medium">Published & Active</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${stats.registrations > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-dark-border'}`} />
                <div className="w-px h-10 bg-dark-border my-1" />
              </div>
              <div className="-mt-1">
                <h4 className="text-xs font-bold text-white">Ticket Registrations</h4>
                <p className="text-[10px] text-gray-400">
                  {stats.registrations} registered • {remainingTickets} tickets left
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${stats.capacityUtil >= 90 ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-dark-border'}`} />
              </div>
              <div className="-mt-1">
                <h4 className="text-xs font-bold text-white">Capacity Target</h4>
                <p className="text-[10px] text-gray-400">
                  {stats.capacityUtil}% capacity utilized
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
