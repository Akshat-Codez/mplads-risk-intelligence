import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading System Analytics...</div>;

  // Map state expenditure data for the bar chart. Express returns values in Rs (Rupees).
  // We divide by 10,000,000 to convert to Crores (Cr) for easier visualization.
  const chartData = data?.expenditureByState?.slice(0, 5).map((item: any) => ({
    state: item.state,
    amount: parseFloat((item.amount / 10000000).toFixed(2)) // in Crores
  })) || [];

  // Sector stats
  const totalWorks = data?.expenditureByState?.reduce((acc: number, item: any) => acc + item.count, 0) || 0;
  const topCategory = data?.expenditureByCategory?.[0]?.category || 'N/A';

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
