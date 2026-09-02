import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Sparkles } from '../../components/common/Icons';
import { MOCK_PROJECTS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const DistrictDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // District Scoping: strictly enforced by officer's authenticated jurisdiction
  const assignedDistrict = user?.district || 'KHERI';
  const assignedState = user?.state || 'Uttar Pradesh';

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PRIORITY' | 'ALL' | 'UNINSPECTED' | 'AUDIT'>('PRIORITY');
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistrictData = async () => {
      setLoading(true);
      try {
        // Fetch projects scoped to district
        const res = await api.get('/projects', {
          params: {
            state: assignedState === 'All India' ? undefined : assignedState,
            district: assignedDistrict === 'All Districts' ? undefined : assignedDistrict,
            limit: 200
          }
        });
        if (res.data?.projects && res.data.projects.length > 0) {
          setProjects(res.data.projects);
        } else {
          // Fallback to local dataset
          const fallback = MOCK_PROJECTS.filter(p =>
            (!assignedDistrict || assignedDistrict === 'All Districts' || p.district?.toUpperCase() === assignedDistrict.toUpperCase()) &&
            (!assignedState || assignedState === 'All India' || p.state?.toUpperCase() === assignedState.toUpperCase())
          );
          setProjects(fallback);
        }

        // Fetch AI briefing for district
        try {
          const aiRes = await api.get('/ai/summary');
          if (aiRes.data?.summaryMarkdown) {
            setAiSummary(aiRes.data.summaryMarkdown);
          }
        } catch (e) {}
      } catch (err) {
        console.warn('District data load error, using local dataset:', err);
        const fallback = MOCK_PROJECTS.filter(p =>
          (!assignedDistrict || assignedDistrict === 'All Districts' || p.district?.toUpperCase() === assignedDistrict.toUpperCase()) &&
          (!assignedState || assignedState === 'All India' || p.state?.toUpperCase() === assignedState.toUpperCase())
        );
        setProjects(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchDistrictData();
  }, [assignedDistrict, assignedState]);

  // Derived metrics
  const totalWorks = projects.length;
  const sanctionedCr = (projects.reduce((acc, p) => acc + (p.sanctionedAmount || p.sanctioned_amount || 0), 0) / 10000000).toFixed(2);
  const expenditureCr = (projects.reduce((acc, p) => acc + (p.actualExpenditure || p.actual_expenditure || p.totalDisbursed || p.total_disbursed || 0), 0) / 10000000).toFixed(2);
  
  const highRiskWorks = useMemo(() => {
    return projects.filter(p => {
      const score = p.riskScore ?? p.prototype_risk_score ?? 0;
      const level = (p.riskLevel || p.risk_level || '').toUpperCase();
      return score >= 50 || level === 'HIGH' || level === 'CRITICAL';
    }).sort((a, b) => (b.riskScore ?? b.prototype_risk_score ?? 0) - (a.riskScore ?? a.prototype_risk_score ?? 0));
  }, [projects]);

  const uninspectedWorks = useMemo(() => {
    return projects.filter(p => {
      const status = (p.inspection_status || p.status || '').toUpperCase();
      return status !== 'INSPECTED' && status !== 'VERIFIED';
    });
  }, [projects]);

  const underAuditWorks = useMemo(() => {
    return projects.filter(p => {
      return (p.audit_cases && p.audit_cases.length > 0) || (p.investigation_status && p.investigation_status !== 'Unreviewed');
    });
  }, [projects]);

  // Filtered projects for display table
  const displayedProjects = useMemo(() => {
    let list = projects;
    if (activeTab === 'PRIORITY') list = highRiskWorks;
    else if (activeTab === 'UNINSPECTED') list = uninspectedWorks;
    else if (activeTab === 'AUDIT') list = underAuditWorks;

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(p =>
      (p.projectId || p.work_id || '').toLowerCase().includes(term) ||
      (p.workDescription || p.workTitle || '').toLowerCase().includes(term) ||
      (p.vendorName || '').toLowerCase().includes(term)
    );
  }, [projects, activeTab, searchTerm, highRiskWorks, uninspectedWorks, underAuditWorks]);

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen max-w-7xl mx-auto">
      
      {/* 1. Header Banner & Scoping Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-3 py-0.5 rounded-full font-extrabold uppercase">
              📍 District Authority Scope • {assignedDistrict}, {assignedState}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif mt-1">
            District Collector Action Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Prioritizes works requiring urgent attention, uninspected field queues, and administrative audit actions strictly within {assignedDistrict}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/gis-analytics')}
            className="bg-[#0A2540] hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin size={15} />
            <span>Open District GIS Map</span>
          </button>
        </div>
      </div>

      {/* 2. District KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Works</p>
          <h3 className="text-2xl font-black text-slate-900 font-serif">{totalWorks}</h3>
          <p className="text-[10px] text-slate-400 font-medium">In {assignedDistrict}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Sanctioned Budget</p>
          <h3 className="text-2xl font-black text-blue-600 font-serif">₹{sanctionedCr} Cr</h3>
          <p className="text-[10px] text-blue-600 font-semibold">Total Sanctioned</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Actual Disbursed</p>
          <h3 className="text-2xl font-black text-emerald-600 font-serif">₹{expenditureCr} Cr</h3>
          <p className="text-[10px] text-emerald-600 font-semibold">Expenditure Released</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-t-2 border-t-red-500">
          <p className="text-[10px] text-red-600 font-bold uppercase">High-Risk Works</p>
          <h3 className="text-2xl font-black text-red-600 font-serif">{highRiskWorks.length}</h3>
          <p className="text-[10px] text-red-500 font-bold">Needs Review (Score &ge; 50)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-t-2 border-t-amber-500">
          <p className="text-[10px] text-amber-700 font-bold uppercase">Not Inspected</p>
          <h3 className="text-2xl font-black text-amber-700 font-serif">{uninspectedWorks.length}</h3>
          <p className="text-[10px] text-amber-600 font-semibold">Pending Physical Sign-off</p>
        </div>
      </div>

      {/* 3. Officer Attention: Urgent Action Needed Callout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Officer Attention Required
              </span>
              <span className="text-xs text-slate-500 font-semibold">Which projects require immediate attention?</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif mt-1">
              Top Priority Works for Verification ({highRiskWorks.length} flagged in {assignedDistrict})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Sorted by AI Risk Score descending</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highRiskWorks.slice(0, 3).map((p) => {
            const pid = p.projectId || p.work_id || p.id;
            const score = p.riskScore ?? p.prototype_risk_score ?? 0;
            return (
              <div key={pid} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                      Risk: {score}/100
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{pid}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2">{p.workDescription || p.workTitle}</h4>
                  <p className="text-[11px] text-slate-500 truncate">Contractor: {p.vendorName || 'Not Assigned'}</p>
                  <p className="text-[11px] font-bold text-slate-800">
                    Sanctioned: ₹{((p.sanctionedAmount || p.sanctioned_amount || 0) / 100000).toFixed(1)} Lakhs
                  </p>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => navigate(`/app/projects/${encodeURIComponent(pid)}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition text-center cursor-pointer"
                  >
                    View Dossier
                  </button>
                  <button
                    onClick={() => navigate(`/app/projects/${encodeURIComponent(pid)}/audit`)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition text-center cursor-pointer"
                  >
                    Audit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. AI District Risk Briefing Card */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-[#0A2540] via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-indigo-500/20 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="font-bold text-sm text-white">AI Executive District Briefing ({assignedDistrict})</h3>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-40 overflow-y-auto bg-black/20 p-3 rounded-xl border border-white/10">
            {aiSummary}
          </div>
        </div>
      )}

      {/* 5. Interactive Works Queue & Inspection Management Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Table Filters & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('PRIORITY')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'PRIORITY' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Priority Works ({highRiskWorks.length})
            </button>
            <button
              onClick={() => setActiveTab('UNINSPECTED')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'UNINSPECTED' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inspection Queue ({uninspectedWorks.length})
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'AUDIT' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Under Audit ({underAuditWorks.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Works ({totalWorks})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Work ID, title, contractor..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          </div>
        </div>

        {/* Project Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="p-3">Work ID & Description</th>
                <th className="p-3">Sanctioned</th>
                <th className="p-3">Expenditure</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Inspection Status</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No matching works found for this queue.
                  </td>
                </tr>
              ) : (
                displayedProjects.slice(0, 30).map((p) => {
                  const targetId = p.projectId || p.work_id || p.id;
                  const score = p.riskScore ?? p.prototype_risk_score ?? 0;
                  const sanctioned = p.sanctionedAmount ?? p.sanctioned_amount;
                  const expenditure = p.actualExpenditure ?? p.actual_expenditure ?? p.totalDisbursed ?? p.total_disbursed;
                  const isInspected = p.inspection_status === 'INSPECTED' || p.documents_checklist?.inspection;

                  return (
                    <tr key={targetId} className="hover:bg-slate-50">
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-900 leading-snug line-clamp-2">{p.workDescription || p.workTitle}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{targetId}</p>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {sanctioned !== null && sanctioned !== undefined && sanctioned > 0
                          ? `₹${(sanctioned / 100000).toFixed(1)} L`
                          : 'Data unavailable'}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {expenditure !== null && expenditure !== undefined && expenditure > 0
                          ? `₹${(expenditure / 100000).toFixed(1)} L`
                          : expenditure === 0
                          ? '₹0'
                          : 'Data unavailable'}
                      </td>
                      <td className="p-3 text-slate-700 truncate max-w-[140px]">{p.vendorName || 'Unassigned'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isInspected
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {isInspected ? 'INSPECTED' : 'NOT INSPECTED'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${
                          score >= 50
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : score >= 25
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/app/projects/${encodeURIComponent(targetId)}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => navigate(`/app/projects/${encodeURIComponent(targetId)}/audit`)}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            Audit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
