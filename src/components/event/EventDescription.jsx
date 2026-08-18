"use client";

import ReactMarkdown from "react-markdown";

export const eventMarkdownComponents = {
  h1: ({ node: _node, ...props }) => (
    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pb-3 mb-4 mt-2 border-b border-white/10" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-white/95 mt-6 mb-3 tracking-tight flex items-center gap-2" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className="text-base sm:text-lg font-bold text-white/90 mt-5 mb-2.5 tracking-tight flex items-center gap-2 before:content-[''] before:w-1.5 before:h-4 before:bg-[#A855F7] before:rounded-full before:inline-block" {...props} />
  ),
  h4: ({ node: _node, ...props }) => (
    <h4 className="text-sm font-bold uppercase tracking-wider text-white/80 mt-4 mb-2" {...props} />
  ),
  p: ({ node: _node, ...props }) => (
    <p className="text-zinc-300 text-sm mb-4 leading-relaxed font-normal whitespace-pre-line" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="space-y-2.5 my-4 pl-5 list-disc marker:text-[#A855F7] text-zinc-300 text-sm" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="space-y-2.5 my-4 pl-5 list-decimal marker:text-[#A855F7] text-zinc-300 text-sm" {...props} />
  ),
  li: ({ node: _node, ...props }) => (
    <li className="text-zinc-300 text-sm leading-relaxed pl-1" {...props} />
  ),
  strong: ({ node: _node, ...props }) => (
    <strong className="font-bold text-white" {...props} />
  ),
  em: ({ node: _node, ...props }) => (
    <em className="italic text-zinc-300" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="border-l-2 border-[#A855F7] bg-[#121212] p-4 my-4 rounded-r-xl text-zinc-300 text-sm italic" {...props} />
  ),
  hr: ({ node: _node, ...props }) => (
    <hr className="border-white/10 my-6" {...props} />
  ),
  code: ({ node: _node, inline, ...props }) =>
    inline ? (
      <code className="font-mono text-xs bg-white/10 text-purple-300 px-1.5 py-0.5 rounded" {...props} />
    ) : (
      <code className="block font-mono text-xs bg-[#0E0E0E] text-zinc-300 p-3 rounded-lg overflow-x-auto border border-white/6 my-3" {...props} />
    ),
  a: ({ node: _node, ...props }) => (
    <a className="text-[#A855F7] hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />
  ),
};

export default function EventDescription({ event }) {
  const renderTags = () => {
    try {
      const tags = event.tags ? (typeof event.tags === "string" ? JSON.parse(event.tags) : event.tags) : [];
      if (!Array.isArray(tags) || tags.length === 0) return null;
      return tags.map((tag, idx) => (
        <span key={idx} className="px-2.5 py-1 bg-dark-card border border-dark-border text-[10px] font-mono text-gray-400 rounded-md">
          #{tag}
        </span>
      ));
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8 flex flex-col justify-start">
      {/* Description */}
      {event.description && (
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4">About this Event</h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown components={eventMarkdownComponents}>
              {event.description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Schedule */}
      {event.schedule && (
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🗓️</span> Event Schedule
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown components={eventMarkdownComponents}>
              {event.schedule}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Prize Pool / Perks */}
      {event.prizePool && (
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span> Prize Pool & Recognition
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown components={eventMarkdownComponents}>
              {event.prizePool}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Organizer & Venue Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border shadow-sm">
          <h3 className="text-sm font-bold text-white mb-2">Organizer</h3>
          <p className="text-xs text-gray-400">{event.customOrganizerName || event.organizer?.fullName || event.organizer?.name || event.organizer?.email || event.organizerId || "Campus Host"}</p>
        </div>
        <div className="bg-dark-card rounded-2xl p-5 border border-dark-border shadow-sm flex flex-col items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Venue</h3>
            <p className="text-xs text-gray-400">{event.location}</p>
          </div>
          {event.googleMapsUrl && (
            <a 
              href={event.googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-neon-purple hover:text-neon-lavender bg-neon-purple/10 hover:bg-neon-purple/20 px-3 py-1.5 rounded-lg border border-neon-purple/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              View on Google Maps
            </a>
          )}
        </div>
      </div>

      {/* Tags */}
      {renderTags() && (
        <div className="flex flex-wrap gap-2">
          {renderTags()}
        </div>
      )}
    </div>
  );
}
