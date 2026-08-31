import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Cpu, CheckCircle2, AlertCircle, ShieldCheck, Play, ArrowRight, BarChart3, Database } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [datasetStatus, setDatasetStatus] = useState<any>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [training, setTraining] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsAndModels = async () => {
    try {
      const [analyticsRes, modelsRes, datasetRes] = await Promise.all([
        api.get('/dashboard/analytics'),
        api.get('/models').catch(() => ({ data: [] })),
        api.get('/models/dataset-status').catch(() => ({ data: null }))
      ]);
      setData(analyticsRes.data);
      setModels(Array.isArray(modelsRes.data) ? modelsRes.data : []);
      setDatasetStatus(datasetRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics or models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsAndModels();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await api.post('/models/evaluate');
      setEvaluationResult(res.data);
      await fetchAnalyticsAndModels();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to run model evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const res = await api.post('/models/train');
      if (res.data.status === 'DEFERRED_INSUFFICIENT_DATA') {
        alert(`${res.data.message}\n\n${res.data.recommendation}`);
      } else {
        alert(res.data.message || 'Model training completed.');
        await fetchAnalyticsAndModels();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Training request failed');
    } finally {
      setTraining(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading System Analytics & Model Registry...</div>;

  const chartData = data?.expenditureByState?.slice(0, 5).map((item: any) => ({
    state: item.state,
    amount: parseFloat((item.amount / 10000000).toFixed(2))
  })) || [];

  const totalWorks = data?.expenditureByState?.reduce((acc: number, item: any) => acc + item.count, 0) || 0;
  const topCategory = data?.expenditureByCategory?.[0]?.category || 'N/A';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🔬</span> Model Registry & Future Training Intelligence
          </h1>
          <p className="text-xs text-slate-500">Continuous model evaluation, dataset quality telemetry, and active learning supervision</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play size={14} />
            <span>{evaluating ? 'Evaluating Pipeline...' : 'Run Model Evaluation'}</span>
          </button>
          <button
            onClick={handleTrainModel}
            disabled={training}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Cpu size={14} />
            <span>{training ? 'Training...' : 'Trigger Supervised Training'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Dataset Readiness Banner */}
      {datasetStatus && (
        <div className={`p-5 rounded-2xl border ${
          datasetStatus.isTrainingAvailable 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl mt-0.5 ${
                datasetStatus.isTrainingAvailable ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
              }`}>
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>Feedback Dataset Readiness & Label Quality</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    datasetStatus.isTrainingAvailable ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {datasetStatus.isTrainingAvailable ? 'Supervised Training Ready' : 'Training Deferred (Phase 7 Feedback Accumulating)'}
                  </span>
                </h3>
                <p className="text-xs opacity-90 mt-0.5">{datasetStatus.reason}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Valid Labels</span>
                <span className="font-bold text-base">{datasetStatus.validLabeledCount} / {datasetStatus.minRequired}</span>
              </div>
              <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${datasetStatus.progressPercentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* Class Distribution Breakdown */}
          {datasetStatus.classDistribution && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-amber-200/60 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block">CONFIRMED (Positive)</span>
                <span className="font-bold text-red-600">{datasetStatus.classDistribution.CONFIRMED || 0} records</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block">FALSE POSITIVE (Negative)</span>
                <span className="font-bold text-emerald-600">{datasetStatus.classDistribution.FALSE_POSITIVE || 0} records</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block">REQUIRES INVESTIGATION</span>
                <span className="font-bold text-blue-600">{datasetStatus.classDistribution.REQUIRES_INVESTIGATION || 0} records</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 font-bold block">INSUFFICIENT DATA</span>
                <span className="font-bold text-slate-600">{datasetStatus.classDistribution.INSUFFICIENT_DATA || 0} records</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">MODEL REGISTRY & VERSION CONTROL</h3>
            <p className="text-xs text-slate-500">Auditable record of production and candidate risk prioritization algorithms</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {models.length} Registered Models
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
              <tr>
                <th className="p-3">Model Name & Version</th>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Precision</th>
                <th className="p-3 text-right">Recall</th>
                <th className="p-3 text-right">F1-Score</th>
                <th className="p-3 text-right">FPR</th>
                <th className="p-3 text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50 ${m.status === 'PRODUCTION' ? 'bg-indigo-50/30 font-semibold' : ''}`}>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{m.version}</p>
                  </td>
                  <td className="p-3 text-slate-700 max-w-xs truncate">{m.algorithm}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'PRODUCTION' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      m.status === 'CANDIDATE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      m.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                      m.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {m.precision !== null ? (m.precision * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {m.recall !== null ? (m.recall * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-indigo-600">
                    {m.f1Score !== null ? (m.f1Score * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {m.falsePositiveRate !== null ? (m.falsePositiveRate * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {m.rocAuc !== null ? m.rocAuc.toFixed(3) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Evaluation Benchmark Comparison Result */}
      {evaluationResult && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 space-y-6">
          <div className="flex justify-between items-center border-b border-indigo-800/40 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚖️</span> Baseline vs Candidate Model Evaluation Matrix
              </h3>
              <p className="text-xs text-indigo-200/80">
                Independent train/validation/test partitioned evaluation (Train: {evaluationResult.datasetInfo.trainSamples}, Val: {evaluationResult.datasetInfo.validationSamples}, Test: {evaluationResult.datasetInfo.testSamples})
              </p>
            </div>
            <span className="text-[11px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full font-bold">
              {evaluationResult.comparisonSummary.decision}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Model Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">Production Baseline</span>
                  <h4 className="font-extrabold text-white text-sm mt-0.5">{evaluationResult.baselineModel.name}</h4>
                  <p className="text-[11px] text-indigo-200/70 font-mono">{evaluationResult.baselineModel.version}</p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                  ACTIVE PRODUCTION
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-black/20 p-2.5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[10px] text-indigo-300/70 block">Precision</span>
                  <span className="font-bold text-white">{(evaluationResult.baselineModel.metrics.precision * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300/70 block">Recall</span>
                  <span className="font-bold text-white">{(evaluationResult.baselineModel.metrics.recall * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300/70 block">F1-Score</span>
                  <span className="font-bold text-indigo-300">{(evaluationResult.baselineModel.metrics.f1 * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300/70 block">FPR</span>
                  <span className="font-bold text-rose-300">{(evaluationResult.baselineModel.metrics.falsePositiveRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Candidate Supervised Model Card */}
            {evaluationResult.candidateModels?.[0] && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">Candidate Supervised Model</span>
                    <h4 className="font-extrabold text-white text-sm mt-0.5">{evaluationResult.candidateModels[0].name}</h4>
                    <p className="text-[11px] text-indigo-200/70 font-mono">{evaluationResult.candidateModels[0].version}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evaluationResult.candidateModels[0].status === 'CANDIDATE' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {evaluationResult.candidateModels[0].status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[10px] text-indigo-300/70 block">Precision</span>
                    <span className="font-bold text-white">{(evaluationResult.candidateModels[0].metrics.precision * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300/70 block">Recall</span>
                    <span className="font-bold text-white">{(evaluationResult.candidateModels[0].metrics.recall * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300/70 block">F1-Score</span>
                    <span className="font-bold text-indigo-300">{(evaluationResult.candidateModels[0].metrics.f1 * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300/70 block">FPR</span>
                    <span className="font-bold text-rose-300">{(evaluationResult.candidateModels[0].metrics.falsePositiveRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-200/90 leading-relaxed font-mono">
            <span className="font-bold text-amber-300 block mb-1">SYSTEM GOVERNANCE DIRECTIVE:</span>
            {evaluationResult.comparisonSummary.recommendation}
          </div>
        </div>
      )}

      {/* Existing Sector Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Expenditure by Top States (₹ Crores)</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No state expenditure data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit=" Cr" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-bold text-slate-900">Tracked Category Focus</h3>
          <div className="text-5xl font-extrabold text-blue-600">{totalWorks.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Total Active Scored Projects in Database</p>
          <div className="mt-4 text-xs font-semibold text-slate-700">
            Primary Expenditure Area: <span className="text-blue-600 block text-sm font-extrabold mt-1">{topCategory}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
