"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck, BarChart3, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HostLandingPage() {
  const features = [
    {
      icon: Users,
      title: "Direct Student Reach",
      description: "Instantly publish your events and reach thousands of active campus attendees.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Organizer Badge",
      description: "Build trust with an official verified host status across all event listings.",
    },
    {
      icon: BarChart3,
      title: "Real-time Roster & Analytics",
      description: "Track registrations, attendee rosters, and ticket check-ins from your dashboard.",
    },
  ];

  const steps = [
    { step: "01", title: "Submit Application", desc: "Fill out your organization or club details." },
    { step: "02", title: "Quick Verification", desc: "Our team reviews your details within 24 hours." },
    { step: "03", title: "Publish & Host", desc: "Create events, manage check-ins, and grow your audience." },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="max-w-3xl text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Organizer Hub</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Host Your Next Big Festival or Campus Event
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          Everything you need to publish events, manage attendee registrations, and scale your audience on one unified platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/host/apply"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            Apply to Become a Host
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/host/status"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-gray-300 font-semibold text-sm transition-all text-center"
          >
            Check Application Status
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 z-10">
        {features.map((feat, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
              <feat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{feat.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>

      {/* 3 Step Process */}
      <div className="max-w-4xl w-full mt-24 z-10 text-center space-y-10">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => (
            <div key={idx} className="space-y-2 text-center md:text-left">
              <span className="text-3xl font-mono font-extrabold text-amber-500/40">{item.step}</span>
              <h4 className="text-base font-bold">{item.title}</h4>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Card */}
      <div className="max-w-3xl w-full mt-20 p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/20 text-center space-y-4 z-10">
        <h3 className="text-xl font-bold">Ready to get started?</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Submit your application in under 3 minutes and get verified to start listing events.
        </p>
        <Link
          href="/host/apply"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all"
        >
          Start Application Now
        </Link>
      </div>
    </div>
  );
}