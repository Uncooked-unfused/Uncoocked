import { prisma } from "@/server/db/prisma";
import { mockEvents } from "@/lib/mockData";

// Weights for recommendation calculation
const WEIGHTS = {
  INTEREST_MATCH: 0.40,
  TAG_SIMILARITY: 0.25,
  PREVIOUS_ENGAGEMENT: 0.20,
  POPULARITY: 0.15,
};

const safeJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const norm = (value) => (value || "").toLowerCase().trim();

export async function getRecommendedEvents(userEmail) {
  // Fetch only the fields we actually use (avoids pulling full event rows
  // for every past activity/registration).
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      interests: true,
      onboardingCompleted: true,
      activities: {
        select: { interactionType: true, event: { select: { tags: true } } },
      },
      registrations: {
        select: { eventId: true, event: { select: { tags: true } } },
      },
    },
  });

  const registeredEventIds = new Set(
    user ? user.registrations.map((r) => r.eventId) : []
  );

  let events = await prisma.event.findMany({
    where: {
      archived: false,
      status: { notIn: ["Completed", "completed"] },
      id: { notIn: Array.from(registeredEventIds) },
    },
  });

  // Plan: fall back to canonical mock events when the database has none
  // (e.g. before seeding), so the recommendation section stays populated.
  if (events.length === 0) {
    events = mockEvents
      .filter(
        (m) =>
          !m.archived &&
          (m.status || "").toLowerCase() !== "completed" &&
          !registeredEventIds.has(m.id)
      )
      .map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        category: m.category,
        description: m.description,
        bannerUrl: m.bannerUrl,
        location: m.location,
        popularityScore: m.popularityScore || 0,
        tags: JSON.stringify(m.tags || []),
        keywords: JSON.stringify(m.keywords || []),
        date: new Date(m.dateISO),
        archived: m.archived ?? false,
      }));
  }

  const userInterests = user && user.interests ? safeJsonArray(user.interests) : [];
  const userInterestSet = new Set(userInterests.map(norm));

  // No personalization signal: surface trending events, not "for you" recs.
  if (!user || !user.onboardingCompleted || userInterestSet.size === 0) {
    const fallback = [...events]
      .sort(
        (a, b) =>
          (b.popularityScore || 0) - (a.popularityScore || 0) || a.date - b.date
      )
      .slice(0, 10)
      .map((event) => ({
        ...event,
        recommendationReason: "Trending Event",
        recommendationScore: event.popularityScore || 0,
      }));
    return fallback;
  }

  // Build the user's engagement profile from past interactions.
  const savedTags = new Set();
  const registeredTags = new Set();
  const viewedTags = new Set();

  user.activities.forEach((activity) => {
    safeJsonArray(activity.event?.tags)
      .map(norm)
      .forEach((tag) => {
        if (activity.interactionType === "SAVE") savedTags.add(tag);
        else if (activity.interactionType === "VIEW") viewedTags.add(tag);
      });
  });
  user.registrations.forEach((reg) => {
    safeJsonArray(reg.event?.tags)
      .map(norm)
      .forEach((tag) => registeredTags.add(tag));
  });

  const scoredEvents = events.map((event) => {
    const eventTags = safeJsonArray(event.tags).map(norm);
    const eventKeywords = safeJsonArray(event.keywords).map(norm);
    const title = norm(event.title);
    const description = norm(event.description);
    const category = norm(event.category);
    const type = norm(event.type);

    let interestScore = 0;
    let reason = "Recommended for you";

    // Category/type is an explicit, exact interest match.
    const isCategoryMatch =
      userInterestSet.has(category) || userInterestSet.has(type);

    // Tags/keywords match by exact (normalized) equality to avoid false
    // substring hits (e.g. interest "art" should not match tag "martial arts").
    const tagHit = eventTags.some((tag) => userInterestSet.has(tag));
    const keywordHit = eventKeywords.some((kw) => userInterestSet.has(kw));

    // Free-text title/description legitimately use substring matching.
    const textHit = [...userInterestSet].some(
      (i) => title.includes(i) || description.includes(i)
    );

    if (isCategoryMatch) interestScore = 100;
    else if (tagHit || keywordHit || textHit) interestScore = 70;

    // Tag similarity + engagement profile.
    let tagScore = 0;
    let engagementScore = 0;

    eventTags.forEach((tag) => {
      if (savedTags.has(tag)) {
        engagementScore += 50;
        tagScore += 50;
      } else if (registeredTags.has(tag)) {
        engagementScore += 40;
        tagScore += 40;
      } else if (viewedTags.has(tag)) {
        engagementScore += 20;
        tagScore += 20;
      }
    });

    tagScore = Math.min(tagScore, 100);
    engagementScore = Math.min(engagementScore, 100);

    const popularityScore = Math.min(event.popularityScore || 0, 100);

    const score =
      interestScore * WEIGHTS.INTEREST_MATCH +
      tagScore * WEIGHTS.TAG_SIMILARITY +
      engagementScore * WEIGHTS.PREVIOUS_ENGAGEMENT +
      popularityScore * WEIGHTS.POPULARITY;

    // Relevance = actual match signal (interest + engagement). Popularity is
    // only a ranking tiebreaker, never a reason to recommend an event.
    const relevance = interestScore + engagementScore;

    if (isCategoryMatch) {
      reason = `Matches your interest in ${event.category || event.type}`;
    } else if (interestScore > 0) {
      reason = "Matches your selected interests";
    } else if (engagementScore > 40) {
      reason = "Similar to events you've interacted with";
    } else if (popularityScore > 80) {
      reason = "Highly popular right now";
    }

    return {
      event,
      score,
      reason,
      relevance,
    };
  });

  // FIX: only recommend events that are actually relevant to the user.
  const relevant = scoredEvents
    .filter((entry) => entry.relevance > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ event, score, reason }) => ({
      ...event,
      recommendationScore: score,
      recommendationReason: reason,
    }));

  return relevant;
}
