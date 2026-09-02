import React from 'react';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { ShieldCheck, Mail, MapPin } from '../../components/common/Icons';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#0A2540] via-[#002B49] to-[#0A2540] text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
            <Mail size={16} />
            <span>Prototype Support & Official Portals</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
            Support & Contact Information
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Project inquiries, authority access support, and authoritative Government of India portal references.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Prototype Development Support */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <span className="text-2xl">💻</span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 font-serif">NIRMAN Project Team</h2>
                <p className="text-[11px] text-slate-500 font-medium">Smart India Hackathon (SIH 2026) Prototype</p>
              </div>
            </div>

            <p className="text-slate-600">
              For technical inquiries regarding the NIRMAN multi-signal risk engine, dataset integration, authority access control, or codebase questions:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <p className="text-slate-800"><strong>Team:</strong> NIRMAN Technical Working Group</p>
              <p className="text-slate-800"><strong>Repository:</strong> mplads-risk-intelligence</p>
              <p className="text-slate-800"><strong>Platform:</strong> Node.js / Express • Prisma / SQLite • React / Vite</p>
              <p className="text-slate-800"><strong>Project ID:</strong> SIH 2026 MoSPI Challenge</p>
            </div>
          </div>

          {/* Card 2: Official Government Portal References */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 font-serif">Official MoSPI Portals</h2>
                <p className="text-[11px] text-slate-500 font-medium">Government of India References</p>
              </div>
            </div>

            <p className="text-slate-600">
              For statutory scheme guidelines, official circulars, and primary national fund transactions:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">e-SAKSHI Portal (eSAKSHI)</span>
                <span className="text-blue-600 font-mono text-[11px]">https://esakshi.gov.in</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Primary portal for MP recommendations and district sanctions.</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block">Ministry Website</span>
                <span className="text-blue-600 font-mono text-[11px]">https://mospi.gov.in</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Ministry of Statistics and Programme Implementation, New Delhi.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Note on Data & Feedback */}
        <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1">
          <p className="font-bold">Authorized Authority Feedback</p>
          <p className="text-blue-900 leading-relaxed">
            Authorized District Collectors and State Nodal Officers logged into the system can record physical inspection observations and investigation decisions directly through each project's <strong>Audit Action</strong> interface.
          </p>
        </div>

      </div>

      {/* Clean Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800">
        NIRMAN Portal • Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
      </footer>
    </div>
  );
};
