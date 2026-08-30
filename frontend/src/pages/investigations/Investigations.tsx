import React, { useState } from 'react';
import { MOCK_CASES } from '../../data/mockData';
import { Briefcase, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, Send } from '../../components/common/Icons';

export const Investigations: React.FC = () => {
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const currentCase = MOCK_CASES[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investigation Case Management</h1>
          <p className="text-xs text-slate-500">Review assigned high-risk cases, record officer verification actions, and escalate as needed</p>
        </div>
        <button 
          onClick={() => setShowEscalateModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-2 transition"
        >
          <Send size={14} />
          <span>Escalate Case to State Authority</span>
        </button>
      </div>

      {/* Case Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Priority: {currentCase.priority}
              </span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Status: {currentCase.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentCase.caseNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{currentCase.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to: <strong>{currentCase.assignedDistrict}, {currentCase.assignedState}</strong> | Created: {currentCase.createdAt}
            </p>
          </div>
        </div>

        {/* Case Activity Timeline */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Auditability Timeline Log</h3>
          <div className="space-y-3 relative border-l-2 border-slate-300 ml-2 pl-4 text-xs">
            {currentCase.actions.map((act) => (
              <div key={act.id} className="space-y-0.5 relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{act.action} — by {act.user}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{act.timestamp}</span>
                </div>
                <p className="text-slate-600">{act.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                  <option value="STATE">State Nodal Authority (Uttar Pradesh)</option>
                  <option value="MINISTRY">Ministry / MoSPI (National Command)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Escalation Reason & Notes</label>
                <textarea rows={3} placeholder="Detail justification for state-level intervention..." className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowEscalateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
              <button 
                onClick={() => {
                  setShowEscalateModal(false);
                  alert('Case escalated to State Nodal Authority! Audit log updated.');
                }} 
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
