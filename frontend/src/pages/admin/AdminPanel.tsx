import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  BarChart3, 
  Database, 
  Lock, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  MapPin,
  FileText
} from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Strict Authorization: ONLY ADMIN or SUPER_ADMIN (normal MINISTRY, MINISTER, STATE, DISTRICT are blocked)
  const role = (user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Admin authentication gate state
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUALITY' | 'RISK_ENGINE' | 'AI_MONITORING' | 'FEEDBACK' | 'EVALUATION' | 'SIGNALS' | 'PIPELINE'>('OVERVIEW');

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
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthenticating(true);
    try {
      const res = await api.post('/admin/login', { adminKey });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        await login('SYS-ADMIN-01', 'ADMIN' as any, 'All India', 'All Districts');
      }
      setTimeout(() => {
        fetchMetrics();
      }, 200);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Invalid System Administrator Key.');
    } finally {
      setAuthenticating(false);
    }
  };

  // If not authorized as System Admin, render the Secure Administrator Access Gate
  if (!isAdmin) {
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
              Restricted Technical Control Center. Operational authorities (Ministry, State, District, Minister) cannot access this console without dedicated System Administrator credentials.
            </p>
          </div>

          {user && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300">
              Currently signed in as: <strong>{user.name} ({role})</strong>.
              <br />
              Please provide the Master Administrative Key to authorize elevated access.
            </div>
          )}

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-semibold">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAdminAuth} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Master Administrative Key / Passphrase</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter System Administrator Passphrase"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                required
                autoFocus
              />
              <p className="text-[10px] text-slate-500">Default SIH Dev Key: <code className="text-amber-400">admin123</code> or <code className="text-amber-400">MoSPI@Admin2026</code></p>
            </div>

            <button
              type="submit"
              disabled={authenticating}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl transition shadow-lg cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {authenticating ? 'Verifying Authorization...' : 'Authorize Administrator Session'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              &larr; Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🛡️ System Administration Console
            </span>
            <span className="text-slate-400 text-xs font-mono">• Authorized as {user?.name || 'Root Admin'} ({role})</span>
          </div>
          <h1 className="text-2xl font-black text-white font-serif mt-1">
            NIRMAN Technical Control &amp; Model Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Model monitoring, data quality diagnostics, risk engine telemetry, investigation feedback, and ML training pipeline oversight.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => navigate('/app/ministry')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            Open National Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1 text-xs font-bold">
        {[
          { id: 'OVERVIEW', label: 'A. System Overview' },
          { id: 'QUALITY', label: 'B. Data Quality' },
          { id: 'RISK_ENGINE', label: 'C. Risk Engine Monitoring' },
          { id: 'AI_MONITORING', label: 'D. AI / Model Monitoring' },
          { id: 'FEEDBACK', label: 'E. Investigation Feedback' },
          { id: 'EVALUATION', label: 'F. Model Evaluation' },
          { id: 'SIGNALS', label: 'G. Feature / Signals' },
          { id: 'PIPELINE', label: 'J. Model Feedback Loop' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2.5 rounded-t-xl transition cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-slate-900 border-t-2 border-amber-400 text-amber-300 shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !metrics && (
        <div className="p-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Loading administrative monitoring telemetry from database...
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-bold">
          ⚠️ {fetchError}
        </div>
      )}

      {metrics && (
        <div className="space-y-6">

          {/* SECTION A: SYSTEM OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">TOTAL PROJECTS</span>
                  <h3 className="text-2xl font-black text-white font-serif">{metrics.systemOverview.totalProjects.toLocaleString()}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold">100% Ingested from e-SAKSHI</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">JURISDICTIONS</span>
                  <h3 className="text-2xl font-black text-blue-400 font-serif">{metrics.systemOverview.totalStates} States / {metrics.systemOverview.totalDistricts} Dists</h3>
                  <p className="text-[10px] text-slate-400">All India Coverage</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">PROJECTS ANALYZED</span>
                  <h3 className="text-2xl font-black text-purple-400 font-serif">{metrics.systemOverview.projectsAnalyzed.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Multi-Signal Scored</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">AWAITING REVIEW</span>
                  <h3 className="text-2xl font-black text-amber-400 font-serif">{metrics.systemOverview.awaitingReviewProjects.toLocaleString()}</h3>
                  <p className="text-[10px] text-amber-400 font-bold">High/Critical Priority</p>
                </div>
              </div>

              {/* Administrative Tools Strip */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                  <span>🛠️ Dedicated Administrative Tools</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Restricted</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => navigate('/app/geofence-inspector')}
                    className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <MapPin size={16} className="text-amber-400" />
                      <span>Geofence EXIF Discrepancy Forensic Inspector</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cross-checks uploaded inspection photo GPS EXIF metadata against sanctioned registered boundary polygons.
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/app/data-ingestion')}
                    className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-400/50 rounded-xl text-left transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <Database size={16} className="text-blue-400" />
                      <span>Data Ingestion &amp; Quality Scrutiny Console</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inspects raw CSV data feeds, column mappings, and missing record distributions across newly received files.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: DATA QUALITY DIAGNOSTICS */}
          {activeTab === 'QUALITY' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  B. Data Quality Diagnostics &amp; Missing vs. Zero Scrutiny
                </h3>
                <p className="text-xs text-slate-400">
                  Explains why the risk engine classifies certain works as <strong>INSUFFICIENT DATA</strong>. Missing records are strictly recorded as NULL, not converted to ₹0.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING SANCTION AMOUNT</span>
                  <strong className="text-xl text-amber-400 font-serif block">{metrics.dataQuality.missingSanctionedAmount}</strong>
                  <span className="text-[10px] text-slate-500">Unrecorded initial allocations</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING EXPENDITURE (NULL)</span>
                  <strong className="text-xl text-purple-400 font-serif block">{metrics.dataQuality.missingExpenditureRecords}</strong>
                  <span className="text-[10px] text-slate-500">Data unavailable / not synced</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">STRICTLY ₹0 DISBURSEMENT</span>
                  <strong className="text-xl text-blue-400 font-serif block">{metrics.dataQuality.strictlyZeroExpenditure}</strong>
                  <span className="text-[10px] text-slate-500">Sanctioned but 0 unreleased</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING VENDOR ASSIGNMENT</span>
                  <strong className="text-xl text-slate-300 font-serif block">{metrics.dataQuality.missingVendorAssignment}</strong>
                  <span className="text-[10px] text-slate-500">Vendor name absent</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING GPS COORDINATES</span>
                  <strong className="text-xl text-red-400 font-serif block">{metrics.dataQuality.missingCoordinates}</strong>
                  <span className="text-[10px] text-slate-500">Works prior to GPS mandate</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING INSPECTION RECORDS</span>
                  <strong className="text-xl text-amber-300 font-serif block">{metrics.dataQuality.missingInspectionRecords}</strong>
                  <span className="text-[10px] text-slate-500">Pending physical verification</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">MISSING STATUTORY DATES</span>
                  <strong className="text-xl text-slate-300 font-serif block">{metrics.dataQuality.missingStatutoryDates}</strong>
                  <span className="text-[10px] text-slate-500">Recommendation or sanction date</span>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-slate-400 block text-[11px]">AVG DATA COMPLETENESS</span>
                  <strong className="text-xl text-emerald-400 font-serif block">{metrics.dataQuality.avgCompletenessScore}%</strong>
                  <span className="text-[10px] text-emerald-400">Standardized across 12 criteria</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: RISK ENGINE MONITORING */}
          {activeTab === 'RISK_ENGINE' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  C. Risk Engine Monitoring &amp; Multi-Signal Component Distributions
                </h3>
                <p className="text-xs text-slate-400">
                  Real database score distribution across NIRMAN's 7 risk dimensions. The engine preserves genuine statistical skew without fabricating artificial symmetry.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-red-950/40 p-4 rounded-xl border border-red-800/60 space-y-1">
                  <span className="text-red-400 block text-[10px] font-bold uppercase">HIGH / CRITICAL RISK</span>
                  <h4 className="text-2xl font-black text-red-300 font-serif">{metrics.riskDistribution.high}</h4>
                  <span className="text-[10px] text-red-400">{metrics.riskDistribution.highRiskPct}% of national portfolio</span>
                </div>
                <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/60 space-y-1">
                  <span className="text-amber-400 block text-[10px] font-bold uppercase">MEDIUM RISK</span>
                  <h4 className="text-2xl font-black text-amber-300 font-serif">{metrics.riskDistribution.medium}</h4>
                  <span className="text-[10px] text-amber-400">{metrics.riskDistribution.mediumRiskPct}% of national portfolio</span>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60 space-y-1">
                  <span className="text-emerald-400 block text-[10px] font-bold uppercase">LOW RISK</span>
                  <h4 className="text-2xl font-black text-emerald-300 font-serif">{metrics.riskDistribution.low}</h4>
                  <span className="text-[10px] text-emerald-400">{metrics.riskDistribution.lowRiskPct}% of national portfolio</span>
                </div>
                <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-800/60 space-y-1">
                  <span className="text-purple-400 block text-[10px] font-bold uppercase">INSUFFICIENT DATA</span>
                  <h4 className="text-2xl font-black text-purple-300 font-serif">{metrics.riskDistribution.insufficientData}</h4>
                  <span className="text-[10px] text-purple-400">{metrics.riskDistribution.insufficientDataPct}% of national portfolio</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700 space-y-3 text-xs">
                <h4 className="font-bold text-white">Component Average Scores (0-100 scale)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block">AVG OVERALL RISK</span>
                    <strong className="text-lg text-white font-serif">{metrics.riskDistribution.avgOverallScore}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">AVG FINANCIAL RISK</span>
                    <strong className="text-lg text-amber-400 font-serif">{metrics.riskDistribution.avgFinancialScore}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">AVG PROCUREMENT RISK</span>
                    <strong className="text-lg text-blue-400 font-serif">{metrics.riskDistribution.avgProcurementScore}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">AVG CONTRACTOR RISK</span>
                    <strong className="text-lg text-purple-400 font-serif">{metrics.riskDistribution.avgContractorScore}/100</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: MODEL / AI MONITORING */}
          {activeTab === 'AI_MONITORING' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  D. Model &amp; AI Service Monitoring
                </h3>
                <p className="text-xs text-slate-400">
                  Technical telemetry on cloud AI integration, deterministic fallback availability, and inference latency.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">SERVICE STATUS</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <strong className="text-emerald-400 text-sm">{metrics.aiMonitoring.serviceStatus}</strong>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Provider: <span className="text-white font-bold">{metrics.aiMonitoring.provider}</span>
                  </p>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">INFERENCE LATENCY</span>
                  <strong className="text-2xl text-blue-400 font-serif block">{metrics.aiMonitoring.averageResponseTimeMs} ms</strong>
                  <p className="text-[11px] text-slate-400">
                    High throughput sub-500ms multi-signal feature evaluation.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">ANALYSIS COVERAGE</span>
                  <strong className="text-2xl text-purple-400 font-serif block">{metrics.aiMonitoring.analysisCoveragePct}%</strong>
                  <p className="text-[11px] text-slate-400">
                    {metrics.aiMonitoring.successfulAnalyses.toLocaleString()} valid works evaluated.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 space-y-1">
                <p>Model Identifier: <strong className="text-amber-400">{metrics.aiMonitoring.modelIdentifier}</strong></p>
                <p>Resilience Mode: Graceful Deterministic Fallback Active (ensures zero white screens or unhandled exceptions)</p>
              </div>
            </div>
          )}

          {/* SECTION E: INVESTIGATION FEEDBACK */}
          {activeTab === 'FEEDBACK' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  E. Investigation Feedback &amp; Verification Outcomes
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous capture of officer field verification decisions. This forms the foundation for verified future ML ground-truth labels.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-center">
                <div className="bg-red-950/40 p-4 rounded-xl border border-red-800/60 space-y-1">
                  <span className="text-red-400 font-bold text-[10px] uppercase block">CONFIRMED ANOMALY</span>
                  <h4 className="text-2xl font-black text-red-300 font-serif">{metrics.investigationFeedback.confirmedAnomaly}</h4>
                  <span className="text-[10px] text-slate-400">Action taken</span>
                </div>
                <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/60 space-y-1">
                  <span className="text-amber-400 font-bold text-[10px] uppercase block">FALSE POSITIVE</span>
                  <h4 className="text-2xl font-black text-amber-300 font-serif">{metrics.investigationFeedback.falsePositive}</h4>
                  <span className="text-[10px] text-slate-400">Normal justification</span>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60 space-y-1">
                  <span className="text-emerald-400 font-bold text-[10px] uppercase block">NO ISSUE FOUND</span>
                  <h4 className="text-2xl font-black text-emerald-300 font-serif">{metrics.investigationFeedback.noIssueFound}</h4>
                  <span className="text-[10px] text-slate-400">Cleared by audit</span>
                </div>
                <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-800/60 space-y-1">
                  <span className="text-blue-400 font-bold text-[10px] uppercase block">UNDER REVIEW</span>
                  <h4 className="text-2xl font-black text-blue-300 font-serif">{metrics.investigationFeedback.needsFurtherInvestigation}</h4>
                  <span className="text-[10px] text-slate-400">Field visit ongoing</span>
                </div>
                <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-800/60 space-y-1">
                  <span className="text-purple-400 font-bold text-[10px] uppercase block">INSUFFICIENT EVID.</span>
                  <h4 className="text-2xl font-black text-purple-300 font-serif">{metrics.investigationFeedback.insufficientEvidence}</h4>
                  <span className="text-[10px] text-slate-400">Records awaited</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION F: MODEL EVALUATION (NO FABRICATION) */}
          {activeTab === 'EVALUATION' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  F. Model Evaluation &amp; Statistical Precision
                </h3>
                <p className="text-xs text-slate-400">
                  Ground-truth evaluation calculated strictly from confirmed investigation outcomes.
                </p>
              </div>

              {!metrics.modelEvaluation.sufficientData ? (
                <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                    <AlertTriangle size={18} />
                    <span>{metrics.modelEvaluation.message}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {metrics.modelEvaluation.notice}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    * Policy Guarantee: NIRMAN strictly forbids fabricating benchmark statistics. Metrics will automatically calculate once the minimum statistical quorum of verified audits is recorded.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span>PRECISION</span>
                    <strong>{metrics.modelEvaluation.precisionPct}%</strong>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span>RECALL</span>
                    <strong>{metrics.modelEvaluation.recallPct}%</strong>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span>F1 SCORE</span>
                    <strong>{metrics.modelEvaluation.f1ScorePct}%</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION G: FEATURE / SIGNALS */}
          {activeTab === 'SIGNALS' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  G. Active Feature &amp; Risk Signal Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  Empirical frequency of active risk signals contributing most frequently to flagged projects in the risk engine.
                </p>
              </div>

              <div className="space-y-3">
                {metrics.featureSignals.map((sig: any) => (
                  <div key={sig.signal} className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-900 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {sig.domain}
                        </span>
                        <strong className="text-white text-sm">{sig.signal}</strong>
                      </div>
                      <span className="text-amber-400 font-bold font-mono">{sig.triggerRatePct}% trigger rate</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all" 
                        style={{ width: `${sig.triggerRatePct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION J: MODEL FEEDBACK LOOP PIPELINE */}
          {activeTab === 'PIPELINE' && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white font-serif">
                  J. Model Feedback Loop &amp; Continuous Learning Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Workflow mapping the lifecycle of project records from e-SAKSHI data ingestion to verified training candidate curation.
                </p>
              </div>

              <div className="space-y-3">
                {metrics.feedbackLoopPipeline.pipelineSteps.map((step: any) => (
                  <div key={step.step} className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center space-x-4 text-xs">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">{step.name}</h5>
                      <p className="text-slate-400 text-xs mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300">
                <strong>Statutory Notice:</strong> {metrics.feedbackLoopPipeline.retrainingNotice}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
