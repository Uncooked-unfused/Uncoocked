"use client";

import Link from "next/link";
import { Users, Sparkles, Building2, Rocket, Code2, Hammer, BrainCircuit, ArrowRight, ShieldCheck } from "lucide-react";

export default function PartnersPage() {
  const partners = [
    {
      name: "University Innovation Cell",
      short: "UIC",
      type: "Innovation & Incubation",
      desc: "Fostering early-stage student prototypes, research grants, and university patent incubation.",
      icon: BrainCircuit,
    },
    {
      name: "Startup Club",
      short: "SC",
      type: "Entrepreneurship",
      desc: "Empowering campus founders with peer mentorship, pitch events, and investor access.",
      icon: Rocket,
    },
    {
      name: "Developer Society",
      short: "DEV",
      type: "Open Source & Engineering",
      desc: "Hosting 24-hour hackathons, system architecture workshops, and open-source sprints.",
      icon: Code2,
    },
    {
      name: "Maker Community",
      short: "MKR",
      type: "Hardware & Robotics",
      desc: "Hardware hackers and robotics enthusiasts building physical computing devices and IoT rigs.",
      icon: Hammer,
    },
    {
      name: "Entrepreneurship Hub",
      short: "E_HUB",
      type: "Venture & Business",
      desc: "Bridging academia with commercial ventures, startup conferences, and venture masterclasses.",
      icon: Building2,
    },
    {
      name: "Tech Council",
      short: "TECH",
      type: "Student Governance",
      desc: "Uniting campus technical clubs to coordinate annual tech fests and flagship symposiums.",
      icon: Users,
    },
  ];

  const perks = [
    {
      title: "Automated Ticket & QR Issuance",
      desc: "Zero manual ticket verification. Real-time scanning at gates with fraud-proof cryptographic check-ins.",
    },
    {
      title: "Cross-Campus Visibility",
      desc: "Put your club events in front of thousands of active students across university campuses.",
    },
    {
      title: "Instant Attendee Analytics",
      desc: "Get deep visibility into attendance rates, registration cohorts, and engagement metrics.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="max-w-3xl text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Campus Ecosystem & Clubs</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Partner Clubs & Campus Communities
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          We partner with elite student clubs, technical societies, and startup incubators to power their events and discovery.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/host/apply"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            Partner Your Club
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/event"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-gray-300 font-semibold text-sm transition-all text-center"
          >
            Browse Partner Events
          </Link>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 z-10">
        {partners.map((partner, idx) => {
          const Icon = partner.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-purple-500/30 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-white/50 tracking-wider">
                  {partner.short}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{partner.name}</h3>
                <span className="text-xs font-semibold text-purple-400 block mt-0.5">
                  {partner.type}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {partner.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Why Clubs Choose Uncooked */}
      <div className="max-w-4xl w-full mt-24 z-10 text-center space-y-10">
        <h2 className="text-2xl font-bold">Why Student Clubs Choose Uncooked</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {perks.map((perk, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <h4 className="text-sm font-bold text-white">{perk.title}</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="max-w-3xl w-full mt-20 p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/40 border border-purple-500/20 text-center space-y-4 z-10">
        <h3 className="text-xl font-bold">Lead a Campus Club or Society?</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Get verified host access, custom ticketing links, and co-branding for your next university event.
        </p>
        <Link
          href="/host/apply"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all"
        >
          Get Club Verified
        </Link>
      </div>
    </div>
  );
}
