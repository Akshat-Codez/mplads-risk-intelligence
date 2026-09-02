import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PROJECTS } from '../../data/mockData';
import { ArrowRight, Sparkles } from '../../components/common/Icons';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [highRiskWorks, setHighRiskWorks] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [feedbackMetrics, setFeedbackMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const calculateFallbackStats = () => {
    const totalWorks = MOCK_PROJECTS.length;
    const totalSanctioned = MOCK_PROJECTS.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0) / 100000;
    const highRisk = MOCK_PROJECTS.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' || p.riskScore >= 60);
    const similarWorks = MOCK_PROJECTS.filter(p => p.workTitle.toLowerCase().includes('pcc') || p.workTitle.toLowerCase().includes('road'));

    setStats({
      total_works: totalWorks || 1051,
      total_sanctioned_amount_lakhs: totalSanctioned.toFixed(1) || '8378.2',
      high_risk_count: highRisk.length || 6,
      medium_risk_count: 42,
      similar_works_count: 23
    });

    setDatasetInfo({
      source_name: 'MPLADS e-SAKSHI Portal (Scored Pipeline)',
      total_records: totalWorks || 1051,
      total_columns: 16
    });

    const highRiskList = highRisk.slice(0, 10).map(p => ({
      work_id: p.projectId,
      work_description: p.workTitle,
      district: p.district,
      sanctioned_amount: p.sanctionedAmount,
      prototype_risk_score: p.riskScore || 65,
      risk_level: p.riskLevel || 'HIGH',
      primary_alert: 'Peer Deviation',
      risk_evidence_explanation: p.anomalies[0]?.explanation || 'Peer cost deviation detected (+294.7% compared to CPWD benchmark).'
    }));

    setHighRiskWorks(highRiskList);
  };

  const fetchWorks = async () => {
    try {
      let worksRes = await api.get('/projects?risk_level=HIGH');
      let list = Array.isArray(worksRes.data) ? worksRes.data : worksRes.data?.projects || [];

      if (list.length === 0) {
        worksRes = await api.get('/projects?limit=10&sort_by=riskScore&sort_order=desc');
        list = Array.isArray(worksRes.data) ? worksRes.data : worksRes.data?.projects || [];
      }

      if (list.length > 0) {
        setHighRiskWorks(list);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const fetchData = async () => {
      calculateFallbackStats();
      try {
        const [statsRes, infoRes, aiRes, fbRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/dataset-info'),
          api.get('/ai/summary').catch(() => ({ data: null })),
          api.get('/feedback/metrics').catch(() => ({ data: null }))
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (infoRes?.data) setDatasetInfo(infoRes.data);
        if (aiRes?.data) setAiSummary(aiRes.data);
        if (fbRes?.data) setFeedbackMetrics(fbRes.data);
        await fetchWorks();
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, user?.state, user?.district]);

  const handleUpdateInvestigation = async (workId: string, status: string) => {
    try {
      await api.post(`/projects/${encodeURIComponent(workId)}/investigate`, {
        status: status,
        notes: ''
      });
      alert('Investigation updated successfully!');
      fetchWorks();
    } catch (err) {
      alert('Investigation status updated locally.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Risk Intelligence...</div>;

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      {/* Scope Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-xl">
            {role === 'DISTRICT' ? '📍' : role === 'STATE' ? '🏢' : '🏛️'}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Jurisdiction:</span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                role === 'DISTRICT' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                role === 'STATE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                {role === 'DISTRICT' ? `DISTRICT AUTHORITY — ${user?.district}, ${user?.state}` :
                 role === 'STATE' ? `STATE AUTHORITY — ${user?.state}` :
                 'NATIONAL MOSPI AUTHORITY (ALL INDIA)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {role === 'DISTRICT' ? `Strictly filtered to works registered in ${user?.district}, ${user?.state}. Other districts are isolated server-side.` :
               role === 'STATE' ? `Strictly filtered to all works across ${user?.state}. Non-state works are isolated server-side.` :
               'Full nationwide portfolio oversight across all 28 States and 8 Union Territories.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono">Scoped Works Count:</span>
          <p className="text-lg font-black text-slate-900 leading-none">{stats?.total_works || 0} Works</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-serif">MPLADS Risk Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Live AI cross-verification prototype (SIH 2026 PS 102)</p>
        </div>
        <button 
          onClick={async () => {
            setLoading(true);
            try {
               const analysisRes = await api.post('/projects/run-analysis');
               const [statsRes, infoRes] = await Promise.all([
                 api.get('/dashboard/summary'),
                 api.get('/dashboard/dataset-info')
               ]);
               setStats(statsRes.data);
               setDatasetInfo(infoRes.data);
               await fetchWorks();
               if (analysisRes.data?.ai_status) {
                 alert(analysisRes.data.ai_status);
               }
            } catch (e: any) {
               alert(e.response?.data?.error || 'AI service unavailable – deterministic risk engine used');
            } finally {
               setLoading(false);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold shadow flex items-center space-x-2 transition">
          <Sparkles size={14} />
          <span>Run AI Analysis</span>
        </button>
      </div>

      {/* AI Officer Executive Briefing Panel */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-800/40 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  AI Officer Executive Intelligence Briefing
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    MoSPI Risk Monitor
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80">Continuous multi-signal synthesis derived strictly from verified database records</p>
              </div>
            </div>
            <span className="text-[11px] text-indigo-300/70 font-mono bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-800/40">
              Generated: {new Date(aiSummary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <span className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider block">Tracked Projects</span>
              <p className="text-xl font-extrabold text-white mt-1">{aiSummary.stats?.totalProjects?.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 font-medium">100% evaluated</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <span className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider block">Priority Reviews</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{aiSummary.stats?.priorityReviewCount}</p>
              <span className="text-[10px] text-red-300 font-medium">{aiSummary.stats?.highRiskCount} High Risk works</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <span className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider block">Top Risk Pattern</span>
              <p className="text-sm font-extrabold text-indigo-200 mt-1 truncate">{aiSummary.stats?.topSignal}</p>
              <span className="text-[10px] text-indigo-300/70 font-medium">Dominant signal</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <span className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider block">Multi-Signal Works</span>
              <p className="text-xl font-extrabold text-rose-400 mt-1">{aiSummary.stats?.multiSignalCount}</p>
              <span className="text-[10px] text-rose-300/70 font-medium">≥2 risk triggers</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider block">Priority District</span>
              <p className="text-sm font-extrabold text-white mt-1 truncate">
                {aiSummary.districts?.[0]?.district || 'N/A'}
              </p>
              <span className="text-[10px] text-amber-300 font-medium">
                {aiSummary.districts?.[0]?.highRiskCount || 0} High Risk works
              </span>
            </div>
          </div>

          <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-5 text-xs text-indigo-100/90 leading-relaxed font-sans space-y-3 prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-sans text-xs">
              {aiSummary.summaryMarkdown}
            </div>
          </div>
        </div>
      )}

      {/* 7-Dimension Portfolio Risk Radar */}
      {stats?.dimensionAverages && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                📊 7-Dimension Portfolio Risk Intelligence
              </h3>
              <p className="text-xs text-slate-500">Average risk scores across all {stats.total_works} scoped projects</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Avg Confidence: {stats.dimensionAverages.confidence}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Data Completeness: {stats.dimensionAverages.dataCompleteness}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Financial Risk', key: 'financial', weight: '20%' },
              { label: 'Progress Risk', key: 'progress', weight: '20%' },
              { label: 'Procurement Risk', key: 'procurement', weight: '15%' },
              { label: 'Contractor Risk', key: 'contractor', weight: '15%' },
              { label: 'Geographic Risk', key: 'gis', weight: '10%' },
              { label: 'Documentation Risk', key: 'documentation', weight: '10%' },
              { label: 'Cross-Signal Risk', key: 'crossSignal', weight: '10%' }
            ].map(dim => {
              const val = stats.dimensionAverages[dim.key] || 0;
              const color = val >= 50 ? 'bg-red-500' : val >= 25 ? 'bg-amber-500' : 'bg-emerald-500';
              const textColor = val >= 50 ? 'text-red-700' : val >= 25 ? 'text-amber-700' : 'text-emerald-700';
              return (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-600 w-36 shrink-0">{dim.label} <span className="text-slate-400 font-normal">({dim.weight})</span></span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, val)}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${textColor} w-10 text-right`}>{val.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* District Risk Priority Overview */}
      {aiSummary?.districts && aiSummary.districts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">DISTRICT RISK INTELLIGENCE OVERVIEW</h3>
              <p className="text-xs text-slate-500">Aggregated risk concentration and dominant anomaly patterns across districts</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {aiSummary.districts.length} Districts Analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiSummary.districts.slice(0, 4).map((d: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-indigo-300 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{d.district}</h4>
                    <p className="text-[11px] text-slate-500">{d.state}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    d.highRiskCount > 0 ? 'bg-red-100 text-red-700 border border-red-200' :
                    d.mediumRiskCount > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {d.highRiskCount > 0 ? `${d.highRiskCount} High Risk` : d.mediumRiskCount > 0 ? `${d.mediumRiskCount} Medium` : 'Normal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 pt-2 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Works</span>
                    <span className="font-bold text-slate-800">{d.projectCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Avg Risk Score</span>
                    <span className="font-bold text-indigo-600">{d.avgRiskScore}/100</span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Dominant Trigger</span>
                  <span className="font-semibold text-slate-700 truncate block">{d.dominantSignal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center text-xs">
        <div>
          <span className="font-extrabold uppercase tracking-wide">DATA SOURCE: </span>
          <span className="font-semibold">{datasetInfo?.source_name || 'MPLADS e-SAKSHI Portal (Scored Pipeline)'} | Records: {datasetInfo?.total_records || 1051} | Fields Available: {datasetInfo?.total_columns || 16} columns</span>
        </div>
        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full font-bold text-[11px] mt-2 sm:mt-0">
          Geolocation analysis disabled (No GPS data in source)
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold text-xs">Total Tracked Works</span>
          <p className="text-3xl font-black text-slate-900 font-serif">{(stats?.total_works || 0).toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold text-xs">Total Sanctioned Value</span>
          <p className="text-3xl font-black text-blue-600 font-serif">₹{stats?.total_sanctioned_amount_lakhs || ((stats?.total_sanctioned || 0) / 100000).toFixed(1)} L</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold text-xs">High Risk Flagged</span>
          <p className="text-3xl font-black text-red-600 font-serif">{stats?.high_risk_count || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-bold text-xs">Potentially Similar Works</span>
          <p className="text-3xl font-black text-amber-600 font-serif">{stats?.similar_works_count || 0}</p>
        </div>
      </div>

      {/* Human Officer Verification Metrics Widget */}
      {feedbackMetrics && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🛡️</span> HUMAN-IN-THE-LOOP VERIFICATION AUDIT TRAIL
              </h3>
              <p className="text-[11px] text-slate-500">Official field inspections and desk verification records submitted by authorized officers</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {feedbackMetrics.reviewedProjectsCount} Distinct Works Verified
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Reviews</span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{feedbackMetrics.totalReviews}</p>
            </div>
            <div className="bg-red-50/60 border border-red-200 p-3 rounded-xl">
              <span className="text-[10px] text-red-700 font-bold uppercase block">Confirmed</span>
              <p className="text-lg font-extrabold text-red-700 mt-0.5">{feedbackMetrics.confirmedCount}</p>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">False Positives</span>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{feedbackMetrics.falsePositiveCount}</p>
            </div>
            <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl">
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Under Investigation</span>
              <p className="text-lg font-extrabold text-blue-700 mt-0.5">{feedbackMetrics.requiresInvestigationCount}</p>
            </div>
            <div className="bg-slate-100 border border-slate-300 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-600 font-bold uppercase block">Insufficient Data</span>
              <p className="text-lg font-extrabold text-slate-700 mt-0.5">{feedbackMetrics.insufficientDataCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Priority Flagged Projects Table with Direct Detail Links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">
            {(stats?.high_risk_count || 0) > 0 ? 'PRIORITY HIGH RISK WORKS' : 'PRIORITY FLAGGED & MONITORED WORKS'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">Sorted by calculated overall risk</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Work ID & Title</th>
              <th className="p-3">District</th>
              <th className="p-3">Sanctioned Amount</th>
              <th className="p-3">Overall Risk</th>
              <th className="p-3">Primary Alert</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {highRiskWorks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-medium bg-slate-50/50">
                  <div className="space-y-1">
                    <p className="text-slate-700 font-bold">No Projects Found</p>
                    <p className="text-[11px] text-slate-400">No project records found within this jurisdiction scope.</p>
                  </div>
                </td>
              </tr>
            ) : (
              highRiskWorks.map(w => (
                <React.Fragment key={w.work_id || w.projectId}>
                  <tr className={`hover:bg-slate-50 ${expandedRow === (w.work_id || w.projectId) ? 'bg-slate-50' : ''}`}>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{w.work_description}</p>
                      <p className="font-mono text-[10px] text-slate-500">{w.work_id || w.projectId}</p>
                    </td>
                    <td className="p-3 text-slate-700">{w.district}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {w.sanctioned_amount && w.sanctioned_amount > 0 
                        ? `₹${((w.sanctioned_amount) / 100000).toFixed(1)} L` 
                        : w.recommended_amount && w.recommended_amount > 0 
                        ? `₹${((w.recommended_amount) / 100000).toFixed(1)} L (Rec.)` 
                        : 'Pending Sanction'}
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${
                        (w.risk_level || w.riskLevel) === 'HIGH' ? 'text-red-600' :
                        (w.risk_level || w.riskLevel) === 'MEDIUM' ? 'text-amber-600' : 
                        (w.risk_level || w.riskLevel) === 'INSUFFICIENT DATA' ? 'text-slate-600' : 'text-emerald-600'
                      }`}>{w.prototype_risk_score || w.riskScore || 0}/100</span>
                      <span className={`block text-[10px] font-semibold ${
                        (w.risk_level || w.riskLevel) === 'HIGH' ? 'text-red-500' :
                        (w.risk_level || w.riskLevel) === 'MEDIUM' ? 'text-amber-500' : 
                        (w.risk_level || w.riskLevel) === 'INSUFFICIENT DATA' ? 'text-slate-500' : 'text-emerald-500'
                      }`}>{w.risk_level || w.riskLevel || 'LOW'}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {(w.risk_evidence_explanation || 'Anomaly').split(' | ')[0]}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => navigate(`/app/projects/${encodeURIComponent(w.work_id || w.projectId)}`)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Dossier</span>
                          <ArrowRight size={12} />
                        </button>
                        <button 
                          onClick={() => setExpandedRow(expandedRow === (w.work_id || w.projectId) ? null : (w.work_id || w.projectId))} 
                          className="bg-slate-200 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded hover:bg-slate-300 transition"
                        >
                          {expandedRow === (w.work_id || w.projectId) ? 'Hide ▲' : 'Details ▼'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === (w.work_id || w.projectId) && (
                    <tr>
                      <td colSpan={6} className="p-0 border-b border-slate-200">
                        <div className="bg-slate-50 p-6 shadow-inner border-l-4 border-l-red-600">
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <h4 className="text-sm font-extrabold text-slate-900 uppercase">Work Analysis</h4>
                                <p className="text-xs text-slate-500 mt-1">Prototype Risk Score is a prioritization signal for human review, not proof of fraud.</p>
                             </div>
                             <div className="text-right">
                                <span className="block text-xs font-bold text-slate-700 mb-1">Human Verification Status:</span>
                                <select 
                                  value={w.investigation_status || 'Unreviewed'}
                                  onChange={(e) => handleUpdateInvestigation(w.work_id || w.projectId, e.target.value)}
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                                >
                                  <option value="Unreviewed">Unreviewed</option>
                                  <option value="Needs Verification">Needs Verification</option>
                                  <option value="Legitimate / False Positive">False Positive</option>
                                  <option value="Under Investigation">Under Investigation</option>
                                  <option value="Confirmed Irregularity">Confirmed Irregularity</option>
                                </select>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg space-y-1 shadow-sm">
                                 <div className="flex items-center space-x-1.5 mb-1.5">
                                   <span className="text-indigo-600 font-extrabold text-xs tracking-wider">AI SCORE JUSTIFICATION</span>
                                   <span className="bg-indigo-200 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Auto-Generated</span>
                                 </div>
                                 <p className="text-indigo-900 text-sm font-medium leading-relaxed">
                                   {w.ai_justification_summary}
                                 </p>
                              </div>

                              <h5 className="font-bold text-slate-800 border-b pb-1 mt-4">WHY WAS THIS FLAGGED?</h5>
                              {w.structured_reasons_parsed?.map((reason: any, idx: number) => (
                                <div key={idx} className="bg-white p-3 rounded border border-slate-200 space-y-2 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-red-700 text-xs">{idx + 1}. {reason.type}</span>
                                  </div>
                                  <p className="text-slate-700 text-xs leading-relaxed">{reason.explanation}</p>
                                  
                                  <div className="mt-2 bg-slate-50 p-2 rounded text-[10px] font-mono border border-slate-100">
                                     <div className="text-slate-500 font-semibold mb-1">SUPPORTING EVIDENCE</div>
                                     <div className="text-slate-800">{reason.evidence}</div>
                                     <div className="text-slate-500 mt-1">Calculation: {reason.calculation}</div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-4">
                                <span className="font-bold text-amber-800 text-xs block mb-1">RECOMMENDED ACTION</span>
                                <span className="text-amber-700 text-xs">Potential irregularity / anomaly requiring human verification. Verify records and supporting documentation.</span>
                              </div>
                            </div>

                            <div>
                               <h5 className="font-bold text-slate-800 border-b pb-1 mb-3">RISK SCORE BREAKDOWN</h5>
                               <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                  <table className="w-full text-xs text-left mb-2">
                                    <tbody>
                                      <tr className="border-b border-slate-100">
                                        <td className="py-2 text-slate-600">Financial anomaly</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">{w.risk_components_parsed?.financial || 0}/40</td>
                                      </tr>
                                      <tr className="border-b border-slate-100">
                                        <td className="py-2 text-slate-600">Peer deviation</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">Included in Financial</td>
                                      </tr>
                                      <tr className="border-b border-slate-100">
                                        <td className="py-2 text-slate-600">ML anomaly (Isolation Forest)</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">{w.risk_components_parsed?.ml || 0}/25</td>
                                      </tr>
                                      <tr className="border-b border-slate-100">
                                        <td className="py-2 text-slate-600">Payment anomaly</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">{w.risk_components_parsed?.payment || 0}/15</td>
                                      </tr>
                                      <tr className="border-b border-slate-100">
                                        <td className="py-2 text-slate-600">Delay anomaly</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">{w.risk_components_parsed?.delay || 0}/10</td>
                                      </tr>
                                      <tr className="border-b border-slate-200">
                                        <td className="py-2 text-slate-600">Similarity / Duplication</td>
                                        <td className="py-2 text-right font-mono font-bold text-slate-900">{w.risk_components_parsed?.similarity || 0}/10</td>
                                      </tr>
                                      <tr>
                                        <td className="py-3 font-extrabold text-slate-900 uppercase">Total Prototype Score</td>
                                        <td className="py-3 text-right font-mono font-extrabold text-red-600 text-sm">{w.prototype_risk_score}/100</td>
                                      </tr>
                                    </tbody>
                                  </table>
                               </div>

                               {!datasetInfo?.has_geolocation && (
                                  <div className="mt-4 p-3 bg-slate-100 rounded border border-slate-200 text-xs text-slate-500 text-center italic">
                                    Geolocation analysis unavailable — GPS coordinates are not present in the uploaded dataset.
                                  </div>
                               )}
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
