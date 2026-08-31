import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, BriefcasePlus } from '../components/common/Icons';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchFeedbackHistory = async () => {
    try {
      const encodedId = encodeURIComponent(id || "");
      const res = await api.get(`/projects/${encodedId}/feedback`);
      setFeedbackHistory(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const encodedId = encodeURIComponent(id || "");
        const res = await api.get(`/projects/${encodedId}`);
        setProject(res.data);
        setInvestigationStatus(res.data.investigation_info?.status || 'Unreviewed');
        setInvestigationNotes(res.data.investigation_info?.notes || '');

        // Fetch associated procurement document if any
        try {
          const procRes = await api.get(`/procurement/${encodedId}`);
          setProcurementDoc(procRes.data);
        } catch (procErr) {}

        // Fetch AI Project Summary
        try {
          const aiRes = await api.get(`/ai/project/${encodedId}/summary`);
          setAiProjectSummary(aiRes.data);
        } catch (aiErr) {}

        // Fetch Verification Feedback History
        await fetchFeedbackHistory();
      } catch (err) {
        console.error(err);
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
    try {
      const res = await api.post(`/procurement/${documentId}/analyze`);
      setProcurementDoc(res.data.data);
      alert('Procurement analysis completed successfully!');
      // Refresh project to get updated overall metrics
      const encodedId = encodeURIComponent(id || "");
      const projRes = await api.get(`/projects/${encodedId}`);
      setProject(projRes.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading Project Data...</div>;
  if (!project) return <div className="p-8 font-bold text-center text-red-600">Project Not Found</div>;

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
      <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 ${project.risk_level === 'HIGH' ? 'border-l-red-600' : 'border-l-amber-500'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-3 py-0.5 rounded-full font-bold ${project.risk_level === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                Risk Level: {project.risk_level}
              </span>
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                Status: {project.investigation_info.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{project.work_description}</h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">{project.work_id}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center min-w-[160px]">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">AI Risk Score</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-0.5">{project.prototype_risk_score} <span className="text-sm font-normal text-slate-500">/ 100</span></h2>
          </div>
        </div>

        {/* Project Attribute Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-slate-400 font-medium">District & State</span>
            <p className="font-semibold text-slate-800">{project.district}, {project.state}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Work Category</span>
            <p className="font-semibold text-slate-800">{project.work_type}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">MP Name</span>
            <p className="font-semibold text-slate-800">{project.mp_name}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Sanctioned Amount</span>
            <p className="font-semibold text-slate-800">₹{(project.sanctioned_amount || 0).toLocaleString()}</p>
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
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
              Confidence: {aiProjectSummary.structuredData?.confidence}%
            </span>
          </div>

          <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-5 text-xs text-indigo-100/90 leading-relaxed font-sans whitespace-pre-wrap">
            {aiProjectSummary.summaryMarkdown}
          </div>
        </div>
      )}

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
              {project.contractor_risk && (
                <p className="text-[10px] text-slate-500 font-semibold mt-1">Confidence Score: {project.contractor_risk.confidence}% (Data Completeness)</p>
              )}
            </div>

            {project.contractor_risk && (
              <div className="md:col-span-2 space-y-2">
                <span className="font-bold text-slate-700 block">Observed Review Flags & Compatibility Signals</span>
                {project.contractor_risk.signals.length === 0 ? (
                  <p className="text-green-600 font-medium">No contractor concentration or type compatibility signals triggered.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                    {project.contractor_risk.signals.map((sig: string, i: number) => (
                      <li key={i}>{sig}</li>
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
                {project.risk_evidence_explanation.split(' | ').map((reason: string, i: number) => (
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
                {project.procurementSignals || project.procurement_signals ? (
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                    {JSON.parse(project.procurementSignals || project.procurement_signals).map((signal: string, i: number) => (
                      <li key={i}>{signal}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 font-medium">No procurement anomalies or warnings identified.</p>
                )}
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
            <span className="font-extrabold text-slate-900 text-base">{project.prototype_risk_score || project.riskScore}/100</span>
            <span className={`block text-[10px] font-bold ${
              project.risk_level === 'HIGH' ? 'text-red-600' :
              project.risk_level === 'MEDIUM' ? 'text-amber-600' :
              project.risk_level === 'INSUFFICIENT DATA' ? 'text-slate-500' : 'text-green-600'
            }`}>{project.risk_level || project.riskLevel}</span>
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
