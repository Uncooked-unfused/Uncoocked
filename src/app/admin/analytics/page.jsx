"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw,
  Activity,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || "Failed to load operational analytics");
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      toast.error("Network error loading analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportAnalyticsCSV = () => {
    if (!data) return;
    const { users, applications, events } = data;
    const rows = [
      ["Category", "Metric Name", "Value"],
      ["Users", "Total Users", users.totalUsers],
      ["Users", "Organizers", users.organizers],
      ["Users", "Standard Users", users.standardUsers],
      ["Users", "Super Admins", users.superAdmins],
      ["Users", "Suspended Users", users.suspendedUsers],
      ["Host Verification", "Total Applications", applications.totalApplications],
      ["Host Verification", "Pending Applications", applications.pendingApps],
      ["Host Verification", "Under Review Applications", applications.underReviewApps],
      ["Host Verification", "Needs Info Applications", applications.needsInfoApps],
      ["Host Verification", "Approved Applications", applications.approvedApps],
      ["Host Verification", "Rejected Applications", applications.rejectedApps],
      ["Host Verification", "Approval Rate (%)", `${applications.approvalRate}%`],
      ["Host Verification", "Rejection Rate (%)", `${applications.rejectionRate}%`],
      ["Events", "Total Events", events.totalEvents],
      ["Events", "Active Events", events.activeEvents],
      ["Events", "Upcoming Events", events.upcomingEvents],
      ["Events", "Completed Events", events.completedEvents],
      ["Events", "Archived Events", events.archivedEvents],
      ["Events", "Suspended Events", events.suspendedEvents],
      ["Events", "Total Registrations", events.totalRegistrations],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics CSV exported!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Aggregating platform telemetry and operational statistics...</p>
        </div>
      </div>
    );
  }

  const { users, applications, events, system } = data || {};

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" /> Operational Intelligence
          </div>
          <h1 className="text-3xl font-black">System Telemetry & Analytics</h1>
          <p className="text-xs text-gray-400 mt-1">Platform performance, host verification efficiency, user growth, and event metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg border border-neutral-800 transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
          <button
            onClick={exportAnalyticsCSV}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" /> Export Analytics CSV
          </button>
        </div>
      </div>

      {/* User Distribution Cards */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" /> User Ecosystem Distribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Total Users</span>
            <p className="text-2xl font-black text-white">{users.totalUsers}</p>
          </div>
          <div className="bg-neutral-900 border border-emerald-500/20 p-5 rounded-xl space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Verified Organizers</span>
            <p className="text-2xl font-black text-emerald-400">{users.organizers}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Standard Users</span>
            <p className="text-2xl font-black text-gray-200">{users.standardUsers}</p>
          </div>
          <div className="bg-neutral-900 border border-purple-500/20 p-5 rounded-xl space-y-1">
            <span className="text-[10px] text-purple-400 uppercase font-bold">Super Admins</span>
            <p className="text-2xl font-black text-purple-400">{users.superAdmins}</p>
          </div>
          <div className="bg-neutral-900 border border-rose-500/20 p-5 rounded-xl space-y-1">
            <span className="text-[10px] text-rose-400 uppercase font-bold">Suspended Accounts</span>
            <p className="text-2xl font-black text-rose-400">{users.suspendedUsers}</p>
          </div>
        </div>
      </div>

      {/* Host Verification Performance */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" /> Host Verification Efficiency & Queue Metrics
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Summary of verification application pipeline and review outcomes.</p>
          </div>
          <Link href="/admin/applications" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
            View Applications Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Applications</span>
            <span className="text-2xl font-black text-white">{applications.totalApplications}</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Approval Rate</span>
            <span className="text-2xl font-black text-emerald-400">{applications.approvalRate}%</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-red-400 uppercase font-bold block">Rejection Rate</span>
            <span className="text-2xl font-black text-red-400">{applications.rejectionRate}%</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">Queue Size</span>
            <span className="text-2xl font-black text-amber-400">{applications.verificationQueueSize}</span>
          </div>
        </div>

        {/* Application Status Bar Visualizer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
            <span>Application Status Breakdown</span>
            <span className="font-mono text-[11px]">{applications.approvedApps} Approved / {applications.totalApplications} Total</span>
          </div>
          <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden flex border border-neutral-800">
            {applications.totalApplications > 0 ? (
              <>
                <div
                  style={{ width: `${(applications.approvedApps / applications.totalApplications) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Approved: ${applications.approvedApps}`}
                />
                <div
                  style={{ width: `${(applications.pendingApps / applications.totalApplications) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`Pending: ${applications.pendingApps}`}
                />
                <div
                  style={{ width: `${(applications.underReviewApps / applications.totalApplications) * 100}%` }}
                  className="bg-blue-500 h-full"
                  title={`Under Review: ${applications.underReviewApps}`}
                />
                <div
                  style={{ width: `${(applications.needsInfoApps / applications.totalApplications) * 100}%` }}
                  className="bg-purple-500 h-full"
                  title={`Needs Info: ${applications.needsInfoApps}`}
                />
                <div
                  style={{ width: `${(applications.rejectedApps / applications.totalApplications) * 100}%` }}
                  className="bg-red-500 h-full"
                  title={`Rejected: ${applications.rejectedApps}`}
                />
                <div
                  style={{ width: `${(applications.suspendedApps / applications.totalApplications) * 100}%` }}
                  className="bg-rose-500 h-full"
                  title={`Suspended: ${applications.suspendedApps}`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-neutral-800" />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-mono pt-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Approved ({applications.approvedApps})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pending ({applications.pendingApps})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Under Review ({applications.underReviewApps})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Needs Info ({applications.needsInfoApps})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Rejected ({applications.rejectedApps})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Suspended ({applications.suspendedApps})</span>
          </div>
        </div>
      </div>

      {/* Event Hosting & Registration Performance */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Event Hosting & Attendance Telemetry
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Overview of published events, registration volume, and event status states.</p>
          </div>
          <Link href="/admin/events" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
            Moderate Events Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Events</span>
            <span className="text-2xl font-black text-white">{events.totalEvents}</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block">Active Events</span>
            <span className="text-2xl font-black text-cyan-400">{events.activeEvents}</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-pink-400 uppercase font-bold block">Upcoming Events</span>
            <span className="text-2xl font-black text-pink-400">{events.upcomingEvents}</span>
          </div>
          <div className="bg-black/50 border border-neutral-800 p-4 rounded-lg">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Total Registrations</span>
            <span className="text-2xl font-black text-emerald-400">{events.totalRegistrations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
