import { PrismaClient } from '@prisma/client';
import { mockEvents, mockOpportunities } from '../src/lib/mockData.js';
import { hashPassword } from '../src/server/auth/password.js';

const prisma = new PrismaClient();

// Known credentials for the demo account. Demo is a normal account — it must
// be signed into with these, not auto-assigned to anonymous visitors.
const DEMO_EMAIL = 'demo@campus.edu';
const DEMO_PASSWORD = 'demo1234';

// Map the canonical mock event shape (lib/mockData.js) to the Prisma Event model.
function toEventCreate(mock, organizerId) {
  return {
    id: mock.id,
    title: mock.title,
    type: mock.type,
    category: mock.category,
    date: new Date(mock.dateISO),
    location: mock.location,
    zone: mock.zone,
    city: mock.city,
    state: mock.state,
    country: mock.country,
    description: mock.description,
    schedule: mock.schedule,
    prizePool: mock.prizePool,
    bannerUrl: mock.bannerUrl,
    tags: JSON.stringify(mock.tags || []),
    keywords: JSON.stringify(mock.keywords || []),
    popularityScore: mock.popularityScore || 0,
    ticketType: mock.ticketType || "Free",
    price: mock.price ? parseFloat(mock.price) : 0,
    capacity: mock.capacity || 100,
    waitlistEnabled: mock.waitlistEnabled ?? true,
    status: mock.status || "Active",
    archived: mock.archived ?? false,
    organizerId,
  };
}

function toOpportunityCreate(mock) {
  return {
    id: mock.id,
    title: mock.title,
    company: mock.company,
    type: mock.type,
    location: mock.location,
    salary: mock.salary || null,
    description: mock.description,
    tags: JSON.stringify(mock.tags || []),
    requirements: mock.requirements || null,
    applyLink: mock.applyLink || null,
    status: mock.status || "ACTIVE",
    featured: Boolean(mock.featured),
    postedBy: "SUPER_ADMIN",
  };
}

const sampleApplications = [
  {
    id: "app-sample-1",
    opportunityId: "opp-1",
    fullName: "Arjun Sharma",
    email: "arjun.sharma@example.edu",
    phone: "+91 98765 43210",
    role: "Frontend Developer Intern",
    message: "Passionate 3rd year CS student with 2 years of Next.js, TypeScript, and TailwindCSS experience. Built 3 production web apps.",
    resumeName: "Arjun_Sharma_Resume.pdf",
    resumeUrl: "https://example.com/resumes/arjun.pdf",
    status: "PENDING",
  },
  {
    id: "app-sample-2",
    opportunityId: "opp-2",
    fullName: "Priya Patel",
    email: "priya.patel@example.edu",
    phone: "+91 98123 45678",
    role: "Smart Contract Bounty",
    message: "Audited 4 DeFi protocols on Ethereum and Arbitrum. Found 2 medium severity vulnerabilities in liquidity pools.",
    resumeName: "Priya_Patel_CV.pdf",
    resumeUrl: "https://example.com/resumes/priya.pdf",
    status: "REVIEWING",
  },
  {
    id: "app-sample-3",
    opportunityId: "opp-3",
    fullName: "Rohan Verma",
    email: "rohan.verma@example.edu",
    phone: "+91 99887 76655",
    role: "Junior Data Scientist",
    message: "Master's student specialized in predictive modeling and deep learning with PyTorch. Winner of 2 hackathon analytics tracks.",
    resumeName: "Rohan_Verma_Resume.pdf",
    resumeUrl: "https://example.com/resumes/rohan.pdf",
    status: "SHORTLISTED",
    adminNotes: "Impressive PyTorch experience and GitHub portfolio.",
  },
];

async function main() {
  console.log('Seeding events...');

  console.log('Seeding users...');
  
  // Seed Super Admin user
  await prisma.user.upsert({
    where: { email: 'shushantshukla62@gmail.com' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'shushantshukla62@gmail.com',
      fullName: 'Shushant Shukla',
      role: 'SUPER_ADMIN',
      onboardingCompleted: true
    }
  });

  // Seed a demo user for testing and give them the Organizer role
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: 'Organizer', passwordHash: demoPasswordHash },
    create: {
      email: DEMO_EMAIL,
      passwordHash: demoPasswordHash,
      fullName: 'Demo Student',
      role: 'Organizer',
      interests: JSON.stringify(['AI & Machine Learning', 'Programming']),
      onboardingCompleted: true
    }
  });

  for (const mock of mockEvents) {
    const eventData = toEventCreate(mock, demoUser.id);
    await prisma.event.upsert({
      where: { id: eventData.id },
      update: eventData,
      create: eventData,
    });
  }

  console.log('Seeding opportunities...');
  for (const mock of mockOpportunities) {
    const oppData = toOpportunityCreate(mock);
    await prisma.opportunity.upsert({
      where: { id: oppData.id },
      update: oppData,
      create: oppData,
    });
  }

  console.log('Seeding sample opportunity applications...');
  for (const app of sampleApplications) {
    await prisma.opportunityApplication.upsert({
      where: { id: app.id },
      update: app,
      create: app,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
