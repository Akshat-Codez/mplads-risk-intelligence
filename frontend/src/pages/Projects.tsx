import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, ArrowUpDown, ChevronRight } from '../components/common/Icons';
import { MOCK_PROJECTS } from '../data/mockData';

export const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const navigate = useNavigate();

  const filteredProjects = MOCK_PROJECTS.filter(p => {
    const matchesSearch = p.workTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRisk === 'ALL' || p.riskLevel === selectedRisk;
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesRisk && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MPLADS Projects Explorer</h1>
          <p className="text-xs text-slate-500">Filter, search, and audit public infrastructure works across all constituencies</p>
        </div>
        <button 
          onClick={() => alert('Exporting dataset as CSV...')}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-300 flex items-center space-x-2 transition"
        >
          <Download size={14} />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Work Name, ID, Vendor..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
        </div>

        {/* Filter Risk */}
        <div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (Risk Score &gt; 80)</option>
            <option value="HIGH">High (Risk Score 60-79)</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>

        {/* Filter Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Work Categories</option>
            <option value="Community Infrastructure">Community Infrastructure</option>
            <option value="Road & Transport">Road & Transport</option>
            <option value="Drinking Water">Drinking Water</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-end text-slate-500 font-semibold">
          <span>Showing {filteredProjects.length} Projects</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Risk</th>
              <th className="p-3">Project ID & Title</th>
              <th className="p-3">State / District</th>
              <th className="p-3">Category</th>
              <th className="p-3">Sanctioned</th>
              <th className="p-3">Spent</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProjects.map((p) => (
              <tr 
                key={p.id} 
                onClick={() => navigate(`/projects/${p.id}`)}
                className="hover:bg-slate-50 cursor-pointer transition"
              >
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    p.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {p.riskScore}/100 ({p.riskLevel})
                  </span>
                </td>
                <td className="p-3">
                  <p className="font-bold text-slate-900">{p.workTitle}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{p.projectId}</p>
                </td>
                <td className="p-3 text-slate-700">{p.state} / {p.district}</td>
                <td className="p-3 text-slate-600">{p.category}</td>
                <td className="p-3 font-semibold text-slate-900">₹{(p.sanctionedAmount / 100000).toFixed(1)} L</td>
                <td className="p-3 font-semibold text-red-600">₹{(p.actualExpenditure / 100000).toFixed(1)} L</td>
                <td className="p-3 text-slate-700">{p.vendorName}</td>
                <td className="p-3">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] px-3 py-1 rounded transition"
                  >
                    View Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
