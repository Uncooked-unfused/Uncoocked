import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";

// 1. GET: Fetch paginated reviews with filters and summary stats
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const ratingFilter = searchParams.get("rating") || "ALL";
    const sortBy = searchParams.get("sortBy") || "createdAt_desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(ratingFilter !== "ALL"
        ? { rating: parseInt(ratingFilter, 10) }
        : {}),
      ...(search
        ? {
            OR: [
              { userName: { contains: search } },
              { userEmail: { contains: search } },
              { comment: { contains: search } },
            ],
          }
        : {}),
    };

    let orderBy = { createdAt: "desc" };
    if (sortBy === "createdAt_asc") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "rating_desc") {
      orderBy = { rating: "desc" };
    } else if (sortBy === "rating_asc") {
      orderBy = { rating: "asc" };
    }

    // Fetch reviews list, filtered total count, and global stats
    const [reviews, totalFiltered, allReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        select: { rating: true },
      }),
    ]);

    // Calculate rating breakdown and average score
    const totalAll = allReviews.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;

    for (const r of allReviews) {
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating] += 1;
      }
      sumRating += r.rating;
    }

    const avgRating = totalAll > 0 ? (sumRating / totalAll).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats: {
        totalReviews: totalAll,
        avgRating: parseFloat(avgRating),
        ratingCounts,
        fiveStarPercentage: totalAll > 0 ? Math.round((ratingCounts[5] / totalAll) * 100) : 0,
        criticalReviewsCount: ratingCounts[1] + ratingCounts[2],
      },
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Reviews Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Admin manual review creation
export const POST = withAdminRateLimit(async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const { userName, userEmail, rating, comment, reason } = await request.json();

    if (!userName || !userEmail || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields (userName, userEmail, rating, comment)" }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          userName: userName.trim(),
          userEmail: userEmail.trim().toLowerCase(),
          rating: ratingNum,
          comment: comment.trim(),
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "REVIEW_CREATED",
          newStatus: `Rating: ${ratingNum} Stars`,
          reason: reason || `Admin created review for ${userEmail.trim()}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Admin Review Error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
});
