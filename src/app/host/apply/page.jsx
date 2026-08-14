"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  Mail,
  Globe,
  MapPin,
  FileText,
  Upload,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const DRAFT_KEY = "uncooked_host_app_draft";

const ORG_TYPES = [
  "College Club",
  "Academic Department",
  "Student Organization",
  "Tech Startup / Company",
  "Non-Profit / NGO",
  "Independent Community",
  "Other Event Host",
];

export default function HostApplicationPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [existingApp, setExistingApp] = useState(null);

  // Form Fields State
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState(ORG_TYPES[0]);
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");

  // Check user status and load existing application or draft
  const checkInitialStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/host/status");
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?callbackUrl=/host/apply");
        return;
      }

      if (res.ok) {
        // If user is already approved organizer, redirect to event creation
        if (data.userRole === "SUPER_ADMIN" || (data.userRole === "ORGANIZER" && data.application?.status === "APPROVED")) {
          toast.info("You are already an approved host!");
          router.push("/dashboard/organizer/new");
          return;
        }

        // If user has active application (PENDING or UNDER_REVIEW), redirect to status page
        if (data.hasApplication && (data.application.status === "PENDING" || data.application.status === "UNDER_REVIEW")) {
          toast.info("You already have an active host application under review.");
          router.push("/host/status");
          return;
        }

        // If application exists in NEEDS_MORE_INFORMATION or REJECTED state, pre-fill form
        if (data.hasApplication && (data.application.status === "NEEDS_MORE_INFORMATION" || data.application.status === "REJECTED")) {
          const app = data.application;
          setExistingApp(app);
          setOrganizationName(app.organizationName || "");
          setOrganizationType(app.organizationType || ORG_TYPES[0]);
          setOrganizationEmail(app.organizationEmail || "");
          setWebsite(app.website || "");
          setAddress(app.address || "");
          setDescription(app.description || "");
          if (app.documentUrls) {
            try {
              const parsed = JSON.parse(app.documentUrls);
              setIdProofUrl(parsed.idProofUrl || app.documentUrls);
            } catch {
              setIdProofUrl(app.documentUrls);
            }
          }
        } else {
          // Check for saved local draft
          const savedDraft = typeof window !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null;
          if (savedDraft) {
            try {
              const draft = JSON.parse(savedDraft);
              setOrganizationName(draft.organizationName || "");
              setOrganizationType(draft.organizationType || ORG_TYPES[0]);
              setOrganizationEmail(draft.organizationEmail || "");
              setWebsite(draft.website || "");
              setAddress(draft.address || "");
              setDescription(draft.description || "");
              setIdProofUrl(draft.idProofUrl || "");
            } catch (err) {
              console.error("Failed to parse draft:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Check status error:", err);
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/deps-change
    checkInitialStatus();
  }, [checkInitialStatus]);

  // Save Draft to localStorage
  const saveDraft = () => {
    if (typeof window === "undefined") return;
    const draftData = {
      organizationName,
      organizationType,
      organizationEmail,
      website,
      address,
      description,
      idProofUrl,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    toast.success("Draft saved successfully!");
  };

  // Step progression and validation
  const validateStep1 = () => {
    if (!organizationName.trim()) {
      toast.error("Organization Name is required.");
      return false;
    }
    if (!organizationType.trim()) {
      toast.error("Organization Type is required.");
      return false;
    }
    if (!organizationEmail.trim()) {
      toast.error("Official Email Address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizationEmail.trim())) {
      toast.error("Please enter a valid official email address.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!address.trim()) {
      toast.error("Campus Location / Physical Address is required.");
      return false;
    }
    if (!description.trim()) {
      toast.error("Organization Overview is required.");
      return false;
    }
    if (description.trim().length < 15) {
      toast.error("Please provide at least 15 characters describing your organization and event plans.");
      return false;
    }
    return true;
  };

  const handleStepChange = (targetStep) => {
    if (targetStep > 1 && !validateStep1()) {
      setStep(1);
      return;
    }
    if (targetStep > 2 && !validateStep2()) {
      setStep(2);
      return;
    }
    setStep(targetStep);
  };

  // Submit Host Application
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (!idProofUrl.trim()) {
      toast.error("Identity Proof / Verification Document link is required.");
      setStep(3);
      return;
    }

    try {
      new URL(idProofUrl.trim());
    } catch {
      toast.error("Please enter a valid URL (including http:// or https://) for identity proof.");
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        organizationName: organizationName.trim(),
        organizationType: organizationType.trim(),
        organizationEmail: organizationEmail.trim(),
        website: website.trim() || null,
        address: address.trim(),
        description: description.trim(),
        documentUrls: { idProofUrl: idProofUrl.trim() },
      };

      const res = await fetch("/api/host/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_KEY);
        }
        toast.success("Host application submitted successfully!");
        router.push("/host/status");
      } else {
        toast.error(result.error || "Failed to submit application");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Submit host application error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Initializing host application portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Host Verification Onboarding
          </div>
          <h1 className="text-3xl font-black">
            {existingApp ? "Resubmit Host Application" : "Become a Verified Host"}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete your organization profile to publish, manage, and scale events on Uncooked. All marked fields (<span className="text-amber-500 font-bold">*</span>) are mandatory for review.
          </p>
        </div>

        <button
          type="button"
          onClick={saveDraft}
          className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 font-bold text-xs px-4 py-2.5 rounded-lg border border-neutral-800 transition flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" /> Save Draft
        </button>
      </div>

      {/* Admin Action Feedback Callout if returning from NEEDS_MORE_INFO */}
      {existingApp?.status === "NEEDS_MORE_INFORMATION" && (
        <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-400" /> Admin Feedback / Requested Info
          </h3>
          <p className="text-xs text-gray-300 font-mono">
            &ldquo;{existingApp.infoRequestedReason || "Please update your application details as requested."}&rdquo;
          </p>
        </div>
      )}

      {/* Multi-step Navigation Indicators */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <button
          type="button"
          onClick={() => handleStepChange(1)}
          className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
            step === 1 ? "text-amber-400 border-b-2 border-amber-500 pb-1" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step === 1 ? "bg-amber-500 text-black font-extrabold" : "bg-neutral-800 text-gray-400"
          }`}>1</span>
          Organization Info *
        </button>
        <div className="w-8 h-px bg-neutral-800" />
        <button
          type="button"
          onClick={() => handleStepChange(2)}
          className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
            step === 2 ? "text-amber-400 border-b-2 border-amber-500 pb-1" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step === 2 ? "bg-amber-500 text-black font-extrabold" : "bg-neutral-800 text-gray-400"
          }`}>2</span>
          Location & Overview *
        </button>
        <div className="w-8 h-px bg-neutral-800" />
        <button
          type="button"
          onClick={() => handleStepChange(3)}
          className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
            step === 3 ? "text-amber-400 border-b-2 border-amber-500 pb-1" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step === 3 ? "bg-amber-500 text-black font-extrabold" : "bg-neutral-800 text-gray-400"
          }`}>3</span>
          Proof & Review *
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Organization Basic Info */}
        {step === 1 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Building2 className="w-4 h-4 text-amber-500" /> Step 1: Organization Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Organization Name <span className="text-amber-500 font-bold">*</span> <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g., Coding Club IIT Lucknow, TechStart Inc."
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Organization Type <span className="text-amber-500 font-bold">*</span> <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required)</span>
                </label>
                <select
                  required
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" /> Official Email Address <span className="text-amber-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required)</span>
                </label>
                <input
                  type="email"
                  required
                  value={organizationEmail}
                  onChange={(e) => setOrganizationEmail(e.target.value)}
                  placeholder="e.g., contact@club.edu or host@org.com"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[10px] text-gray-500 mt-1">Used for official admin verification correspondence and host governance notifications.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" /> Website / Social Portfolio Link
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myorg.com or https://instagram.com/myclub"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-6 py-2.5 rounded-lg transition flex items-center gap-2 cursor-pointer"
              >
                Next: Address & Description <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address & Description */}
        {step === 2 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <MapPin className="w-4 h-4 text-amber-500" /> Step 2: Location & Overview
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Campus Location / Physical Address <span className="text-amber-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Student Activity Center, Campus North, Lucknow"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> Organization Overview & Past Event Experience <span className="text-amber-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required, min 15 chars)</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization, team size, types of events you plan to host, and any previous event hosting experience..."
                  className="w-full bg-black border border-neutral-800 rounded-lg p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs px-5 py-2.5 rounded-lg border border-neutral-700 transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-6 py-2.5 rounded-lg transition flex items-center gap-2 cursor-pointer"
              >
                Next: Verification & Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Identity Verification & Final Review */}
        {step === 3 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Upload className="w-4 h-4 text-amber-500" /> Step 3: Identity Document Reference & Final Review
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>
                    Identity Proof / Authorization Link (Drive / Certificate / Government ID URL) <span className="text-amber-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal lowercase">(required)</span>
                </label>
                <input
                  type="url"
                  required
                  value={idProofUrl}
                  onChange={(e) => setIdProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or document reference URL"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Provide a valid URL (Google Drive, Dropbox, cloud storage, or college portal link) to a student ID, organization registration certificate, or official authorization letter for admin verification.
                </p>
              </div>

              {/* Application Summary Box */}
              <div className="bg-black/60 border border-neutral-800 rounded-lg p-4 space-y-3 text-xs">
                <h3 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] border-b border-neutral-800 pb-2">
                  Application Summary Preview
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Organization:</span>
                    <p className="font-bold text-white">{organizationName || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Type:</span>
                    <p className="font-bold text-white">{organizationType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Official Email:</span>
                    <p className="font-mono text-gray-300">{organizationEmail || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Campus Address:</span>
                    <p className="text-gray-300">{address || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Website / Portfolio:</span>
                    <p className="font-mono text-gray-300 truncate">{website || "None specified (optional)"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Identity / Document URL:</span>
                    <p className="font-mono text-amber-400 truncate">{idProofUrl || "Pending URL input"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs px-5 py-2.5 rounded-lg border border-neutral-700 transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs px-8 py-3 rounded-lg transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {submitting ? "Submitting Application..." : "Submit Host Verification Application"} <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
