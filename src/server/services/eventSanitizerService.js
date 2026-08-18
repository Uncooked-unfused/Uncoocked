const VALID_EVENT_TYPES = [
  "Hackathon",
  "Fest",
  "Party",
  "Festive Night",
  "Meetup",
  "Workshop",
  "Competition",
  "Seminar",
  "MUN",
  "Model United Nations",
  "Other",
];

export function validateAndSanitizeEventData(data, isUpdate = false) {
  const errors = [];

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!isUpdate || data.title !== undefined) {
    if (!title || title.length < 3 || title.length > 150) {
      errors.push("Title must be between 3 and 150 characters.");
    }
    // Block common low-quality / garbage inputs
    if (/(no address|nahi bharunga|\b(asdf|qwerty|test|lol|none|na)\b)/i.test(title)) {
      errors.push("Please provide a meaningful event title.");
    }
  }

  const description = typeof data.description === "string" ? data.description.trim() : "";
  if (!isUpdate || data.description !== undefined) {
    if (!description || description.length < 10) {
      errors.push("Description must be at least 10 characters long.");
    }
  }

  const location = typeof data.location === "string" ? data.location.trim() : "";
  if (!isUpdate || data.location !== undefined) {
    if (!location || location.length < 3) {
      errors.push("Location must be at least 3 characters long.");
    }
    if (/(no address|nahi bharunga|\b(asdf|qwerty|test|lol|none|na)\b)/i.test(location)) {
      errors.push("Please provide a valid location address.");
    }
  }

  let eventDate = null;
  if (!isUpdate || data.date !== undefined) {
    if (!data.date) {
      errors.push("Event date is required.");
    } else {
      const parsed = new Date(data.date);
      if (isNaN(parsed.getTime())) {
        errors.push("Invalid event date format.");
      } else {
        eventDate = parsed;
      }
    }
  }

  let type = "Other";
  if (data.type && typeof data.type === "string") {
    const matched = VALID_EVENT_TYPES.find(
      (t) => t.toLowerCase() === data.type.trim().toLowerCase()
    );
    type = matched || data.type.trim();
  }

  const category =
    typeof data.category === "string" && data.category.trim()
      ? data.category.trim()
      : type;

  let capacity = 100;
  if (data.capacity !== undefined && data.capacity !== null) {
    const parsedCap = parseInt(data.capacity, 10);
    if (isNaN(parsedCap) || parsedCap <= 0 || parsedCap > 100000) {
      errors.push("Capacity must be a positive integer up to 100,000.");
    } else {
      capacity = parsedCap;
    }
  }

  let price = 0;
  if (data.price !== undefined && data.price !== null) {
    const parsedPrice = parseFloat(data.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push("Price cannot be negative.");
    } else {
      price = parsedPrice;
    }
  }

  let customRegistrationCount = undefined;
  if (data.customRegistrationCount !== undefined) {
    if (data.customRegistrationCount === null || data.customRegistrationCount === "") {
      customRegistrationCount = null;
    } else {
      const parsedCustom = parseInt(data.customRegistrationCount, 10);
      if (isNaN(parsedCustom) || parsedCustom < 0 || parsedCustom > 10000000) {
        errors.push("Custom registrations must be a non-negative number.");
      } else {
        customRegistrationCount = parsedCustom;
      }
    }
  }

  let customOrganizerName = undefined;
  if (data.customOrganizerName !== undefined) {
    if (data.customOrganizerName === null || data.customOrganizerName === "") {
      customOrganizerName = null;
    } else if (typeof data.customOrganizerName === "string") {
      customOrganizerName = data.customOrganizerName.trim().slice(0, 120) || null;
    }
  }

  // Handle bannerUrl: Allow custom uploaded data URLs (up to 5MB) or standard image URLs
  let bannerUrl = typeof data.bannerUrl === "string" ? data.bannerUrl.trim() : "";
  if (bannerUrl.startsWith("data:image")) {
    if (bannerUrl.length > 5 * 1024 * 1024) {
      errors.push("Custom uploaded banner image is too large (max 5MB). Please upload a smaller image.");
    }
  }

  // Normalize tags and keywords to JSON string arrays
  let tagsStr = "[]";
  if (Array.isArray(data.tags)) {
    tagsStr = JSON.stringify(data.tags.map((t) => String(t).trim()));
  } else if (typeof data.tags === "string" && data.tags.trim()) {
    try {
      const parsed = JSON.parse(data.tags);
      tagsStr = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([data.tags.trim()]);
    } catch {
      tagsStr = JSON.stringify(data.tags.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }

  let keywordsStr = "[]";
  if (Array.isArray(data.keywords)) {
    keywordsStr = JSON.stringify(data.keywords.map((k) => String(k).trim()));
  } else if (typeof data.keywords === "string" && data.keywords.trim()) {
    try {
      const parsed = JSON.parse(data.keywords);
      keywordsStr = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([data.keywords.trim()]);
    } catch {
      keywordsStr = JSON.stringify(data.keywords.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title,
      type,
      category,
      description,
      location,
      date: eventDate,
      capacity,
      price,
      bannerUrl,
      googleMapsUrl: typeof data.googleMapsUrl === "string" ? data.googleMapsUrl.trim() : "",
      ticketType: data.ticketType || (price > 0 ? "Paid" : "Free"),
      waitlistEnabled: data.waitlistEnabled ?? true,
      zone: typeof data.zone === "string" ? data.zone.trim() : null,
      city: typeof data.city === "string" ? data.city.trim() : "Lucknow",
      state: typeof data.state === "string" ? data.state.trim() : "Uttar Pradesh",
      country: typeof data.country === "string" ? data.country.trim() : "India",
      tags: tagsStr,
      keywords: keywordsStr,
      customRegistrationCount,
      customOrganizerName,
    },
  };
}
