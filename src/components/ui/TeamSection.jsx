"use client";

export default function TeamSection() {
  const members = [
    { name: "Shushant Shukla", role: "Founder & CEO", avatar: "SS" },
    { name: "Siddhart Bhowmik", role: "Co-Founder", avatar: "SB" },
    { name: "Swayum Bansal", role: "Chief Technology Officer", avatar: "SB" },
    { name: "Sanidhya Srivastava", role: "Head of Product", avatar: "SS" },
    { name: "Yogya Chhabra", role: "Marketing Associate", avatar: "YC" },
    { name: "Shashwat Pathak", role: "Full Stack Developer", avatar: "SP" },
  ];

  return (
    <section className="w-full py-16 bg-black border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center">
          <span className="text-xs font-extrabold text-neon-purple tracking-widest uppercase block neon-text-glow">
            Our Operations
          </span>
          <h2 className="text-3xl font-black text-white">The Core Team</h2>
          <p className="text-xs text-gray-400 max-w-2xl mx-auto">
            The developers and product architects coordinating student
            engagement across the campus network.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto">
          {members.map((m, idx) => (
            <div
              key={idx}
              className="bg-dark-card border border-dark-border rounded-xl p-4 text-center space-y-3 hover:border-neon-purple/30 hover:shadow-neon transition-all duration-300 group"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-neon-purple/5 border border-dark-border group-hover:border-neon-purple/40 text-base font-black text-neon-lavender flex items-center justify-center transition-all duration-300">
                {m.avatar}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white group-hover:text-neon-purple transition-colors truncate">
                  {m.name}
                </h4>
                <p className="text-[10px] text-gray-500 font-semibold truncate">
                  {m.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}