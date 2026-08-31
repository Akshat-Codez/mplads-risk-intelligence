import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, AlertTriangle, CheckCircle2, MapPin, Building2, FileText, ArrowRight, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [highRiskWorks, setHighRiskWorks] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [feedbackMetrics, setFeedbackMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchWorks = async () => {
    try {
      const worksRes = await api.get('/projects?risk_level=HIGH');
      setHighRiskWorks(Array.isArray(worksRes.data) ? worksRes.data : worksRes.data.projects || []);
    } catch (e) {}
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, infoRes, aiRes, fbRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/dataset-info'),
          api.get('/ai/summary').catch(() => ({ data: null })),
          api.get('/feedback/metrics').catch(() => ({ data: null }))
        ]);
        setStats(statsRes.data);
        setDatasetInfo(infoRes.data);
        setAiSummary(aiRes?.data || null);
        setFeedbackMetrics(fbRes?.data || null);
        await fetchWorks();
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateInvestigation = async (workId: string, status: string) => {
    try {
      await api.post(`/projects/${encodeURIComponent(workId)}/investigate`, {
        status: status,
        notes: ""
      });
      alert('Investigation updated successfully!');
      fetchWorks(); // refresh
    } catch (err) {
      alert("Failed to update investigation");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Analytics...</div>;

  const RISK_PIE_DATA = [
    { name: 'Low Risk', value: stats?.low_risk_count || 0, color: '#10B981' },
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
        <button 
          onClick={async () => {
            setLoading(true);
            try {
               await api.post('/projects/run-analysis');
               // Refresh the page data
               const [statsRes, infoRes] = await Promise.all([
                 api.get('/dashboard/summary'),
                 api.get('/dashboard/dataset-info')
               ]);
               setStats(statsRes.data);
               setDatasetInfo(infoRes.data);
               await fetchWorks();
            } catch (e) {
               alert("Failed to run analysis");
            } finally {
               setLoading(false);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold shadow flex items-center space-x-2 transition">
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

          {/* Key Executive Insights Grid */}
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

          {/* AI Briefing Markdown Card */}
          <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-5 text-xs text-indigo-100/90 leading-relaxed font-sans space-y-3 prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-sans text-xs">
              {aiSummary.summaryMarkdown}
            </div>
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
          <span className="font-bold text-blue-900 block mb-1">DATA SOURCE</span>
          <span className="text-blue-700">Source: {datasetInfo?.source} | Records: {datasetInfo?.records} | Fields Available: {datasetInfo?.available_fields}</span>
        </div>
        <div className="text-right">
          {!datasetInfo?.has_geolocation && (
             <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded font-semibold">Geolocation analysis disabled (No GPS data in source)</span>
          )}
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Tracked Works</p>
          <h3 className="text-2xl font-extrabold text-slate-900">{stats?.total_works.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Total Sanctioned Value</p>
          <h3 className="text-2xl font-extrabold text-blue-600">₹{(stats?.total_sanctioned / 100000).toFixed(1)} L</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">High Risk Flagged</p>
          <h3 className="text-2xl font-extrabold text-red-600">{stats?.high_risk_count}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-medium">Potentially Similar Works</p>
          <h3 className="text-2xl font-extrabold text-amber-600">{stats?.similar_works_count}</h3>
        </div>
      </div>

      {/* Priority Flagged Projects Table with Direct Detail Links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">PRIORITY HIGH RISK WORKS</h3>
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
            {highRiskWorks.map(w => (
              <React.Fragment key={w.work_id}>
                <tr className={`hover:bg-slate-50 ${expandedRow === w.work_id ? 'bg-slate-50' : ''}`}>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{w.work_description}</p>
                    <p className="font-mono text-[10px] text-slate-500">{w.work_id}</p>
                  </td>
                  <td className="p-3 text-slate-700">{w.district}</td>
                  <td className="p-3 font-semibold text-slate-900">₹{(w.sanctioned_amount / 100000).toFixed(1)} L</td>
                  <td className="p-3">
                    <span className="font-bold text-red-600">{w.prototype_risk_score}/100</span>
                    <span className="block text-[10px] text-red-500 font-semibold">HIGH</span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">
                    {w.risk_evidence_explanation.split(' | ')[0] || "Anomaly"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => navigate(`/projects/${encodeURIComponent(w.work_id || w.projectId)}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-2.5 py-1 rounded transition flex items-center gap-1"
                      >
                        <span>Open Dossier</span>
                        <ArrowRight size={12} />
                      </button>
                      <button 
                        onClick={() => setExpandedRow(expandedRow === w.work_id ? null : w.work_id)} 
                        className="bg-slate-200 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded hover:bg-slate-300 transition"
                      >
                        {expandedRow === w.work_id ? 'Hide ▲' : 'Details ▼'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === w.work_id && (
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
                                onChange={(e) => handleUpdateInvestigation(w.work_id, e.target.value)}
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
                          {/* Left Column: Reasons & Evidence */}
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

                          {/* Right Column: Score Breakdown */}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
