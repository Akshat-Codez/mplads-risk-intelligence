import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Building2, 
  Search, 
  ChevronRight, 
  PieChart, 
  BarChart3,
  ShieldAlert
} from '../components/common/Icons';
import { 
  FolderKanban, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  Layers, 
  FileText,
  Building,
  Scale
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const assignedState = user?.state && user.state !== 'All India' ? user.state : 'Uttar Pradesh';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [districtSearch, setDistrictSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorDirectory, setVendorDirectory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINANCIALS' | 'BENCHMARK' | 'DISTRICTS' | 'ATTENTION' | 'VENDORS'>('OVERVIEW');

  const fetchPortfolioAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/portfolio-analytics');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch portfolio analytics:', err);
      setError(err.response?.data?.error || 'Failed to load portfolio analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/projects?limit=500');
      const projects: any[] = res.data?.projects || res.data || [];
      const vMap: Record<string, any> = {};
      projects.forEach(p => {
        const vName = (p.vendorName || '').trim();
        if (vName && vName !== 'Unknown Vendor' && vName !== 'N/A') {
          if (!vMap[vName]) {
            vMap[vName] = {
              name: vName,
              projectsCount: 0,
              totalValue: 0,
              districts: new Set<string>(),
              completedCount: 0,
              highRiskCount: 0
            };
          }
          vMap[vName].projectsCount += 1;
          vMap[vName].totalValue += (p.sanctionedAmount || 0);
          if (p.district) vMap[vName].districts.add(p.district);
          if ((p.workStatus || '').toLowerCase().includes('complete')) vMap[vName].completedCount += 1;
          if ((p.riskScore || 0) >= 60 || p.riskLevel === 'HIGH') vMap[vName].highRiskCount += 1;
        }
      });

      const list = Object.values(vMap).map((v: any) => ({
        ...v,
        districtCount: v.districts.size,
        completionRate: v.projectsCount > 0 ? Number(((v.completedCount / v.projectsCount) * 100).toFixed(0)) : 0,
        indicator: v.highRiskCount > 0 ? 'Potential procurement anomaly — requires verification' : 'Standard competitive clearance'
      })).sort((a: any, b: any) => b.totalValue - a.totalValue);

      setVendorDirectory(list);
    } catch (err) {
      console.warn('Could not load vendor directory:', err);
    }
  };

  useEffect(() => {
    fetchPortfolioAnalytics();
    fetchVendors();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3 font-sans">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
        <p className="text-sm font-bold text-slate-600">Generating Portfolio Analytics...</p>
        <p className="text-xs text-slate-400">Aggregating sanctioned amounts, disbursements, and state benchmarks</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 font-sans">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
          <p className="font-bold">Could not load portfolio analytics</p>
          <p className="text-xs mt-1 text-red-600">{error || 'Unknown error occurred.'}</p>
        </div>
        <button
          onClick={fetchPortfolioAnalytics}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const { summary, financialOverview, stateBenchmark, costOverview, districtSummary, topAttentionProjects } = data;

  const filteredDistricts = (districtSummary || []).filter((d: any) => 
    d.district.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  const filteredVendors = vendorDirectory.filter((v: any) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase().trim())
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto font-sans bg-slate-50 min-h-screen text-slate-900">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🇮🇳 Official Portfolio Intelligence
            </span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Jurisdiction: {assignedState}
            </span>
          </div>
          <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
            Portfolio Analysis
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Overview of your MPLADS project portfolio — resource allocation, disbursements, and empirical state benchmarking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'OVERVIEW' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('FINANCIALS')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'FINANCIALS' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Financials
          </button>
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'BENCHMARK' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            State Benchmark
          </button>
          <button
            onClick={() => setActiveTab('DISTRICTS')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'DISTRICTS' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Districts ({districtSummary?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ATTENTION')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'ATTENTION' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Priority Review ({summary.highRiskCount})
          </button>
          <button
            onClick={() => setActiveTab('VENDORS')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'VENDORS' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendors
          </button>
        </div>
      </div>
          {/* Row 1: Top Portfolio Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
            <span>Total Projects</span>
            <FolderKanban size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900">
            {summary.totalProjects.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Active works in authorized portfolio
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
            <span>Total Sanctioned</span>
            <Coins size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900">
            ₹{(summary.totalSanctioned / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Allocated across recommended projects
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
            <span>Total Expenditure</span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900">
            ₹{(summary.totalExpenditure / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Disbursed against verifiable invoices
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
            <span>Fund Utilization</span>
            <PieChart size={16} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black font-serif text-slate-900">
            {summary.utilization}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, summary.utilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Operational Health */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Completed</span>
          <div className="text-2xl font-black text-emerald-950 font-serif">{summary.completedCount}</div>
          <span className="text-[10px] text-slate-500 block">
            {summary.totalProjects > 0 ? ((summary.completedCount / summary.totalProjects) * 100).toFixed(1) : 0}% delivery rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-blue-700 block">Ongoing</span>
          <div className="text-2xl font-black text-blue-950 font-serif">{summary.ongoingCount}</div>
          <span className="text-[10px] text-slate-500 block">Under physical execution</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-700 block">Delayed</span>
          <div className="text-2xl font-black text-amber-950 font-serif">{summary.delayedCount}</div>
          <span className="text-[10px] text-slate-500 block">Schedule extended</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm text-center space-y-1 bg-red-50/20">
          <span className="text-[10px] font-bold uppercase text-red-700 block">High Attention</span>
          <div className="text-2xl font-black text-red-950 font-serif">{summary.highRiskCount}</div>
          <span className="text-[10px] text-red-600 font-bold block">Requires verification</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Incomplete Data</span>
          <div className="text-2xl font-black text-purple-950 font-serif">{summary.insufficientDataCount}</div>
          <span className="text-[10px] text-slate-500 block">Disbursement pending</span>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL OVERVIEW */}
      {(activeTab === 'OVERVIEW' || activeTab === 'FINANCIALS') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <Coins size={20} className="text-emerald-700" />
                <span>Portfolio Financial Overview</span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed capital allocation, remaining commitments, and per-project disbursement velocity.
              </p>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 rounded-full">
              Net Unspent: ₹{(financialOverview.remainingAmount / 10000000).toFixed(2)} Cr
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">AVERAGE PROJECT COST</span>
              <strong className="text-2xl font-black text-slate-900 font-serif block">
                ₹{(financialOverview.avgProjectCost / 100000).toFixed(2)} Lakhs
              </strong>
              <p className="text-[11px] text-slate-500">
                Calculated strictly from sanctioned non-zero allocations.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">AVERAGE EXPENDITURE PER PROJECT</span>
              <strong className="text-2xl font-black text-blue-900 font-serif block">
                ₹{(financialOverview.avgExpenditurePerProject / 100000).toFixed(2)} Lakhs
              </strong>
              <p className="text-[11px] text-slate-500">
                Disbursed mean across active reporting works.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">COMPLETED WORKS AVG SPEND</span>
              <strong className="text-2xl font-black text-emerald-900 font-serif block">
                ₹{(financialOverview.completedAvgSpend / 100000).toFixed(2)} Lakhs
              </strong>
              <p className="text-[11px] text-slate-500">
                Final settlement average upon work delivery.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-950">
            <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Government Data Accounting Standard</p>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                NIRMAN strictly refuses to silently convert missing expenditure fields into ₹0. Projects where disbursements have not yet been synchronized from e-SAKSHI are classified as <em>Insufficient/Pending Data</em> rather than zero expenditures, protecting reporting accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STATE PORTFOLIO BENCHMARK */}
      {(activeTab === 'OVERVIEW' || activeTab === 'BENCHMARK') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <Scale size={20} className="text-blue-700" />
                <span>State Portfolio Benchmark (Average Spend by MP)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Comparative performance context against peer MPLADS portfolios within {stateBenchmark.state}.
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-1 rounded-full">
              Evaluating {stateBenchmark.mpCountEvaluated} Members of Parliament
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">AVG PROJECT EXPENDITURE</span>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Your Portfolio:</span>
                  <strong className="text-base text-slate-900 font-serif">₹{(stateBenchmark.yourAvgSpendPerProject / 100000).toFixed(1)} L</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">State MP Avg:</span>
                  <strong className="text-base text-blue-700 font-serif">₹{(stateBenchmark.stateAvgSpendPerProject / 100000).toFixed(1)} L</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">EXPENDITURE PER MP</span>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Your Total:</span>
                  <strong className="text-base text-slate-900 font-serif">₹{(stateBenchmark.yourAvgSpendPerMp / 10000000).toFixed(1)} Cr</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">State Avg / MP:</span>
                  <strong className="text-base text-blue-700 font-serif">₹{(stateBenchmark.stateAvgSpendPerMp / 10000000).toFixed(1)} Cr</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">PORTFOLIO UTILIZATION</span>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Your Portfolio:</span>
                  <strong className="text-base text-slate-900 font-serif">{stateBenchmark.yourUtilization}%</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">State Benchmark:</span>
                  <strong className="text-base text-emerald-700 font-serif">{stateBenchmark.stateAvgUtilization}%</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">COMPLETION RATE</span>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Your Portfolio:</span>
                  <strong className="text-base text-slate-900 font-serif">{stateBenchmark.yourCompletionRate}%</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">State Benchmark:</span>
                  <strong className="text-base text-blue-700 font-serif">{stateBenchmark.stateAvgCompletionRate}%</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>📌</span> Methodology Note (Mandatory Aggregation Standard)
            </p>
            <p className="leading-relaxed">
              State average expenditure per MP is derived by aggregating valid project disbursements for each Member of Parliament in {stateBenchmark.state} and dividing by the count of active MPs with reported project records. This metric is strictly objective comparative delivery benchmarking and does not assign political or character ratings.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: PROJECT COST OVERVIEW */}
      {(activeTab === 'OVERVIEW' || activeTab === 'FINANCIALS') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-700" />
              <span>Project Cost Overview &amp; Extremes</span>
            </h2>
            <p className="text-xs text-slate-500">
              Statistical cost distributions and category-level resource distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-bold uppercase block">AVERAGE COST</span>
              <strong className="text-xl font-black text-slate-900 font-serif block">
                ₹{(costOverview.avgCost / 100000).toFixed(2)} Lakhs
              </strong>
              <span className="text-[10px] text-slate-400">Mean sanction value</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-bold uppercase block">MEDIAN COST</span>
              <strong className="text-xl font-black text-blue-950 font-serif block">
                ₹{(costOverview.medianCost / 100000).toFixed(2)} Lakhs
              </strong>
              <span className="text-[10px] text-slate-400">Neutral midpoint (unskewed)</span>
            </div>

            {costOverview.largestProject && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-bold uppercase block">LARGEST WORK</span>
                <strong className="text-xl font-black text-purple-950 font-serif block">
                  ₹{(costOverview.largestProject.sanctionedAmount / 10000000).toFixed(2)} Cr
                </strong>
                <p className="text-[10px] text-slate-600 line-clamp-1">
                  {costOverview.largestProject.district} • {costOverview.largestProject.workTitle}
                </p>
              </div>
            )}

            {costOverview.smallestProject && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-bold uppercase block">SMALLEST WORK</span>
                <strong className="text-xl font-black text-slate-900 font-serif block">
                  ₹{costOverview.smallestProject.sanctionedAmount.toLocaleString()}
                </strong>
                <p className="text-[10px] text-slate-600 line-clamp-1">
                  {costOverview.smallestProject.district} • {costOverview.smallestProject.workTitle}
                </p>
              </div>
            )}
          </div>

          {costOverview.categoryBreakdown && costOverview.categoryBreakdown.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Work Category</th>
                    <th className="p-3 text-right">Works Count</th>
                    <th className="p-3 text-right">Sanctioned (₹ Cr)</th>
                    <th className="p-3 text-right">Disbursed (₹ Cr)</th>
                    <th className="p-3 text-right rounded-r-xl">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costOverview.categoryBreakdown.map((cat: any) => (
                    <tr key={cat.category} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{cat.category}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{cat.count.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-900 font-bold">
                        ₹{(cat.sanctioned / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="p-3 text-right font-mono text-blue-900 font-bold">
                        ₹{(cat.expenditure / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="p-3 text-right">
                        <span className="bg-slate-100 font-bold text-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {cat.sanctioned > 0 ? ((cat.expenditure / cat.sanctioned) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: DISTRICT-LEVEL PORTFOLIO SUMMARY */}
      {(activeTab === 'OVERVIEW' || activeTab === 'DISTRICTS') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <Building size={20} className="text-blue-700" />
                <span>District Portfolio Summary</span>
              </h2>
              <p className="text-xs text-slate-500">
                Territorial breakdown of active works, capital disbursed, and high-risk flags across {assignedState} districts.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search district..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">District</th>
                  <th className="p-3 text-right">Total Works</th>
                  <th className="p-3 text-right">Sanctioned (₹ Cr)</th>
                  <th className="p-3 text-right">Disbursed (₹ Cr)</th>
                  <th className="p-3 text-right">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDistricts.slice(0, 15).map((d: any) => (
                  <tr key={d.district} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">{d.district}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{d.count}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ₹{(d.sanctioned / 10000000).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-900">
                      ₹{(d.expenditure / 10000000).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.utilization >= 60 ? 'bg-emerald-100 text-emerald-800' :
                        d.utilization >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.utilization}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {d.highRiskCount > 0 ? (
                        <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {d.highRiskCount} flagged
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                      {d.completedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDistricts.length > 15 && (
            <p className="text-[11px] text-slate-400 text-right pt-1">
              Showing top 15 of {filteredDistricts.length} active districts.
            </p>
          )}
        </div>
      )}

      {/* SECTION 5: PROJECTS REQUIRING ATTENTION */}
      {(activeTab === 'OVERVIEW' || activeTab === 'ATTENTION') && (
        <div className="bg-white p-6 rounded-3xl border border-red-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <span>Projects Requiring Attention (Ranked Priority Queue)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Decision-support ranking prioritizing works with empirical financial, procurement, or velocity signals.
              </p>
            </div>
            <span className="text-xs bg-red-100 text-red-800 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {topAttentionProjects?.length || 0} Priority Works
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(topAttentionProjects || []).slice(0, 5).map((p: any, idx: number) => (
              <div 
                key={p.id || idx}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                      #{idx + 1} PRIORITY
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">{p.projectId}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-700">{p.district}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {p.workTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-0.5">
                    <span className="text-slate-500 font-medium">Attention Indicator:</span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      ⚠️ Statistical peer expenditure velocity deviation ({p.riskScore}/100)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{((p.actualExpenditure || 0) / 100000).toFixed(1)} L / 
                      <span className="text-slate-500"> ₹{((p.sanctionedAmount || 0) / 100000).toFixed(1)} L</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      {p.action}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition flex items-center space-x-1"
                  >
                    <span>Review</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: NATIONAL VENDOR & CONTRACTOR INTELLIGENCE */}
      {(activeTab === 'OVERVIEW' || activeTab === 'VENDORS') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-purple-700" />
                <span>National Vendor &amp; Contractor Intelligence</span>
              </h2>
              <p className="text-xs text-slate-500">
                Searchable contractor history across executed public works to support informed future allocation decisions.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search contractor name or domain..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.slice(0, 6).map((v: any) => (
              <div key={v.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{v.name}</h4>
                  <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded shrink-0">
                    {v.projectsCount} Works
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-500 block text-[10px]">TOTAL VALUE</span>
                    <strong className="text-slate-900 font-serif">₹{(v.totalValue / 10000000).toFixed(2)} Cr</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DISTRICT SPREAD</span>
                    <strong className="text-slate-900">{v.districtCount} Districts</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    v.highRiskCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {v.indicator}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">{v.completionRate}% Delivered</span>
                </div>
              </div>
            ))}
          </div>

          {filteredVendors.length > 6 && (
            <p className="text-[11px] text-slate-400 text-right">
              Showing top 6 of {filteredVendors.length} active contractors.
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default Analytics;
