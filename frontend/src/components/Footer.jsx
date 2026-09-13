// components/Footer.jsx — Official JNTU-GV Institutional Mandated Footer
import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      role="contentinfo"
      aria-label="University Portal Footer"
      className={`w-full bg-[#072558] text-white py-4 px-4 sm:px-6 md:px-8 border-t border-[#0B3D91]/40 shadow-inner z-10 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
        <p className="text-xs md:text-[13px] font-medium leading-relaxed tracking-wide text-white/95 selection:bg-[#D4AF37] selection:text-[#072558]">
          <span className="font-semibold text-white">© 2026 JNTU-GV. All Rights Reserved.</span>
          <span className="inline-block mx-1.5 text-[#D4AF37] font-bold" aria-hidden="true">·</span>
          <span>Designed, Developed &amp; Maintained by Yuva Teja &amp; Sahithya</span>
          <span className="inline-block mx-1.5 text-[#D4AF37] font-bold" aria-hidden="true">·</span>
          <span className="text-white/90">Department of Information Technology</span>
          <span className="inline-block mx-1.5 text-[#D4AF37] font-bold" aria-hidden="true">·</span>
          <span className="text-[#F5D975] font-semibold">JNTU-GV, Vizianagaram</span>
        </p>
      </div>
    </footer>
  );
}
