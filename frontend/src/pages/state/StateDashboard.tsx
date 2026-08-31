import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertTriangle, CheckCircle2, ArrowUpRight, Send, Filter, RotateCcw } from '../../components/common/Icons';
import { MOCK_PROJECTS, MOCK_CASES } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export const StateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Scoping: Defaults to user's assigned state or Karnataka
  const assignedState = user?.state || 'Karnataka';
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Filter projects belonging strictly to THIS state
  const stateProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(p => 
      p.state.toUpperCase().includes(assignedState.toUpperCase()) || 
      assignedState.toUpperCase().includes(p.state.toUpperCase())
    );
  }, [assignedState]);

  // Extract unique districts within this state for District-Wise Filtering
  const stateDistricts = useMemo(() => {
    const dists = Array.from(new Set(stateProjects.map(p => p.district).filter(Boolean))).sort();
    return ['ALL', ...dists];
  }, [stateProjects]);

  // Filtered dataset by selected district inside state
  const filteredStateProjects = useMemo(() => {
    if (selectedDistrict === 'ALL') return stateProjects;
    return stateProjects.filter(p => p.district === selectedDistrict);
  }, [stateProjects, selectedDistrict]);

  const totalProjects = filteredStateProjects.length;
  const totalExpenditureCr = (filteredStateProjects.reduce((acc, p) => acc + (p.actualExpenditure || 0), 0) / 10000000).toFixed(2);
  const openCases = MOCK_CASES.filter(c => c.assignedState === assignedState);

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-0.5 rounded-full font-extrabold uppercase">
              🏢 State Jurisdiction Scope • {assignedState}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif mt-1">
            State Nodal Authority Dashboard ({assignedState})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            State-level district monitoring, escalated investigation reviews, and regional compliance scoped strictly to {assignedState}.
          </p>
        </div>
        <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-3.5 py-1.5 rounded-full font-bold">
          {stateDistricts.length - 1} Districts Monitored in {assignedState}
        </span>
      </div>

      {/* District-Wise Filter Bar for State Authority */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wide">
          <Filter size={16} className="text-emerald-600" />
          <span>State District Filter Option:</span>
        </div>

        <div className="flex items-center space-x-3">
          <label className="font-bold text-slate-700">Select District in {assignedState}:</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
          >
            {stateDistricts.map(dst => (
              <option key={dst} value={dst}>{dst === 'ALL' ? `📍 All ${stateDistricts.length - 1} Districts in ${assignedState}` : `District: ${dst}`}</option>
            ))}
          </select>

          {selectedDistrict !== 'ALL' && (
            <button 
              onClick={() => setSelectedDistrict('ALL')}
              className="text-red-600 hover:text-red-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset District Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Strictly Scoped State KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">{assignedState} Total Projects</p>
          <h3 className="text-3xl font-black text-slate-900 font-serif">{totalProjects}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">{selectedDistrict === 'ALL' ? 'Entire State Scope' : `District ${selectedDistrict}`}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">Disbursed Expenditure</p>
          <h3 className="text-3xl font-black text-blue-600 font-serif">₹{totalExpenditureCr} Cr</h3>
          <p className="text-[10px] text-blue-600 font-bold">Total Asset Disbursement</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">Escalated Cases</p>
          <h3 className="text-3xl font-black text-amber-600 font-serif">{openCases.length} Open</h3>
          <p className="text-[10px] text-amber-600 font-bold">Under Nodal Review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">SC/ST Sub-plan Rule</p>
          <h3 className="text-3xl font-black text-emerald-600 font-serif">96.2%</h3>
          <p className="text-[10px] text-emerald-700 font-bold">≥15% SC & ≥7.5% ST Compliant</p>
        </div>
      </div>

      {/* District SC/ST Sub-plan Compliance Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">District SC & ST Sub-Plan Statutory Compliance ({assignedState})</h3>
            <p className="text-xs text-slate-500">Tracking 15% SC & 7.5% ST statutory spending targets across districts in {assignedState}</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            All Districts Compliant
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <th className="p-3">DISTRICT</th>
                <th className="p-3">TOTAL WORKS</th>
                <th className="p-3">SANCTIONED AMOUNT</th>
                <th className="p-3">SC SUB-PLAN (≥15%)</th>
                <th className="p-3">ST SUB-PLAN (≥7.5%)</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stateDistricts.filter(d => d !== 'ALL').map(dst => {
                const dstProjects = stateProjects.filter(p => p.district === dst);
                const dstSanctioned = (dstProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0) / 100000).toFixed(1);
                return (
                  <tr key={dst} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 uppercase">{dst}</td>
                    <td className="p-3 text-slate-700 font-semibold">{dstProjects.length} Works</td>
                    <td className="p-3 font-bold text-slate-900">₹{dstSanctioned} L</td>
                    <td className="p-3 font-bold text-emerald-600">16.4% ✓</td>
                    <td className="p-3 font-bold text-emerald-600">8.1% ✓</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        Compliant
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalated Investigation Cases in State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 border-l-4 border-l-amber-500">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">Escalated Anomaly Investigation Inbox ({assignedState})</h3>
            <p className="text-xs text-slate-500">High-risk cases forwarded from District Collectors requiring State Nodal review</p>
          </div>
          <button onClick={() => navigate('/app/investigations')} className="text-xs font-bold text-blue-600 hover:underline">
            View All State Investigations →
          </button>
        </div>

        <div className="space-y-3">
          {openCases.map(c => (
            <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{c.caseNumber}</span>
                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{c.priority}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{c.title}</h4>
                <p className="text-slate-500">Assigned: {c.assignedDistrict} • {c.createdAt}</p>
              </div>
              <button onClick={() => navigate('/app/investigations')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow whitespace-nowrap">
                Review Case File
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
