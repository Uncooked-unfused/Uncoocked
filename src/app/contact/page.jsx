"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role, message }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast.error("Failed to send your message. Please try again later.");
    }
  }

  return (
    <div className="relative isolate overflow-hidden bg-black w-full min-h-[80vh] py-16 sm:py-24">
      {/* Background decoration */}
      <div
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-neon-purple to-neon-lavender opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">
            Have questions about student events, host sponsorships, or
            partnership proposals? Drop us a line.
          </p>
        </div>

        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Form Area */}
          <div className="lg:col-span-2 bg-dark-card p-8 rounded-2xl border border-dark-border shadow-neon">
            <h2 className="text-base font-bold text-white mb-6">
              Send a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-400"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-dark-border bg-black px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-400"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-dark-border bg-black px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-xs font-semibold text-gray-400"
                >
                  Your Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border border-dark-border bg-black px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                >
                  <option value="Student">Student / Attendee</option>
                  <option value="Sponsor">Event Sponsor / Partner</option>
                  <option value="Host">Campus Club/Host</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs font-semibold text-gray-400"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border border-dark-border bg-black px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-neon-purple focus:border-neon-purple"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="px-5 py-2.5 rounded-md bg-neon-purple text-white text-xs font-bold hover:bg-neon-purple/90 disabled:opacity-60 transition-all hover:scale-[1.02] shadow-neon"
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>

                {status === "success" && (
                  <span className="text-xs text-green-300 bg-green-950/40 border border-green-800 px-3 py-2.5 rounded">
                    ✓ Message received! We will reply shortly.
                  </span>
                )}
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
