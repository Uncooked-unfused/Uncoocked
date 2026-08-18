"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  Terminal,
  Briefcase,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export default function RegistrationDatabase() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [sortField, setSortField] = useState("ts");
  const [sortOrder, setSortOrder] = useState("desc");

  // Load and enrich registrations
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          localStorage.getItem("registrations") || "[]",
        );
        // Enrich data with statuses, track, and github if not present
        const enriched = stored.map((reg, idx) => {
          const statuses = ["Confirmed", "Pending", "Checked In"];
          const tracks = [
            "Frontend Dev",
            "Backend Engineer",
            "Fullstack Developer",
            "UI/UX Designer",
            "AI Specialist",
          ];
          return {
            ...reg,
            status: reg.status || statuses[idx % statuses.length],
            track: reg.track || tracks[idx % tracks.length],
            github:
              reg.github ||
              `https://github.com/${reg.name.toLowerCase().replace(/\s+/g, "")}`,
          };
        });

        // Simulate a small network delay for the skeleton UI
        const timer = setTimeout(() => {
          setRegistrations(enriched);
          setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
      } catch (err) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
      }
    }
  }, []);

  const handleRowClick = (email, eventId) => {
    const key = `${email}-${eventId}`;
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Unique list of Event IDs for filtering
  const eventIds = Array.from(new Set(registrations.map((r) => r.eventId)));

  // Filter and sort registrations
  const processedData = registrations
    .filter((reg) => {
      const matchesSearch =
        reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || reg.status === statusFilter;
      const matchesEvent = eventFilter === "all" || reg.eventId === eventFilter;

      return matchesSearch && matchesStatus && matchesEvent;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "ts") {
        comparison = a.ts - b.ts;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getStatusStyle = (status) => {
    switch (status) {
      case "Checked In":
        return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40";
      case "Confirmed":
        return "bg-neon-purple/10 text-neon-lavender border border-neon-purple/30 shadow-neon";
      case "Pending":
      default:
        return "bg-amber-950/40 text-amber-400 border border-amber-800/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-dark-border rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple backdrop-blur-md"
          />
        </div>

        {/* Event ID Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-dark-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple backdrop-blur-md appearance-none"
          >
            <option value="all">All Events</option>
            {eventIds.map((id) => (
              <option key={id} value={id}>
                {id.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-dark-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple backdrop-blur-md appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Checked In">Checked In</option>
          </select>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-zinc-900/40 border border-dark-border rounded-2xl overflow-hidden backdrop-blur-md shadow-neon">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-black/60">
                <th
                  onClick={() => handleSort("name")}
                  className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-neon-lavender neon-text-glow cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Student Name
                    <ArrowUpDown className="h-3.5 w-3.5 text-neon-purple" />
                  </div>
                </th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-neon-lavender neon-text-glow select-none">
                  Email
                </th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-neon-lavender neon-text-glow select-none">
                  Event ID
                </th>
                <th
                  onClick={() => handleSort("ts")}
                  className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-neon-lavender neon-text-glow cursor-pointer hover:text-white transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Status
                    <ArrowUpDown className="h-3.5 w-3.5 text-neon-purple" />
                  </div>
                </th>
              </tr>
            </thead>

            {loading ? (
              /* Loading Skeleton UI */
              <tbody className="divide-y divide-dark-border/40">
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-3.5 w-32 bg-zinc-800 rounded-md"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-3.5 w-44 bg-zinc-800 rounded-md"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-3.5 w-24 bg-zinc-800 rounded-md"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-5 w-20 bg-zinc-800 rounded-full"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody className="divide-y divide-dark-border/40 font-mono text-xs">
                {processedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 px-6 text-center text-gray-500"
                    >
                      No registrations found matching the filters.
                    </td>
                  </tr>
                ) : (
                  processedData.map((reg) => {
                    const rowKey = `${reg.email}-${reg.eventId}`;
                    const isExpanded = !!expandedRows[rowKey];

                    return (
                      <React.Fragment key={rowKey}>
                        {/* Main Row */}
                        <tr
                          onClick={() => handleRowClick(reg.email, reg.eventId)}
                          className="hover:border-neon-purple border-l-2 border-l-transparent hover:border-l-neon-purple hover:bg-neon-purple/5 transition-all duration-200 cursor-pointer text-gray-300"
                        >
                          <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-neon-purple" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-neon-purple" />
                              )}
                              {reg.name}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400">
                            {reg.email}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="text-[10px] text-gray-400 font-mono uppercase bg-zinc-800/60 px-2 py-1 rounded border border-dark-border">
                              {reg.eventId}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(reg.status)}`}
                            >
                              {reg.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-black/30 border-l-2 border-l-neon-purple animate-fadeIn">
                            <td
                              colSpan={4}
                              className="py-5 px-6 border-b border-dark-border/40"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
                                {/* Builder Track Details */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase tracking-wider">
                                    <Briefcase className="h-3.5 w-3.5 text-neon-purple" />
                                    <span>Department / Major</span>
                                  </div>
                                  <p className="text-white font-bold pl-5">
                                    {reg.track || "Unassigned Department"}
                                  </p>
                                </div>

                                {/* Team Association */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase tracking-wider">
                                    <Users className="h-3.5 w-3.5 text-neon-purple" />
                                    <span>Club / Student Society</span>
                                  </div>
                                  <p className="text-white font-bold pl-5">
                                    {reg.team || "Individual"}
                                  </p>
                                </div>

                                {/* GitHub / Portfolio link */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase tracking-wider">
                                    <Terminal className="h-3.5 w-3.5 text-neon-purple" />
                                    <span>Social / Portfolio Link</span>
                                  </div>
                                  <div className="pl-5">
                                    {reg.github ? (
                                      <a
                                        href={reg.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-neon-lavender hover:text-white underline hover:neon-text-glow transition-all"
                                      >
                                        {reg.github.replace("https://", "")}
                                      </a>
                                    ) : (
                                      <span className="text-gray-600">—</span>
                                    )}
                                  </div>
                                </div>

                                {/* Timestamp / Date */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase tracking-wider">
                                    <Calendar className="h-3.5 w-3.5 text-neon-purple" />
                                    <span>Signup Date</span>
                                  </div>
                                  <p className="text-white pl-5">
                                    {reg.ts
                                      ? formatDate(reg.ts)
                                      : "—"}
                                  </p>
                                </div>

                                {/* Timestamp / Time */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase tracking-wider">
                                    <Clock className="h-3.5 w-3.5 text-neon-purple" />
                                    <span>Registration Time</span>
                                  </div>
                                  <p className="text-white pl-5">
                                    {reg.ts
                                      ? new Date(reg.ts).toLocaleTimeString(
                                          [],
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          },
                                        )
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// React Import wrapper to avoid compilation issue
import React from "react";
