import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [highRiskWorks, setHighRiskWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get('http://localhost:8000/api/dashboard/stats');
        setStats(statsRes.data);
        
        const worksRes = await axios.get('http://localhost:8000/api/works?risk_level=HIGH');
        setHighRiskWorks(worksRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Analytics...</div>;

  const RISK_PIE_DATA = [
    { name: 'Low Risk', value: stats?.total_works - stats?.medium_risk_count - stats?.high_risk_count || 0, color: '#10B981' },
    { name: 'Medium Risk', value: stats?.medium_risk_count || 0, color: '#F59E0B' },
    { name: 'High Risk', value: stats?.high_risk_count || 0, color: '#EF4444' }
  ];

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">MPLADS Risk Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500">Live AI cross-verification prototype (SIH 2026 PS 102)</p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Data Sync</span>
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Tracked Works</p>
          <h3 className="text-2xl font-extrabold text-slate-900">{stats?.total_works.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Sanctioned Value</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹{(stats?.total_sanctioned / 10000000).toFixed(2)} Cr</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">High Risk Flagged</p>
          <h3 className="text-2xl font-extrabold text-red-600">{stats?.high_risk_count}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Potentially Similar</p>
          <h3 className="text-2xl font-extrabold text-amber-600">{stats?.similar_works_count}</h3>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Prototype Risk Level Distribution</h3>
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
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 overflow-y-auto max-h-72">
          <h3 className="text-sm font-bold text-slate-900">Automated Risk Signals Triggered</h3>
          <ul className="text-xs text-slate-600 space-y-2">
            {highRiskWorks.map(w => (
              <li key={w.work_id} className="p-2 bg-red-50 rounded border border-red-100">
                <span className="font-bold text-red-700">{w.work_id}:</span> {w.risk_evidence_explanation}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Priority Flagged Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">High-Risk Priority Queue</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Work ID</th>
              <th className="p-3">District</th>
              <th className="p-3">Category</th>
              <th className="p-3">Sanctioned</th>
              <th className="p-3">Risk Score</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {highRiskWorks.map(w => (
              <tr key={w.work_id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">{w.work_id}</td>
                <td className="p-3 text-slate-700">{w.district}</td>
                <td className="p-3 text-slate-700">{w.work_type}</td>
                <td className="p-3 font-semibold text-slate-900">₹{(w.sanctioned_amount / 100000).toFixed(1)} L</td>
                <td className="p-3 font-bold text-red-600">{w.prototype_risk_score}/100</td>
                <td className="p-3">
                  <button onClick={() => navigate(`/projects/${encodeURIComponent(w.work_id)}`)} className="bg-blue-600 text-white font-bold text-[11px] px-3 py-1 rounded hover:bg-blue-700">
                    Investigate
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
