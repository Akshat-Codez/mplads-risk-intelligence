import React from 'react';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { StateEmblem } from '../../components/common/StateEmblem';
import { ShieldCheck, BarChart3, MapPin, FileCheck, CheckCircle } from '../../components/common/Icons';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#0A2540] via-[#002B49] to-[#0A2540] text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
            <ShieldCheck size={16} />
            <span>Official Scheme & Platform Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
            About MPLADS & NIRMAN
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Understanding the Members of Parliament Local Area Development Scheme and the role of NIRMAN in assisting government authorities with risk-based verification.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 text-xs sm:text-sm leading-relaxed text-slate-700">
        
        {/* Section 1: About MPLADS */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">1. About the MPLADS Scheme</h2>
              <p className="text-[11px] text-slate-500 font-medium">Central Sector Scheme • Government of India</p>
            </div>
          </div>
          
          <p>
            The <strong>Members of Parliament Local Area Development Scheme (MPLADS)</strong> is a Central Sector Scheme formulated by the Government of India in December 1993. Under this scheme, each Member of Parliament (MP) has the choice to recommend developmental works of developmental nature with emphasis on the creation of durable community assets based on locally felt needs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900">Mandate & Eligible Works</h3>
              <p className="text-slate-600">
                Focuses on national developmental priorities including drinking water, education, public health, sanitation, irrigation, roads, and community infrastructure.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-slate-900">Execution Mechanism</h3>
              <p className="text-slate-600">
                MPs recommend works to the designated District Authority. The District Authority sanctions, selects implementing agencies following public procurement rules, and oversees execution.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: About NIRMAN */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">2. What NIRMAN Does</h2>
              <p className="text-[11px] text-slate-500 font-medium">National Infra Reporting & Monitoring Analytics Network</p>
            </div>
          </div>

          <p>
            <strong>NIRMAN</strong> is an AI-assisted risk intelligence and decision-support platform designed to help the Ministry of Statistics and Programme Implementation (MoSPI), State Nodal Authorities, and District Collectors monitor MPLADS works efficiently.
          </p>

          <p>
            With tens of thousands of active works sanctioned annually across hundreds of districts, reviewing every single project in equal manual detail is operationally challenging. NIRMAN analyzes multiple data streams to identify projects that exhibit statistical deviations or missing milestones, enabling authorities to allocate their physical inspection and audit resources where they are most needed.
          </p>
        </section>

        {/* Section 3: How Risk Intelligence Works */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">3. How Risk Intelligence Works</h2>
              <p className="text-[11px] text-slate-500 font-medium">7-Signal Multi-Dimensional Evaluation</p>
            </div>
          </div>

          <p>
            NIRMAN combines multiple risk signals into an aggregated risk score (0 to 100). The scoring is rule-governed and mathematically structured:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
              <span className="font-bold text-blue-900 block">Financial Signals (35%)</span>
              <p className="text-slate-600">Evaluates sanctioned amount deviations compared to median costs for identical work types in the constituency, along with sanction delays.</p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-bold text-emerald-900 block">Procurement Signals (20%)</span>
              <p className="text-slate-600">Monitors tender turnaround time, cost escalation ratios between estimates and awarded contracts, and single-bidder indicators.</p>
            </div>

            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
              <span className="font-bold text-purple-900 block">Contractor Signals (15%)</span>
              <p className="text-slate-600">Identifies vendor concentration where a single agency captures an unusually high proportion of constituency works.</p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 block">Progress & Timeline (10%)</span>
              <p className="text-slate-600">Compares reported physical progress against disbursed funds to highlight stagnation or release-execution mismatch.</p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">Document Completeness (10%)</span>
              <p className="text-slate-600">Tracks availability of essential statutory records: Measurement Book, Utilisation Certificate, and Sanction Orders.</p>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <span className="font-bold text-teal-900 block">Spatial & Cross-Signal (10%)</span>
              <p className="text-slate-600">Checks worksite coordinate registration against field app locations and evaluates multi-domain compound triggers.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Human Verification Principles */}
        <section className="bg-amber-50/70 p-6 sm:p-8 rounded-2xl border border-amber-200 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-base sm:text-lg">
            <CheckCircle size={20} className="text-amber-700" />
            <span>4. Human Verification Principle: AI Assists, Officers Decide</span>
          </div>
          <p className="text-amber-950 leading-relaxed text-xs sm:text-sm">
            NIRMAN is strictly an investigative triage and decision-support system. <strong>It does not allege or prove corruption, fraud, or wrongdoing.</strong> A high risk score indicates that a project exhibits statistical anomalies or missing administrative records that warrant closer human verification. Only authorized government authorities (District Collectors, State Nodal Officers, and Central Auditors) conduct physical inspections and make authoritative findings.
          </p>
        </section>

      </div>

      {/* Clean Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800">
        NIRMAN Portal • Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
      </footer>
    </div>
  );
};
