import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, ShieldCheck, ArrowUpRight, CheckCircle2, Download, Building2, AlertTriangle, Filter, RotateCcw } from '../../components/common/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { MOCK_PROJECTS } from '../../data/mockData';

const SECTOR_DISTRIBUTION = [
  { name: 'Drinking Water', value: 30, color: '#2563EB' },
  { name: 'CC Roads & Transport', value: 28, color: '#10B981' },
  { name: 'Primary Education', value: 20, color: '#F59E0B' },
  { name: 'Public Health (PHC)', value: 12, color: '#8B5CF6' },
  { name: 'Community Halls', value: 10, color: '#EF4444' }
];

export const MinisterDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Minister Filters
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Unique States & Districts
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(MOCK_PROJECTS.map(p => p.state).filter(Boolean))).sort();
    return ['ALL', ...states];
  }, []);

  const uniqueDistricts = useMemo(() => {
    const filtered = selectedState === 'ALL' 
      ? MOCK_PROJECTS 
      : MOCK_PROJECTS.filter(p => p.state === selectedState);
    const dists = Array.from(new Set(filtered.map(p => p.district).filter(Boolean))).sort();
    return ['ALL', ...dists];
  }, [selectedState]);

  // Filtered dataset for Minister
  const filteredMinisterProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(p => {
      const matchState = selectedState === 'ALL' || p.state === selectedState;
      const matchDistrict = selectedDistrict === 'ALL' || p.district === selectedDistrict;
      return matchState && matchDistrict;
    });
  }, [selectedState, selectedDistrict]);

  const totalSanctionedCr = (filteredMinisterProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0) / 10000000).toFixed(2);
  const totalDisbursedCr = (filteredMinisterProjects.reduce((acc, p) => acc + (p.actualExpenditure || 0), 0) / 10000000).toFixed(2);

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
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
          onClick={() => alert(`Generating Ministerial Briefing for State: ${selectedState}, District: ${selectedDistrict}...`)}
          className="bg-[#E65100] hover:bg-[#c64500] text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 transition cursor-pointer"
        >
          <Download size={15} />
          <span>Export Executive Briefing PDF</span>
        </button>
      </div>

      {/* State & District Interactive Minister Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wide">
          <Filter size={16} className="text-blue-600" />
          <span>Minister Jurisdiction Filter:</span>
        </div>

        <div className="flex flex-wrap items-center space-x-4">
          {/* State Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="font-bold text-slate-700">State / UT:</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('ALL');
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              {uniqueStates.map(st => (
                <option key={st} value={st}>{st === 'ALL' ? '🇮🇳 All India (All 28 States)' : st}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="font-bold text-slate-700">District:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              {uniqueDistricts.map(dst => (
                <option key={dst} value={dst}>{dst === 'ALL' ? '📍 All Districts' : dst}</option>
              ))}
            </select>
          </div>

          {(selectedState !== 'ALL' || selectedDistrict !== 'ALL') && (
            <button 
              onClick={() => { setSelectedState('ALL'); setSelectedDistrict('ALL'); }}
              className="text-red-600 hover:text-red-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">National Fund Subvention</p>
          <h3 className="text-2xl font-extrabold text-[#0A2540]">₹{selectedState === 'ALL' ? '2,715' : (parseFloat(totalSanctionedCr)*1.2).toFixed(1)} Cr</h3>
          <p className="text-[11px] text-emerald-600 font-bold">100% Released by MoSPI</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Disbursed Expenditure</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹{selectedState === 'ALL' ? '1,940' : totalDisbursedCr} Cr</h3>
          <p className="text-[11px] text-blue-600 font-bold">Community Asset Creation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Tracked Works Count</p>
          <h3 className="text-2xl font-extrabold text-emerald-600">{filteredMinisterProjects.length}</h3>
          <p className="text-[11px] text-slate-500 font-semibold">{selectedState === 'ALL' ? 'All 788 MPs Nationwide' : `${selectedState} Scope`}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">SC/ST Sub-plan Compliance</p>
          <h3 className="text-2xl font-extrabold text-purple-600">96.8%</h3>
          <p className="text-[11px] text-purple-700 font-bold">≥15% SC & ≥7.5% ST Statutory Rule</p>
        </div>
      </div>

      {/* Statutory Guidelines Rule Card */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-950 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Award className="text-amber-700" size={18} />
            <h3 className="font-extrabold text-sm font-serif text-amber-900">Statutory MPLADS Sub-Plan Allocation Mandate</h3>
          </div>
          <p className="text-slate-700 leading-relaxed max-w-3xl">
            Under central guidelines, Hon'ble Members of Parliament must allocate at least <strong>15%</strong> of annual funds for Scheduled Caste (SC) populated areas and <strong>7.5%</strong> for Scheduled Tribe (ST) populated areas.
          </p>
        </div>
        <button 
          onClick={() => navigate('/app/projects')}
          className="bg-[#0A2540] hover:bg-[#002B49] text-white font-bold px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer shadow"
        >
          View SC/ST Project Explorer
        </button>
      </div>

      {/* Recent Works List Filtered by Minister Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-base text-slate-900 font-serif">Filtered Works Audit Queue ({filteredMinisterProjects.length})</h3>
          <button 
            onClick={() => navigate('/app/projects')}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Open Full Projects Explorer →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="p-3">WORK ID & TITLE</th>
                <th className="p-3">STATE / DISTRICT</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3">SANCTIONED</th>
                <th className="p-3">VENDOR</th>
                <th className="p-3">RISK SCORE</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMinisterProjects.slice(0, 8).map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 max-w-sm">
                    <p className="font-bold text-slate-900 leading-snug">{p.workTitle}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.projectId}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">{p.state}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{p.district}</p>
                  </td>
                  <td className="p-3 text-slate-700">{p.category}</td>
                  <td className="p-3 font-bold text-slate-900">₹{(p.sanctionedAmount / 100000).toFixed(1)} L</td>
                  <td className="p-3 text-slate-700">{p.vendorName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      p.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.riskScore}/100
                    </span>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={() => navigate(`/app/projects/${encodeURIComponent(p.projectId || p.id)}`)}
                      className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-[11px] hover:bg-blue-700 cursor-pointer"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
