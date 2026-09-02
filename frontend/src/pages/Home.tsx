import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicNavbar } from '../components/common/PublicNavbar';
import { StateEmblem } from '../components/common/StateEmblem';
import { MoSPILogo } from '../components/common/MoSPILogo';
import { 
  ArrowRight, 
  Sparkles, 
  IndianRupee, 
  FileText, 
  Briefcase, 
  Globe, 
  FileCheck, 
  CheckCircle2, 
  ClipboardCheck, 
  Users,
  ShieldCheck,
  Building,
  Layers,
  CheckCircle
} from '../components/common/Icons';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* 1. Official Header & Navigation Bar */}
      <PublicNavbar />

      {/* 2. Hero Section: Exact layout, background, typography & CTA */}
      <section className="bg-gradient-to-r from-[#091B33] via-[#0D2444] to-[#0A1D38] text-white py-14 sm:py-16 px-4 sm:px-8 border-b border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[#E65100] font-black text-sm tracking-widest uppercase block">
              NIRMAN
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white leading-tight tracking-tight">
              Intelligent Risk Monitoring <br />
              for Public Development
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl">
              An AI-assisted monitoring and decision intelligence platform for the Members of Parliament Local Area Development Scheme (MPLADS). NIRMAN synthesizes financial, procurement, contractor, timeline, and geospatial signals to help government authorities prioritize projects that require closer human verification.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="bg-[#E65100] hover:bg-[#c64500] text-white px-7 py-3.5 rounded-lg shadow-lg flex items-center space-x-2 transition font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>ACCESS AUTHORITY DASHBOARD</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: MoSPI Monitoring Summary Glass Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#0D223F]/80 backdrop-blur-md border border-blue-400/20 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
              <h3 className="text-center text-sm font-bold text-slate-100 font-serif tracking-wide">
                MoSPI Monitoring Summary
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Metric 1 */}
                <div className="bg-gradient-to-b from-[#11315B] to-[#0B2140] border border-blue-400/30 rounded-xl p-4 text-center space-y-1 shadow-inner">
                  <span className="text-white font-extrabold text-2xl sm:text-3xl font-serif block">
                    ₹5 Crore
                  </span>
                  <p className="text-slate-300 text-[11px] font-medium">
                    Annual Fund Per MP
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="bg-gradient-to-b from-[#11315B] to-[#0B2140] border border-blue-400/30 rounded-xl p-4 text-center space-y-1 shadow-inner">
                  <span className="text-white font-extrabold text-2xl sm:text-3xl font-serif block">
                    27,347+
                  </span>
                  <p className="text-slate-300 text-[11px] font-medium">
                    Total Projects Analyzed
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Why NIRMAN? Section with Callout Alert Box */}
      <section className="bg-white py-14 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] font-serif tracking-tight">
            Why NIRMAN?
          </h2>

          {/* Callout Alert Box */}
          <div className="bg-[#EEF5FC] border border-[#BFD9F5] rounded-xl p-6 text-left shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-[#0A2540] font-bold text-sm sm:text-base">
              <span className="text-blue-700 text-lg">⚠️</span>
              <span>Objective Risk Prioritization, Not Automatic Accusation.</span>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed pl-7">
              NIRMAN identifies projects requiring further verification. It does not allege corruption, nor does AI make legal findings. Instead, it surfaces projects exhibiting statistical cost anomalies, unusual vendor clustering, procurement bottlenecks, or incomplete documentation so that District Collectors and State Nodal Officers can focus their on-ground verification where it matters most.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 03 • ARCHITECTURE & WORKFLOW / How NIRMAN Works */}
      <section className="bg-white py-14 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">
              03 • ARCHITECTURE &amp; WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] font-serif tracking-tight">
              How NIRMAN Works
            </h2>
          </div>

          {/* Stepper Pipeline Flow */}
          <div className="overflow-x-auto pb-4 pt-2">
            <div className="min-w-[860px] flex items-center justify-between gap-1.5 text-[10px] font-bold tracking-tight">
              
              <div className="bg-[#DFE7EF] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                PROJECT<br />DATA
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#DFE5EE] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                DATA<br />VALIDATION
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#D3E3F0] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                FINANCIAL<br />ANALYSIS
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#D7DAED] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                PROCUREMENT<br />ANALYSIS
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#DCD5EB] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                CONTRACTOR<br />ANALYSIS
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#5C5376] text-white px-3 py-3 rounded-xl border border-[#484061] text-center flex-1 shrink-0 shadow-md">
                RISK<br />ENGINE
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#D0DEEF] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                AI-ASSISTED<br />EXPLANATION
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#E2DCEB] text-slate-800 px-3 py-3 rounded-xl border border-slate-300 text-center flex-1 shrink-0 shadow-sm">
                GIS<br />PRIORITIZATION
              </div>
              <span className="text-slate-400 font-bold px-0.5">→</span>

              <div className="bg-[#FBEBD9] text-slate-900 px-3 py-3 rounded-xl border border-amber-300 text-center flex-1 shrink-0 shadow-sm">
                HUMAN<br />VERIFICATION
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. 04 • IMPLEMENTED FEATURES / Key System Capabilities (3x3 Grid) */}
      <section className="bg-[#FBFBF9] py-16 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-1">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">
              04 • IMPLEMENTED FEATURES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] font-serif tracking-tight">
              Key System Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            
            {/* Card 1: AI-Assisted Multi-Signal Briefings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  AI-Assisted Multi-Signal Briefings
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                AI-Assisted multi-signal risk briefings to investigate documentation, with explainable indicators.
              </p>
            </div>

            {/* Card 2: Financial Risk Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-center justify-center shrink-0">
                  <IndianRupee size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Financial Risk Analysis
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Financial identifies projects to prioritize financial audits, and financial risk analysis.
              </p>
            </div>

            {/* Card 3: Procurement Turnaround Scrutiny */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Procurement Turnaround Scrutiny
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Procurement turnaround bottleneck scrutiny, and contractor analysis.
              </p>
            </div>

            {/* Card 4: Contractor Risk Indicators */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Briefcase size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Contractor Risk Indicators
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Indicate contractor indicators on incomplete documentation.
              </p>
            </div>

            {/* Card 5: GIS-Based Project Visualization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  GIS-Based Project Visualization
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                GIS-Based project project analysis in project visualization.
              </p>
            </div>

            {/* Card 6: Evidence & Document Review */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <FileCheck size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Evidence &amp; Document Review
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Review, verification of evidence &amp; Document review.
              </p>
            </div>

            {/* Card 7: Physical Inspection Tracking */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Physical Inspection Tracking
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Physical inspection walk-through, and inspection tracking.
              </p>
            </div>

            {/* Card 8: Audit & Case Workflow */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <ClipboardCheck size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Audit &amp; Case Workflow
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Realtime contractor review and audit &amp; case workflow.
              </p>
            </div>

            {/* Card 9: Role-Scoped Authority Access */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  Role-Scoped Authority Access
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Role-scoped authority and authority access control access.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Comprehensive MPLADS Framework & Statutory Rules */}
      <section className="bg-white py-16 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2 text-center">
            <span className="text-[#E65100] font-black text-xs uppercase tracking-widest block">
              GOVERNMENT SCHEME ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] font-serif tracking-tight">
              Understanding the MPLADS Scheme
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
              Formulated by the Government of India in December 1993, the Members of Parliament Local Area Development Scheme (MPLADS) is administered by the Ministry of Statistics and Programme Implementation (MoSPI).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            
            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-bold text-sm text-slate-900">1. Recommendation Structure</h3>
              <p className="text-slate-600 leading-relaxed">
                Hon'ble Lok Sabha MPs recommend eligible developmental works in their constituencies. Rajya Sabha MPs recommend works within their state of election. Nominated MPs may recommend works anywhere in India.
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-2xl">💰</span>
              <h3 className="font-bold text-sm text-slate-900">2. Fund Entitlement</h3>
              <p className="text-slate-600 leading-relaxed">
                Each MP is allocated ₹5 Crore per financial year, released in two equal installments of ₹2.5 Crore directly by MoSPI to the designated Nodal District Authority for capital asset creation.
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-2xl">🏗️</span>
              <h3 className="font-bold text-sm text-slate-900">3. Implementing Agencies</h3>
              <p className="text-slate-600 leading-relaxed">
                District Authorities examine technical estimates and accord Administrative Approval (AA) within 75 days. Works are executed through established public agencies following state procurement regulations.
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-2xl">⚖️</span>
              <h3 className="font-bold text-sm text-slate-900">4. Statutory Compliance</h3>
              <p className="text-slate-600 leading-relaxed">
                Guidelines mandate at least 15% fund utilization in Scheduled Caste (SC) areas and 7.5% in Scheduled Tribe (ST) areas. District Collectors must conduct 10% annual physical inspections.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Comprehensive NIRMAN Risk Intelligence System Context */}
      <section className="bg-slate-50 py-16 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2 text-center">
            <span className="text-[#E65100] font-black text-xs uppercase tracking-widest block">
              DECISION SUPPORT PLATFORM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] font-serif tracking-tight">
              Understanding NIRMAN Risk Intelligence
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
              How the National Infra Reporting &amp; Monitoring Analytics Network transforms raw administrative records into actionable verification priorities for MoSPI and District Collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold">
                🎯
              </div>
              <h3 className="font-bold text-sm text-slate-900">Triage & Prioritization Engine</h3>
              <p className="text-slate-600 leading-relaxed">
                With over 27,000 active works across 30 States and Union Territories, manual physical inspection of every single work is unfeasible. NIRMAN acts as an intelligent sieve, ranking works by cumulative risk indicators so limited field engineering resources inspect high-priority works first.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center justify-center font-bold">
                📊
              </div>
              <h3 className="font-bold text-sm text-slate-900">Multi-Signal Convergence</h3>
              <p className="text-slate-600 leading-relaxed">
                Rather than relying on isolated metrics, NIRMAN aggregates 7 dimensions: financial peer cost deviation, procurement turnaround, contractor concentration, physical vs financial execution gap, document completeness, geospatial validity, and cross-signal anomaly multipliers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                🛡️
              </div>
              <h3 className="font-bold text-sm text-slate-900">Human-in-the-Loop Integrity</h3>
              <p className="text-slate-600 leading-relaxed">
                NIRMAN strictly assists officers and does not replace human judgment. An elevated risk score highlights statistical deviation or missing documentation; final findings are recorded only by authorized District Collectors and State Nodal Officers through formal field audit reports.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Official Clean Footer matching attached PNG */}
      <footer className="bg-white text-slate-600 py-8 px-4 sm:px-8 border-t border-slate-200 text-xs font-sans">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Top Row: Emblems + Titles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <StateEmblem size={36} darkBg={false} />
              <MoSPILogo size={30} />
              <span className="font-black text-slate-900 text-sm tracking-tight font-serif">MoSPI</span>
            </div>
            <span className="font-bold text-slate-800 text-xs tracking-wide">
              MPLADS Risk Intelligence System
            </span>
          </div>

          {/* Bottom Row: Copyright + Terms Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500">
            <p>© 2026 MoSPI, Government of India. All Rights Reserved.</p>
            <div className="flex items-center space-x-3">
              <Link to="/guidelines" className="hover:text-[#E65100] transition">Privacy Policy</Link>
              <span>|</span>
              <Link to="/help" className="hover:text-[#E65100] transition">Terms of Use</Link>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
