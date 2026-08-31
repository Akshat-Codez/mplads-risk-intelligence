import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertTriangle, CheckCircle2, ArrowUpRight, Send } from '../../components/common/Icons';
import { MOCK_PROJECTS, MOCK_CASES } from '../../data/mockData';

const DISTRICT_PERFORMANCE = [
  { district: 'Varanasi', totalWorks: 412, spent: '₹28.5 Cr', anomalyRate: '2.4%', scCompliance: '16.8%', stCompliance: '8.1%', status: 'Compliant' },
  { district: 'Gorakhpur', totalWorks: 380, spent: '₹24.2 Cr', anomalyRate: '1.8%', scCompliance: '15.4%', stCompliance: '7.8%', status: 'Compliant' },
  { district: 'Lucknow', totalWorks: 520, spent: '₹39.1 Cr', anomalyRate: '3.1%', scCompliance: '14.2%', stCompliance: '6.9%', status: 'Warning' },
  { district: 'Prayagraj', totalWorks: 440, spent: '₹31.0 Cr', anomalyRate: '2.1%', scCompliance: '15.9%', stCompliance: '7.6%', status: 'Compliant' },
  { district: 'Kanpur', totalWorks: 490, spent: '₹35.4 Cr', anomalyRate: '2.8%', scCompliance: '15.1%', stCompliance: '7.5%', status: 'Compliant' }
];

export const StateDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">State Nodal Authority Dashboard (Uttar Pradesh)</h1>
          <p className="text-xs text-slate-500">State-level district monitoring, escalated case reviews, and regional vendor concentration</p>
        </div>
        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-bold">
          75 Districts Monitored
        </span>
      </div>

      {/* State KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">State Total Projects</p>
          <h3 className="text-2xl font-extrabold text-slate-900">28,450</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">State Expenditure</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹480 Crore</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Escalated Cases</p>
          <h3 className="text-2xl font-extrabold text-amber-600">18 Open</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">SC/ST Sub-plan Compliance</p>
          <h3 className="text-2xl font-extrabold text-emerald-600">96.2%</h3>
        </div>
      </div>

      {/* FEATURE 2: State SC/ST Sub-plan District Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">District SC & ST Sub-Plan Statutory Compliance Ranking</h3>
            <p className="text-xs text-slate-500">Tracking 15% SC & 7.5% ST statutory spending targets across districts</p>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            1 District Below SC/ST Quota
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">District</th>
              <th className="p-3">Total Works</th>
              <th className="p-3">Total Spent</th>
              <th className="p-3">SC Allocation % (Min 15%)</th>
              <th className="p-3">ST Allocation % (Min 7.5%)</th>
              <th className="p-3">Anomaly Rate</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {DISTRICT_PERFORMANCE.map(d => (
              <tr key={d.district} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">{d.district}</td>
                <td className="p-3 text-slate-700">{d.totalWorks}</td>
                <td className="p-3 font-semibold text-slate-900">{d.spent}</td>
                <td className="p-3 font-bold text-emerald-700">{d.scCompliance}</td>
                <td className="p-3 font-bold text-emerald-700">{d.stCompliance}</td>
                <td className="p-3 text-red-600 font-semibold">{d.anomalyRate}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Escalated Cases Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-amber-500">
        <h3 className="text-sm font-bold text-slate-900">Escalated Investigation Inbox (Requires State Review)</h3>
        {MOCK_CASES.map(c => (
          <div key={c.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-900">{c.title} ({c.caseNumber})</span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">{c.priority}</span>
            </div>
            <p className="text-slate-600">Escalated by District Collector ({c.assignedDistrict}) on {c.createdAt}.</p>
            <div className="flex space-x-2 pt-1">
              <button onClick={() => navigate('/investigations')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded transition">
                Open Investigation Case
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
