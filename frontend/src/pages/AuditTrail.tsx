import React from 'react';
import { MOCK_AUDIT_LOGS } from '../data/mockData';
import { History, ShieldCheck } from '../components/common/Icons';

export const AuditTrail: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
        <p className="text-xs text-slate-500">Immutable chronological log of all AI flags, case creations, and officer verification actions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User / Officer</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_AUDIT_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-slate-500">{log.timestamp}</td>
                <td className="p-3 font-bold text-slate-900">{log.user} ({log.role})</td>
                <td className="p-3">
                  <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-800">{log.entity}</td>
                <td className="p-3 text-slate-600">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
