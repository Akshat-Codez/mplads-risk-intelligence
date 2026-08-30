import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BriefcasePlus } from '../components/common/Icons';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [investigationStatus, setInvestigationStatus] = useState("Unreviewed");
  const [investigationNotes, setInvestigationNotes] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const encodedId = encodeURIComponent(id || "");
        const res = await axios.get(`http://localhost:8000/api/works/${encodedId}`);
        setProject(res.data);
        setInvestigationStatus(res.data.investigation_info.status);
        setInvestigationNotes(res.data.investigation_info.notes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleUpdateInvestigation = async () => {
    try {
      const encodedId = encodeURIComponent(id || "");
      await axios.post(`http://localhost:8000/api/works/${encodedId}/investigate`, {
        status: investigationStatus,
        notes: investigationNotes
      });
      setShowCaseModal(false);
      alert('Investigation updated successfully!');
      // Refresh
      const res = await axios.get(`http://localhost:8000/api/works/${encodedId}`);
      setProject(res.data);
    } catch (err) {
      alert("Failed to update investigation");
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
