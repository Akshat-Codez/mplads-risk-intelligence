import React from 'react';
import { MOCK_VENDORS } from '../../data/mockData';
import { Building2, AlertTriangle, Network } from '../../components/common/Icons';

export const Vendors: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Vendor Intelligence & Cartel Explorer</h1>
        <p className="text-xs text-slate-500">Track contractor project concentrations, shared GSTIN addresses, and multi-agency bidding patterns</p>
      </div>

      {/* React Flow Visual Cartel Network Graphic Simulation */}
      <div className="bg-slate-900 rounded-xl p-6 h-72 border border-slate-800 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Network className="text-blue-400" size={18} />
            <h3 className="font-bold text-sm">Interactive React Flow Vendor Network Graph</h3>
          </div>
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1 rounded-full font-bold">1 Cartel Ring Active</span>
        </div>

        {/* Visual Graph Diagram SVG */}
        <div className="flex items-center justify-center my-auto">
          <svg className="w-full h-36" viewBox="0 0 600 150">
            <line x1="100" y1="75" x2="300" y2="30" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>
            <line x1="100" y1="75" x2="300" y2="120" stroke="#3b82f6" strokeWidth="2"/>
            <line x1="300" y1="30" x2="500" y2="75" stroke="#ef4444" strokeWidth="3"/>
            <line x1="300" y1="120" x2="500" y2="75" stroke="#ef4444" strokeWidth="3"/>

            <circle cx="100" cy="75" r="20" fill="#10b981"/>
            <text x="100" y="78" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">MP Office</text>

            <circle cx="300" cy="30" r="16" fill="#3b82f6"/>
            <text x="300" y="33" fill="white" fontSize="8" textAnchor="middle">PWD Div-1</text>

            <circle cx="300" cy="120" r="16" fill="#3b82f6"/>
            <text x="300" y="123" fill="white" fontSize="8" textAnchor="middle">REO Div-2</text>

            <circle cx="500" cy="75" r="24" fill="#ef4444" className="animate-pulse"/>
            <text x="500" y="78" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">Shree Infra</text>
          </svg>
        </div>

        <p className="text-[11px] text-slate-400">
          * React Flow graph visualizes shared bank accounts & GSTIN registration links across non-tendered works.
        </p>
      </div>

      {/* Vendor Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Registered Contractors & Anomaly Flags</h3>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Vendor Name & GSTIN</th>
              <th className="p-3">Projects</th>
              <th className="p-3">Total Expenditure</th>
              <th className="p-3">Agencies Served</th>
              <th className="p-3">Risk Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_VENDORS.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <p className="font-bold text-slate-900">{v.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">GSTIN: {v.gstin}</p>
                </td>
                <td className="p-3 font-semibold text-slate-900">{v.totalProjects} Works</td>
                <td className="p-3 font-semibold text-slate-900">₹{(v.totalExpenditure / 100000).toFixed(1)} L</td>
                <td className="p-3 text-slate-700">{v.agencyCount} Agencies</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    v.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    v.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {v.riskLevel}
                  </span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => alert(`Opening Network Graph for ${v.name}`)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] px-3 py-1 rounded transition"
                  >
                    View Network
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
