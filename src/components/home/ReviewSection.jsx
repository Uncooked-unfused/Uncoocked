"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

export default function ReviewSection() {
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    }
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    const reviewPayload = {
      userName: user?.fullName || user?.name || "Student Attendee",
      userEmail: user?.email || (typeof user === "string" ? user : "anonymous@student.com"),
      rating,
      comment: comment.trim(),
    };

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews((prev) => [data.review, ...prev]);
          setComment("");
          setRating(5);
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error("Could not post your review right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 border-t border-white/6 bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Compact Input Panel (Sticky/Fixed width) */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#0A0A0A] border border-white/8 rounded-xl p-5 space-y-3 shadow-md">
          <div className="space-y-0.5">
            <h3 className="text-[14px] font-bold tracking-tight">Ecosystem Feedback</h3>
            <p className="text-[11px] text-white/40">Attended an event? Share your thoughts raw.</p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div className="flex items-center justify-between bg-[#111111] border border-white/6 px-3 py-1.5 rounded-lg">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={() => setRating(star)}
                    className="text-sm transition-transform active:scale-90"
                  >
                    {star <= rating ? "⭐" : "✨"}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              required
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your brief review here..."
              className="w-full text-[11px] px-3 py-2 bg-[#111111] border border-white/8 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
            />

            <button
              type="submit"
              disabled={submitting}
              suppressHydrationWarning={true}
              className="w-full py-1.5 bg-[#A855F7] hover:bg-[#9333EA] text-white text-[11px] font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Submit Review"}
            </button>
          </form>
        </div>

        {/* Right Side: Horizontal Scrollable Strip Track */}
        <div className="w-full flex-1 min-w-0">
          <div className="mb-2 flex items-baseline justify-between border-b border-white/6 pb-1.5">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-white/60">Verified Attendee Logs</h4>
            <span className="text-[10px] font-mono text-white/30">{reviews.length} total logs</span>
          </div>

          {/* Left-to-Right Scrolling Container */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {reviews.length === 0 ? (
              <div className="w-full text-zinc-500 text-[11px] py-10 text-center border border-dashed border-white/6 rounded-xl">
                No active logs. Submit yours on the left to initialize the feed matrix!
              </div>
            ) : (
              reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="w-[260px] shrink-0 snap-start bg-[#111111] border border-white/8 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-white/20 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate max-w-[160px]">
                        {rev.userName}
                      </span>
                      <div className="flex text-[10px] shrink-0">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i}>⭐</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/75 font-normal leading-relaxed h-[44px] overflow-y-auto break-words select-none pr-1">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>
                  
                  <div className="text-[8px] text-white/30 font-mono border-t border-white/4 pt-1.5 mt-2 flex justify-between items-center">
                    <span>STATUS // VERIFIED</span>
                    <span>{formatDate(rev.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}