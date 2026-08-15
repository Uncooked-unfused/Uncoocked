"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function HostStatusPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/host/status");
      const result = await res.json();

      if (res.status === 401) {
        router.push("/login?callbackUrl=/host/status");
        return;
      }

      if (res.ok) {
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch host status:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Checking host application status...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasApplication) {
    return (
      <div className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-black">No Host Application Found</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            You have not submitted a host verification application yet. Apply today to become a verified host and publish events.
          </p>
        </div>
        <Link
          href="/host/apply"
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-6 py-3 rounded-lg transition inline-flex items-center gap-2 shadow-lg"
        >
          Apply to Become a Host <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const app = data.application;
  const status = app.status;

  // Safely extract identity proof URL from documentUrls string or object
  let parsedIdProofUrl = "";
  if (app.documentUrls) {
    try {
      const docs = typeof app.documentUrls === "string" ? JSON.parse(app.documentUrls) : app.documentUrls;
      parsedIdProofUrl = docs.idProofUrl || (typeof docs === "string" ? docs : "");
    } catch {
      parsedIdProofUrl = typeof app.documentUrls === "string" ? app.documentUrls : "";
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "APPROVED":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approved Host</span>;
      case "PENDING":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
      case "UNDER_REVIEW":
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case "NEEDS_MORE_INFORMATION":
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Action Required</span>;
      case "REJECTED":
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case "SUSPENDED":
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Suspended</span>;
      default:
        return <span className="bg-neutral-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Host Verification Portal
          </div>
          <h1 className="text-3xl font-black">{app.organizationName}</h1>
          <p className="text-xs text-gray-400 mt-1">Application ID: <span className="font-mono text-gray-300">{app.id}</span></p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Status Banners */}
      {status === "APPROVED" && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Host Account Approved & Verified
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
              Your organization credentials have been verified by the super admin team. You now have full access to create, publish, and manage events.
            </p>
          </div>
          <Link
            href="/dashboard/organizer/new"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-5 py-3 rounded-lg transition shrink-0 flex items-center gap-2 shadow-lg"
          >
            Create Your Event <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {(status === "PENDING" || status === "UNDER_REVIEW") && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" /> Application Under Review
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
              Thank you for submitting your organization details. Our verification team is currently inspecting your application. Reviews typically complete within 24–48 hours.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shrink-0 flex items-center gap-2 border border-neutral-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>
      )}

      {status === "NEEDS_MORE_INFORMATION" && (
        <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-400" /> Action Required: Additional Information Requested
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              The verification review team requested additional details regarding your application before approval:
            </p>
          </div>
          {app.infoRequestedReason && (
            <div className="bg-black/60 border border-purple-500/20 p-4 rounded-lg text-xs font-mono text-purple-200">
              &ldquo;{app.infoRequestedReason}&rdquo;
            </div>
          )}
          <Link
            href="/host/apply"
            className="bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs px-5 py-2.5 rounded-lg transition inline-flex items-center gap-2 shadow-md"
          >
            Update Application Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {status === "REJECTED" && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Host Application Not Approved
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Your host application was reviewed and could not be approved at this time.
            </p>
          </div>
          {app.rejectionReason && (
            <div className="bg-black/60 border border-red-500/20 p-4 rounded-lg text-xs font-mono text-red-200">
              Reason: &ldquo;{app.rejectionReason}&rdquo;
            </div>
          )}
          <Link
            href="/host/apply"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition inline-flex items-center gap-2 border border-neutral-700"
          >
            Submit New Application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Organization Metadata */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Building2 className="w-4 h-4 text-amber-500" /> Submitted Organization Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Organization Name</span>
                <span className="font-bold text-white">{app.organizationName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Organization Type</span>
                <span className="font-bold text-white">{app.organizationType}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Official Email</span>
                <span className="font-mono text-gray-300">{app.organizationEmail || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Website / Link</span>
                {app.website ? (
                  <a href={app.website} target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-amber-300 font-mono truncate block">
                    {app.website}
                  </a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </div>
            </div>
            {app.address && (
              <div className="pt-2 border-t border-neutral-800/60 text-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Address / Campus</span>
                <span className="text-gray-300">{app.address}</span>
              </div>
            )}
            {app.description && (
              <div className="pt-2 border-t border-neutral-800/60 text-xs space-y-1">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Description</span>
                <p className="text-gray-300 leading-relaxed">{app.description}</p>
              </div>
            )}
            {parsedIdProofUrl && (
              <div className="pt-2 border-t border-neutral-800/60 text-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Identity Proof Link</span>
                <a
                  href={parsedIdProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 font-mono truncate inline-flex items-center gap-1 mt-0.5"
                >
                  {parsedIdProofUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Dates & Timeline */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <FileText className="w-4 h-4 text-amber-500" /> Timeline Overview
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Submission Date</span>
                <span className="font-mono text-gray-300">{new Date(app.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Last Status Update</span>
                <span className="font-mono text-gray-300">{new Date(app.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            {app.auditLogs && app.auditLogs.length > 0 && (
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <span className="text-gray-400 font-semibold text-[11px] block">Activity History</span>
                <div className="space-y-3 border-l-2 border-neutral-800 pl-3">
                  {app.auditLogs.map((log) => (
                    <div key={log.id} className="space-y-0.5 text-xs">
                      <p className="font-bold text-amber-400 text-[11px] font-mono">{log.action}</p>
                      {log.reason && <p className="text-gray-400 italic text-[11px]">&ldquo;{log.reason}&rdquo;</p>}
                      <p className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}