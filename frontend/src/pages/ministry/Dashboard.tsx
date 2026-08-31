import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [highRiskWorks, setHighRiskWorks] = useState<any[]>([]);
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
        const [statsRes, infoRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/dataset-info')
        ]);
        setStats(statsRes.data);
        setDatasetInfo(infoRes.data);
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

      {/* Priority Flagged Projects Table with Inline Expansion */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">HIGH RISK WORKS</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Work ID & Title</th>
              <th className="p-3">District</th>
              <th className="p-3">Sanctioned Amount</th>
              <th className="p-3">Risk Score</th>
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
                    <button 
                      onClick={() => setExpandedRow(expandedRow === w.work_id ? null : w.work_id)} 
                      className="bg-slate-200 text-slate-800 font-bold text-[11px] px-3 py-1 rounded hover:bg-slate-300"
                    >
                      {expandedRow === w.work_id ? 'Hide Analysis ▲' : 'View Analysis ▼'}
                    </button>
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
