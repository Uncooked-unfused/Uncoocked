"use client";

import { useState, useEffect, use } from "react";
import {
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowLeft,
  Send,
  Calendar,
  AlertTriangle,
  UploadCloud,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useBackNavigation } from "@/context/NavigationHistoryContext";
import { formatDate } from "@/lib/dateUtils";

export default function RequestSubmissionPage({ params }) {
  const unwrappedParams = use(params);
  const requestId = unwrappedParams.id;
  const { goBack } = useBackNavigation();

  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [error, setError] = useState(null);

  const [documentUrl, setDocumentUrl] = useState("");
  const [responseNotes, setResponseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        const res = await fetch(`/api/requests/${requestId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setRequestData(data.data);
          if (data.data.documentUrl) setDocumentUrl(data.data.documentUrl);
          if (data.data.responseNotes) setResponseNotes(data.data.responseNotes);
        } else {
          setError(data.error || "Failed to load request");
        }
      } catch (err) {
        console.error("Fetch request error:", err);
        setError("Network error while loading request");
      } finally {
        setLoading(false);
      }
    }

    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documentUrl.trim() && !responseNotes.trim()) {
      toast.error("Please provide either a document link or written response details");
      return;
    }

    if (documentUrl.trim()) {
      try {
        const parsed = new URL(documentUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          toast.error("Please provide a valid HTTP/HTTPS URL");
          return;
        }
      } catch {
        toast.error("Please provide a valid URL (e.g. https://drive.google.com/...)");
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl: documentUrl.trim() || undefined,
          responseNotes: responseNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Submission successfully uploaded for admin review!");
        setRequestData(data.data);
        setEditMode(false);
      } else {
        toast.error(data.error || "Failed to submit response");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Network error while submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-400 font-mono">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 p-8 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-black">Request Not Found</h2>
          <p className="text-xs text-neutral-400">{error || "This document request may have expired or is unavailable."}</p>
          <button
            type="button"
            onClick={() => goBack("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const comm = requestData.communication || {};
  const isResponded = requestData.status === "RESPONDED" || requestData.respondedAt !== null;
  const isPending = requestData.adminReviewStatus === "PENDING";
  const isApproved = requestData.adminReviewStatus === "APPROVED";
  const isFollowUp = requestData.adminReviewStatus === "FOLLOW_UP_REQUIRED";
  const isRejected = requestData.adminReviewStatus === "REJECTED";

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goBack("/dashboard")}
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition font-mono cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Previous Page</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>UNCOOKED Governance</span>
          </div>
        </div>

        {/* Request Header Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-2 border-b border-neutral-800 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  comm.priority === "URGENT"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : comm.priority === "HIGH"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {comm.priority || "NORMAL"} Priority
              </span>
              <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400 uppercase">
                {comm.type?.replace(/_/g, " ")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{comm.subject}</h1>

            {comm.deadline && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-red-400 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Submission Deadline: {formatDate(comm.deadline)}
                </span>
              </div>
            )}
          </div>

          {/* Admin Message */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-neutral-500">Notice from Platform Administration:</div>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/80">
              {comm.message}
            </p>
          </div>

          {/* Requested Document Box */}
          {comm.requiredDocType && (
            <div className="p-4 bg-amber-500/5 border-l-4 border-amber-500 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-bold">
                <FileText className="w-4 h-4" />
                <span>Requested Document / Media Type</span>
              </div>
              <div className="text-base font-extrabold text-white">{comm.requiredDocType}</div>
              {comm.instructions && (
                <div className="text-xs text-neutral-400 italic mt-1">&ldquo;{comm.instructions}&rdquo;</div>
              )}
            </div>
          )}
        </div>

        {/* Existing Submission Status Card (if already submitted) */}
        {isResponded && !editMode && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-white">Your Submitted Response</h2>
              </div>

              {/* Status Badge */}
              <div>
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved by Admin</span>
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Under Review</span>
                  </span>
                )}
                {isFollowUp && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Revisions Requested</span>
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Rejected</span>
                  </span>
                )}
              </div>
            </div>

            {/* Admin Feedback Box if present */}
            {requestData.adminReviewNotes && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Admin Feedback</span>
                <p className="text-xs text-white leading-relaxed">{requestData.adminReviewNotes}</p>
              </div>
            )}

            {/* Submitted URL */}
            {requestData.documentUrl && (
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Uploaded Document Link</span>
                  <div className="text-xs text-amber-400 font-mono truncate max-w-xs sm:max-w-md">
                    {requestData.documentUrl}
                  </div>
                </div>
                <a
                  href={requestData.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View</span>
                </a>
              </div>
            )}

            {/* Submitted Notes */}
            {requestData.responseNotes && (
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Your Notes</span>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{requestData.responseNotes}</p>
              </div>
            )}

            {/* Option to edit/update submission */}
            {!isApproved && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>Update / Resubmit Response</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submission Form (Shown if not yet submitted or in edit mode) */}
        {(!isResponded || editMode) && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-amber-500" />
                  <span>
                    {editMode
                      ? "Update Your Response"
                      : comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO"
                      ? "Submit Information & Clarifications"
                      : "Submit Required Document & Response"}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  {comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO"
                    ? "Provide the requested details or answers below. You may also attach supporting document links if applicable."
                    : "Upload your document or media to Google Drive, Dropbox, or your preferred storage and paste the public link below."}
                </p>
              </div>

              {editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Response Notes / Comments */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-neutral-400">
                  {comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO" ? (
                    <>
                      Response &amp; Clarification Details <span className="text-amber-500 font-bold">*</span>
                    </>
                  ) : (
                    "Explanation & Response Notes"
                  )}
                </label>
                <textarea
                  rows={4}
                  required={comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO"}
                  placeholder={
                    comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO"
                      ? "Type your detailed answer, explanation, or clarifications here..."
                      : "Provide any additional context, document descriptions, or answers requested by the administration..."
                  }
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Document Link Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-neutral-400">
                  {comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO"
                    ? "Optional Supporting Document / Cloud Storage Link"
                    : "Document / Cloud Storage URL *"}
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... or https://dropbox.com/..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono transition"
                />
                <p className="text-[11px] text-neutral-500">
                  Tip: Ensure link sharing permissions are set to &ldquo;Anyone with link can view&rdquo; so admins can verify.
                </p>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading Response...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit to Administration</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
