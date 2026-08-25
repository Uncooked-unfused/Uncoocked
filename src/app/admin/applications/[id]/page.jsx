"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  ArrowLeft,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import DocumentViewerModal from "@/components/admin/DocumentViewerModal";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function ApplicationDetailPage({ params }) {
  const { id } = use(params);
  const { goBack } = useBackNavigation();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { action: string, title: string }

  // Document Viewer State
  const [viewerDocUrl, setViewerDocUrl] = useState(null);
  const [viewerDocTitle, setViewerDocTitle] = useState("");

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setApp(result.data);
      } else {
        toast.error(result.error || "Failed to load application details");
      }
    } catch (err) {
      console.error("Failed to fetch application:", err);
      toast.error("Network error loading application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    fetchApplication();
  }, [fetchApplication]);

  const executeAction = async (actionType) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, notes: note }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Action ${actionType} completed successfully!`);
        setNote("");
        setConfirmModal(null);
        await fetchApplication();
      } else {
        toast.error(`Action failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionClick = (actionType) => {
    if (actionType === "REJECT" || actionType === "SUSPEND") {
      setConfirmModal({
        action: actionType,
        title: actionType === "REJECT" ? "Confirm Application Rejection" : "Confirm Host Suspension",
      });
    } else {
      executeAction(actionType);
    }
  };

  const openDocumentViewer = (title, url) => {
    setViewerDocTitle(title);
    setViewerDocUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Loading application review workspace...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-4">
        <h1 className="text-2xl font-black">Application Not Found</h1>
        <p className="text-xs text-gray-400">The requested host verification application could not be found.</p>
        <Link href="/admin/applications" className="text-xs text-amber-400 underline">
          ← Return to Applications Queue
        </Link>
      </div>
    );
  }

  // Parse document URLs
  let documents = [];
  if (app.documentUrls) {
    try {
      const parsed = JSON.parse(app.documentUrls);
      if (typeof parsed === "object") {
        Object.entries(parsed).forEach(([key, val]) => {
          if (val) documents.push({ title: key, url: val });
        });
      } else {
        documents.push({ title: "Identity Proof Document", url: app.documentUrls });
      }
    } catch {
      documents.push({ title: "Identity Proof Document", url: app.documentUrls });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => goBack("/admin/applications")}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Applications Queue
          </button>
          <h1 className="text-3xl font-black">{app.organizationName}</h1>
          <p className="text-xs text-gray-400">
            Applicant: <strong className="text-white">{app.user?.fullName || app.user?.name || "N/A"}</strong> (
            <span className="font-mono text-gray-300">{app.user?.email}</span>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${
              app.status === "APPROVED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : app.status === "PENDING"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : app.status === "SUSPENDED"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : app.status === "REJECTED"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}
          >
            Status: {app.status}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Columns: Details & Documents */}
        <div className="md:col-span-2 space-y-6">
          {/* Organization Information */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Building2 className="w-4 h-4 text-amber-500" /> Organization Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Organization Type</span>
                <span className="font-bold text-white">{app.organizationType}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Official Email</span>
                <span className="font-mono text-gray-300">{app.organizationEmail || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Website</span>
                {app.website ? (
                  <a href={app.website} target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono truncate block">
                    {app.website}
                  </a>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Submitted On</span>
                <span className="font-mono text-gray-300">{new Date(app.createdAt).toLocaleString()}</span>
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
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Description / Bio</span>
                <p className="text-gray-300 leading-relaxed">{app.description}</p>
              </div>
            )}
          </div>

          {/* Verification Documents Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <FileText className="w-4 h-4 text-amber-500" /> Identity Verification Documents
            </h2>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/50 border border-neutral-800 rounded-lg text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white capitalize">{doc.title}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-xs">{doc.url}</p>
                    </div>
                    <button
                      onClick={() => openDocumentViewer(doc.title, doc.url)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-neutral-700 transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" /> View In-App
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No identity proof document URL attached.</p>
            )}
          </div>

          {/* Review Actions Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 sticky bottom-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <UserCheck className="w-4 h-4 text-amber-500" /> Admin Review Actions & Notes
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter review notes, feedback, or suspension reasons..."
              className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              rows={3}
            />
            <div className="flex flex-wrap gap-2.5">
              {app.status !== "APPROVED" && (
                <>
                  <button
                    disabled={submitting}
                    onClick={() => handleActionClick("APPROVE")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Host
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleActionClick("APPROVE_SUPER_ADMIN")}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Make Super Admin
                  </button>
                </>
              )}
              {app.status === "APPROVED" && (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("SUSPEND")}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Suspend Host
                </button>
              )}
              {app.status === "SUSPENDED" && (
                <button
                  disabled={submitting}
                  onClick={() => handleActionClick("REINSTATE")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate Host
                </button>
              )}
              <button
                disabled={submitting}
                onClick={() => handleActionClick("REQUEST_INFO")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Request Info
              </button>
              <button
                disabled={submitting}
                onClick={() => handleActionClick("REJECT")}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timelines for Admin Notes & Audit Logs */}
        <div className="space-y-6">
          {/* Admin Notes Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <MessageSquare className="w-4 h-4 text-amber-500" /> Internal Notes
            </h2>
            <div className="space-y-3">
              {app.notes && app.notes.length > 0 ? (
                app.notes.map((n) => (
                  <div key={n.id} className="bg-black/50 border border-neutral-800 p-3 rounded-lg text-xs space-y-1">
                    <p className="text-gray-200 leading-relaxed">&ldquo;{n.note}&rdquo;</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No admin notes written yet.</p>
              )}
            </div>
          </div>

          {/* Audit Log Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Clock className="w-4 h-4 text-amber-500" /> Audit Trail
            </h2>
            <div className="space-y-3 border-l-2 border-neutral-800 pl-3">
              {app.auditLogs && app.auditLogs.length > 0 ? (
                app.auditLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5 text-xs">
                    <p className="font-bold text-amber-400 font-mono text-[11px]">{log.action}</p>
                    {log.reason && <p className="text-gray-400 italic text-[11px]">&ldquo;{log.reason}&rdquo;</p>}
                    <p className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No audit records recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDocUrl)}
        onClose={() => setViewerDocUrl(null)}
        docUrl={viewerDocUrl}
        docTitle={viewerDocTitle}
        applicationId={app.id}
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to perform action <strong className="text-white">{confirmModal.action}</strong> for <strong className="text-white">{app.organizationName}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(confirmModal.action)}
                disabled={submitting}
                className="px-5 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? "Executing..." : `Yes, ${confirmModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}