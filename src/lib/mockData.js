// Canonical mock event data — single source of truth for both the UI
// (event explorer, dashboard, recommendations) and the DB seed (prisma/seed.js).
// Shape mirrors the Prisma `Event` model so merged lists stay consistent.

export const mockEvents = [
  {
    id: "cultural-fest",
    bannerUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
    title: "Annual Cultural Fest 2026",
    type: "Fest",
    category: "Cultural Events",
    date: "20/06/2026",
    dateISO: "2026-06-20",
    location: "Main Campus Arena",
    zone: "Gomti Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Inter-college cultural showcase. Compete in street plays, battle of bands, classical dance, and fashion shows.",
    schedule: `
## Day 1 - 20/06/2026
- **9:00 AM** - Registration & Inauguration Ceremony
- **11:00 AM** - Folk Dance & Street Play Rounds
- **6:00 PM** - Classical Music Solos

## Day 2 - 21/06/2026
- **10:00 AM** - Choreography & Western Dance Rounds
- **2:00 PM** - Fine Arts & Poetry Slams
- **7:00 PM** - DJ Night & Rock Band Prelims

## Day 3 - 22/06/2026
- **11:00 AM** - Fashion Show Finale
- **3:00 PM** - Celebrity Guest Performance
- **5:00 PM** - Valedictory & Awards Distribution
    `,
    prizePool: `
## Total Prizes: ₹20,000 + Trophies
- **🥇 Best Cultural Contingent** - Trophy + ₹5,000
- **🥈 Runner-up College** - Trophy + ₹3,000
- **🎭 Best Street Play Crew** - ₹2,000
- **🎸 Battle of Bands Winner** - ₹3,000
    `,
    bulletinUpdates: [
      {
        id: "u1",
        date: "16/06/2026",
        title: "Registration Deadline Extended!",
        content: "Contingent registration is open until 18/06/2026.",
      },
      {
        id: "u2",
        date: "15/06/2026",
        title: "Celebrity Guest Confirmed",
        content:
          "Rock star VIP guest lineup is locked for the final night performance!",
      },
    ],
    tags: ["dance", "music", "fashion", "drama"],
    keywords: ["cultural", "fest", "bands", "show"],
    popularityScore: 85,
    ticketType: "Paid",
    price: 49.99,
    capacity: 2000,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
  },
  {
    id: "freshers-party",
    bannerUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=60",
    title: "Campus Freshers Welcome Party",
    type: "Party",
    category: "Entertainment",
    date: "15/07/2026",
    dateISO: "2026-07-15",
    location: "Campus Green Lawn",
    zone: "Hazratganj",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Join us for the official welcome mixer for incoming freshers. Live music, food courts, and network games.",
    schedule: `
## Day 1 - 15/07/2026
- **5:00 PM** - Entry & Freshers Identity Kit distribution
- **6:00 PM** - Principal Welcoming Address
- **6:30 PM** - Freshers Talent Hunt & Icebreakers
- **8:00 PM** - DJ Set & Dinner Buffet opens
    `,
    prizePool: `
## Awards & Freshers Titles
- **👑 Mr. & Ms. Fresher 2026** - ₹1,000 Gift Vouchers + Sash
- **🌟 Best Talent Performer** - ₹500 Voucher
    `,
    bulletinUpdates: [
      {
        id: "u3",
        date: "16/06/2026",
        title: "Dress Code Announced",
        content: "The theme is Retro Neon. Come dressed in neon colors!",
      },
    ],
    tags: ["party", "music", "social", "freshers"],
    keywords: ["mixer", "welcome", "dj", "fun"],
    popularityScore: 90,
    ticketType: "Free",
    capacity: 1500,
    waitlistEnabled: false,
    status: "Active",
    archived: false,
  },
  {
    id: "dandiya-night",
    bannerUrl:
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop&q=60",
    title: "Grand Dandiya Festive Night 2026",
    type: "Festive Night",
    category: "Cultural Events",
    date: "12/10/2026",
    dateISO: "2026-10-12",
    location: "Auditorium Hall, Main Campus",
    zone: "Aliganj",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Celebrate the festive season with traditional Garba, live orchestra, authentic food stalls, and prizes.",
    schedule: `
## Day 1 - 12/10/2026
- **6:00 PM** - Entry gates open & Dandiya sticks pickup
- **6:30 PM** - Traditional Aarti & Diya Lighting
- **7:00 PM** - Garba Circle 1 Begins
- **9:00 PM** - Traditional Food Court Open
- **11:00 PM** - Dandiya Dance Awards Ceremony
    `,
    prizePool: `
## Festive Dress & Dance Awards
- **🥇 Best Dancer (Male & Female)** - ₹1,000 each + Golden Dandiya Stick
- **👗 Best Traditional Dress** - ₹1,000 Voucher
    `,
    bulletinUpdates: [],
    tags: ["dance", "traditional", "festival", "music"],
    keywords: ["garba", "dandiya", "festive", "gujarati"],
    popularityScore: 70,
    ticketType: "Paid",
    price: 15.0,
    capacity: 500,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
  },
  {
    id: "ai-workshop",
    bannerUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=60",
    title: "Generative AI & LLM Workshop",
    type: "Workshop",
    category: "AI & Machine Learning",
    date: "02/07/2026",
    dateISO: "2026-07-02",
    location: "Tech Lab 102, Main Campus",
    zone: "Indira Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Learn prompt engineering, vector databases, embeddings, and building active AI agents with PyTorch.",
    schedule: `
## Day 1 - 02/07/2026
- **10:00 AM** - Introduction to Transformers & LLMs
- **12:00 PM** - Vector Database Setup (Pinecone/Chroma)
- **2:00 PM** - Building an AI Agent from Scratch
- **4:00 PM** - API keys distribution & sandbox trials
    `,
    prizePool: `
## Certificate & Compute Credits
- Certified completion certificates for all registered student attendees.
- ₹200 in OpenAI sandbox API credits.
    `,
    bulletinUpdates: [],
    tags: ["ai", "machine learning", "llm", "programming", "technology"],
    keywords: ["pytorch", "agent", "prompt engineering", "tech"],
    popularityScore: 95,
    ticketType: "Free",
    capacity: 2,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
  },
  {
    id: "entrepreneur-meetup",
    bannerUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=60",
    title: "Founder & Startup Meetup",
    type: "Meetup",
    category: "Startups",
    date: "18/07/2026",
    dateISO: "2026-07-18",
    location: "Incubation Center, Campus",
    zone: "Vikas Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Connect with startup founders, exchange ideas, and network with active angel mentors and VC investors.",
    schedule: `
## Day 1 - 18/07/2026
- **2:00 PM** - Networking & Coffee Mixer
- **3:00 PM** - Panel: Fundraising in College
- **4:30 PM** - 60-second Elevator Pitch Round
- **6:00 PM** - Open Networking Mixer
    `,
    prizePool: `
## Incubator Fast-Track & Mentorship
- Top 3 student startup pitches win 6-month free incubator seats.
- Direct mentoring sessions with ecosystem venture capitalists.
    `,
    bulletinUpdates: [],
    tags: ["startups", "business", "networking", "finance"],
    keywords: ["founder", "vc", "pitch", "angel"],
    popularityScore: 80,
    ticketType: "Paid",
    price: 5.0,
    capacity: 50,
    waitlistEnabled: false,
    status: "Active",
    archived: false,
  },
  {
    id: "hackathon-2026",
    bannerUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60",
    title: "Campus Innovation Hackathon 2026",
    type: "Hackathon",
    category: "Programming",
    date: "20/06/2026",
    dateISO: "2026-06-20",
    location: "Tech Hub Building, Main Campus",
    zone: "Gomti Nagar",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Build prototypes, join project teams, and pitch ideas for a ₹50k prize pool. All skill levels welcome.",
    schedule: `
## Day 1 - 20/06/2026
- **9:00 AM** - Registration & Breakfast
- **10:00 AM** - Opening Keynote
- **11:00 AM** - Team Formation & Hackathon Begins

## Day 2 - 21/06/2026
- **8:00 AM** - Breakfast & Hacking Continues
- **3:00 PM** - Mentor Office Hours

## Day 3 - 22/06/2026
- **12:00 PM** - Hacking Ends
- **2:00 PM** - Project Presentations
- **4:00 PM** - Judging & Awards Ceremony
    `,
    prizePool: `
## Total Prize Pool: ₹50,000
- **🥇 First Place** - ₹15,000
- **🥈 Second Place** - ₹10,000
- **🥉 Third Place** - ₹5,000
- **Category Winners** - ₹5,000 each (Mobile, AI/ML, Design)
    `,
    bulletinUpdates: [
      {
        id: "u4",
        date: "16/06/2026",
        title: "Hackathon Registration Now Open!",
        content: "Team registration is now live. Sign up by 18/06/2026.",
      },
      {
        id: "u5",
        date: "15/06/2026",
        title: "Mentor List Released",
        content: "Meet our amazing panel of mentors from top tech companies.",
      },
    ],
    tags: ["hackathon", "coding", "technology", "development"],
    keywords: ["code", "software", "innovation", "prize"],
    popularityScore: 100,
    ticketType: "Free",
    capacity: 300,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
  },
  {
    id: "lucknow-mun-2026",
    bannerUrl:
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=60",
    title: "Lucknow Youth Model United Nations (MUN) 2026",
    type: "MUN",
    category: "Debate & Diplomacy",
    date: "19/09/2026",
    dateISO: "2026-09-19",
    location: "Senate Hall, Lucknow University",
    zone: "Hazratganj",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    description:
      "Join student delegates across the country to debate global affairs, draft UN resolutions, and master international diplomacy.",
    schedule: `
## Day 1 - 19/09/2026
- **9:00 AM** - Registration & Delegate Kit Distribution
- **10:30 AM** - Opening Plenary & Keynote Address
- **11:30 AM** - Committee Session 1: General Assembly & UNHRC
- **2:00 PM** - Lunch & Informal Caucus
- **3:30 PM** - Committee Session 2: Crisis Simulation
- **6:00 PM** - Press Conference & Delegate Social

## Day 2 - 20/09/2026
- **9:30 AM** - Committee Session 3: Resolution Drafting
- **1:00 PM** - Working Lunch & Lobbying
- **2:30 PM** - Voting & Passing of UN Resolutions
- **4:30 PM** - Closing Ceremony & Best Delegate Awards
    `,
    prizePool: `
## Best Delegate Awards & Cash Grants
- **🥇 Best Delegate (UNGA & UNSC)** - ₹10,000 + Golden Gavel + Certificate
- **🥈 High Commendation** - ₹5,000 + Trophy
- **🌟 Special Mention & Best Delegation** - Certificates & Commendations
    `,
    bulletinUpdates: [
      {
        id: "u-mun-1",
        date: "15/08/2026",
        title: "Country Matrix Released",
        content: "Country and committee allocations are now available for all registered delegates.",
      },
    ],
    tags: ["mun", "diplomacy", "debate", "united nations", "leadership"],
    keywords: ["un", "delegates", "committee", "resolutions", "politics"],
    popularityScore: 92,
    ticketType: "Paid",
    price: 499.0,
    capacity: 250,
    waitlistEnabled: true,
    status: "Active",
    archived: false,
  },
];

