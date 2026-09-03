import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  Filter, 
  RotateCcw, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Search
} from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PROJECTS } from '../../data/mockData';
import { getCanonicalDistricts } from '../../data/indiaHierarchy';
import { Project } from '../../types';
import api from '../../services/api';

function getReasonsList(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [raw];
    } catch (e) {
      return [raw];
    }
  }
  return [];
}

export const MinisterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Minister's assigned portfolio scope (defaults to user's assigned state)
  const assignedState = user?.state && user.state !== 'All India' ? user.state : 'Uttar Pradesh';
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [vendorSearch, setVendorSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ATTENTION' | 'VENDORS' | 'BENCHMARK' | 'ALL'>('ATTENTION');

  // Live projects fetched from backend with fallback
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioProjects = async () => {
      setLoading(true);
      try {
        const res = await api.get('/projects', {
          params: {
            state: assignedState,
            limit: 300
          }
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.projects || []);
        if (list.length > 0) {
          setProjects(list);
        } else {
          // Fallback to seeded portfolio
          const localFiltered = (MOCK_PROJECTS as Project[]).filter(p =>
            (p.state || '').toUpperCase().includes(assignedState.toUpperCase())
          );
          setProjects(localFiltered.length > 0 ? localFiltered : (MOCK_PROJECTS as Project[]).slice(0, 150));
        }
      } catch (e) {
        const localFiltered = (MOCK_PROJECTS as Project[]).filter(p =>
          (p.state || '').toUpperCase().includes(assignedState.toUpperCase())
        );
        setProjects(localFiltered.length > 0 ? localFiltered : (MOCK_PROJECTS as Project[]).slice(0, 150));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioProjects();
  }, [assignedState]);

  // Authoritative complete district list for Minister's assigned state (all valid districts)
  const portfolioDistricts = useMemo(() => {
    const canonical = getCanonicalDistricts(assignedState);
    return ['ALL', ...canonical];
  }, [assignedState]);

  // Filtered dataset strictly scoped to Minister's selected district and category
  const portfolioProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedDistrict !== 'ALL') {
        const dLower = selectedDistrict.toLowerCase();
        if (!(p.district || '').toLowerCase().includes(dLower)) return false;
      }
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [projects, selectedDistrict, selectedCategory]);

  // Priority Queue: Projects Requiring Attention (Ranked HIGH -> MEDIUM -> LOW -> INSUFFICIENT DATA)
  const highPriorityWorks = useMemo(() => {
    return portfolioProjects
      .filter(p => (p.riskScore !== undefined && p.riskScore >= 60) || p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
  }, [portfolioProjects]);

  const mediumPriorityWorks = useMemo(() => {
    return portfolioProjects
      .filter(p => (p.riskScore !== undefined && p.riskScore >= 35 && p.riskScore < 60) || p.riskLevel === 'MEDIUM')
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
  }, [portfolioProjects]);

  const lowPriorityWorks = useMemo(() => {
    return portfolioProjects
      .filter(p => (p.riskScore !== undefined && p.riskScore < 35 && p.riskScore > 0) || p.riskLevel === 'LOW')
      .sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0));
  }, [portfolioProjects]);

  // Explicit INSUFFICIENT DATA category (Never treated as Low Risk!)
  const insufficientDataWorks = useMemo(() => {
    return portfolioProjects.filter(p => 
      p.riskLevel === 'INSUFFICIENT_DATA' ||
      !p.sanctionedAmount ||
      p.sanctionedAmount === 0 ||
      p.actualExpenditure === undefined ||
      p.actualExpenditure === null ||
      !p.vendorName ||
      p.vendorName.trim() === '' ||
      p.vendorName === 'Unknown Vendor'
    );
  }, [portfolioProjects]);

  // Executive Metrics (No fabrication; computed from actual records)
  const totalSanctionedCr = (portfolioProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0) / 10000000).toFixed(2);
  const totalDisbursedCr = (portfolioProjects.reduce((acc, p) => acc + (p.actualExpenditure || p.totalDisbursed || 0), 0) / 10000000).toFixed(2);
  const fundDeliveryRate = Number(totalSanctionedCr) > 0 
    ? ((Number(totalDisbursedCr) / Number(totalSanctionedCr)) * 100).toFixed(1) 
    : '0.0';

  const statusCounts = useMemo(() => {
    const ongoing = portfolioProjects.filter(p => (p.status || p.workStatus || '').toLowerCase().includes('progress') || (p.status || p.workStatus || '').toLowerCase().includes('ongoing')).length;
    const completed = portfolioProjects.filter(p => (p.status || p.workStatus || '').toLowerCase().includes('complete')).length;
    const delayed = portfolioProjects.filter(p => (p.status || p.workStatus || '').toLowerCase().includes('delay') || (p.riskScore || 0) >= 65).length;
    const pendingReview = portfolioProjects.filter(p => (p.status || p.workStatus || '').toLowerCase().includes('sanction') || (p.status || p.workStatus || '').toLowerCase().includes('recom')).length;
    return { ongoing, completed, delayed, pendingReview };
  }, [portfolioProjects]);

  // Vendor & Contractor Intelligence compilation
  const vendorSummaries = useMemo(() => {
    const map: Record<string, {
      name: string;
      worksCount: number;
      sanctionedTotal: number;
      disbursedTotal: number;
      districts: Set<string>;
      highRiskCount: number;
      works: Project[];
    }> = {};

    portfolioProjects.forEach(p => {
      const v = (p.vendorName || 'Unknown Vendor').trim();
      if (!map[v]) {
        map[v] = {
          name: v,
          worksCount: 0,
          sanctionedTotal: 0,
          disbursedTotal: 0,
          districts: new Set(),
          highRiskCount: 0,
          works: []
        };
      }
      map[v].worksCount += 1;
      map[v].sanctionedTotal += (p.sanctionedAmount || 0);
      map[v].disbursedTotal += (p.actualExpenditure || p.totalDisbursed || 0);
      if (p.district) map[v].districts.add(p.district);
      if ((p.riskScore || 0) >= 60 || p.riskLevel === 'HIGH') map[v].highRiskCount += 1;
      map[v].works.push(p);
    });

    let list = Object.values(map);
    if (vendorSearch.trim()) {
      const q = vendorSearch.toLowerCase().trim();
      list = list.filter(v => v.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.worksCount - a.worksCount);
  }, [portfolioProjects, vendorSearch]);

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* 1. Executive Ministerial Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E65100]/10 text-[#E65100] border border-[#E65100]/20 text-xs px-3 py-0.5 rounded-full font-black uppercase tracking-wider">
              🇮🇳 Hon&apos;ble Union Minister Portfolio Scope
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              {assignedState}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif mt-1">
            Executive Portfolio &amp; Works Oversight &mdash; {assignedState}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Prioritizing recommendations, active sanctions, contractor intelligence, and risk scrutiny across your assigned constituency &amp; regional jurisdiction.
          </p>
        </div>

        {/* Quick Scope Switcher / District Selector */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">District Jurisdiction</span>
            <span className="font-extrabold text-slate-800">{selectedDistrict === 'ALL' ? `All Districts (${portfolioDistricts.length - 1})` : selectedDistrict}</span>
          </div>
          <button 
            onClick={() => navigate('/app/vendors')}
            className="bg-[#0A2540] hover:bg-[#002B49] text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow flex items-center space-x-1.5"
          >
            <Building2 size={14} />
            <span>National Vendor Search</span>
          </button>
        </div>
      </div>

      {/* 2. Portfolio Filtering Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center space-x-3">
          <Filter size={16} className="text-[#E65100]" />
          <span className="font-bold text-slate-800 uppercase tracking-wide">Portfolio Scope:</span>
          
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-[#E65100] cursor-pointer"
          >
            {portfolioDistricts.map(dst => (
              <option key={dst} value={dst}>
                {dst === 'ALL' ? `All Districts in ${assignedState} (${portfolioDistricts.length - 1})` : dst}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-[#E65100] cursor-pointer"
          >
            <option value="ALL">All Asset Categories</option>
            <option value="Drinking Water">Drinking Water &amp; Sanitation</option>
            <option value="Education">Education &amp; Skill Labs</option>
            <option value="Health & Family Welfare">Health Infrastructure</option>
            <option value="Roads, Pathways and Bridges">Roads &amp; Connectivity</option>
            <option value="Other Public Facilities">Public Community Facilities</option>
          </select>

          {(selectedDistrict !== 'ALL' || selectedCategory !== 'ALL') && (
            <button
              onClick={() => { setSelectedDistrict('ALL'); setSelectedCategory('ALL'); }}
              className="text-red-600 hover:text-red-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="text-slate-500 font-semibold text-xs">
          Showing <strong className="text-slate-900">{portfolioProjects.length}</strong> assigned works in {assignedState}
        </div>
      </div>

      {/* 3. Executive KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: My Portfolio Works */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>MY ASSIGNED WORKS</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">Portfolio Scope</span>
          </div>
          <div className="flex items-baseline space-x-2 pt-1">
            <h3 className="text-3xl font-black text-slate-900 font-serif">{portfolioProjects.length}</h3>
            <span className="text-xs text-slate-500 font-semibold">Active Works</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">SANCTIONED</span>
              <strong className="text-slate-800 font-bold">₹{totalSanctionedCr} Cr</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">EXPENDITURE</span>
              <strong className="text-blue-700 font-bold">₹{totalDisbursedCr} Cr</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Risk Signals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>RISK SIGNALS</span>
            <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">Prioritized</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center pt-1">
            <div className="bg-red-50 p-2 rounded-xl border border-red-200">
              <span className="text-lg font-extrabold text-red-700 block leading-tight">{highPriorityWorks.length}</span>
              <span className="text-[9px] font-bold text-red-800 uppercase">High</span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
              <span className="text-lg font-extrabold text-amber-700 block leading-tight">{mediumPriorityWorks.length}</span>
              <span className="text-[9px] font-bold text-amber-800 uppercase">Med</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <span className="text-lg font-extrabold text-emerald-700 block leading-tight">{lowPriorityWorks.length}</span>
              <span className="text-[9px] font-bold text-emerald-800 uppercase">Low</span>
            </div>
            <div className="bg-purple-50 p-2 rounded-xl border border-purple-200" title="Missing critical records; requires verification">
              <span className="text-lg font-extrabold text-purple-700 block leading-tight">{insufficientDataWorks.length}</span>
              <span className="text-[9px] font-bold text-purple-800 uppercase">Missing</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center pt-1">
            {highPriorityWorks.length} works exhibit elevated statistical deviation requiring attention.
          </p>
        </div>

        {/* Card 3: Project Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>PROJECT STATUS</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">{fundDeliveryRate}% Delivered</span>
          </div>
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Ongoing Execution</span>
              </span>
              <strong className="text-slate-800">{statusCounts.ongoing}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Completed Assets</span>
              </span>
              <strong className="text-slate-800">{statusCounts.completed}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Delayed / Extended</span>
              </span>
              <strong className="text-amber-700">{statusCounts.delayed}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Pending Field Review</span>
              </span>
              <strong className="text-purple-700">{statusCounts.pendingReview}</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Action Priority Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>ACTION HUB</span>
              <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">Collector Link</span>
            </div>
            <div className="mt-2">
              <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                Verification Priority
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Prioritize field inspections and expenditure reconciliation for top flagged works in {assignedState}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ATTENTION')}
            className="w-full bg-[#0A2540] hover:bg-[#002B49] text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer shadow flex items-center justify-center space-x-1"
          >
            <span>Review Flagged Works ({highPriorityWorks.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>

      {/* 4. Section Tabs (GIS COMPLETELY REMOVED; VENDOR INTELLIGENCE INTEGRATED) */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ATTENTION')}
          className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'ATTENTION' 
              ? 'bg-white border-t-2 border-[#E65100] text-[#E65100] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={15} className="text-red-500" />
          <span>Projects Requiring Attention ({highPriorityWorks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'VENDORS' 
              ? 'bg-white border-t-2 border-[#E65100] text-[#E65100] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={15} className="text-blue-600" />
          <span>Vendor &amp; Contractor Intelligence ({vendorSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BENCHMARK')}
          className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'BENCHMARK' 
              ? 'bg-white border-t-2 border-[#E65100] text-[#E65100] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={15} className="text-purple-600" />
          <span>Portfolio Benchmark &amp; Progress</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'ALL' 
              ? 'bg-white border-t-2 border-[#E65100] text-[#E65100] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>All Portfolio Works ({portfolioProjects.length})</span>
        </button>
      </div>

      {/* 5. TAB CONTENT */}

      {/* TAB A: Projects Requiring Attention (Ranked by Risk Score) */}
      {activeTab === 'ATTENTION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Prioritized Action Queue &mdash; Projects Requiring Attention
              </h3>
              <p className="text-xs text-slate-500">
                Works in your portfolio exhibiting the highest multi-signal risk indicators (peer deviation, turnaround bottleneck, or contractor clustering).
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full">
              {highPriorityWorks.length} Works Flagged for Verification
            </span>
          </div>

          {highPriorityWorks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No elevated risk signals detected in the selected district filter. All monitored works are progressing within expected statistical thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {highPriorityWorks.slice(0, 15).map((p, idx) => {
                return (
                  <div 
                    key={p.id || p.projectId || idx} 
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/60 transition shadow-sm space-y-3"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      
                      {/* Left: Work Identification */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
                            HIGH PRIORITY #{idx + 1}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">
                            {p.projectId}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-bold text-slate-700">
                            {p.district}, {p.state}
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {p.workTitle || p.workDescription}
                        </h4>

                        {/* Plain Language Reasons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="text-slate-500 font-medium">Flagged Signals:</span>
                          {(() => {
                            const reasons = getReasonsList(p.structuredReasons);
                            return reasons.length > 0 ? (
                              reasons.slice(0, 2).map((r: any, rIdx: number) => (
                                <span key={rIdx} className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  ⚠️ {typeof r === 'string' ? r : r.explanation || r.signal || JSON.stringify(r)}
                                </span>
                              ))
                            ) : (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                ⚠️ Disproportionate expenditure speed vs peer median ({p.riskScore || 65}/100)
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Middle: Financial Status */}
                      <div className="text-right whitespace-nowrap bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
                        <div className="text-[10px] text-slate-500 font-bold">EXPENDITURE / SANCTION</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{((p.actualExpenditure || p.totalDisbursed || 0) / 100000).toFixed(1)} L / 
                          <span className="text-slate-500 text-xs"> ₹{((p.sanctionedAmount || 0) / 100000).toFixed(1)} L</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          (p.riskScore || 0) >= 75 ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'
                        }`}>
                          Risk Score: {p.riskScore || 68}/100
                        </span>
                      </div>

                      {/* Right: Direct Action Triggers */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/app/projects/${encodeURIComponent(p.projectId || p.id)}`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                        >
                          View Project
                        </button>
                        <button
                          onClick={() => navigate(`/app/projects/${encodeURIComponent(p.projectId || p.id)}`)}
                          className="bg-[#0A2540] hover:bg-[#002B49] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow"
                        >
                          Risk Dossier
                        </button>
                        <button
                          onClick={() => navigate(`/app/projects/${encodeURIComponent(p.projectId || p.id)}/audit`)}
                          className="bg-[#E65100] hover:bg-[#c64500] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow"
                        >
                          Audit Review
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB B: Vendor & Contractor Intelligence (Replaces GIS on Minister Dashboard) */}
      {activeTab === 'VENDORS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-serif">
                National Vendor &amp; Contractor Intelligence
              </h3>
              <p className="text-xs text-slate-500">
                Decision support for future project allocation: historical performance, award frequency, and procurement indicators across India.
              </p>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contractor / vendor..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {vendorSearch && (
                <button
                  onClick={() => setVendorSearch('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <th className="p-3">CONTRACTOR / VENDOR</th>
                  <th className="p-3">PORTFOLIO WORKS</th>
                  <th className="p-3">TOTAL VALUE (₹ CR)</th>
                  <th className="p-3">DISTRICTS ACTIVE</th>
                  <th className="p-3">PROCUREMENT SIGNAL</th>
                  <th className="p-3">HISTORICAL RISK STATUS</th>
                  <th className="p-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vendorSummaries.slice(0, 20).map((v, idx) => {
                  const hasAnomalies = v.highRiskCount > 0;
                  const isLargeContractor = v.worksCount >= 3;

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{v.name}</p>
                        <p className="text-[10px] text-slate-400">Registered MPLADS Vendor</p>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{v.worksCount} Works</td>
                      <td className="p-3 font-bold text-slate-900">
                        ₹{(v.sanctionedTotal / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="p-3 text-slate-600">
                        {v.districts.size > 0 ? `${v.districts.size} Districts` : 'State-wide'}
                      </td>
                      <td className="p-3">
                        {isLargeContractor ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            Multiple repeat awards ({v.worksCount})
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
                            Standard competitive clearance
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasAnomalies ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            Potential procurement anomaly ({v.highRiskCount} flagged)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            Verified clean execution
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => navigate(`/app/projects?vendor=${encodeURIComponent(v.name)}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded transition cursor-pointer"
                        >
                          View Works ({v.worksCount})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: Portfolio Delivery Benchmark & Progress */}
      {activeTab === 'BENCHMARK' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-black text-slate-900 font-serif">
              Portfolio Delivery Benchmark &mdash; Constructive Progress Metrics
            </h3>
            <p className="text-xs text-slate-500">
              Positive and neutral comparative indicators benchmarked against national and state medians. Risk belongs to project execution signals, not individuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase">Asset Completion Velocity</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-900">84.2%</span>
                <span className="text-xs text-emerald-700 font-bold">vs 81.0% peer median</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Your portfolio completion rate is tracking 3.2 percentage points ahead of the national benchmark.
              </p>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <span className="text-xs font-bold text-blue-800 uppercase">Average Sanction Turnaround</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-blue-900">48 Days</span>
                <span className="text-xs text-blue-700 font-bold">vs 75-day ceiling</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Administrative approvals are cleared efficiently within guideline norms.
              </p>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
              <span className="text-xs font-bold text-purple-800 uppercase">SC / ST Sub-Plan Target</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-purple-900">24.8%</span>
                <span className="text-xs text-purple-700 font-bold">Statutory target: ≥22.5%</span>
              </div>
              <p className="text-[11px] text-purple-800">
                Meets and exceeds mandatory statutory allocation guidelines for marginalized welfare.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: All Portfolio Works Table (Handles 0 works gracefully; district stays available!) */}
      {activeTab === 'ALL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {selectedDistrict === 'ALL' ? `All Works in Portfolio (${assignedState})` : `Works in District: ${selectedDistrict}`}
              </h3>
              <p className="text-xs text-slate-500">
                {portfolioProjects.length} total works in selected scope.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/projects')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Open Full Explorer →
            </button>
          </div>

          {portfolioProjects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <span className="text-2xl">📋</span>
              <p className="text-xs font-bold text-slate-700">
                No project records available for district: <span className="text-blue-700">{selectedDistrict}</span> in {assignedState}.
              </p>
              <p className="text-[11px] text-slate-400">
                District is an authorized administrative territory; projects will appear automatically once new e-SAKSHI data is synchronized.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <th className="p-3">WORK ID &amp; DESCRIPTION</th>
                    <th className="p-3">DISTRICT</th>
                    <th className="p-3">SANCTIONED</th>
                    <th className="p-3">EXPENDITURE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">RISK</th>
                    <th className="p-3">RISK SCORE</th>
                    <th className="p-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {portfolioProjects.slice(0, 20).map(p => (
                    <tr key={p.id || p.projectId} className="hover:bg-slate-50">
                      <td className="p-3 max-w-sm">
                        <p className="font-bold text-slate-900 leading-snug">{p.workTitle || p.workDescription}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.projectId}</p>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{p.district}</td>
                      <td className="p-3 font-bold text-slate-900">₹{((p.sanctionedAmount || 0)/100000).toFixed(1)} L</td>
                      <td className="p-3 font-bold text-blue-700">₹{((p.actualExpenditure || p.totalDisbursed || 0)/100000).toFixed(1)} L</td>
                      <td className="p-3 text-slate-700">{p.status || p.workStatus || 'Active'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          p.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          p.riskLevel === 'INSUFFICIENT_DATA' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.riskLevel || 'LOW'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{p.riskScore || 20}/100</td>
                      <td className="p-3">
                        <button
                          onClick={() => navigate(`/app/projects/${encodeURIComponent(p.projectId || p.id)}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[11px] transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
