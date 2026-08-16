"use client";

import { useState } from "react";

export default function OpportunityApplicationModal({
  open,
  onClose,
  opportunity,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Student");
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setResumeError("Please upload a PDF or Word document");
      setResume(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File must be under 5MB");
      setResume(null);
      return;
    }
    setResumeError("");
    setResume(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("message", message);
      formData.append("opportunityTitle", opportunity?.title || "");
      formData.append("opportunityCompany", opportunity?.company || "");
      formData.append("opportunityType", opportunity?.type || "");
      formData.append("opportunityLocation", opportunity?.location || "");
      if (opportunity?.id) {
        formData.append("opportunityId", opportunity.id);
      }
      if (resume) {
        formData.append("resume", resume);
      }

      const res = await fetch("/api/opportunities/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit application");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-white tracking-tight">
              Apply for Opportunity
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {opportunity?.title} at {opportunity?.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-lg leading-none px-2"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <p className="text-emerald-400 font-medium">Application submitted!</p>
            <p className="text-xs text-zinc-400 mt-2">
              We will review your application and get back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="Student">Student / Attendee</option>
                <option value="Sponsor">Event Sponsor / Partner</option>
                <option value="Host">Campus Club/Host</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Resume <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#A855F7]/10 file:text-[#C084FC] hover:file:bg-[#A855F7]/20 file:cursor-pointer cursor-pointer mt-1"
              />
              {resumeError && (
                <p className="text-red-400 text-[11px] mt-1">{resumeError}</p>
              )}
              <p className="text-[10px] text-zinc-500 mt-1">
                PDF or Word, max 5MB
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Tell us why you are a good fit..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-[12px] px-5 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !resume}
                className="btn-primary text-[12px] px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
