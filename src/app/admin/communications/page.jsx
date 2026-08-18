"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  User,
  Users,
  Shield,
  RefreshCw,
  X,
  FileCheck,
  Inbox,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getCachedAdminData, fetchWithClientCache, invalidateClientCache } from "@/lib/clientCache";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState("responses"); // 'responses' | 'compose' | 'outbox'

  // Responses / Submissions state
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [responseStats, setResponseStats] = useState({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    FOLLOW_UP_REQUIRED: 0,
    REVIEWED: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [adminReviewStatus, setAdminReviewStatus] = useState("APPROVED");
  const [adminReviewNotes, setAdminReviewNotes] = useState("");
  const [updatingReview, setUpdatingReview] = useState(false);

  // Outbox / Dispatched state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Compose & Request state
  const [targetType, setTargetType] = useState("INDIVIDUAL"); // 'INDIVIDUAL' | 'GROUP'
  const [targetGroup, setTargetGroup] = useState("ALL_USERS");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  
  // Comm Types: 'INFO_REQUEST' | 'DOCUMENT_REQUEST' | 'MEDIA_REQUEST' | 'NOTIFICATION'
  const [commType, setCommType] = useState("INFO_REQUEST");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requiredDocType, setRequiredDocType] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState("NORMAL"); // 'NORMAL' | 'HIGH' | 'URGENT'
  const [deadline, setDeadline] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch responses with status, type, and search filters
  const fetchResponses = useCallback(async (bypassCache = false) => {
    try {
      setResponsesLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const url = `/api/admin/communications/responses?${params.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache,
        ttl: 15_000,
      });

      if (result.success && result.data?.success) {
        setResponses(result.data.items || []);
        if (result.data.stats) setResponseStats(result.data.stats);
      } else if (!result.fromCache && result.error) {
        console.warn("Failed to load user responses:", result.error);
      }
    } catch (err) {
      console.error("Error loading responses:", err);
    } finally {
      setResponsesLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  // Fetch outbox campaigns
  const fetchCampaigns = useCallback(async (bypassCache = false) => {
    try {
      setCampaignsLoading(true);
      const url = "/api/admin/communications";
      const result = await fetchWithClientCache(url, {
        bypassCache,
        ttl: 15_000,
      });
      if (result.success && result.data?.success) {
        setCampaigns(result.data.items || []);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // Fetch users for individual search / selection
  const fetchUsers = useCallback(async (query = "", role = "ALL") => {
    try {
      setSearchingUsers(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      if (role !== "ALL") params.append("role", role);
      params.append("limit", "40");

      const res = await fetch(`/api/admin/users/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUserSearchResults(data.users || []);
      } else {
        console.error("User fetch error:", data.error);
      }
    } catch (err) {
      console.error("Search users error:", err);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadTabData = async () => {
      if (activeTab === "responses") {
        await fetchResponses();
      } else if (activeTab === "outbox") {
        await fetchCampaigns();
      } else if (activeTab === "compose") {
        await fetchUsers(userSearchTerm, userRoleFilter);
      }
    };
    if (isMounted) {
      loadTabData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, fetchResponses, fetchCampaigns, fetchUsers, userSearchTerm, userRoleFilter]);

  // User search debounce for compose view
  useEffect(() => {
    if (activeTab !== "compose" || targetType !== "INDIVIDUAL") return;

    const timer = setTimeout(() => {
      fetchUsers(userSearchTerm, userRoleFilter);
    }, 200);

    return () => clearTimeout(timer);
  }, [userSearchTerm, userRoleFilter, activeTab, targetType, fetchUsers]);

  // Handle user selection in compose
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const selectAllFiltered = () => {
    if (!userSearchResults.length) return;
    const newSelected = [...selectedUsers];
    userSearchResults.forEach((u) => {
      if (!newSelected.some((sel) => sel.id === u.id)) {
        newSelected.push(u);
      }
    });
    setSelectedUsers(newSelected);
  };

  const clearAllSelected = () => {
    setSelectedUsers([]);
  };

  // Dispatch Communication
  const handleDispatch = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter message details or instructions");
      return;
    }
    if (targetType === "INDIVIDUAL" && selectedUsers.length === 0) {
      toast.error("Please select at least one recipient user");
      return;
    }
    if (commType !== "NOTIFICATION" && !requiredDocType.trim()) {
      toast.error(
        commType === "INFO_REQUEST"
          ? "Please specify the topic or question for the information request"
          : "Please specify the required document or media type"
      );
      return;
    }

    try {
      setSending(true);
      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        type: commType,
        targetType,
        targetGroup: targetType === "GROUP" ? targetGroup : undefined,
        targetUserIds: targetType === "INDIVIDUAL" ? selectedUsers.map((u) => u.id) : undefined,
        requiredDocType: commType !== "NOTIFICATION" ? requiredDocType.trim() : undefined,
        instructions: commType !== "NOTIFICATION" ? instructions.trim() : undefined,
        priority,
        deadline: deadline || undefined,
      };

      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Communication dispatched successfully!");
        invalidateClientCache("/api/admin/communications");
        // Reset form
        setSubject("");
        setMessage("");
        setRequiredDocType("");
        setInstructions("");
        setDeadline("");
        setSelectedUsers([]);
        setUserSearchTerm("");
        setActiveTab("responses");
        fetchResponses(true);
      } else {
        toast.error(data.error || "Failed to dispatch communication");
      }
    } catch (err) {
      console.error("Dispatch error:", err);
      toast.error("Network error while dispatching communication");
    } finally {
      setSending(false);
    }
  };

  // Open Review Modal
  const openReviewModal = (response) => {
    setSelectedResponse(response);
    setAdminReviewStatus(response.adminReviewStatus === "PENDING" ? "APPROVED" : response.adminReviewStatus);
    setAdminReviewNotes(response.adminReviewNotes || "");
    setReviewModalOpen(true);
  };

  // Submit Review Update
  const handleUpdateReview = async () => {
    if (!selectedResponse) return;

    try {
      setUpdatingReview(true);
      const res = await fetch(`/api/admin/communications/responses/${selectedResponse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: adminReviewStatus,
          notes: adminReviewNotes,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Review status updated successfully");
        invalidateClientCache("/api/admin/communications/responses");
        setReviewModalOpen(false);
        fetchResponses(true);
      } else {
        toast.error(data.error || "Failed to update review");
      }
    } catch (err) {
      console.error("Review update error:", err);
      toast.error("Failed to update review");
    } finally {
      setUpdatingReview(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-10 py-8 space-y-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Governance &amp; User Communications</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Admin Communications &amp; Request Info Hub
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Dispatch direct user inquiries, request information or clarification, collect verification documents, and review all user submissions in one unified console.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "responses"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>User Submissions</span>
            {responseStats.PENDING > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
                {responseStats.PENDING}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "compose"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Compose &amp; Request Info</span>
          </button>

          <button
            onClick={() => setActiveTab("outbox")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "outbox"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Sent History</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: USER RESPONSES & REQUEST INFO SUBMISSIONS (Admin Only) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "responses" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
                <span>Total Submissions</span>
                <Inbox className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-2xl font-black text-white">{responseStats.ALL}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Responses across all requests</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-2">
                <span>Pending Review</span>
                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              </div>
              <div className="text-2xl font-black text-amber-400">{responseStats.PENDING}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Awaiting admin assessment</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
                <span>Approved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{responseStats.APPROVED}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Verified &amp; accepted responses</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-purple-400 font-mono mb-2">
                <span>Follow-Up Needed</span>
                <AlertCircle className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-400">{responseStats.FOLLOW_UP_REQUIRED}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Sent back for clarifications</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search user, email, answer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-[11px] font-mono text-neutral-500 uppercase shrink-0">Status:</span>
                {["ALL", "PENDING", "APPROVED", "FOLLOW_UP_REQUIRED", "REJECTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === status
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                    }`}
                  >
                    {status === "ALL" ? "All Statuses" : status.replace(/_/g, " ")}
                  </button>
                ))}

                <button
                  onClick={() => fetchResponses(true)}
                  className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                  title="Refresh responses"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${responsesLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-neutral-800/80">
              <span className="text-[11px] font-mono text-neutral-500 uppercase shrink-0">Category:</span>
              {[
                { id: "ALL", label: "All Types" },
                { id: "INFO_REQUEST", label: "Request Info / Clarifications" },
                { id: "DOCUMENT_REQUEST", label: "Document Requests" },
                { id: "MEDIA_REQUEST", label: "Media Requests" },
                { id: "NOTIFICATION", label: "Notifications" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    typeFilter === t.id
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono"
                      : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800 font-mono"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Table */}
          {responsesLoading ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-neutral-400 font-mono">Loading user submissions...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Submissions Found</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "No submissions matched your active filters. Try clearing search filters."
                  : "When you request information, documents, or clarifications from users, their responses will appear here for review."}
              </p>
              <button
                onClick={() => setActiveTab("compose")}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Create Request Info Communication</span>
              </button>
            </div>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Type &amp; Subject</th>
                      <th className="px-5 py-3.5">User Response / Answer</th>
                      <th className="px-5 py-3.5">Document / Media Link</th>
                      <th className="px-5 py-3.5">Submitted At</th>
                      <th className="px-5 py-3.5">Review Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {responses.map((resp) => {
                      const user = resp.user || {};
                      const comm = resp.communication || {};
                      const isInfo = comm.type === "INFO_REQUEST" || comm.type === "REQUEST_INFO";
                      const isDoc = comm.type === "DOCUMENT_REQUEST";
                      const isMedia = comm.type === "MEDIA_REQUEST";

                      const statusColor =
                        resp.adminReviewStatus === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : resp.adminReviewStatus === "REJECTED"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : resp.adminReviewStatus === "FOLLOW_UP_REQUIRED"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20";

                      return (
                        <tr key={resp.id} className="hover:bg-neutral-900/50 transition">
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                                {user.name?.[0]?.toUpperCase() || resp.email?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div>
                                <div className="font-bold text-white">{user.name || user.fullName || "User"}</div>
                                <div className="text-neutral-400 text-[11px] font-mono">{resp.email}</div>
                                {user.role && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-800 text-neutral-300">
                                    {user.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Request Type & Subject */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  isInfo
                                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                    : isDoc
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : isMedia
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-neutral-800 text-neutral-300"
                                }`}
                              >
                                {isInfo ? "Info Request" : isDoc ? "Doc Request" : isMedia ? "Media Request" : "Notification"}
                              </span>
                            </div>
                            <div className="font-semibold text-white">{comm.subject}</div>
                            {comm.requiredDocType && (
                              <div className="text-neutral-400 text-[11px] font-mono mt-0.5">
                                Topic: {comm.requiredDocType}
                              </div>
                            )}
                          </td>

                          {/* Response Notes / Answer */}
                          <td className="px-5 py-4 max-w-xs">
                            {resp.responseNotes ? (
                              <p className="text-neutral-200 text-xs line-clamp-3 leading-relaxed">
                                {resp.responseNotes}
                              </p>
                            ) : (
                              <span className="text-neutral-500 italic text-xs">No written text provided</span>
                            )}
                          </td>

                          {/* Submitted URL */}
                          <td className="px-5 py-4">
                            {resp.documentUrl ? (
                              <a
                                href={resp.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-bold transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[130px]">Open Document</span>
                              </a>
                            ) : resp.mediaUrls ? (
                              <span className="text-neutral-400 font-mono text-[11px]">Media Links Provided</span>
                            ) : (
                              <span className="text-neutral-500 italic text-xs">None Attached</span>
                            )}
                          </td>

                          {/* Submitted At */}
                          <td className="px-5 py-4 text-neutral-400 text-[11px] font-mono whitespace-nowrap">
                            {resp.respondedAt ? (
                              formatDateTime(resp.respondedAt)
                            ) : (
                              <span className="text-neutral-500">Pending</span>
                            )}
                          </td>

                          {/* Review Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusColor}`}
                            >
                              {resp.adminReviewStatus.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => openReviewModal(resp)}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: COMPOSE & REQUEST INFO (Individual or Group)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                <span>Compose Communication / Request Info</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Dispatches an in-app notification and an official branded email with dedicated submission and reply deep-links.
              </p>
            </div>

            <form onSubmit={handleDispatch} className="space-y-6">
              {/* Target Audience Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Target Audience</label>
                  {targetType === "INDIVIDUAL" && selectedUsers.length > 0 && (
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {selectedUsers.length} user(s) selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType("INDIVIDUAL")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      targetType === "INDIVIDUAL"
                        ? "bg-amber-500/10 border-amber-500/50 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Individual User(s)</div>
                      <div className="text-[10px] text-neutral-500">Target specific members or hosts</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("GROUP")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      targetType === "GROUP"
                        ? "bg-amber-500/10 border-amber-500/50 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Group Broadcast</div>
                      <div className="text-[10px] text-neutral-500">Send by role or host status</div>
                    </div>
                  </button>
                </div>

                {/* Individual Search Picker */}
                {targetType === "INDIVIDUAL" && (
                  <div className="space-y-3 pt-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      {/* Search Input */}
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Search name, email, department..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                        />
                        {userSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setUserSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quick Role Filter & Batch Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="USER">Regular Users</option>
                          <option value="ORGANIZER">Organizers</option>
                          <option value="HOST">Hosts</option>
                          <option value="SUPER_ADMIN">Super Admins</option>
                        </select>

                        <button
                          type="button"
                          onClick={selectAllFiltered}
                          className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        {selectedUsers.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllSelected}
                            className="text-[11px] font-bold text-neutral-400 hover:text-red-400 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Selected Users Chips */}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedUsers.map((u) => (
                          <span
                            key={u.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold"
                          >
                            <span>{u.name || u.fullName || u.email}</span>
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(u)}
                              className="text-amber-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* User Search Results List */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-h-56 overflow-y-auto divide-y divide-neutral-900 shadow-xl">
                      {searchingUsers ? (
                        <div className="p-4 text-center text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Fetching users...</span>
                        </div>
                      ) : userSearchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-500 italic">
                          No users found matching &ldquo;{userSearchTerm}&rdquo;
                        </div>
                      ) : (
                        userSearchResults.map((u) => {
                          const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleUserSelection(u)}
                              className={`p-2.5 flex items-center justify-between hover:bg-neutral-900/80 cursor-pointer transition text-xs ${
                                isSelected ? "bg-amber-500/10" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-amber-500 border-amber-500 text-black"
                                      : "border-neutral-700 bg-neutral-900"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-white truncate">
                                    {u.name || u.fullName || "User"}
                                  </div>
                                  <div className="text-neutral-400 text-[11px] font-mono truncate">{u.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {u.hostApplication && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono uppercase border border-purple-500/30">
                                    Host ({u.hostApplication.status})
                                  </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase font-mono">
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Group Selector */}
                {targetType === "GROUP" && (
                  <div className="pt-2">
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                    >
                      <option value="ALL_USERS">All Registered Platform Users</option>
                      <option value="ORGANIZERS">All Organizers &amp; Event Creators</option>
                      <option value="PENDING_HOSTS">Pending Host Verification Applicants</option>
                      <option value="VERIFIED_HOSTS">Verified Approved Hosts</option>
                      <option value="ATTENDEES">Registered Event Attendees</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Communication Purpose / Mode */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase text-neutral-400">Communication Purpose</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: "INFO_REQUEST",
                      label: "Request Info",
                      desc: "Ask clarification or details",
                      icon: HelpCircle,
                      activeColor: "bg-sky-500/10 border-sky-500/50 text-white",
                    },
                    {
                      id: "DOCUMENT_REQUEST",
                      label: "Document Request",
                      desc: "Ask for verification proofs",
                      icon: FileText,
                      activeColor: "bg-purple-500/10 border-purple-500/50 text-white",
                    },
                    {
                      id: "MEDIA_REQUEST",
                      label: "Media Request",
                      desc: "Request high-res banners/video",
                      icon: Sparkles,
                      activeColor: "bg-amber-500/10 border-amber-500/50 text-white",
                    },
                    {
                      id: "NOTIFICATION",
                      label: "Notification",
                      desc: "System update or announcement",
                      icon: Mail,
                      activeColor: "bg-emerald-500/10 border-emerald-500/50 text-white",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCommType(item.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          commType === item.id
                            ? item.activeColor
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-400 mb-1" />
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">
                    Subject Line <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      commType === "INFO_REQUEST"
                        ? "e.g. Action Required: Clarification regarding Host Verification Application"
                        : commType === "DOCUMENT_REQUEST"
                        ? "e.g. Action Required: Please provide College Permission NOC"
                        : "e.g. Important Platform Notice & Governance Update"
                    }
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-neutral-400">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Red Alert)</option>
                  </select>
                </div>
              </div>

              {/* Request Specific Fields (Info Request, Document Request, Media Request) */}
              {commType !== "NOTIFICATION" && (
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase">
                    {commType === "INFO_REQUEST" ? <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>
                      {commType === "INFO_REQUEST"
                        ? "Information & Clarification Specifications"
                        : "Requested Document / Media Specifications"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase text-neutral-400">
                        {commType === "INFO_REQUEST" ? "Topic / Information Needed" : "Document / Media Type"}{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          commType === "INFO_REQUEST"
                            ? "e.g. Venue Safety Plan / Organizer ID Details"
                            : "e.g. Govt ID / Campus Approval NOC / Pitch Deck"
                        }
                        value={requiredDocType}
                        onChange={(e) => setRequiredDocType(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono uppercase text-neutral-400">Response Deadline (Optional)</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-neutral-400">
                      Specific Instructions &amp; Acceptance Criteria
                    </label>
                    <textarea
                      rows={2}
                      placeholder={
                        commType === "INFO_REQUEST"
                          ? "e.g. Please explain how you plan to manage event ticketing and campus entry clearances."
                          : "e.g. Please upload a clear PDF scan or Google Drive link with viewing permissions enabled."
                      }
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-neutral-400">
                  Message Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide full context on why this information request or notification is being issued..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Dispatching Communications...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {targetType === "INDIVIDUAL"
                        ? `Dispatch to ${selectedUsers.length} Selected User(s)`
                        : `Broadcast to ${targetGroup.replace(/_/g, " ")}`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <div className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>User Email &amp; App Preview</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="border-b border-neutral-800 pb-3">
                <span
                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    priority === "URGENT"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : priority === "HIGH"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : commType === "INFO_REQUEST"
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {priority} Priority &bull; {commType.replace(/_/g, " ")}
                </span>
                <h3 className="text-base font-black text-white mt-2">{subject || "Administrative Notice Subject"}</h3>
              </div>

              <div className="text-xs text-neutral-300 space-y-2">
                <p>Hello <strong>User Name</strong>,</p>
                <p className="text-neutral-400 leading-relaxed whitespace-pre-line">
                  {message || "The body of your message will appear here in the user's email client and in-app notification center."}
                </p>
              </div>

              {commType !== "NOTIFICATION" && (
                <div className="p-3.5 bg-neutral-900 border-l-4 border-amber-500 rounded-lg space-y-2">
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    {commType === "INFO_REQUEST" ? "Information / Clarification Needed:" : "Required Submission:"}
                  </div>
                  <div className="text-xs font-bold text-white">
                    {requiredDocType || (commType === "INFO_REQUEST" ? "Requested Clarifications" : "Required Document")}
                  </div>
                  {instructions && <div className="text-[11px] text-neutral-400 italic">&ldquo;{instructions}&rdquo;</div>}
                  {deadline && (
                    <div className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Response Deadline: {deadline}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <div className="w-full py-2.5 rounded-lg bg-amber-500 text-black text-center font-black text-xs">
                  {commType === "INFO_REQUEST"
                    ? "Submit Clarifications & Answers \u2192"
                    : commType !== "NOTIFICATION"
                    ? "Submit Response & Upload Document \u2192"
                    : "Go to Dashboard \u2192"}
                </div>
                <p className="text-[10px] text-neutral-500 text-center mt-2">
                  Responses are received and reviewed directly in the admin console.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: SENT OUTBOX & CAMPAIGNS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "outbox" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-amber-500" />
              <span>Sent Communications History</span>
            </h2>
            <button
              onClick={() => fetchCampaigns(true)}
              className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${campaignsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {campaignsLoading ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-neutral-400 font-mono">Loading outbox...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Communications Sent Yet</h3>
              <p className="text-xs text-neutral-400">All dispatched individual and group broadcasts will be logged here.</p>
            </div>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Subject &amp; Type</th>
                    <th className="px-5 py-3.5">Target Audience</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Recipients</th>
                    <th className="px-5 py-3.5">Responses</th>
                    <th className="px-5 py-3.5">Sent Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {campaigns.map((comm) => (
                    <tr key={comm.id} className="hover:bg-neutral-900/50 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{comm.subject}</div>
                        <div className="text-amber-400 text-[11px] font-mono">
                          {comm.type === "INFO_REQUEST"
                            ? `Info Request: ${comm.requiredDocType || comm.subject}`
                            : comm.requiredDocType
                            ? `Doc Request: ${comm.requiredDocType}`
                            : comm.type}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-neutral-300">
                        {comm.targetType === "GROUP" ? comm.targetGroup : "Individual Users"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            comm.priority === "URGENT"
                              ? "bg-red-500/20 text-red-400"
                              : comm.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {comm.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-white font-bold">{comm.stats?.totalRecipients || 0}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-emerald-400 font-mono">
                          {comm.stats?.totalResponded || 0} ({comm.stats?.responseRate || 0}%)
                        </div>
                        {comm.stats?.pendingReview > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            {comm.stats.pendingReview} pending review
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-neutral-400 font-mono text-[11px]">
                        {formatDate(comm.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSearchQuery(comm.subject);
                            setActiveTab("responses");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Responses</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REVIEW & INSPECTION MODAL (Admin Only)                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {reviewModalOpen && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">
                  Administrative Response &amp; Clarification Review
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Submission from {selectedResponse.user?.name || selectedResponse.email}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">{selectedResponse.email}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
              <div className="text-xs font-mono text-neutral-400 uppercase">Original Request Details</div>
              <div className="text-sm font-bold text-white">{selectedResponse.communication?.subject}</div>
              <div className="text-xs text-amber-400 font-mono">
                Topic / Requirement: {selectedResponse.communication?.requiredDocType || "Custom Submission"}
              </div>
              {selectedResponse.communication?.instructions && (
                <p className="text-xs text-neutral-400 italic">
                  Instructions: &ldquo;{selectedResponse.communication?.instructions}&rdquo;
                </p>
              )}
            </div>

            {/* User Submission Payload */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-neutral-400 uppercase">User Submitted Response &amp; Details</div>

              {/* Written Notes / Answer */}
              {selectedResponse.responseNotes && (
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Written Answer / Clarification</span>
                  <p className="text-xs text-white leading-relaxed whitespace-pre-line">
                    {selectedResponse.responseNotes}
                  </p>
                </div>
              )}

              {/* Document Link */}
              {selectedResponse.documentUrl ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Attached Document Link</span>
                    <div className="text-xs text-white font-mono truncate max-w-sm sm:max-w-md">
                      {selectedResponse.documentUrl}
                    </div>
                  </div>
                  <a
                    href={selectedResponse.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs hover:bg-blue-400 transition flex items-center gap-1.5 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Link</span>
                  </a>
                </div>
              ) : (
                !selectedResponse.responseNotes && (
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-500 italic">
                    No external link or written notes provided.
                  </div>
                )
              )}
            </div>

            {/* Review Decision Form */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-neutral-400">Review Decision Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { status: "APPROVED", label: "Approve", color: "hover:border-emerald-500" },
                    { status: "FOLLOW_UP_REQUIRED", label: "Request Revisions", color: "hover:border-purple-500" },
                    { status: "REJECTED", label: "Reject", color: "hover:border-red-500" },
                    { status: "REVIEWED", label: "Mark Reviewed", color: "hover:border-blue-500" },
                  ].map((opt) => (
                    <button
                      key={opt.status}
                      type="button"
                      onClick={() => setAdminReviewStatus(opt.status)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        adminReviewStatus === opt.status
                          ? "bg-amber-500 text-black border-amber-500"
                          : `bg-neutral-900 border-neutral-800 text-neutral-300 ${opt.color}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-neutral-400">
                  Admin Feedback / Notes (Sent to User in App)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add feedback explaining your approval, requested revisions, or next steps..."
                  value={adminReviewNotes}
                  onChange={(e) => setAdminReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs border border-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateReview}
                disabled={updatingReview}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {updatingReview ? "Saving Review..." : "Save & Notify User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
