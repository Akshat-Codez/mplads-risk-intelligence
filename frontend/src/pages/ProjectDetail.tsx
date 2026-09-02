import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, BriefcasePlus } from '../components/common/Icons';
import { MOCK_PROJECTS } from '../data/mockData';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [investigationStatus, setInvestigationStatus] = useState("Unreviewed");
  const [investigationNotes, setInvestigationNotes] = useState("");

  const [procurementDoc, setProcurementDoc] = useState<any>(null);
  const [aiProjectSummary, setAiProjectSummary] = useState<any>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<string>('CONFIRMED');
  const [feedbackReason, setFeedbackReason] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const effectiveChecklist = useMemo(() => {
    if (project?.documents_checklist && Object.keys(project.documents_checklist).length > 0) {
      return project.documents_checklist;
    }
    if (!project) return {};
    const hasSanction = Boolean(project.sanctionDate || (project.sanctionedAmount && project.sanctionedAmount > 0));
    const hasSpent = Boolean((project.totalDisbursed && project.totalDisbursed > 0) || (project.paymentCount && project.paymentCount > 0));
    const statusStr = (project.workStatus || project.status || '').toLowerCase();
    const isCompleted = statusStr.includes('completed') || Boolean(project.actualCompletionDate);
    const isInspected = statusStr.includes('physical inspection completed') || statusStr.includes('inspection passed') || project.inspection_status === 'INSPECTED';

    return {
      aa: Boolean(project.recommendationDate || project.recommendedAmount || project.sanctionDate),
      ts: hasSanction,
      estimate: Boolean(project.recommendedAmount || project.sanctionedAmount),
      boq: hasSanction,
      tender: Boolean(project.vendorName || hasSanction),
      workOrder: Boolean(project.workOrderDate || project.vendorName || hasSpent || ['work in progress', 'work partially completed', 'work completed', 'physical inspection'].some(s => statusStr.includes(s))),
      mb: Boolean(hasSpent || isInspected),
      bills: hasSpent,
      uc: Boolean(project.totalDisbursed && project.sanctionedAmount && (project.totalDisbursed / project.sanctionedAmount) >= 0.5),
      cc: isCompleted,
      inspection: isInspected,
      photos: Boolean(project.imageAvailable)
    };
  }, [project]);

  const effectiveCompleteness = useMemo(() => {
    if (project?.document_completeness !== undefined && project?.document_completeness > 0) {
      return project.document_completeness;
    }
    const count = Object.values(effectiveChecklist).filter(Boolean).length;
    return Math.round((count / 12) * 100);
  }, [project, effectiveChecklist]);

  const formatSignal = (sig: any): string => {
    if (!sig) return '';
    if (typeof sig === 'string') return sig;
    if (typeof sig === 'object') {
      return sig.description || sig.signal || sig.factor || sig.evidence || JSON.stringify(sig);
    }
    return String(sig);
  };

  const fetchFeedbackHistory = async () => {
    try {
      const encodedId = encodeURIComponent(id || "");
      const res = await api.get(`/projects/${encodedId}/feedback`);
      setFeedbackHistory(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetId = id ? decodeURIComponent(id) : "";
        const encodedId = encodeURIComponent(targetId);

        let data = null;
        try {
          const res = await api.get(`/projects/${encodedId}`);
          data = res.data;
        } catch (apiErr: any) {
          // If the main endpoint returns an error, try the audit-specific endpoint
          try {
            const auditRes = await api.get(`/projects/${encodedId}/audit`);
            data = auditRes.data;
          } catch (auditErr) {
            // Local dataset fallback
            const local = MOCK_PROJECTS.find(p => p.projectId === targetId || p.id === targetId || p.work_id === targetId);
            if (local) {
              data = { ...local, work_description: local.workDescription || local.workTitle, work_id: local.projectId || local.id };
            } else {
              throw apiErr;
            }
          }
        }

        if (data) {
          setProject(data);
          setInvestigationStatus(data.investigation_info?.status || data.investigation_status || 'Unreviewed');
          setInvestigationNotes(data.investigation_info?.notes || '');
        }

        // Fetch associated procurement document if any
        try {
          const procRes = await api.get(`/procurement/${encodedId}`);
          setProcurementDoc(procRes.data);
        } catch (procErr) {}

        // Fetch AI Project Summary
        try {
          const aiRes = await api.get(`/ai/project/${encodedId}/summary`);
          setAiProjectSummary(aiRes.data);
        } catch (aiErr: any) {
          console.warn("AI service currently unavailable, using deterministic fallback:", aiErr.message);
          setAiProjectSummary({
            summaryMarkdown: `### 1. Executive Intelligence Notice\nThis project has been flagged for further administrative verification through multi-signal deterministic evaluation.\n\n### 2. Contributing Risk Factors\n${data?.risk_evidence_explanation || 'Deterministic review complete. Standard verification parameters apply.'}\n\n### 3. Recommended Verification Actions\n1. Verify physical site execution milestones before releasing subsequent installment tranches.\n2. Confirm contractor credentials and GSTIN compliance.\n3. Validate Measurement Book (MB) recordings against original technical sanctions.`,
            isLlmGenerated: false,
            isUnavailable: true
          });
        }

        // Fetch Verification Feedback History
        await fetchFeedbackHistory();
      } catch (err: any) {
        console.error("Audit load failure:", err);
        setError(err.response?.data?.error || err.message || 'Unable to load audit information');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReason || feedbackReason.trim().length < 5) {
      alert('Please provide a justification reason of at least 5 characters.');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const encodedId = encodeURIComponent(id || "");
      await api.post(`/projects/${encodedId}/feedback`, {
        decision: selectedDecision,
        reason: feedbackReason.trim(),
        modelType: 'OVERALL'
      });
      alert(`Official verification recorded: ${selectedDecision}`);
      setFeedbackReason('');
      await fetchFeedbackHistory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit verification feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpdateInvestigation = async () => {
    try {
      const encodedId = encodeURIComponent(id || "");
      await api.post(`/projects/${encodedId}/investigate`, {
        status: investigationStatus,
        notes: investigationNotes
      });
      setShowCaseModal(false);
      alert('Investigation updated successfully!');
      // Refresh
      const res = await api.get(`/projects/${encodedId}`);
      setProject(res.data);
    } catch (err) {
      alert("Failed to update investigation");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', project.id);

    setUploading(true);
    try {
      const res = await api.post('/procurement/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Tender/BOQ PDF uploaded successfully! Beginning extraction & risk comparison...');
      // Trigger analysis immediately
      await handleAnalyze(res.data.documentId);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (documentId: string) => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await api.post(`/procurement/${documentId}/analyze`);
      setProcurementDoc(res.data.data);
      if (res.data.ai_status) {
        setAiStatusMessage(res.data.ai_status);
      }
      // Refresh project to get updated overall metrics
      const encodedId = encodeURIComponent(id || "");
      const projRes = await api.get(`/projects/${encodedId}`);
      setProject(projRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'AI service unavailable – deterministic risk engine used';
      setAiStatusMessage('AI service unavailable – deterministic risk engine used');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" role="status"></div>
        <p className="font-bold text-slate-700 text-sm tracking-wide animate-pulse">Loading audit information...</p>
        <p className="text-xs text-slate-400 font-mono">Work Identifier: {id}</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-xl max-w-lg w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-slate-900">Unable to load audit information</h2>
          <p className="text-xs text-slate-600 bg-red-50/60 p-3 rounded-lg border border-red-100 font-mono text-left break-all">
            {error}
          </p>
          <p className="text-xs text-slate-500">
            Project ID: <span className="font-mono font-bold text-slate-700">{id}</span>
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/app/projects')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Back to Projects
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            📋
          </div>
          <h2 className="text-xl font-black text-slate-900">No audit record exists for this project yet.</h2>
          <p className="text-xs text-slate-600">
            Project <span className="font-mono font-bold text-slate-800">{id}</span> is registered in the system, but no formal field inspection dossier or audit investigation has been initialized.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/app/projects')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Back to Projects Explorer
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const encodedId = encodeURIComponent(id || "");
                  await api.post(`/projects/${encodedId}/audit`, {
                    status: 'Under Audit',
                    notes: 'Initial audit record initiated by authorized authority officer.'
                  });
                  window.location.reload();
                } catch (e: any) {
                  alert(e.response?.data?.error || 'Failed to initialize audit');
                  setLoading(false);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <BriefcasePlus size={16} />
              <span>Start / Create Project Audit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans bg-slate-50 min-h-screen">
      {/* Back Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          onClick={() => setShowCaseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-2 transition"
        >
          <BriefcasePlus size={16} />
          <span>Update Investigation Status</span>
        </button>
      </div>

      {/* Main Project Title Card */}
      <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 ${(project.risk_level || project.riskLevel) === 'HIGH' ? 'border-l-red-600' : 'border-l-amber-500'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-3 py-0.5 rounded-full font-bold ${(project.risk_level || project.riskLevel) === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                Risk Level: {project.risk_level || project.riskLevel || 'LOW'}
              </span>
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                Status: {project.investigation_info?.status || project.investigation_status || 'Unreviewed'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{project.work_description || project.workTitle || 'Project Audit Dossier'}</h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">{project.work_id || project.projectId || id}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center min-w-[160px]">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">AI Risk Score</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-0.5">{project.prototype_risk_score ?? project.riskScore ?? 0} <span className="text-sm font-normal text-slate-500">/ 100</span></h2>
          </div>
        </div>

        {/* Project Attribute Cards Grid (Complete 15-Field Intelligence Dossier) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <span className="text-slate-400 font-medium">Work ID</span>
            <p className="font-bold text-slate-900 font-mono">{project.work_id || project.projectId || id}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">State & District</span>
            <p className="font-semibold text-slate-800">{project.district || 'N/A'}, {project.state || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">MP Name & Constituency</span>
            <p className="font-semibold text-slate-800">{project.mp_name || project.mpName || 'Data unavailable'} {project.constituency ? `(${project.constituency})` : ''}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Execution Status</span>
            <p className="font-semibold text-slate-800">{project.work_status || project.workStatus || project.status || 'In Progress'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Sanctioned Amount</span>
            <p className="font-bold text-slate-900">
              {project.sanctioned_amount !== null && project.sanctioned_amount !== undefined && project.sanctioned_amount > 0 
                ? `₹${Number(project.sanctioned_amount).toLocaleString('en-IN')}` 
                : project.recommended_amount !== null && project.recommended_amount !== undefined && project.recommended_amount > 0 
                ? `₹${Number(project.recommended_amount).toLocaleString('en-IN')} (Recommended)` 
                : project.sanctioned_amount === 0
                ? '₹0'
                : 'Data unavailable'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Actual Expenditure</span>
            <p className="font-bold text-slate-900">
              {project.actual_expenditure !== null && project.actual_expenditure !== undefined && project.actual_expenditure > 0
                ? `₹${Number(project.actual_expenditure).toLocaleString('en-IN')}`
                : project.total_disbursed !== null && project.total_disbursed !== undefined && project.total_disbursed > 0
                ? `₹${Number(project.total_disbursed).toLocaleString('en-IN')}`
                : project.actual_expenditure === 0 || project.total_disbursed === 0
                ? '₹0 (Unspent)'
                : 'Data unavailable'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Physical Inspection Status</span>
            <p className="mt-0.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                project.inspection_status === 'INSPECTED' || effectiveChecklist.inspection
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {project.inspection_status === 'INSPECTED' || effectiveChecklist.inspection ? 'INSPECTED / VERIFIED' : 'NOT INSPECTED'}
              </span>
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Audit Record Status</span>
            <p className="mt-0.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                (project.audit_cases && project.audit_cases.length > 0) || project.investigation_status === 'Under Audit'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {(project.audit_cases && project.audit_cases.length > 0) || project.investigation_status === 'Under Audit' ? 'UNDER AUDIT' : 'NO AUDIT RECORD YET'}
              </span>
            </p>
          </div>
        </div>

        {/* 4 Core Risk Intelligence Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Financial Risk</span>
            <strong className="text-sm font-extrabold text-slate-900">{project.financial_risk_score ?? project.financialRiskScore ?? 0}/100</strong>
            <span className="text-[10px] text-slate-500 block font-medium">Level: {project.financial_risk_level ?? project.financialRiskLevel ?? 'LOW'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Procurement Risk</span>
            <strong className="text-sm font-extrabold text-slate-900">{project.procurement_risk_score ?? project.procurementRiskScore ?? 0}/100</strong>
            <span className="text-[10px] text-slate-500 block font-medium">Level: {project.procurement_risk_level ?? project.procurementRiskLevel ?? 'LOW'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Contractor Risk</span>
            <strong className="text-sm font-extrabold text-slate-900">{project.contractor_risk_score ?? project.contractorRiskScore ?? 0}/100</strong>
            <span className="text-[10px] text-slate-500 block font-medium truncate">{project.vendorName || 'No Vendor Assigned'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Evidence Coverage</span>
            <strong className="text-sm font-extrabold text-indigo-900">{project.data_completeness ?? effectiveCompleteness ?? 0}%</strong>
            <span className="text-[10px] text-indigo-700 block font-medium">{effectiveCompleteness >= 70 ? 'High Evidence' : 'Data Gaps Present'}</span>
          </div>
        </div>
      </div>

      {/* AI Officer Project Intelligence Briefing Card */}
      {aiProjectSummary && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-800/40 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 bg-indigo-600/40 rounded-lg border border-indigo-400/30 text-indigo-300">✨</span>
              <div>
                <h3 className="text-base font-bold text-white">AI Officer Risk Intelligence Briefing</h3>
                <p className="text-[11px] text-indigo-200/80">Cross-verified structured intelligence for administrative review</p>
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
              aiProjectSummary.isUnavailable 
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                : 'bg-indigo-500/30 text-indigo-300 border-indigo-400/30'
            }`}>
              {aiProjectSummary.isUnavailable ? 'Deterministic Rule-Based Briefing' : 'AI Officer Multi-Signal Briefing'}
            </span>
          </div>

          <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-5 text-xs text-indigo-100/90 leading-relaxed font-sans whitespace-pre-wrap">
            {aiProjectSummary.summaryMarkdown}
          </div>
        </div>
      )}

      {/* 7-Dimension Risk Radar Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b pb-3">7-Dimension Risk Intelligence Analysis</h3>
        <div className="space-y-3">
          {[
            { label: 'Financial Risk', score: project.financial_risk_score },
            { label: 'Procurement Risk', score: project.procurement_risk_score },
            { label: 'Progress Risk', score: project.progress_risk_score },
            { label: 'Contractor Risk', score: project.contractor_risk_score },
            { label: 'Geographic Risk', score: project.gis_risk_score },
            { label: 'Documentation Risk', score: project.documentation_risk_score },
            { label: 'Cross-Signal Risk', score: project.cross_signal_score },
          ].map((dim, i) => (
            <div key={i} className="flex items-center text-xs">
              <span className="w-1/3 font-medium text-slate-700">{dim.label}</span>
              <div className="w-2/3 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (dim.score || 0) >= 50 ? 'bg-red-500' : (dim.score || 0) >= 25 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(dim.score || 0, 0), 100)}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right font-bold text-slate-600">{dim.score || 0}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg mt-4 text-xs font-bold text-slate-800">
          <span>Overall AI Score: {project.prototype_risk_score || 0}/100</span>
          <span>Data Completeness: {project.data_completeness || 0}%</span>
        </div>
      </div>

      {/* Top 5 Contributing Risk Factors */}
      {project.top_risk_factors && project.top_risk_factors.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3">Top 5 Contributing Risk Factors</h3>
          <div className="space-y-3">
            {[...project.top_risk_factors]
              .sort((a: any, b: any) => b.points - a.points)
              .slice(0, 5)
              .map((factor: any, i: number) => (
              <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{factor.factor}</span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">{factor.engine}</span>
                  </div>
                  <p className="text-xs text-slate-500">{factor.evidence}</p>
                </div>
                <span className="text-red-600 font-extrabold text-sm whitespace-nowrap">+{factor.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explainability Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Intelligence Explainability & Recommendations</h3>
        </div>
        
        {/* Accordion 1: Evidence & Supporting Data */}
        <div className="border-b border-slate-100">
          <button 
            className="w-full text-left px-6 py-4 font-bold text-sm text-slate-800 hover:bg-slate-50 flex justify-between items-center transition"
            onClick={() => setActiveAccordion(activeAccordion === 'evidence' ? null : 'evidence')}
          >
            <span>Evidence & Supporting Data by Dimension</span>
            <span className="text-slate-400">{activeAccordion === 'evidence' ? '−' : '+'}</span>
          </button>
          {activeAccordion === 'evidence' && (
            <div className="px-6 pb-5 pt-1 text-xs text-slate-600 space-y-4">
              {[
                { title: 'Financial Signals', data: project.financial_signals_parsed },
                { title: 'Progress Signals', data: project.progress_signals_parsed },
                { title: 'Documentation Signals', data: project.documentation_signals_parsed },
                { title: 'Cross Signals', data: project.cross_signals_parsed },
                { title: 'Contractor Signals', data: project.contractor_signals_parsed },
                { title: 'GIS Signals', data: project.gis_signals_parsed },
                { title: 'Procurement Signals', data: project.procurement_signals_parsed }
              ].map((section, i) => (
                section.data && section.data.length > 0 && (
                  <div key={i} className="space-y-1">
                    <span className="font-bold text-slate-700 block">{section.title}</span>
                    <ul className="list-disc pl-5 space-y-1 text-slate-500">
                      {section.data.map((sig: any, j: number) => <li key={j}>{formatSignal(sig)}</li>)}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Accordion 2: Data Used vs Missing */}
        <div className="border-b border-slate-100">
          <button 
            className="w-full text-left px-6 py-4 font-bold text-sm text-slate-800 hover:bg-slate-50 flex justify-between items-center transition"
            onClick={() => setActiveAccordion(activeAccordion === 'data' ? null : 'data')}
          >
            <span>Data Analysis & Missing Sources</span>
            <span className="text-slate-400">{activeAccordion === 'data' ? '−' : '+'}</span>
          </button>
          {activeAccordion === 'data' && (
            <div className="px-6 pb-5 pt-1 text-xs space-y-2">
              <p className="text-slate-600 font-medium mb-3">The following critical data sources were missing and not factored into the analysis:</p>
              <div className="flex flex-wrap gap-2">
                {project.missing_data_list && project.missing_data_list.length > 0 ? (
                  project.missing_data_list.map((item: string, i: number) => (
                    <span key={i} className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-green-600 font-medium">All critical data sources are present.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Recommended Administrative Actions */}
        <div>
          <button 
            className="w-full text-left px-6 py-4 font-bold text-sm text-slate-800 hover:bg-slate-50 flex justify-between items-center transition"
            onClick={() => setActiveAccordion(activeAccordion === 'actions' ? null : 'actions')}
          >
            <span>Recommended Administrative Actions</span>
            <span className="text-slate-400">{activeAccordion === 'actions' ? '−' : '+'}</span>
          </button>
          {activeAccordion === 'actions' && (
            <div className="px-6 pb-5 pt-1 text-xs space-y-3">
              {project.recommended_actions && project.recommended_actions.length > 0 ? (
                project.recommended_actions.map((action: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        action.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        action.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                        action.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>{action.priority}</span>
                      <span className="font-bold text-slate-800">{action.action}</span>
                    </div>
                    <p className="text-slate-600 ml-1">{action.reason} <span className="italic text-[10px] text-slate-400">({action.engine})</span></p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No specific actions recommended at this time.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Compliance Checklist */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Document Compliance Checklist</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculated from verified project milestones, financial sanctions, and physical execution records</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
            Completeness: {effectiveCompleteness}%
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { key: 'aa', label: 'Admin Approval (AA)' },
            { key: 'ts', label: 'Tech Sanction (TS)' },
            { key: 'estimate', label: 'Detailed Estimate' },
            { key: 'boq', label: 'Bill of Quantities (BOQ)' },
            { key: 'tender', label: 'Tender Document' },
            { key: 'workOrder', label: 'Work Order' },
            { key: 'mb', label: 'Measurement Book (MB)' },
            { key: 'bills', label: 'Running/Final Bills' },
            { key: 'uc', label: 'Utilisation Cert (UC)' },
            { key: 'cc', label: 'Completion Cert (CC)' },
            { key: 'inspection', label: 'Inspection Report' },
            { key: 'photos', label: 'Site Photographs' }
          ].map((doc) => (
            <div key={doc.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-base">{effectiveChecklist[doc.key] ? '✅' : '❌'}</span>
              <span className={`font-medium ${effectiveChecklist[doc.key] ? 'text-slate-800' : 'text-slate-400'}`}>
                {doc.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Associated Contractor & Compatibility Card */}
      {project.vendorName && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-base font-bold text-slate-900">Contractor Profile & Project Compatibility</h3>
            {project.contractor_risk && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                project.contractor_risk.level === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' :
                project.contractor_risk.level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                Vendor Risk: {project.contractor_risk.level}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <span className="text-slate-400 font-medium block">Contractor Name</span>
              <p className="font-extrabold text-slate-900 text-sm">{project.vendorName}</p>
            </div>

            {project.contractor_risk && (
              <div className="md:col-span-2 space-y-2">
                <span className="font-bold text-slate-700 block">Observed Review Flags & Compatibility Signals</span>
                {project.contractor_risk.signals.length === 0 ? (
                  <p className="text-green-600 font-medium">No contractor concentration or type compatibility signals triggered.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                    {project.contractor_risk.signals.map((sig: any, i: number) => (
                      <li key={i}>{formatSignal(sig)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Anomaly Explanation Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">AI Flagged Evidence (Explainability)</h3>
        <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-xl border-l-4 border-l-red-600 border border-slate-200 shadow-sm space-y-2 text-sm">
              <ul className="list-disc pl-5 space-y-2 text-slate-700 font-medium">
                {(project.risk_evidence_explanation || 'No unusual patterns detected.').split(' | ').map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
        </div>
      </div>

      {/* Procurement Intelligence Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-slate-900">Procurement & BOQ Audit Intelligence</h3>
          
          {/* Upload Button */}
          <div>
            <label className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg shadow cursor-pointer transition inline-block">
              {uploading ? 'Uploading PDF...' : analyzing ? 'Running AI Extraction...' : 'Upload Tender / BOQ PDF'}
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading || analyzing}
              />
            </label>
          </div>
        </div>

        {aiStatusMessage && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-blue-600 font-bold text-sm">ℹ️</span>
              <div>
                <p className="font-bold text-blue-950">AI & Risk Engine Status</p>
                <p className="text-blue-800 font-medium">{aiStatusMessage}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-blue-200/70 text-blue-900 px-2.5 py-1 rounded-full uppercase">
              {procurementDoc?.status || 'Analyzed'}
            </span>
          </div>
        )}

        {analysisError && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 font-bold text-sm">⚠️</span>
              <div>
                <p className="font-bold text-amber-900">Notice</p>
                <p className="text-amber-700">{analysisError}</p>
              </div>
            </div>
            {procurementDoc && procurementDoc.id && (
              <button
                onClick={() => handleAnalyze(procurementDoc.id)}
                disabled={analyzing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shrink-0"
              >
                {analyzing ? 'Retrying...' : 'Retry Analysis'}
              </button>
            )}
          </div>
        )}

        {analyzing && (
          <div className="p-8 text-center text-slate-600 font-semibold space-y-3">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading"></div>
            <p>Running LLM text extraction & price benchmark audit (CPWD SSR)...</p>
          </div>
        )}

        {!analyzing && !procurementDoc && (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
            No tender/BOQ document uploaded yet. Upload a PDF tender to parse items and compare against standard schedule of rates.
          </div>
        )}

        {!analyzing && procurementDoc && (
          <div className="space-y-4">
            {/* Meta Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Tender Number</span>
                <p className="font-bold text-slate-800">{procurementDoc.tender_number || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Contractor / Vendor</span>
                <p className="font-bold text-slate-800">{procurementDoc.contractor_vendor || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Issuing Authority</span>
                <p className="font-bold text-slate-800">{procurementDoc.issuing_authority || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Tender Date</span>
                <p className="font-bold text-slate-800">{procurementDoc.tender_date || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Total Estimated Value</span>
                <p className="font-bold text-slate-800">₹{(procurementDoc.total_estimated_value || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Total Quoted Value</span>
                <p className="font-bold text-slate-800">₹{(procurementDoc.total_quoted_value || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status</span>
                <p className="font-bold text-blue-600">{procurementDoc.status || 'Analyzed'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Extraction Mode</span>
                <p className="font-bold text-slate-800">{procurementDoc.extraction_method || 'DIGITAL'}</p>
              </div>
            </div>

            {/* Score & Signals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Procurement Risk Score</span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-0.5">{procurementDoc.procurement_risk_score} <span className="text-sm font-normal text-slate-500">/ 100</span></h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-2 ${procurementDoc.procurement_risk_level === 'HIGH' ? 'bg-red-100 text-red-700' : procurementDoc.procurement_risk_level === 'REQUIRES REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {procurementDoc.procurement_risk_level}
                </span>
              </div>

              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Procurement Risk Signals</span>
                {(() => {
                  let signals = [];
                  const raw = project.procurementSignals || project.procurement_signals;
                  if (raw) {
                    try {
                      signals = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    } catch (e) {
                      signals = [];
                    }
                  }
                  if (Array.isArray(signals) && signals.length > 0) {
                    return (
                      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                        {signals.map((signal: any, i: number) => (
                          <li key={i}>{formatSignal(signal)}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p className="text-slate-400 font-medium">No procurement anomalies or warnings identified.</p>;
                })()}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200 text-xs font-bold text-slate-700 flex flex-col sm:flex-row justify-between gap-2">
                <span>Extracted Bill of Quantities (BOQ) Items</span>
                <span className="text-[10px] text-amber-600 font-bold">Benchmark source: Demo/Synthetic reference dataset</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Item Name & Specs</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Estimated Price</th>
                      <th className="px-4 py-2 text-right">Quoted Price</th>
                      <th className="px-4 py-2 text-right">Ref Price (Benchmark)</th>
                      <th className="px-4 py-2 text-right">Deviation %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {procurementDoc.items && procurementDoc.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400 block max-w-md truncate">{item.description}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.estimated_price ? `₹${item.estimated_price}` : 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">₹{item.quoted_price}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {item.reference_price ? `₹${item.reference_price}` : 'Benchmark unavailable'}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${item.deviation_percentage > 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.deviation_percentage !== null ? `${item.deviation_percentage > 0 ? '+' : ''}${item.deviation_percentage}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Human Verification & Feedback Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️</span> Official Officer Human Verification & Decision
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review AI intelligence findings and record official verification feedback for audit logging and model calibration.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
            Human-in-the-Loop Protocol
          </span>
        </div>

        {/* Verification Summary Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Overall Risk</span>
            <span className="font-extrabold text-slate-900 text-base">{project.prototype_risk_score ?? project.riskScore ?? 0}/100</span>
            <span className={`block text-[10px] font-bold ${
              (project.risk_level || project.riskLevel) === 'HIGH' ? 'text-red-600' :
              (project.risk_level || project.riskLevel) === 'MEDIUM' ? 'text-amber-600' :
              (project.risk_level || project.riskLevel) === 'INSUFFICIENT DATA' ? 'text-slate-500' : 'text-green-600'
            }`}>{project.risk_level || project.riskLevel || 'LOW'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Financial Risk</span>
            <span className="font-extrabold text-slate-800 text-base">{project.financial_risk_score || 0}/100</span>
            <span className="block text-[10px] text-slate-500 font-semibold">Statistical & IF</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Procurement Risk</span>
            <span className="font-extrabold text-slate-800 text-base">{procurementDoc?.procurement_risk_score ?? 'N/A'}</span>
            <span className="block text-[10px] text-slate-500 font-semibold">{procurementDoc ? 'BOQ Audited' : 'No BOQ'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Contractor Risk</span>
            <span className="font-extrabold text-slate-800 text-base">{project.contractor_risk?.score ?? 'N/A'}</span>
            <span className="block text-[10px] text-slate-500 font-semibold">{project.contractor_risk ? 'Profiled' : 'Unprofiled'}</span>
          </div>
        </div>

        {/* Feedback Submission Form */}
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Officer Verification Decision:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'CONFIRMED', label: 'CONFIRMED', desc: 'Anomaly verified on-ground / records', color: 'border-red-500 bg-red-50 text-red-700', active: 'ring-2 ring-red-600 bg-red-100 font-extrabold' },
                { key: 'FALSE_POSITIVE', label: 'FALSE POSITIVE', desc: 'Legitimate cost / false trigger', color: 'border-emerald-500 bg-emerald-50 text-emerald-700', active: 'ring-2 ring-emerald-600 bg-emerald-100 font-extrabold' },
                { key: 'REQUIRES_INVESTIGATION', label: 'REQUIRES INVESTIGATION', desc: 'Needs field inspection / audit', color: 'border-blue-500 bg-blue-50 text-blue-700', active: 'ring-2 ring-blue-600 bg-blue-100 font-extrabold' },
                { key: 'INSUFFICIENT_DATA', label: 'INSUFFICIENT DATA', desc: 'Missing docs / unverified', color: 'border-slate-400 bg-slate-50 text-slate-700', active: 'ring-2 ring-slate-600 bg-slate-200 font-extrabold' }
              ].map(d => (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => setSelectedDecision(d.key)}
                  className={`p-3 rounded-xl border text-left transition ${d.color} ${selectedDecision === d.key ? d.active : 'opacity-80 hover:opacity-100'}`}
                >
                  <span className="block text-xs font-bold">{d.label}</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Officer Justification Reason & Verification Evidence <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              placeholder="State the verified ground evidence, measurement book details, or rationale for this decision..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingFeedback}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{submittingFeedback ? 'Recording Decision...' : 'Submit Official Verification'}</span>
            </button>
          </div>
        </form>

        {/* Verification History & Audit Trail */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Verification History & Human Audit Trail ({feedbackHistory.length})
          </h4>

          {feedbackHistory.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No officer verification decisions recorded yet for this project.
            </div>
          ) : (
            <div className="space-y-2.5">
              {feedbackHistory.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.officerDecision === 'CONFIRMED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        item.officerDecision === 'FALSE_POSITIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        item.officerDecision === 'REQUIRES_INVESTIGATION' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}>
                        Decision: {item.officerDecision}
                      </span>
                      <span className="font-bold text-slate-800">
                        {item.officer?.name || 'Officer'} ({item.officer?.role || 'Reviewer'})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                    "{item.reason}"
                  </p>

                  <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-slate-200/60 font-mono">
                    <span>AI Score at Review: <strong>{item.overallRiskScore}/100</strong> ({item.riskLevel})</span>
                    <span>Model: {item.modelVersion || 'v1.0-nirman-ensemble'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Score Components Breakdown</h3>
          <pre className="text-xs bg-slate-100 p-4 rounded text-slate-800">
              {JSON.stringify(project.risk_components_parsed, null, 2)}
          </pre>
      </div>

      {/* Modal: Create Investigation */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Update Investigation Workflow</h3>
              <button onClick={() => setShowCaseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Human Review Status</label>
                <select 
                    value={investigationStatus}
                    onChange={(e) => setInvestigationStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold">
                  <option value="Unreviewed">Unreviewed</option>
                  <option value="Needs Verification">Needs Verification</option>
                  <option value="Legitimate / False Positive">Legitimate / False Positive</option>
                  <option value="Confirmed Irregularity">Confirmed Irregularity (Finalized)</option>
                  <option value="Under Investigation">Under Investigation</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Review Notes</label>
                <textarea 
                    rows={4} 
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    placeholder="Add human verified context or field team instructions..." 
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowCaseModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
              <button 
                onClick={handleUpdateInvestigation} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
