"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  FileText,
  Building2,
  MapPin,
  DollarSign,
  Filter,
  RefreshCw,
  Eye,
  Star,
  Users,
  MessageSquare,
  ChevronRight,
  Send,
  AlertCircle,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import { fetchWithClientCache, invalidateClientCache } from "@/lib/clientCache";

const OPPORTUNITY_TYPES = [
  "Internship",
  "Full-time",
  "Freelance",
  "Bounty",
  "Part-time",
  "Contract",
];

const APPLICATION_STATUSES = [
  { id: "ALL", label: "All Statuses" },
  { id: "PENDING", label: "Pending Review", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "REVIEWING", label: "In Review", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "SHORTLISTED", label: "Shortlisted", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "ACCEPTED", label: "Accepted", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "REJECTED", label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

export default function AdminOpportunitiesPage() {
  const [activeTab, setActiveTab] = useState("listings"); // 'listings' | 'applications'

  // Opportunities state
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    pausedCount: 0,
    closedCount: 0,
    totalApplicationsCount: 0,
    pendingApplicationsCount: 0,
  });

  // Modal / Form state for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "Full-time",
    location: "Remote",
    salary: "",
    description: "",
    tags: "",
    requirements: "",
    applyLink: "",
    status: "ACTIVE",
    featured: false,
  });

  // Applications Inbox state
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");
  const [appOpportunityFilter, setAppOpportunityFilter] = useState("");
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Fetch opportunities
  const fetchOpportunities = useCallback(async (bypassCache = false) => {
    try {
      if (bypassCache) setIsRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const url = `/api/admin/opportunities?${params.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache,
        ttl: 15_000,
      });

      if (result.success && result.data?.success) {
        setOpportunities(result.data.items || []);
        if (result.data.stats) setStats(result.data.stats);
      } else if (!result.fromCache && result.error) {
        toast.error(result.error || "Failed to load opportunities");
      }
    } catch (err) {
      console.error("Error loading opportunities:", err);
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  // Fetch applications
  const fetchApplications = useCallback(async (bypassCache = false) => {
    try {
      setApplicationsLoading(true);
      const params = new URLSearchParams();
      if (appStatusFilter !== "ALL") params.append("status", appStatusFilter);
      if (appOpportunityFilter) params.append("opportunityId", appOpportunityFilter);
      if (appSearchQuery.trim()) params.append("search", appSearchQuery.trim());

      const url = `/api/admin/opportunities/applications?${params.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache,
        ttl: 15_000,
      });

      if (result.success && result.data?.success) {
        setApplications(result.data.items || []);
      } else if (!result.fromCache && result.error) {
        toast.error(result.error || "Failed to load applications");
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setApplicationsLoading(false);
    }
  }, [appStatusFilter, appOpportunityFilter, appSearchQuery]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.append("status", statusFilter);
        if (typeFilter !== "ALL") params.append("type", typeFilter);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());

        const url = `/api/admin/opportunities?${params.toString()}`;
        const result = await fetchWithClientCache(url, { ttl: 15_000 });

        if (!ignore) {
          if (result.success && result.data?.success) {
            setOpportunities(result.data.items || []);
            if (result.data.stats) setStats(result.data.stats);
          } else if (!result.fromCache && result.error) {
            toast.error(result.error || "Failed to load opportunities");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading opportunities:", err);
          toast.error("Failed to load opportunities");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    if (activeTab !== "applications") return;
    let ignore = false;
    async function loadApps() {
      try {
        const params = new URLSearchParams();
        if (appStatusFilter !== "ALL") params.append("status", appStatusFilter);
        if (appOpportunityFilter) params.append("opportunityId", appOpportunityFilter);
        if (appSearchQuery.trim()) params.append("search", appSearchQuery.trim());

        const url = `/api/admin/opportunities/applications?${params.toString()}`;
        const result = await fetchWithClientCache(url, { ttl: 15_000 });

        if (!ignore) {
          if (result.success && result.data?.success) {
            setApplications(result.data.items || []);
          } else if (!result.fromCache && result.error) {
            toast.error(result.error || "Failed to load applications");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading applications:", err);
        }
      } finally {
        if (!ignore) {
          setApplicationsLoading(false);
        }
      }
    }
    loadApps();
    return () => {
      ignore = true;
    };
  }, [activeTab, appStatusFilter, appOpportunityFilter, appSearchQuery]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedOpportunity(null);
    setFormData({
      title: "",
      company: "",
      type: "Full-time",
      location: "Remote",
      salary: "",
      description: "",
      tags: "",
      requirements: "",
      applyLink: "",
      status: "ACTIVE",
      featured: false,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (opp) => {
    setModalMode("edit");
    setSelectedOpportunity(opp);
    setFormData({
      title: opp.title || "",
      company: opp.company || "",
      type: opp.type || "Full-time",
      location: opp.location || "Remote",
      salary: opp.salary || "",
      description: opp.description || "",
      tags: Array.isArray(opp.tags) ? opp.tags.join(", ") : opp.tags || "",
      requirements: opp.requirements || "",
      applyLink: opp.applyLink || "",
      status: opp.status || "ACTIVE",
      featured: Boolean(opp.featured),
    });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.company.trim() || !formData.description.trim()) {
      toast.error("Please fill in Title, Company, and Description.");
      return;
    }

    try {
      setSubmitting(true);
      const isEdit = modalMode === "edit" && selectedOpportunity?.id;
      const url = isEdit
        ? `/api/admin/opportunities/${selectedOpportunity.id}`
        : "/api/admin/opportunities";
      const method = isEdit ? "PATCH" : "POST";

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        tags: tagsArray,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          isEdit ? "Opportunity updated successfully" : "Opportunity published successfully"
        );
        invalidateClientCache("/api/admin/opportunities");
        invalidateClientCache("/api/opportunities");
        setIsModalOpen(false);
        fetchOpportunities(true);
      } else {
        toast.error(data.error || "Failed to save opportunity");
      }
    } catch (err) {
      console.error("Save opportunity error:", err);
      toast.error("Network error while saving opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (oppId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/opportunities/${oppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Status updated to ${newStatus}`);
        invalidateClientCache("/api/admin/opportunities");
        invalidateClientCache("/api/opportunities");
        fetchOpportunities(true);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Quick Toggle Featured
  const handleToggleFeatured = async (opp) => {
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !opp.featured }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(opp.featured ? "Unmarked as featured" : "Marked as featured");
        invalidateClientCache("/api/admin/opportunities");
        invalidateClientCache("/api/opportunities");
        fetchOpportunities(true);
      } else {
        toast.error(data.error || "Failed to toggle featured");
      }
    } catch {
      toast.error("Failed to update featured flag");
    }
  };

  // Delete Opportunity
  const handleDeleteOpportunity = async (oppId) => {
    if (!confirm("Are you sure you want to permanently delete this opportunity and its applications?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/opportunities/${oppId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Opportunity deleted successfully");
        invalidateClientCache("/api/admin/opportunities");
        invalidateClientCache("/api/opportunities");
        fetchOpportunities(true);
      } else {
        toast.error(data.error || "Failed to delete opportunity");
      }
    } catch {
      toast.error("Network error while deleting opportunity");
    }
  };

  // Update Application Status
  const handleUpdateApplicationStatus = async (appId, newStatus, adminNotes) => {
    try {
      setUpdatingAppId(appId);
      const res = await fetch(`/api/admin/opportunities/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(adminNotes !== undefined ? { adminNotes } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Application status updated");
        invalidateClientCache("/api/admin/opportunities/applications");
        invalidateClientCache("/api/admin/opportunities");
        fetchApplications(true);
      } else {
        toast.error(data.error || "Failed to update application");
      }
    } catch {
      toast.error("Failed to update application");
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId) => {
    if (!confirm("Are you sure you want to delete this applicant submission?")) return;
    try {
      const res = await fetch(`/api/admin/opportunities/applications/${appId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Application deleted");
        invalidateClientCache("/api/admin/opportunities/applications");
        invalidateClientCache("/api/admin/opportunities");
        fetchApplications(true);
      } else {
        toast.error(data.error || "Failed to delete application");
      }
    } catch {
      toast.error("Failed to delete application");
    }
  };

  return (
    <div className="w-full px-6 sm:px-10 py-8 space-y-8 min-h-screen bg-black text-white">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Briefcase className="w-4 h-4" /> Career & Opportunities Management
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Job Opportunities Control Center</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Create, moderate, and manage job listings, internships, bounties, and applicant submissions across the ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (activeTab === "listings" ? fetchOpportunities(true) : fetchApplications(true))}
            disabled={isRefreshing || applicationsLoading}
            className="p-2.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh listings"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || applicationsLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post New Opportunity
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-neutral-500 flex items-center justify-between">
            <span>Total Roles</span>
            <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalCount}</div>
        </div>

        <div className="bg-neutral-950 border border-emerald-500/20 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-emerald-400/80 flex items-center justify-between">
            <span>Active Live</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.activeCount}</div>
        </div>

        <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-amber-400/80 flex items-center justify-between">
            <span>Paused</span>
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.pausedCount}</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-neutral-500 flex items-center justify-between">
            <span>Closed</span>
            <XCircle className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-black text-neutral-400">{stats.closedCount}</div>
        </div>

        <div className="bg-neutral-950 border border-purple-500/20 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-purple-400/80 flex items-center justify-between">
            <span>Applications</span>
            <FileText className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{stats.totalApplicationsCount}</div>
        </div>

        <div className="bg-neutral-950 border border-yellow-500/20 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase text-yellow-400/80 flex items-center justify-between">
            <span>Pending Review</span>
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-2xl font-black text-yellow-400">{stats.pendingApplicationsCount}</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 text-xs font-bold transition relative cursor-pointer flex items-center gap-2 ${
            activeTab === "listings" ? "text-amber-400" : "text-neutral-400 hover:text-white"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Opportunity Listings</span>
          <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
            {stats.totalCount}
          </span>
          {activeTab === "listings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 text-xs font-bold transition relative cursor-pointer flex items-center gap-2 ${
            activeTab === "applications" ? "text-amber-400" : "text-neutral-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Applications Inbox</span>
          {stats.pendingApplicationsCount > 0 ? (
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              {stats.pendingApplicationsCount} pending
            </span>
          ) : (
            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
              {stats.totalApplicationsCount}
            </span>
          )}
          {activeTab === "applications" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
          )}
        </button>
      </div>

      {/* TAB 1: LISTINGS VIEW */}
      {activeTab === "listings" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by job title, company, skills, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {["ALL", "ACTIVE", "PAUSED", "CLOSED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                    }`}
                  >
                    {st === "ALL" ? "All Status" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-neutral-900">
              <span className="text-[11px] font-mono text-neutral-500 uppercase shrink-0">Type:</span>
              {["ALL", ...OPPORTUNITY_TYPES].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                    typeFilter === type
                      ? "bg-white/15 text-white font-bold border border-white/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Listings List */}
          {loading ? (
            <div className="p-16 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-neutral-400 font-mono">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-16 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <Briefcase className="w-12 h-12 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Opportunities Found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No job postings match your filters. Click &quot;Post New Opportunity&quot; to publish your first role.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-lg transition"
              >
                + Post Opportunity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`bg-neutral-950 border rounded-xl p-5 space-y-4 transition flex flex-col justify-between ${
                    opp.featured
                      ? "border-amber-500/40 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-amber-500/5 to-neutral-950"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{opp.title}</h3>
                          {opp.featured && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-500" /> {opp.company}
                        </p>
                      </div>

                      {/* Status Dropdown Badge */}
                      <div className="flex items-center gap-2">
                        <select
                          value={opp.status}
                          onChange={(e) => handleToggleStatus(opp.id, e.target.value)}
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded border cursor-pointer ${
                            opp.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : opp.status === "PAUSED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-neutral-900 text-neutral-400 border-neutral-700"
                          }`}
                        >
                          <option value="ACTIVE" className="bg-neutral-900 text-emerald-400">ACTIVE</option>
                          <option value="PAUSED" className="bg-neutral-900 text-amber-400">PAUSED</option>
                          <option value="CLOSED" className="bg-neutral-900 text-neutral-400">CLOSED</option>
                        </select>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                        {opp.type}
                      </span>
                      {opp.location && (
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-500" /> {opp.location}
                        </span>
                      )}
                      {opp.salary && (
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {opp.salary}
                        </span>
                      )}
                    </div>

                    {/* Description snippet */}
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Tags */}
                    {Array.isArray(opp.tags) && opp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {opp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setAppOpportunityFilter(opp.id);
                        setActiveTab("applications");
                      }}
                      className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{opp.applicationsCount || 0} Applicants</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFeatured(opp)}
                        title={opp.featured ? "Remove featured" : "Make featured"}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          opp.featured
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditModal(opp)}
                        title="Edit Opportunity"
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteOpportunity(opp.id)}
                        title="Delete Opportunity"
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICATIONS INBOX */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          {/* Applications Filter Toolbar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search applicant name, email, role, or message..."
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {APPLICATION_STATUSES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setAppStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      appStatusFilter === st.id
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Opportunity Filter */}
            {appOpportunityFilter && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                <span className="text-neutral-400">
                  Filtering for specific opportunity ID:{" "}
                  <code className="text-amber-400 font-mono">{appOpportunityFilter}</code>
                </span>
                <button
                  onClick={() => setAppOpportunityFilter("")}
                  className="text-amber-400 hover:underline font-bold text-xs"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Applications Cards */}
          {applicationsLoading ? (
            <div className="p-16 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-neutral-400 font-mono">Loading applicant submissions...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <FileText className="w-12 h-12 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Applications Found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No applicant submissions match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{app.fullName}</h4>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
                          {app.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                        <a href={`mailto:${app.email}`} className="text-amber-400 hover:underline">
                          {app.email}
                        </a>
                        {app.phone && (
                          <a href={`tel:${app.phone}`} className="hover:text-white font-mono">
                            {app.phone}
                          </a>
                        )}
                        <span className="text-neutral-500 font-mono text-[10px]">
                          Applied {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2">
                      <select
                        value={app.status}
                        disabled={updatingAppId === app.id}
                        onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold px-3 py-1.5 rounded-lg text-amber-400 cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="REVIEWING">IN REVIEW</option>
                        <option value="SHORTLISTED">SHORTLISTED</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                      <button
                        onClick={() => handleDeleteApplication(app.id)}
                        title="Delete application"
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 border border-neutral-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Target Opportunity Banner */}
                  {app.opportunity && (
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Applied For:
                        </span>
                        <span className="font-bold text-white">{app.opportunity.title}</span>
                        <span className="text-neutral-400 ml-2 font-medium">at {app.opportunity.company}</span>
                      </div>
                      <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
                        {app.opportunity.type} • {app.opportunity.location}
                      </span>
                    </div>
                  )}

                  {/* Cover Message */}
                  {app.message && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                        Applicant Note:
                      </span>
                      <p className="text-xs text-neutral-300 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/80 leading-relaxed whitespace-pre-wrap">
                        {app.message}
                      </p>
                    </div>
                  )}

                  {/* Resume Info */}
                  {app.resumeName && (
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Resume File: {app.resumeName}</span>
                    </div>
                  )}

                  {/* Admin Notes Section */}
                  <div className="pt-2 border-t border-neutral-900 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add internal admin notes / interview feedback..."
                      defaultValue={app.adminNotes || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (app.adminNotes || "")) {
                          handleUpdateApplicationStatus(app.id, app.status, e.target.value);
                        }
                      }}
                      className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {modalMode === "edit" ? "Edit Opportunity" : "Create New Job Opportunity"}
                </h3>
                <p className="text-xs text-neutral-400">
                  Fill in the specifications for this position to publish it live to the explorer board.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Job Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Company / Organization <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NeonTech Labs"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Hybrid / Lucknow"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹80k - ₹100k or ₹20/hr"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Tags & Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, TypeScript, Solidity"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the opportunity responsibilities, team, and day-to-day work..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Requirements & Qualifications (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key technical requirements, prerequisites, or experience desired..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  External Application Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://company.com/careers/apply"
                  value={formData.applyLink}
                  onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-amber-500/50"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Leave empty if applicants should apply directly through the platform application modal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Listing Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Published Live)</option>
                    <option value="PAUSED">PAUSED (Hidden temporarily)</option>
                    <option value="CLOSED">CLOSED (Archived)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-neutral-200">
                      Feature on Top of Board
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{modalMode === "edit" ? "Update Opportunity" : "Publish Opportunity"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
