import React from 'react';
import { PublicNavbar } from '../../components/common/PublicNavbar';
import { ShieldCheck, FileCheck, CheckCircle } from '../../components/common/Icons';

export const Guidelines: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#0A2540] via-[#002B49] to-[#0A2540] text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
            <FileCheck size={16} />
            <span>Statutory Rules & Decision Support Protocols</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
            Guidelines & System Protocols
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Distinguishing official Government of India MPLADS scheme guidelines from NIRMAN analytical risk interpretation standards.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 text-xs sm:text-sm leading-relaxed text-slate-700">
        
        {/* Part 1: Official Statutory MPLADS Guidelines */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">Part A: Official MPLADS Scheme Guidelines</h2>
              <p className="text-[11px] text-slate-500 font-medium">Statutory Provisions Issued by MoSPI, Government of India</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">1. SC/ST Sub-plan Allocation</h3>
              <p className="text-slate-600 leading-relaxed">
                Under MPLADS guidelines, at least <strong>15%</strong> of annual scheme funds must be utilized for areas inhabited by Scheduled Caste (SC) population, and at least <strong>7.5%</strong> must be utilized for areas inhabited by Scheduled Tribe (ST) population.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">2. Sanction & Scrutiny Timelines</h3>
              <p className="text-slate-600 leading-relaxed">
                District Authorities must examine recommendations and accord Administrative Approval (AA) or convey non-feasibility within <strong>75 days</strong> of recommendation by the Hon'ble MP.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">3. Prohibited Works</h3>
              <p className="text-slate-600 leading-relaxed">
                MPLADS funds cannot be sanctioned for commercial organizations, religious places or places of worship, acquisition of land, or ongoing operational maintenance.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">4. 10% Mandatory Physical Inspection</h3>
              <p className="text-slate-600 leading-relaxed">
                District Authorities are required by guidelines to physically inspect at least <strong>10%</strong> of sanctioned MPLADS works annually to verify ground reality.
              </p>
            </div>
          </div>
        </section>

        {/* Part 2: NIRMAN System Guidance & Risk Interpretation */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">Part B: NIRMAN System Guidance & Risk Interpretation</h2>
              <p className="text-[11px] text-slate-500 font-medium">Standard Operating Procedures for Platform Users</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-1">
              <span className="font-bold text-red-900 block text-sm">Critical Risk (Score &ge; 80) & High Risk (50–79)</span>
              <p className="text-slate-700 leading-relaxed">
                Indicates compound statistical anomalies across multiple domains (e.g. substantial peer cost deviation combined with long sanction delays or vendor monopoly). <strong>Recommended Action:</strong> Priority scheduling for mandatory field physical inspection by the District Collector or designated nodal engineer.
              </p>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 block text-sm">Medium Risk (Score 25–49)</span>
              <p className="text-slate-700 leading-relaxed">
                Indicates isolated indicators, such as minor tender turnaround delay or single-source contracting, without compound flags. <strong>Recommended Action:</strong> Routine desk verification of document checklists before final disbursement.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-bold text-emerald-900 block text-sm">Low Risk (Score &lt; 25)</span>
              <p className="text-slate-700 leading-relaxed">
                Normal execution parameters conforming to historical constituency medians, with complete documentation and standard procurement turnaround.
              </p>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block text-sm">Insufficient Data Status</span>
              <p className="text-slate-700 leading-relaxed">
                <strong>Important Principle:</strong> Insufficient Data does <em>not</em> mean Low Risk. It signifies that critical financial records, dates, or vendor entries are missing from the system, preventing a conclusive assessment. Authorities must update baseline project records.
              </p>
            </div>
          </div>
        </section>

        {/* Part 3: Authority Responsibilities */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif">Part C: Authority Roles & Responsibilities in NIRMAN</h2>
              <p className="text-[11px] text-slate-500 font-medium">Role-Based Operational Access</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-blue-900">Ministry (MoSPI) Ops</h3>
              <p className="text-slate-600">Monitors national macro trends, cross-state contractor clusters, aggregate fund utilization, and model performance.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-emerald-900">State Nodal Authority</h3>
              <p className="text-slate-600">Oversees district-wise performance within the state, reviews escalated investigation dossiers, and tracks SC/ST sub-plan compliance.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-purple-900">District Collector (DC)</h3>
              <p className="text-slate-600">Executes on the high-risk priority queue, assigns field inspection officers, conducts physical audits, and records verification findings.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Clean Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800">
        NIRMAN Portal • Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
      </footer>
    </div>
  );
};
