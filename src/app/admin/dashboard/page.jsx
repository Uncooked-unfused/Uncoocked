"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Activity,
  Megaphone,
  RefreshCw,
  Star,
  Briefcase,
} from "lucide-react";

import { getCachedAdminData, fetchWithClientCache } from "@/lib/clientCache";

export default function AdminDashboardPage() {
  const [data, setData] = useState(() => getCachedAdminData("/api/admin/stats"));
  const [loading, setLoading] = useState(() => !getCachedAdminData("/api/admin/stats"));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const result = await fetchWithClientCache("/api/admin/stats", {
        bypassCache: isManualRefresh,
        ttl: 20_000,
      });

      if (result.success && result.data?.success) {
        setData(result.data);
      } else if (!result.fromCache) {
        toast.error(result.error || "Failed to load admin stats");
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      if (!data) toast.error("Network error loading dashboard");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Loading Super Admin Operational Metrics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentActivity = data?.recentActivity || [];
  const pendingWorkItems = data?.pendingWorkItems || [];

  const kpiCards = [
    { title: "Total Users", value: stats.totalUsers ?? 0, desc: "Registered platform users", href: "/admin/users", icon: Users, color: "text-blue-400 border-blue-500/20" },
    { title: "Active Organizers", value: stats.totalOrganizers ?? 0, desc: "Verified hosts & admins", href: "/admin/applications?status=APPROVED", icon: Building2, color: "text-emerald-400 border-emerald-500/20" },
    { title: "Platform Reviews", value: `${stats.totalReviews ?? 0} (${stats.avgRating ?? "0.0"}★)`, desc: "Total user reviews & rating", href: "/admin/reviews", icon: Star, color: "text-amber-400 border-amber-500/20" },
    { title: "Pending Applications", value: stats.pendingCount ?? 0, desc: "Awaiting initial review", href: "/admin/applications?status=PENDING", icon: Clock, color: "text-amber-400 border-amber-500/20" },
    { title: "Under Review", value: stats.underReviewCount ?? 0, desc: "Currently being reviewed", href: "/admin/applications?status=UNDER_REVIEW", icon: Activity, color: "text-indigo-400 border-indigo-500/20" },
    { title: "Action Needed", value: stats.needsInfoCount ?? 0, desc: "Info requested from host", href: "/admin/applications?status=NEEDS_MORE_INFORMATION", icon: AlertCircle, color: "text-purple-400 border-purple-500/20" },
    { title: "Approved Hosts", value: stats.approvedCount ?? 0, desc: "Eligible to host events", href: "/admin/applications?status=APPROVED", icon: CheckCircle2, color: "text-emerald-400 border-emerald-500/20" },
    { title: "Rejected Apps", value: stats.rejectedCount ?? 0, desc: "Not approved requests", href: "/admin/applications?status=REJECTED", icon: XCircle, color: "text-red-400 border-red-500/20" },
    { title: "Active Events", value: stats.activeEvents ?? 0, desc: "Live published events", href: "/admin/events?status=ACTIVE", icon: Calendar, color: "text-cyan-400 border-cyan-500/20" },
    { title: "Job Opportunities", value: `${stats.activeOpportunities ?? 0} Live`, desc: `${stats.pendingOpportunityApplications ?? 0} applications pending`, href: "/admin/opportunities", icon: Briefcase, color: "text-amber-400 border-amber-500/20" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Operations Overview
          </div>
          <h1 className="text-3xl font-black">Super Admin Command Center</h1>
          <p className="text-xs text-gray-400 mt-1">Real-time platform metrics, host applications queue, and governance audit trail.</p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {/* Quick Actions Toolbar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Quick Actions:</span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/applications"
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow"
          >
            <Building2 className="w-3.5 h-3.5" /> Review Applications
          </Link>
          <Link
            href="/admin/reviews"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5 text-amber-400" /> Manage Reviews
          </Link>
          <Link
            href="/admin/audit-logs"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Audit Logs
          </Link>
          <Link
            href="/admin/users"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" /> Manage Users
          </Link>
          <Link
            href="/admin/opportunities"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Job Opportunities
          </Link>
          <Link
            href="/admin/events"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-pink-400" /> View Events
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className={`bg-neutral-900 border ${card.color} p-5 rounded-xl hover:bg-neutral-800/80 transition flex flex-col justify-between space-y-3 group shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg bg-black/40 ${card.color.split(" ")[0]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-black ${card.color.split(" ")[0]}`}>{card.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{card.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational System Health Metrics Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Total Applications</span>
          <span className="text-2xl font-black text-white">{stats.totalApplications ?? 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Approval Rate</span>
          <span className="text-2xl font-black text-emerald-400">{stats.approvalRate ?? "0.0"}%</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Rejection Rate</span>
          <span className="text-2xl font-black text-red-400">{stats.rejectionRate ?? "0.0"}%</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Queue Size</span>
          <span className="text-2xl font-black text-amber-400">{stats.verificationQueueSize ?? 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">System Status</span>
          <div className="flex flex-col items-center">
            <span className={`text-sm font-extrabold inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-full border ${
              (stats.activeIncidentsCount || 0) === 0 && (stats.systemHealth?.status !== "DEGRADED")
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              <span className={`w-2 h-2 rounded-full ${ (stats.activeIncidentsCount || 0) === 0 ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-ping" }`} />
              {(stats.activeIncidentsCount || 0) === 0 ? "Operational" : `${stats.activeIncidentsCount} Incident(s)`}
            </span>
            {stats.systemHealth && (
              <span className="text-[9px] text-gray-400 font-mono mt-1">
                DB: {stats.systemHealth.dbLatencyMs >= 0 ? `${stats.systemHealth.dbLatencyMs}ms` : "ERR"} | P95: {stats.systemHealth.p95LatencyMs}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Pending Work & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pending Work Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Actionable Review Queue ({pendingWorkItems.length})
            </h2>
            <Link href="/admin/applications" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingWorkItems.length > 0 ? (
            <div className="space-y-3">
              {pendingWorkItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-black/50 border border-neutral-800 rounded-lg hover:border-neutral-700 transition text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white">{item.organizationName}</p>
                    <p className="text-[10px] text-gray-400">
                      Applicant: <span className="text-gray-300 font-mono">{item.user?.name || item.user?.fullName || item.user?.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        item.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : item.status === "UNDER_REVIEW"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : item.status === "SUSPENDED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                    <Link
                      href={`/admin/applications/${item.id}`}
                      className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold px-3 py-1.5 rounded-md text-[11px] border border-neutral-700 transition"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
              <p className="text-xs font-semibold">Verification Queue Clear!</p>
              <p className="text-[11px] text-gray-600">No pending host applications currently require review.</p>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Recent Administrative Activity
            </h2>
            <Link href="/admin/audit-logs" className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
              Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3 border-l-2 border-neutral-800 pl-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-300">
                    Target: <strong className="text-white">{log.application?.organizationName || "System Target"}</strong>
                  </p>
                  {log.reason && <p className="text-gray-500 italic text-[11px]">&ldquo;{log.reason}&rdquo;</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <Clock className="w-8 h-8 text-neutral-700 mx-auto" />
              <p className="text-xs font-semibold">No Recent Admin Activity</p>
              <p className="text-[11px] text-gray-600">Administrative actions will appear here in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}