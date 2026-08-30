import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, BarChart3, MapPin, Building2, TrendingUp, AlertTriangle, FileText, CheckCircle2 } from '../../components/common/Icons';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { MOCK_PROJECTS } from '../../data/mockData';

const RISK_PIE_DATA = [
  { name: 'Low Risk (0-29)', value: 85, color: '#10B981' },
  { name: 'Moderate Risk (30-59)', value: 10, color: '#F59E0B' },
  { name: 'High Risk (60-79)', value: 3, color: '#EF4444' },
  { name: 'Critical Risk (80-100)', value: 2, color: '#991B1B' }
];

const ANOMALY_LINE_DATA = [
  { month: 'Jan', anomalies: 120 },
  { month: 'Feb', anomalies: 145 },
  { month: 'Mar', anomalies: 190 },
  { month: 'Apr', anomalies: 165 },
  { month: 'May', anomalies: 210 },
  { month: 'Jun', anomalies: 185 },
  { month: 'Jul', anomalies: 240 }
];

const BOQ_EXTRACTIONS = [
  { item: 'Solar Street Light (60W LED + LiFePO4 Battery)', quotedRate: 84000, referenceSSR: 28500, unit: 'Per Unit', deviation: '+294.7%', risk: 'CRITICAL' },
  { item: 'Deep Rig Borewell Drilling (150mm dia)', quotedRate: 3400, referenceSSR: 1850, unit: 'Per Meter', deviation: '+83.7%', risk: 'HIGH' },
  { item: 'Ready Mix Concrete M25 Grade', quotedRate: 7800, referenceSSR: 5200, unit: 'Per Cu.m', deviation: '+50.0%', risk: 'MODERATE' },
  { item: 'Galvanized Iron Hand Pump Assembly', quotedRate: 45000, referenceSSR: 43500, unit: 'Per Unit', deviation: '+3.4%', risk: 'LOW' }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-3 py-0.5 rounded-full font-bold">
              National Risk Intelligence Hub • MoSPI Data Informatics Division
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif mt-1">Ministry Operations Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time AI cross-verification of 1.42 Lakh MPLADS projects across all States & Union Territories</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>e-SAKSHI Stream Live Sync</span>
          </span>
        </div>
      </div>

      {/* National KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Tracked Works</p>
          <h3 className="text-2xl font-extrabold text-slate-900">1,42,850</h3>
          <p className="text-[11px] text-slate-400">All India Coverage</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Sanctioned Value</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹2,715 Cr</h3>
          <p className="text-[11px] text-blue-600 font-bold">100% Allocation Released</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">High Risk Flagged Projects</p>
          <h3 className="text-2xl font-extrabold text-red-600">3,412</h3>
          <p className="text-[11px] text-red-500 font-bold">2.38% Anomaly Rate</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Active Investigation Cases</p>
          <h3 className="text-2xl font-extrabold text-amber-600">142</h3>
          <p className="text-[11px] text-slate-500">Under Officer Review</p>
        </div>
      </div>

      {/* FEATURE 3: BOQ PDF Rate Extraction & CPWD SSR Benchmark Visualizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-blue-600">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                FEATURE 3: Tender Procurement AI Extraction
              </span>
              <span className="text-xs text-slate-500 font-semibold">OCR + CPWD Standard Schedule of Rates (SSR) Benchmark</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Tender BOQ Item Price Inflation Analyzer</h3>
            <p className="text-xs text-slate-500">Extracts itemized unit rates from uploaded work-order PDFs and compares against official reference rates.</p>
          </div>
          <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-bold">
            ⚠ 1 Critical Rate Inflation Flagged
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Extracted BOQ Item Description</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Tender Quoted Rate</th>
              <th className="p-3">CPWD Reference SSR Rate</th>
              <th className="p-3">Price Deviation</th>
              <th className="p-3">Risk Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {BOQ_EXTRACTIONS.map(item => (
              <tr key={item.item} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">{item.item}</td>
                <td className="p-3 text-slate-600">{item.unit}</td>
                <td className="p-3 font-bold text-red-600">₹{item.quotedRate.toLocaleString('en-IN')}</td>
                <td className="p-3 font-bold text-slate-700">₹{item.referenceSSR.toLocaleString('en-IN')}</td>
                <td className="p-3 font-extrabold text-red-600">{item.deviation}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                    item.risk === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                    item.risk === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">National Risk Level Distribution (PieChart)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={RISK_PIE_DATA} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {RISK_PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {RISK_PIE_DATA.map(item => (
              <div key={item.name} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Anomalies Over Time */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Anomalies Detected Over Time (LineChart)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ANOMALY_LINE_DATA}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="anomalies" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Flagged Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">High-Risk Flagged Works Queue</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Project Title & ID</th>
              <th className="p-3">State & District</th>
              <th className="p-3">Sanctioned</th>
              <th className="p-3">Risk Score</th>
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
                <td className="p-3 text-slate-700">{p.district}, {p.state}</td>
                <td className="p-3 font-semibold text-slate-900">₹{(p.sanctionedAmount/100000).toFixed(1)} L</td>
                <td className="p-3 font-bold text-red-600">{p.riskScore}/100</td>
                <td className="p-3">
                  <button onClick={() => navigate(`/projects/${p.id}`)} className="bg-blue-600 text-white font-bold text-[11px] px-3 py-1 rounded">
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
