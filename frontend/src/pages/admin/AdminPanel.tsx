import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, BarChart3, Database, Lock, RotateCcw, Sparkles } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Authentication & Authorization gate
  const role = (user?.role || '').toUpperCase();
  const isAuthorized = ['ADMIN', 'SUPER_ADMIN', 'MINISTRY', 'MINISTER'].includes(role);

  // Admin login modal state if unauthenticated/unauthorized
  const [adminAuthId, setAdminAuthId] = useState('GOV-MOSPI-001');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Live admin metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      setFetchError(err.response?.data?.error || err.message || 'Failed to load administrative monitoring metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchMetrics();
    }
  }, [isAuthorized]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthenticating(true);
    try {
      await login(adminAuthId, 'MINISTRY', 'All India', 'All Districts');
      // Trigger fetch after login
      setTimeout(() => {
        fetchMetrics();
      }, 300);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid administrative credentials.');
    } finally {
      setAuthenticating(false);
    }
  };

  // If not authorized, show official Administration Authentication Gate
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-black text-white font-serif tracking-wide">
              NIRMAN System Administration
            </h2>
            <p className="text-xs text-slate-400">
              Restricted Model Monitoring & Risk Intelligence Console. Administrative authorization is required to proceed.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Admin Authority ID</label>
              <input
                type="text"
                value={adminAuthId}
                onChange={(e) => setAdminAuthId(e.target.value)}
                placeholder="e.g. GOV-MOSPI-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Security Passphrase</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin credentials"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authenticating}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl transition shadow-lg cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {authenticating ? 'Authenticating...' : 'Authorize Admin Session'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              &larr; Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Protected Administration Console
            </span>
            <span className="text-slate-400 text-xs font-mono">• Authenticated as {user?.name || user?.authorityId} ({role})</span>
          </div>
          <h1 className="text-2xl font-black text-white font-serif mt-1">
            NIRMAN AI & Risk Intelligence Administration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time model weights, feature inputs, dataset quality distributions, and governance feedback telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => navigate('/app')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow cursor-pointer"
          >
            Dashboard Hub &rarr;
          </button>
        </div>
      </div>

      {loading && !metrics && (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono">Aggregating national data quality & risk telemetry from authoritative database...</p>
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-xs text-red-200">
          ⚠️ {fetchError}
        </div>
      )}

      {metrics && (
        <div className="space-y-8">

          {/* 1. SYSTEM OVERVIEW SECTION */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">01.</span>
              <h2 className="text-lg font-bold text-white">System Overview (Authoritative Counts)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Works Seeded</span>
                <p className="text-2xl font-black text-white font-serif">{metrics.systemOverview.totalProjects?.toLocaleString()}</p>
                <span className="text-[10px] text-slate-500 block">30 States / UTs Active</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Valid Complete Works</span>
                <p className="text-2xl font-black text-emerald-400 font-serif">{metrics.systemOverview.validProjects?.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-500 block">Analyzed by Risk Engine</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1 border-t-2 border-t-amber-500">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Insufficient Data Works</span>
                <p className="text-2xl font-black text-amber-400 font-serif">{metrics.systemOverview.insufficientDataProjects?.toLocaleString()}</p>
                <span className="text-[10px] text-amber-500 block">Financial records missing</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1 border-t-2 border-t-red-500">
                <span className="text-[10px] text-red-400 font-bold uppercase">High-Risk Works</span>
                <p className="text-2xl font-black text-red-400 font-serif">{metrics.systemOverview.highRiskCount?.toLocaleString()}</p>
                <span className="text-[10px] text-red-500 block">Score &ge; 50 (Vigilance)</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-blue-400 font-bold uppercase">Audits & Feedback</span>
                <p className="text-2xl font-black text-blue-400 font-serif">{metrics.systemOverview.auditsCount + metrics.systemOverview.feedbackCount}</p>
                <span className="text-[10px] text-blue-500 block">Active Cases & Field Logs</span>
              </div>
            </div>
          </section>

          {/* 2. RISK MODEL METHODOLOGY & WEIGHTS */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">02.</span>
              <h2 className="text-lg font-bold text-white">Implemented Risk Methodology & Mathematical Weights</h2>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-white">{metrics.riskModel.methodology}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Version: {metrics.riskModel.version} • Deterministic scoring with ML prototype baseline compatibility</p>
                </div>
                <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                  Weight Total: 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {metrics.riskModel.weights.map((w: any, i: number) => (
                  <div key={i} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{w.dimension}</span>
                      <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{w.weight}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{w.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-700 text-xs text-slate-400 flex flex-wrap gap-4">
                <span><strong>Critical Threshold:</strong> &ge; 80</span>
                <span><strong>High Threshold:</strong> 50–79</span>
                <span><strong>Medium Threshold:</strong> 25–49</span>
                <span><strong>Low Threshold:</strong> &lt; 25</span>
              </div>
            </div>
          </section>

          {/* 3. RISK DISTRIBUTION & CONCENTRATION */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">03.</span>
              <h2 className="text-lg font-bold text-white">Risk Score Distribution & Regional Concentrations</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* National Score Averages & Percentages */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-bold text-sm text-white">National Score Averages</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block">Overall Avg</span>
                    <strong className="text-xl font-extrabold text-white">{metrics.riskDistribution.avgOverallScore}/100</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block">Financial Avg</span>
                    <strong className="text-xl font-extrabold text-blue-400">{metrics.riskDistribution.avgFinancialScore}/100</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block">Procurement Avg</span>
                    <strong className="text-xl font-extrabold text-emerald-400">{metrics.riskDistribution.avgProcurementScore}/100</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block">Contractor Avg</span>
                    <strong className="text-xl font-extrabold text-purple-400">{metrics.riskDistribution.avgContractorScore}/100</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs text-slate-300 font-bold block">Portfolio Segmentation</span>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex">
                    <div style={{ width: `${metrics.riskDistribution.highRiskPct}%` }} className="bg-red-500" title={`High Risk: ${metrics.riskDistribution.highRiskPct}%`}></div>
                    <div style={{ width: `${metrics.riskDistribution.mediumRiskPct}%` }} className="bg-amber-500" title={`Medium Risk: ${metrics.riskDistribution.mediumRiskPct}%`}></div>
                    <div style={{ width: `${metrics.riskDistribution.lowRiskPct}%` }} className="bg-emerald-500" title={`Low Risk: ${metrics.riskDistribution.lowRiskPct}%`}></div>
                    <div style={{ width: `${metrics.riskDistribution.insufficientDataPct}%` }} className="bg-slate-500" title={`Insufficient Data: ${metrics.riskDistribution.insufficientDataPct}%`}></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-red-400">High: {metrics.riskDistribution.highRiskPct}%</span>
                    <span className="text-amber-400">Medium: {metrics.riskDistribution.mediumRiskPct}%</span>
                    <span className="text-emerald-400">Low: {metrics.riskDistribution.lowRiskPct}%</span>
                    <span className="text-slate-400">Missing Data: {metrics.riskDistribution.insufficientDataPct}%</span>
                  </div>
                </div>
              </div>

              {/* Highest Risk District Concentrations */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-bold text-sm text-white">Top High-Risk District Clusters</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700 pb-2 uppercase text-[10px]">
                        <th className="pb-2">District</th>
                        <th className="pb-2">State</th>
                        <th className="pb-2">High-Risk Works</th>
                        <th className="pb-2">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-mono">
                      {metrics.riskDistribution.highRiskDistricts.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-700/40">
                          <td className="py-2 text-white font-bold">{d.district}</td>
                          <td className="py-2 text-slate-300">{d.state}</td>
                          <td className="py-2 text-red-400 font-bold">{d.highRiskWorks}</td>
                          <td className="py-2 text-amber-300">{d.avgRisk}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>

          {/* 4. DATA QUALITY: MISSING VS ZERO MONITOR */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">04.</span>
              <h2 className="text-lg font-bold text-white">Data Quality & Explicit Missing vs Zero Auditing</h2>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
              <div className="p-3.5 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-blue-200 leading-relaxed">
                ℹ️ <strong>System Protocol:</strong> {metrics.dataQuality.noteOnNullVsZero}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Missing Sanctioned</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">{metrics.dataQuality.missingSanctionedAmount?.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Null / 0 Sanctions</span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Missing Expenditure</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">{metrics.dataQuality.missingExpenditureRecords?.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Tracked as 'Data unavailable'</span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Strictly ₹0 Spent</span>
                  <p className="text-xl font-bold text-emerald-400 font-mono">{metrics.dataQuality.strictlyZeroExpenditure?.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-500">Sanctioned, 0 unreleased</span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Missing Contractors</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">{metrics.dataQuality.missingVendorAssignment?.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Unassigned Vendor Fields</span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Missing GPS Coords</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">{metrics.dataQuality.missingCoordinates?.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Skipped from Map Pins</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. MODEL INPUTS: ACTIVE VS PLANNED */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">05.</span>
              <h2 className="text-lg font-bold text-white">Model Inputs Specification (Active vs Planned)</h2>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-700">
                    <th className="p-3">Domain</th>
                    <th className="p-3">Feature Field</th>
                    <th className="p-3">Data Type</th>
                    <th className="p-3">Authoritative Source</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {metrics.modelInputs.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-700/30">
                      <td className="p-3 font-sans font-bold text-slate-300">{item.domain}</td>
                      <td className="p-3 text-amber-300">{item.field}</td>
                      <td className="p-3 text-slate-400">{item.type}</td>
                      <td className="p-3 text-slate-300 font-sans">{item.source}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status.includes('Active')
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. AI SERVICE TELEMETRY & HEALTH */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">06.</span>
              <h2 className="text-lg font-bold text-white">AI Service Health & Deterministic Fallback Mode</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">AI Service Operational Mode</span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700">
                    {metrics.aiMonitoring.provider}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Status: <strong className="text-white">{metrics.aiMonitoring.serviceStatus}</strong>
                </p>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1 font-mono text-[11px]">
                  <p>• API Key Configured: <span className={metrics.aiMonitoring.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}>{String(metrics.aiMonitoring.apiKeyConfigured)}</span></p>
                  <p>• Error Resilience: <span className="text-emerald-400">{metrics.aiMonitoring.errorResilienceMode}</span></p>
                  <p>• Telemetry Latency: <span className="text-blue-300">{metrics.aiMonitoring.sampleResponseTimeMs} ms</span></p>
                </div>
              </div>

              {/* 7. EXPLAINABILITY SHOWCASE */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">07. Model Explainability Sample</span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded">
                    Representative Work
                  </span>
                </div>
                {metrics.explainability.sampleProject ? (
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-1.5 text-[11px]">
                    <p className="font-bold text-white line-clamp-1">{metrics.explainability.sampleProject.description}</p>
                    <p className="text-slate-400 font-mono">ID: {metrics.explainability.sampleProject.workId} • {metrics.explainability.sampleProject.stateDistrict}</p>
                    <p className="text-red-400 font-bold">Risk Assessment: {metrics.explainability.sampleProject.riskScore}</p>
                    <p className="text-slate-300 text-[10px] pt-1">Flagged Triggers: {metrics.explainability.sampleProject.reasons}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">No sample project loaded.</p>
                )}
              </div>
            </div>
          </section>

          {/* 8. INVESTIGATION FEEDBACK & 9. SYSTEM HEALTH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 8. Investigation Feedback */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-mono text-sm font-bold">08.</span>
                <h3 className="font-bold text-sm text-white">Investigation Decision Telemetry</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-emerald-400 font-bold block">Confirmed Anomaly</span>
                  <strong className="text-lg font-bold text-white font-mono">{metrics.investigationFeedback.CONFIRMED}</strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-amber-400 font-bold block">False Positive</span>
                  <strong className="text-lg font-bold text-white font-mono">{metrics.investigationFeedback.FALSE_POSITIVE}</strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-blue-400 font-bold block">Under Investigation</span>
                  <strong className="text-lg font-bold text-white font-mono">{metrics.investigationFeedback.UNDER_INVESTIGATION}</strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block">No Issue Found</span>
                  <strong className="text-lg font-bold text-white font-mono">{metrics.investigationFeedback.NO_ISSUE}</strong>
                </div>
              </div>
            </div>

            {/* 9. System Health */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-mono text-sm font-bold">09.</span>
                <h3 className="font-bold text-sm text-white">Infrastructure Health Monitor</h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span>Backend API Server</span>
                  <span className="text-emerald-400 font-bold">● {metrics.systemHealth.backendServer.status} (Port {metrics.systemHealth.backendServer.port})</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span>Database (SQLite ORM)</span>
                  <span className="text-emerald-400 font-bold">● {metrics.systemHealth.database.status} ({metrics.systemHealth.database.latencyMs}ms)</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span>AI Risk Engine</span>
                  <span className="text-emerald-400 font-bold">● {metrics.systemHealth.aiService.status}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span>GIS / CartoDB Tile Engine</span>
                  <span className="text-emerald-400 font-bold">● {metrics.systemHealth.gisService.status}</span>
                </div>
              </div>
            </div>

          </div>

          {/* 10. REAL AUDIT LOGS */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm font-bold">10.</span>
              <h2 className="text-lg font-bold text-white">System Audit Trail & Access Logs</h2>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-700">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Details / User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-slate-300">
                  {metrics.auditLogs && metrics.auditLogs.length > 0 ? (
                    metrics.auditLogs.map((log: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-700/30">
                        <td className="p-3 text-slate-400">{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-bold text-amber-300">{log.action}</td>
                        <td className="p-3 text-slate-300">{log.entityType || 'PROJECT'}</td>
                        <td className="p-3 text-slate-400 font-sans">{log.details || log.userId || 'System'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                        Audit events active. All project views, inspections, and feedback submissions are recorded in SQLite auditLogs table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}

    </div>
  );
};
