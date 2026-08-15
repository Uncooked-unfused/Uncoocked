"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { toast } from "sonner";
import {
  Star,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  Plus,
  X,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  CheckCircle2,
} from "lucide-react";

import { getCachedAdminData, fetchWithClientCache, invalidateClientCache } from "@/lib/clientCache";

function ReviewsManagementContent() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    fiveStarPercentage: 0,
    criticalReviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals State
  const [batchModal, setBatchModal] = useState(false);
  const [batchReason, setBatchReason] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    userName: "",
    userEmail: "",
    rating: 5,
    comment: "",
    reason: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editModal, setEditModal] = useState(null); // review object
  const [editForm, setEditForm] = useState({
    userName: "",
    rating: 5,
    comment: "",
    reason: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [viewModal, setViewModal] = useState(null); // review object
  const [deleteModal, setDeleteModal] = useState(null); // review object
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Reviews
  const fetchReviews = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.set("search", debouncedSearch);
      if (ratingFilter !== "ALL") query.set("rating", ratingFilter);
      if (sortBy) query.set("sortBy", sortBy);
      query.set("page", page.toString());
      query.set("limit", "10");

      const url = `/api/admin/reviews?${query.toString()}`;
      const result = await fetchWithClientCache(url, {
        bypassCache: isManualRefresh,
        ttl: 15_000,
      });

      if (result.success && result.data?.success) {
        setReviews(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalCount(result.data.pagination.total || 0);
        }
        if (result.data.stats) {
          setStats(result.data.stats);
        }
      } else if (!result.fromCache) {
        toast.error(result.error || "Failed to load platform reviews");
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      toast.error("Network error while loading reviews");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, ratingFilter, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / deps change
    fetchReviews();
  }, [fetchReviews]);

  // Batch Select Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length && reviews.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Action
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      const res = await fetch("/api/admin/reviews/batch-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: selectedIds,
          action: "DELETE",
          reason: batchReason,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully removed ${data.processedCount} reviews!`);
        invalidateClientCache("/api/admin/reviews");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setSelectedIds([]);
        setBatchModal(false);
        setBatchReason("");
        fetchReviews(true);
      } else {
        toast.error(`Bulk deletion failed: ${data.error || res.statusText}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Create Review Action
  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!createForm.userName.trim() || !createForm.userEmail.trim() || !createForm.comment.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Review published successfully!");
        invalidateClientCache("/api/admin/reviews");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setCreateModal(false);
        setCreateForm({
          userName: "",
          userEmail: "",
          rating: 5,
          comment: "",
          reason: "",
        });
        fetchReviews(true);
      } else {
        toast.error(`Failed to create review: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (review) => {
    setEditModal(review);
    setEditForm({
      userName: review.userName || "",
      rating: review.rating || 5,
      comment: review.comment || "",
      reason: "",
    });
  };

  // Submit Edit Review
  const handleEditReview = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Review updated successfully!");
        invalidateClientCache("/api/admin/reviews");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setEditModal(null);
        fetchReviews(true);
      } else {
        toast.error(`Failed to update review: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Single Delete Review Action
  const handleDeleteReview = async () => {
    if (!deleteModal) return;
    setDeleteSubmitting(true);
    try {
      const query = new URLSearchParams();
      if (deleteReason) query.set("reason", deleteReason);

      const res = await fetch(`/api/admin/reviews/${deleteModal.id}?${query.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Review deleted successfully!");
        invalidateClientCache("/api/admin/reviews");
        invalidateClientCache("/api/admin/stats");
        invalidateClientCache("/api/admin/analytics");
        setDeleteModal(null);
        setDeleteReason("");
        fetchReviews(true);
      } else {
        toast.error(`Failed to delete review: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const ratingPills = [
    { label: "ALL RATINGS", value: "ALL" },
    { label: "5 STARS ★★★★★", value: "5" },
    { label: "4 STARS ★★★★", value: "4" },
    { label: "3 STARS ★★★", value: "3" },
    { label: "2 STARS ★★", value: "2" },
    { label: "1 STAR ★", value: "1" },
  ];

  const renderStars = (rating, size = "w-3.5 h-3.5") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-neutral-700"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Feedback Governance & Trust Administration
          </div>
          <h1 className="text-3xl font-black">Reviews & Testimonials Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Monitor attendee feedback, curate platform ratings, manage user testimonials, and enforce review moderation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Review
          </button>
          <button
            onClick={() => fetchReviews(true)}
            disabled={isRefreshing}
            className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Analytics & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Platform Reviews</span>
            <div className="p-2 rounded-lg bg-black/40 text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.totalReviews}</p>
            <p className="text-[10px] text-gray-500 mt-1">Total submitted user testimonials</p>
          </div>
        </div>

        {/* Average Rating Score Card */}
        <div className="bg-neutral-900 border border-amber-500/20 p-5 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Rating</span>
            <div className="p-2 rounded-lg bg-black/40 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black text-amber-400">{stats.avgRating.toFixed(1)}</p>
              <span className="text-xs text-gray-400 font-mono">/ 5.0</span>
            </div>
            <div className="mt-1">{renderStars(Math.round(stats.avgRating))}</div>
          </div>
        </div>

        {/* 5-Star Reviews Card */}
        <div className="bg-neutral-900 border border-emerald-500/20 p-5 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">5-Star Satisfaction</span>
            <div className="p-2 rounded-lg bg-black/40 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400">{stats.fiveStarPercentage}%</p>
            <p className="text-[10px] text-gray-500 mt-1">{stats.ratingCounts?.[5] || 0} reviews with 5 stars</p>
          </div>
        </div>

        {/* Critical Feedback Card */}
        <div className="bg-neutral-900 border border-rose-500/20 p-5 rounded-xl flex flex-col justify-between space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Critical Reviews (1-2★)</span>
            <div className="p-2 rounded-lg bg-black/40 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-rose-400">{stats.criticalReviewsCount}</p>
            <p className="text-[10px] text-gray-500 mt-1">Requires review & quality checks</p>
          </div>
        </div>
      </div>

      {/* Visual Rating Distribution Breakdown Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 shadow-md">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Rating Distribution Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.ratingCounts?.[stars] || 0;
            const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <button
                key={stars}
                onClick={() => {
                  setRatingFilter(String(stars));
                  setPage(1);
                }}
                className={`p-3 rounded-lg border text-left transition ${
                  ratingFilter === String(stars)
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-black/40 border-neutral-800 hover:border-neutral-700 text-gray-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <span className="font-mono text-gray-400">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stars >= 4 ? "bg-amber-400" : stars === 3 ? "bg-indigo-400" : "bg-rose-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reviews by user name, email, or comment text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500 shrink-0"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="rating_desc">Highest Rating (5★ → 1★)</option>
              <option value="rating_asc">Lowest Rating (1★ → 5★)</option>
            </select>
          </div>

          <span className="text-xs text-gray-500 font-mono shrink-0">
            Total Results: <strong className="text-white">{totalCount}</strong>
          </span>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
          {ratingPills.map((pill) => {
            const isActive = ratingFilter === pill.value;
            return (
              <button
                key={pill.value}
                onClick={() => {
                  setRatingFilter(pill.value);
                  setPage(1);
                  setSelectedIds([]);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  isActive
                    ? "bg-amber-500 text-black shadow-md"
                    : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:text-white"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Batch Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <CheckSquare className="w-4 h-4" /> Selected <span className="underline">{selectedIds.length}</span> reviews
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBatchModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete Selected
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-white underline ml-2">
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-gray-400 font-semibold uppercase tracking-wider">
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                  {selectedIds.length > 0 && selectedIds.length === reviews.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4">Author</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Review & Feedback</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Loading platform reviews...</span>
                  </div>
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500 space-y-2">
                  <MessageSquare className="w-8 h-8 text-neutral-700 mx-auto" />
                  <p className="font-bold text-gray-400">No reviews found</p>
                  <p className="text-[11px] text-gray-600">Try adjusting your search query or rating filter.</p>
                </td>
              </tr>
            ) : (
              reviews.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-neutral-800/40 transition ${
                      isSelected ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <td className="p-4">
                      <button onClick={() => toggleSelectRow(r.id)} className="text-gray-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 font-medium">
                      <div>
                        <p className="font-bold text-white flex items-center gap-1.5">
                          {r.userName || "Anonymous"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5 text-gray-600" /> {r.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border inline-flex items-center gap-1 ${
                            r.rating >= 4
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : r.rating === 3
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {r.rating} ★
                        </span>
                        <div>{renderStars(r.rating, "w-3 h-3")}</div>
                      </div>
                    </td>
                    <td className="p-4 max-w-md">
                      <p className="text-gray-300 line-clamp-2 text-xs leading-relaxed">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-gray-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewModal(r)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(r)}
                          title="Edit Review"
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(r)}
                          title="Delete Review"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-800 text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 transition"
            >
              ← Previous
            </button>
            <span className="text-gray-400">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded bg-neutral-800 disabled:opacity-40 hover:bg-neutral-700 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modal: View Full Review Details */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Review Feedback Inspection</h3>
                <p className="text-xs text-gray-400 font-mono">ID: {viewModal.id}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-semibold block">Author Name</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> {viewModal.userName}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-semibold block">Author Email</span>
                <span className="font-mono text-gray-300 text-[11px] truncate block">{viewModal.userEmail}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-semibold block">Rating</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-400">{viewModal.rating} Stars</span>
                  {renderStars(viewModal.rating)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-semibold block">Submitted At</span>
                <span className="font-mono text-gray-300 text-[11px] block">
                  {new Date(viewModal.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                Review Content:
              </span>
              <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                &ldquo;{viewModal.comment}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const reviewToEdit = viewModal;
                  setViewModal(null);
                  openEditModal(reviewToEdit);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Review
              </button>
              <button
                onClick={() => setViewModal(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Review */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Add Platform Review</h3>
                <p className="text-xs text-gray-400">Publish a new verified testimonial or review directly.</p>
              </div>
              <button onClick={() => setCreateModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={createForm.userName}
                  onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Author Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@example.com"
                  value={createForm.userEmail}
                  onChange={(e) => setCreateForm({ ...createForm, userEmail: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Star Rating *
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={createForm.rating}
                    onChange={(e) => setCreateForm({ ...createForm, rating: parseInt(e.target.value, 10) })}
                    className="bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                  {renderStars(createForm.rating, "w-4 h-4")}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the full review feedback..."
                  value={createForm.comment}
                  onChange={(e) => setCreateForm({ ...createForm, comment: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Optional Admin Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Imported from feedback survey"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50"
                >
                  {createSubmitting ? "Publishing..." : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Review */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Edit Platform Review</h3>
                <p className="text-xs text-gray-400 font-mono">Target: {editModal.userEmail}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditReview} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={editForm.userName}
                  onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Star Rating
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value, 10) })}
                    className="bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                  {renderStars(editForm.rating, "w-4 h-4")}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Review Comment
                </label>
                <textarea
                  rows={4}
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Moderation Reason (For Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="Reason for modifying review..."
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50"
                >
                  {editSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Single Review Delete Confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" /> Delete Review
            </h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to permanently delete this review by{" "}
              <strong className="text-white">{deleteModal.userName}</strong> ({deleteModal.userEmail})?
            </p>
            <div className="bg-black/50 border border-neutral-800 p-3 rounded-lg text-xs text-gray-300 italic">
              &ldquo;{deleteModal.comment}&rdquo;
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Inappropriate content, spam, or user requested removal"
                className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deleteSubmitting}
                className="px-5 py-2 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" /> Bulk Delete Reviews
            </h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">{selectedIds.length}</strong> selected reviews? This action will be logged in the audit trail.
            </p>
            <textarea
              value={batchReason}
              onChange={(e) => setBatchReason(e.target.value)}
              placeholder="Enter reason for bulk deletion..."
              className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBatchModal(false)}
                className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchSubmitting}
                className="px-5 py-2 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50"
              >
                {batchSubmitting ? "Deleting..." : "Execute Bulk Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading reviews management...</div>}>
      <ReviewsManagementContent />
    </Suspense>
  );
}
