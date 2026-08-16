"use client";

import { motion } from "framer-motion";

export default function Partners() {
  const partners = [
    { name: "University Innovation Cell", short: "UIC" },
    { name: "Startup Club",               short: "SC" },
    { name: "Developer Society",           short: "DEV" },
    { name: "Maker Community",             short: "MKR" },
    { name: "Entrepreneurship Hub",        short: "E_HUB" },
    { name: "Tech Council",               short: "TECH" },
  ];

  return (
    <section id="partners" className="py-10 relative w-full border-t border-white/6 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6 text-center">
        <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
          Built for students across the ecosystem
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-center justify-center max-w-5xl mx-auto">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06, ease: [0, 0, 0.2, 1] }}
              className="bg-[#111111] border border-white/6 rounded-xl px-3 py-4 flex flex-col items-center justify-center gap-1 grayscale hover:grayscale-0 opacity-35 hover:opacity-100 hover:border-white/16 hover:-translate-y-0.5 transition-all duration-150 cursor-default"
            >
              <span className="text-[12px] font-bold tracking-widest text-white">
                {partner.short}
              </span>
              <span className="text-[9px] uppercase font-medium text-white/40 tracking-wider text-center">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
