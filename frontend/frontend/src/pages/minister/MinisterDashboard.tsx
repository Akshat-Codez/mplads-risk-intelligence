import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, ShieldCheck, ArrowUpRight, CheckCircle2, Download, Building2, AlertTriangle } from '../../components/common/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { MOCK_PROJECTS } from '../../data/mockData';

const TOP_CONSTITUENCIES = [
  { name: 'Varanasi (UP)', spent: 4.8, count: 42, score: 92 },
  { name: 'Patna Sahib (BR)', spent: 4.2, count: 38, score: 88 },
  { name: 'Pune (MH)', spent: 4.5, count: 45, score: 95 },
  { name: 'Jaipur (RJ)', spent: 3.9, count: 31, score: 84 },
  { name: 'Bhopal (MP)', spent: 4.1, count: 36, score: 89 }
];

const SECTOR_DISTRIBUTION = [
  { name: 'Drinking Water', value: 30, color: '#2563EB' },
  { name: 'CC Roads & Transport', value: 28, color: '#10B981' },
  { name: 'Primary Education', value: 20, color: '#F59E0B' },
  { name: 'Public Health (PHC)', value: 12, color: '#8B5CF6' },
  { name: 'Community Halls', value: 10, color: '#EF4444' }
];

export const MinisterDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 font-sans">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#002B49] to-[#0A2540] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs px-3 py-0.5 rounded-full font-bold">
              🇮🇳 Union Executive Oversight • Ministry of Statistics & Programme Implementation
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight mt-2 text-white">Hon'ble Minister Executive Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">High-level national MPLADS fund subvention summaries, MP constituency performance, and statutory compliance oversight</p>
        </div>
        <button 
          onClick={() => alert('Generating Official Ministerial Executive Briefing PDF Report...')}
          className="bg-[#E65100] hover:bg-[#c64500] text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition"
        >
          <Download size={15} />
          <span>Export Executive Briefing PDF</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">National Fund Subvention</p>
          <h3 className="text-2xl font-extrabold text-[#0A2540]">₹2,715 Crore</h3>
          <p className="text-[11px] text-emerald-600 font-bold">100% Released by MoSPI</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Overall Disbursement</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹1,940 Crore</h3>
          <p className="text-[11px] text-blue-600 font-bold">71.4% Spent on Community Assets</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">MP Recommendation Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-600">96.8%</h3>
          <p className="text-[11px] text-slate-400">543 Lok Sabha + 245 Rajya Sabha</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Flagged Works Under Audit</p>
          <h3 className="text-2xl font-extrabold text-red-600">3,412</h3>
          <p className="text-[11px] text-red-500 font-bold">2.38% Anomaly Rate</p>
        </div>
      </div>

      {/* FEATURE 2: Statutory SC/ST Sub-plan Compliance Gauge */}
      <div className="bg-white p-6 rounded-xl border-l-4 border-l-emerald-600 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Statutory Requirement Compliance
              </span>
              <span className="text-xs text-slate-500 font-semibold">MPLADS Guideline Section 3.2</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">National SC & ST Sub-Plan Spending Quota Monitor</h3>
            <p className="text-xs text-slate-500">Mandatory statutory requirement: At least <strong>15% for Scheduled Caste (SC)</strong> areas and <strong>7.5% for Scheduled Tribe (ST)</strong> areas annually.</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
            ✓ 96.8% National Compliance Rate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
          {/* SC Quota Gauge (15% Minimum) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Scheduled Caste (SC) Quota Target (Min 15.0%)</span>
              <span className="font-extrabold text-emerald-600">16.4% Allocated (COMPLIANT)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <p className="text-[11px] text-slate-500">₹445.2 Crore allocated across SC population habitations.</p>
          </div>

          {/* ST Quota Gauge (7.5% Minimum) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Scheduled Tribe (ST) Quota Target (Min 7.5%)</span>
              <span className="font-extrabold text-emerald-600">8.2% Allocated (COMPLIANT)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '88%' }}></div>
            </div>
            <p className="text-[11px] text-slate-500">₹222.6 Crore allocated across tribal area developmental works.</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Constituency Expenditure Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900">Top Performing MP Constituencies (Fund Utilization ₹ Cr)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_CONSTITUENCIES}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit=" Cr" />
                <Tooltip />
                <Bar dataKey="spent" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Sector-Wise Fund Distribution</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SECTOR_DISTRIBUTION} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {SECTOR_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-[11px]">
            {SECTOR_DISTRIBUTION.map(item => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Policy Priorities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">High-Impact Works Requiring Ministerial Attention</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Work Title & ID</th>
              <th className="p-3">Hon'ble MP</th>
              <th className="p-3">Constituency</th>
              <th className="p-3">Amount</th>
              <th className="p-3">AI Risk Score</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_PROJECTS.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <p className="font-bold text-slate-900">{p.workTitle}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{p.projectId}</p>
                </td>
                <td className="p-3 text-slate-700">{p.mpName}</td>
                <td className="p-3 text-slate-700">{p.constituency}, {p.state}</td>
                <td className="p-3 font-semibold text-slate-900">₹{(p.actualExpenditure/100000).toFixed(1)} L</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {p.riskScore}/100 ({p.riskLevel})
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => navigate(`/projects/${p.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] px-3 py-1 rounded transition">
                    Inspect
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
