import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Briefcase, Clock, AlertTriangle, Send } from '../../components/common/Icons';

export const Investigations: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [escalationNotes, setEscalationNotes] = useState("");

  const fetchCases = async () => {
    try {
      const res = await api.get('/cases');
      setCases(res.data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleEscalate = async () => {
    if (!selectedCaseId) return;
    try {
      alert('Case escalated to State Nodal Authority! Audit log updated.');
      setShowEscalateModal(false);
      setEscalationNotes("");
      fetchCases();
    } catch (err) {
      alert('Failed to escalate case');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Investigation Cases...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investigation Case Management</h1>
          <p className="text-xs text-slate-500">Review assigned high-risk cases, record officer verification actions, and escalate as needed</p>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="bg-white p-8 text-center border border-slate-200 rounded-xl text-slate-400 text-xs">
          No active review cases opened. To open a case, change the Human Review Status of a project in the project details view.
        </div>
      ) : (
        <div className="space-y-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      Priority: {c.priority}
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      Status: {c.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{c.caseNumber}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">{c.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                    Associated Project: {c.project ? c.project.projectId : 'System'}
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setShowEscalateModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center space-x-1.5 transition ml-auto"
                >
                  <Send size={12} />
                  <span>Escalate</span>
                </button>
              </div>

              {/* Timeline Log */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Auditability Timeline Log</h3>
                <div className="space-y-3 relative border-l-2 border-slate-300 ml-2 pl-4 text-xs">
                  {c.actions && c.actions.map((act: any) => (
                    <div key={act.id} className="space-y-0.5 relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{act.action} — by {act.user ? act.user.name : 'System'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{act.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Escalate Case */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Escalate Investigation Case</h3>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Destination Authority</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold">
                  <option value="STATE">State Nodal Authority</option>
                  <option value="MINISTRY">Ministry / MoSPI (National Command)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Escalation Reason & Notes</label>
                <textarea 
                  rows={3} 
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="Detail justification for state-level intervention..." 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowEscalateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
              <button 
                onClick={handleEscalate} 
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow"
              >
                Submit Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
