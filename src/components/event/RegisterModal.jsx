"use client";

import React, { useState } from "react";

export default function RegisterModal({
  open,
  onClose,
  onSubmit,
  ticketType,
  price,
  eventId,
  userId
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({ name, email, phone, university });
      }
      onClose();
    } catch (err) {
      // Error handling is managed via toast inside onSubmit
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a0a] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-5 border-b border-zinc-800/80">
          <h3 className="text-base font-medium text-white tracking-tight">
            Register for event
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Please provide your details to reserve your ticket.
          </p>
        </div>

        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
          <p className="text-xs font-bold text-amber-500 text-center uppercase tracking-wide">
            ⚠️ Note: Currently operating exclusively in Lucknow
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="modal-name" className="block text-sm font-medium text-zinc-300">
                Full name
              </label>
              <input
                id="modal-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <input
                id="modal-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="modal-phone" className="block text-sm font-medium text-zinc-300">
                Phone number
              </label>
              <input
                id="modal-phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="modal-university" className="block text-sm font-medium text-zinc-300">
                University / Institution
              </label>
              <input
                id="modal-university"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing..." : "Confirm reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}