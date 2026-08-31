import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const STATE_EXPENDITURE = [
  { state: 'Uttar Pradesh', amount: 480 },
  { state: 'Maharashtra', amount: 420 },
  { state: 'Bihar', amount: 350 },
  { state: 'Rajasthan', amount: 290 },
  { state: 'Madhya Pradesh', amount: 260 }
];

export const Analytics: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">System Analytics & Expenditure Metrics</h1>
        <p className="text-xs text-slate-500">Cross-state financial distribution, category completion rates, and anomaly statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Expenditure by Top States (₹ Crores)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STATE_EXPENDITURE}>
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit=" Cr" />
                <Tooltip />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-bold text-slate-900">National Sector Completion Rate</h3>
          <div className="text-5xl font-extrabold text-blue-600">71.4%</div>
          <p className="text-xs text-slate-500">98,420 Completed / 1,42,850 Total Sanctioned Works</p>
        </div>
      </div>
    </div>
  );
};
