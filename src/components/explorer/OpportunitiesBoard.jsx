"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, ExternalLink, Search, Loader2 } from "lucide-react";
import OpportunityApplicationModal from "./OpportunityApplicationModal";

const fallbackOpportunities = [
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
  },
];

export default function OpportunitiesBoard() {
  const [opportunities, setOpportunities] = useState(fallbackOpportunities);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOpportunities() {
      try {
        const res = await fetch("/api/opportunities");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setOpportunities(data.data);
          }
        }
      } catch (err) {
        console.error("Error loading opportunities:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOpportunities();
    return () => {
      isMounted = false;
    };
  }, []);

  const types = useMemo(() => {
    const uniqueTypes = new Set(opportunities.map((opp) => opp.type));
    return ["All", ...Array.from(uniqueTypes)];
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchType = activeType === "All" || opp.type === activeType;
      const matchText = searchQuery.toLowerCase().trim();
      const tagsList = Array.isArray(opp.tags) ? opp.tags : [];
      const matchSearch =
        opp.title?.toLowerCase().includes(matchText) ||
        opp.company?.toLowerCase().includes(matchText) ||
        opp.description?.toLowerCase().includes(matchText) ||
        tagsList.some((tag) => tag.toLowerCase().includes(matchText));
      return matchType && matchSearch;
    });
  }, [opportunities, searchQuery, activeType]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const getTypeStyle = (type) => {
    switch ((type || "").toLowerCase()) {
      case "internship":
        return "bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20";
      case "freelance":
        return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
      case "bounty":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "full-time":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-white/5 text-white/50 border border-white/10";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/6 pb-6">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search roles, skills, or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                activeType === type
                  ? "bg-[#A855F7] text-white"
                  : "bg-[#111111] text-white/50 hover:text-white/80 hover:border-white/16 border border-white/8"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12 text-white/50 bg-[#111111] border border-white/8 rounded-2xl">
          <p className="text-[13px]">No opportunities match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredOpportunities.map((opp) => (
            <motion.div
              key={opp.id}
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="bg-[#111111] border border-white/8 hover:border-white/16 hover:shadow-md rounded-2xl p-4 transition-all duration-150 flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${getTypeStyle(opp.type)}`}
                >
                  {opp.type}
                </span>
                {opp.salary && (
                  <span className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-400" />{" "}
                    {opp.salary}
                  </span>
                )}
              </div>

              <div className="space-y-1 mb-3">
                <h3 className="text-[16px] font-bold text-white group-hover:text-white/80 transition-colors leading-tight">
                  {opp.title}
                </h3>
                <p className="text-[12px] text-white/60 font-semibold">
                  {opp.company}
                </p>
              </div>

              {opp.location && (
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono mb-3">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{opp.location}</span>
                </div>
              )}

              <p className="text-[12px] text-white/45 leading-relaxed mb-4 flex-grow line-clamp-4">
                {opp.description}
              </p>

              <div className="space-y-3 mt-auto">
                {Array.isArray(opp.tags) && opp.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono font-bold text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-white/6">
                  {opp.applyLink ? (
                    <a
                      href={opp.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full text-[12px] flex items-center justify-center gap-1.5"
                    >
                      Apply on Website <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <button
                      className="btn-secondary w-full text-[12px] flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        setIsModalOpen(true);
                      }}
                    >
                      Apply Now <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      {isModalOpen && selectedOpportunity && (
        <OpportunityApplicationModal
          key={selectedOpportunity.id}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOpportunity(null);
          }}
          opportunity={selectedOpportunity}
        />
      )}
    </div>
  );
}
