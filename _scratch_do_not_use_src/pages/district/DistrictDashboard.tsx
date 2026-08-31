import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertTriangle, CheckCircle2, MapPin, ArrowUpRight, ShieldAlert, FileText } from '../../components/common/Icons';
import { MOCK_PROJECTS } from '../../data/mockData';

const BOQ_DISTRICT_CHECK = [
  { item: 'Community Hall Roofing Structural Steel Truss', quoted: 1450000, reference: 890000, deviation: '+62.9%', status: 'HIGH_PRICE' },
  { item: 'Paver Blocks 80mm M40 Grade Heavy Duty', quoted: 820, reference: 540, deviation: '+51.8%', status: 'MODERATE_PRICE' }
];

export const DistrictDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGeoProject] = useState(MOCK_PROJECTS[0]);

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">District Collector Action Hub (Varanasi District)</h1>
          <p className="text-xs text-slate-500">Field inspection queues, local project evidence verifications, and investigation actions</p>
        </div>
        <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-bold">
          1 Priority Action Pending
        </span>
      </div>

      {/* District KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">District Total Works</p>
          <h3 className="text-2xl font-extrabold text-slate-900">412</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Sanctioned Amount</p>
          <h3 className="text-2xl font-extrabold text-slate-900">₹28.5 Cr</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Local Anomalies</p>
          <h3 className="text-2xl font-extrabold text-red-600">4 Works</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Pending Evidence Review</p>
          <h3 className="text-2xl font-extrabold text-amber-600">2 Items</h3>
        </div>
      </div>

      {/* FEATURE 1: Interactive GIS Geofence Inspector */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                FEATURE 1: GIS Geofence Location Inspector
              </span>
              <span className="text-xs text-slate-500 font-semibold">100m Tolerance Boundary Check</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Geotag Photo Location Mismatch Visualizer</h3>
            <p className="text-xs text-slate-500">Compares official registered worksite coordinates against uploaded field photo EXIF GPS metadata.</p>
          </div>
          <button onClick={() => navigate(`/projects/${selectedGeoProject.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded transition">
            Open Full Audit
          </button>
        </div>

        {/* GIS Simulator Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Map Simulation Visual */}
          <div className="md:col-span-2 bg-slate-900 rounded-xl p-5 text-white h-64 relative overflow-hidden border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs">
              <span className="bg-slate-800/80 px-3 py-1 rounded text-slate-200 font-mono">
                🟢 Registered Worksite: ({selectedGeoProject.regLatitude}, {selectedGeoProject.regLongitude})
              </span>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded border border-red-500/40 font-bold">
                8.4 km Distance Mismatch
              </span>
            </div>

            {/* Visual SVG Map Circle Simulator */}
            <div className="flex items-center justify-center my-auto relative">
              <svg className="w-full h-32" viewBox="0 0 400 120">
                {/* 100m Tolerance Green Circle */}
                <circle cx="100" cy="60" r="35" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" strokeDasharray="4"/>
                <circle cx="100" cy="60" r="6" fill="#10b981"/>
                <text x="100" y="110" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Registered Worksite (100m Geofence)</text>

                {/* Dotted Line Gap */}
                <line x1="100" y1="60" x2="300" y2="60" stroke="#ef4444" strokeWidth="2" strokeDasharray="6"/>

                {/* Photo EXIF Mismatch Location */}
                <circle cx="300" cy="60" r="8" fill="#ef4444" className="animate-ping"/>
                <circle cx="300" cy="60" r="8" fill="#ef4444"/>
                <text x="300" y="110" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold">Photo EXIF Location (8.4 km Away)</text>
              </svg>
            </div>
          </div>

          {/* Right Audit Summary */}
          <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Location Audit Decision:</h4>
            <p className="text-slate-600">
              Photo uploaded for <strong>{selectedGeoProject.workTitle}</strong> was captured outside the allowed 100m geofence radius.
            </p>
            <div className="bg-red-50 p-2.5 rounded border border-red-200 text-red-700 font-bold">
              ⚠ Action Required: Request field verification from District Inspector before releasing payment.
            </div>
            <button 
              onClick={() => alert(`Verification order issued for ${selectedGeoProject.projectId}. Payment disbursal paused.`)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition"
            >
              Issue Field Audit Order
            </button>
          </div>
        </div>
      </div>

      {/* FEATURE 3: District Local BOQ Procurement Rate Auditor */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-blue-600">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                FEATURE 3: Local BOQ Rate Audit
              </span>
              <span className="text-xs text-slate-500 font-semibold">Tender BOQ Price vs CPWD SSR Benchmark</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">District Tender Item Rate Auditor</h3>
            <p className="text-xs text-slate-500">Flags quoted item prices exceeding standard schedule of rates before sanction approval.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {BOQ_DISTRICT_CHECK.map(check => (
            <div key={check.item} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <p className="font-bold text-slate-900">{check.item}</p>
                <p className="text-[11px] text-slate-500">Quoted: ₹{check.quoted.toLocaleString('en-IN')} | SSR Benchmark: ₹{check.reference.toLocaleString('en-IN')}</p>
              </div>
              <span className="bg-red-100 text-red-700 font-extrabold px-3 py-1 rounded border border-red-200">
                {check.deviation} Inflation
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Local Projects Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">District Local Works Queue</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Work Title & ID</th>
              <th className="p-3">Agency</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Risk Score</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_PROJECTS.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">{p.workTitle} ({p.projectId})</td>
                <td className="p-3 text-slate-700">{p.implementingAgency}</td>
                <td className="p-3 text-slate-700">{p.vendorName}</td>
                <td className="p-3 font-semibold">₹{(p.actualExpenditure/100000).toFixed(1)} L</td>
                <td className="p-3 font-bold text-red-600">{p.riskScore}/100</td>
                <td className="p-3">
                  <button onClick={() => navigate(`/projects/${p.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1 rounded transition">
                    Field Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
