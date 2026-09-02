import React from 'react';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { ShieldCheck, HelpCircle } from '../../components/common/Icons';

export const Help: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#0A2540] via-[#002B49] to-[#0A2540] text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
            <HelpCircle size={16} />
            <span>User Assistance & System Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
            User Help & Operational Guide
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Step-by-step guidance on signing in, interpreting risk scores, reviewing AI briefings, and navigating GIS maps.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
        
        {/* Step 1: Signing In & Authority Access */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">1</span>
            <span>How to Sign In & Select Your Authority</span>
          </h2>
          <p>
            From the landing page, click the primary <strong>"Access Authority Dashboard"</strong> button to navigate to the Sign In page. Select your authorized role:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Hon'ble Minister:</strong> Executive national policy overview and high-impact briefings.</li>
            <li><strong>Ministry (MoSPI) Ops:</strong> Comprehensive national dataset monitoring and anomaly radar.</li>
            <li><strong>State Nodal Authority:</strong> Select your assigned State to access state-scoped project monitoring.</li>
            <li><strong>District Collector:</strong> Select your State and District to access your localized district action hub.</li>
          </ul>
          <p className="text-[11px] text-slate-500">Enter your credentials and the 5-character security CAPTCHA code shown on screen to sign in.</p>
        </div>

        {/* Step 2: Interpreting Risk Scores */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">2</span>
            <span>How to Interpret Risk Scores & Categories</span>
          </h2>
          <p>
            NIRMAN calculates a risk score from 0 to 100 for each project based on financial, procurement, contractor, progress, spatial, and documentation signals:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <strong className="text-red-900 block">Critical (&ge;80) / High (50–79)</strong>
              <span className="text-slate-600">Significant statistical anomalies or timeline delays. Prioritized for physical field inspection.</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <strong className="text-amber-900 block">Medium (25–49)</strong>
              <span className="text-slate-600">Minor deviations or incomplete document checklists. Handled via standard desk review.</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <strong className="text-emerald-900 block">Low (&lt;25)</strong>
              <span className="text-slate-600">Normal execution aligned with historical medians.</span>
            </div>
          </div>
        </div>

        {/* Critical Principle: What INSUFFICIENT DATA Means */}
        <div className="bg-amber-50/80 p-6 sm:p-8 rounded-2xl border border-amber-300 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-amber-950 flex items-center space-x-2">
            <span className="text-amber-700">⚠️</span>
            <span>What "INSUFFICIENT DATA" Means in NIRMAN</span>
          </h2>
          <p className="text-amber-950 font-medium leading-relaxed">
            <strong>INSUFFICIENT DATA does NOT mean LOW RISK.</strong>
          </p>
          <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
            When a project is labeled "Insufficient Data", it means the system lacks critical financial figures (such as sanctioned amounts or expenditure records), key procurement dates, or vendor identities necessary to perform a rigorous multi-signal evaluation. A missing record is <em>not</em> treated as zero cost or clean execution; it is flagged so authorities can ensure baseline data compliance.
          </p>
        </div>

        {/* Step 3: AI Analysis & Multi-Signal Briefings */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">3</span>
            <span>How to Open AI Officer Multi-Signal Briefings</span>
          </h2>
          <p>
            When viewing any project in the <strong>Project Details</strong> dossier, NIRMAN automatically generates a structured investigative summary. The briefing highlights:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Specific financial flags (e.g. amount variance vs constituency peers)</li>
            <li>Procurement turnaround and contractor concentration indicators</li>
            <li>Checklist of missing statutory documents (e.g. MB, UC, CC)</li>
            <li>Recommended inspection checklist for field engineers</li>
          </ul>
          <p className="text-[11px] text-slate-500">If external AI services are offline, NIRMAN seamlessly falls back to a deterministic multi-signal engine so pages never fail.</p>
        </div>

        {/* Step 4: Physical Inspection vs Work Completion */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">4</span>
            <span>Physical Inspection Tracking</span>
          </h2>
          <p>
            NIRMAN enforces a strict distinction between <em>Work Completed</em> and <em>Physically Inspected</em>. A work will display <strong>"NOT INSPECTED"</strong> until an authorized nodal officer conducts a physical ground visit and uploads verification evidence.
          </p>
        </div>

        {/* Step 5: GIS Project Visualization */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">5</span>
            <span>How to Use the GIS Risk Map</span>
          </h2>
          <p>
            The GIS Analytics view renders project locations with color-coded risk pins. Only projects with verified coordinates are plotted. Click on any pin to view the work description, sanction details, and directly jump to the detailed project audit dossier.
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
