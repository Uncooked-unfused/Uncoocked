"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Database,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  Building2,
  RefreshCw,
  Eye,
  ArrowRightLeft,
  RotateCcw,
  Check,
  Zap,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";
import { invalidateClientCache } from "@/lib/clientCache";

export default function HomepageStatsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [data, setData] = useState(null);

  // Editable custom form state
  const [customForm, setCustomForm] = useState({
    students: 6846,
    activeEvents: 8,
    registrations: 2346,
    clubs: 12,
  });

  const fetchConfig = useCallback(async (showToast = false) => {
    try {
      const res = await fetch(`/api/admin/homepage-stats?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        if (json.customStats) {
          setCustomForm({
            students: json.customStats.students ?? 6846,
            activeEvents: json.customStats.activeEvents ?? 8,
            registrations: json.customStats.registrations ?? 2346,
            clubs: json.customStats.clubs ?? 12,
          });
        }
        if (showToast) {
          toast.success("Homepage stats configuration refreshed");
        }
      } else {
        toast.error(json.error || "Failed to load homepage stats settings");
      }
    } catch (err) {
      console.error("Failed to fetch homepage stats:", err);
      toast.error("Network error loading homepage stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleToggleMode = async (newMode) => {
    if (!data || data.mode === newMode) return;
    setSwitchingMode(true);
    try {
      const res = await fetch("/api/admin/homepage-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        invalidateClientCache("/api/stats");
        invalidateClientCache("/api/admin/stats");
        toast.success(
          newMode === "ACTUAL"
            ? "Switched homepage to live database counts!"
            : "Switched homepage to custom tweaked numbers!"
        );
      } else {
        toast.error(json.error || "Failed to update mode");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSwitchingMode(false);
    }
  };

  const handleSaveCustomStats = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const parsedStats = {
        students: parseInt(customForm.students, 10) || 0,
        activeEvents: parseInt(customForm.activeEvents, 10) || 0,
        registrations: parseInt(customForm.registrations, 10) || 0,
        clubs: parseInt(customForm.clubs, 10) || 0,
      };

      const res = await fetch("/api/admin/homepage-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CUSTOM", // Automatically activate custom mode when saving custom values
          customStats: parsedStats,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        invalidateClientCache("/api/stats");
        invalidateClientCache("/api/admin/stats");
        toast.success("Custom homepage metrics saved and applied live!");
      } else {
        toast.error(json.error || "Failed to save custom stats");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const copyLiveToCustom = () => {
    if (!data?.actualStats) return;
    setCustomForm({
      students: data.actualStats.students ?? 0,
      activeEvents: data.actualStats.activeEvents ?? 0,
      registrations: data.actualStats.registrations ?? 0,
      clubs: data.actualStats.clubs ?? 0,
    });
    toast.info("Copied current live database numbers into custom inputs");
  };

  const resetToDefaultPresets = () => {
    setCustomForm({
      students: 6846,
      activeEvents: 8,
      registrations: 2346,
      clubs: 12,
    });
    toast.info("Reset inputs to default marketing presets");
  };

  const applyIncrement = (field, amount) => {
    setCustomForm((prev) => ({
      ...prev,
      [field]: Math.max(0, (parseInt(prev[field], 10) || 0) + amount),
    }));
  };

  const applyMultiplier = (field, multiplier) => {
    setCustomForm((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.round((parseInt(prev[field], 10) || 0) * multiplier)),
    }));
  };

  const isCustomMode = data?.mode === "CUSTOM";
  const actual = data?.actualStats || { students: 0, activeEvents: 0, registrations: 0, clubs: 0 };
  const custom = data?.customStats || { students: 6846, activeEvents: 8, registrations: 2346, clubs: 12 };
  const active = isCustomMode ? custom : actual;

  const metricFields = [
    {
      id: "students",
      label: "Students Registered / Active",
      subLabel: "Shown in Hero micro-bar, Metrics cards, and Ecosystem hub",
      icon: Users,
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      actualVal: actual.students,
      customVal: customForm.students,
    },
    {
      id: "activeEvents",
      label: "Active Campus Events",
      subLabel: "Shown in Hero micro-bar and Metrics cards",
      icon: Calendar,
      color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
      actualVal: actual.activeEvents,
      customVal: customForm.activeEvents,
    },
    {
      id: "registrations",
      label: "Total Registrations",
      subLabel: "Shown in Hero micro-bar and Metrics cards",
      icon: CheckCircle,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      actualVal: actual.registrations,
      customVal: customForm.registrations,
    },
    {
      id: "clubs",
      label: "Partner Clubs & Societies",
      subLabel: "Shown in Hero statistics and ecosystem directory",
      icon: Building2,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
      actualVal: actual.clubs,
      customVal: customForm.clubs,
    },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
            <SlidersHorizontal className="w-4 h-4" /> Homepage Metrics Governance
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            Public Metrics & Counter Control
          </h2>
          <p className="text-xs text-gray-400 max-w-2xl">
            Control the numbers displayed on the public home page. Toggle instantly between live verified database counts or custom marketing metrics.
          </p>
        </div>

        {/* Live / Custom Switcher Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="bg-black/60 p-1.5 rounded-xl border border-neutral-800 flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleToggleMode("ACTUAL")}
              disabled={switchingMode || loading}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                !isCustomMode
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-gray-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Live DB Counts</span>
              {!isCustomMode && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleMode("CUSTOM")}
              disabled={switchingMode || loading}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                isCustomMode
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "text-gray-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Tweaked</span>
              {isCustomMode && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>

          <button
            onClick={() => fetchConfig(true)}
            disabled={loading}
            title="Refresh values"
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-xl border border-neutral-700 transition shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active State Status Callout */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isCustomMode
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isCustomMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping"
            }`}
          />
          <div>
            <span className="font-extrabold uppercase tracking-wide">
              Active Mode: {isCustomMode ? "Custom Marketing Metrics" : "Live Database Counts"}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isCustomMode
                ? "The homepage is currently displaying custom numbers configured below."
                : "The homepage is currently calculating and rendering real-time website database counts."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-black/40 border border-white/10 font-bold">
            Status: {isCustomMode ? "CUSTOM OVERRIDE ACTIVE" : "REAL-TIME DB SYNC"}
          </span>
        </div>
      </div>

      {/* Metrics Tweak Form & Inputs Grid */}
      <form onSubmit={handleSaveCustomStats} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricFields.map((field) => {
            const Icon = field.icon;
            const isFieldCurrentlyActive = isCustomMode;
            return (
              <div
                key={field.id}
                className="bg-black/50 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition"
              >
                {/* Field Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${field.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {field.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{field.subLabel}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isFieldCurrentlyActive
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {isFieldCurrentlyActive ? "Custom Live" : "DB Live"}
                  </span>
                </div>

                {/* Live Count vs Custom Input Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Real DB Count Card */}
                  <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-gray-500 font-mono uppercase font-bold flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-400" /> Real DB Count
                    </span>
                    <span className="text-xl font-mono font-black text-white mt-1">
                      {loading ? "..." : field.actualVal?.toLocaleString() ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomForm((prev) => ({ ...prev, [field.id]: field.actualVal ?? 0 }))
                      }
                      className="text-[10px] text-amber-400/90 hover:text-amber-300 text-left underline font-medium mt-1 cursor-pointer"
                    >
                      Use DB value ({field.actualVal ?? 0})
                    </button>
                  </div>

                  {/* Custom Tweak Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Custom Value
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000000"
                      value={field.customVal}
                      onChange={(e) =>
                        setCustomForm((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg p-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500 transition"
                      placeholder="Enter custom count..."
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets for this field */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-gray-500 mr-1">Quick:</span>
                  {[10, 50, 100, 500, 1000].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => applyIncrement(field.id, step)}
                      className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded border border-neutral-700/50 transition cursor-pointer"
                    >
                      +{step}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => applyMultiplier(field.id, 2)}
                    className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-neutral-800 hover:bg-amber-500 hover:text-black text-amber-400 rounded border border-amber-500/30 transition cursor-pointer"
                  >
                    2x
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Toolbar & Save Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyLiveToCustom}
              className="px-3 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              Copy Live DB Counts to Inputs
            </button>
            <button
              type="button"
              onClick={resetToDefaultPresets}
              className="px-3 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded-lg border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Default Presets
            </button>
          </div>

          <div className="flex items-center gap-3">
            {!isCustomMode && (
              <button
                type="button"
                onClick={() => handleToggleMode("ACTUAL")}
                className="px-4 py-2.5 text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Live DB Mode Active
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              {saving ? "Saving & Publishing..." : "Save & Publish Custom Numbers"}
            </button>
          </div>
        </div>
      </form>

      {/* Live Homepage Display Preview Mockup */}
      <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-purple-400" /> Public Visitor Live Preview
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Mode: <strong className="text-white">{isCustomMode ? "CUSTOM MARKETING" : "LIVE DB"}</strong>
          </span>
        </div>

        {/* 3-Column Metrics Grid Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-gray-400">Students Registered</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUp end={active.students} />
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Verified campus students</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-gray-400">Active Events</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUp end={active.activeEvents} />
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Upcoming fests & workshops</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Registrations</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              <CountUp end={active.registrations} />
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Verified event registrations</p>
          </div>
        </div>

        {/* Micro-bar Preview */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-wrap justify-around items-center text-xs font-mono text-gray-400 text-center gap-4">
          <div>
            <span className="block text-white font-bold text-sm">
              <CountUp end={active.registrations} />
            </span>
            Registrations
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div>
            <span className="block text-white font-bold text-sm">
              <CountUp end={active.students} />
            </span>
            Students Active
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div>
            <span className="block text-white font-bold text-sm">
              <CountUp end={active.activeEvents} />
            </span>
            Campus Events
          </div>
        </div>
      </div>
    </div>
  );
}