// Merge DB events with the mock fallback, deduping by id (DB version wins,
// since it carries the full schema). Prevents the same mock event from
// appearing twice once it has been seeded into the database.
export function mergeWithMockEvents(dbEvents = []) {
  const byId = new Map();
  for (const event of dbEvents) {
    byId.set(event.id, event);
  }
  for (const mock of mockEvents) {
    if (!byId.has(mock.id)) byId.set(mock.id, mock);
  }
  return Array.from(byId.values());
}

export const mockOpportunities = [
  {
    id: "opp-1",
    title: "Frontend Developer Intern",
    company: "NeonTech Labs",
    type: "Internship",
    location: "Remote",
    salary: "₹20/hr",
    description:
      "Join our core frontend team to build next-gen interactive React and Next.js applications.",
    tags: ["React", "Next.js", "Tailwind"],
    requirements: "Experience with React, Next.js, and CSS/Tailwind. Passion for high-quality UI/UX.",
    applyLink: "",
    status: "ACTIVE",
    featured: true,
  },
  {
    id: "opp-2",
    title: "Smart Contract Bounty",
    company: "DeFi Protocols",
    type: "Bounty",
    location: "Remote",
    salary: "₹500 - ₹2000",
    description:
      "Find and patch vulnerabilities in our new liquidity pool staking contract on Ethereum.",
    tags: ["Solidity", "Security", "Web3"],
    requirements: "Proficiency in Solidity, EVM internals, and smart contract audit procedures.",
    applyLink: "",
    status: "ACTIVE",
    featured: true,
  },
  {
    id: "opp-3",
    title: "Junior Data Scientist",
    company: "Quantum Analytics",
    type: "Full-time",
    location: "New York, NY",
    salary: "₹80k - ₹100k",
    description:
      "Analyze large datasets and train predictive machine learning models for fintech clients.",
    tags: ["Python", "PyTorch", "SQL"],
    requirements: "Strong background in statistics, Python data stack (pandas, PyTorch/scikit-learn), and SQL queries.",
    applyLink: "",
    status: "ACTIVE",
    featured: false,
  },
  {
    id: "opp-4",
    title: "UI/UX Design Freelance",
    company: "Creative Studios",
    type: "Freelance",
    location: "Hybrid",
    salary: "₹40/hr",
    description:
      "Design a high-converting landing page and onboarding flow for a new consumer app.",
    tags: ["Figma", "Prototyping", "User Research"],
    requirements: "Strong portfolio showing mobile/web design, Figma components and interactive prototypes.",
    applyLink: "",
    status: "ACTIVE",
    featured: false,
  },
  {
    id: "opp-5",
    title: "Backend Engineering Intern",
    company: "CloudScale Inc",
    type: "Internship",
    location: "San Francisco, CA",
    salary: "₹25/hr",
    description:
      "Help scale our Go microservices handling millions of concurrent requests daily.",
    tags: ["Go", "Kubernetes", "AWS"],
    requirements: "Familiarity with Go, relational databases, REST APIs, and containerization basics.",
    applyLink: "",
    status: "ACTIVE",
    featured: false,
  },
];

