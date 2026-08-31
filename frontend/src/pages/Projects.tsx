import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, ArrowUpDown, ChevronRight } from '../components/common/Icons';
import api from '../services/api';

export const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = `/projects?page=${page}&limit=20`;
      if (selectedRisk !== 'ALL') {
        url += `&risk_level=${selectedRisk}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      // mapping category names from UI to workType
      if (selectedCategory !== 'ALL') {
        url += `&work_type=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await api.get(url);
      const data = res.data;
      if (Array.isArray(data)) {
        setProjects(data);
        setTotalPages(1);
      } else if (data && data.projects) {
        setProjects(data.projects);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, selectedRisk, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans text-xs">
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
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Work ID, Description, MP, Vendor..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={15} />
        </div>

        {/* Filter Risk */}
        <div>
          <select
            value={selectedRisk}
            onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High (Risk Score &gt; 60)</option>
            <option value="MEDIUM">Medium (Risk Score 30-59)</option>
            <option value="LOW">Low (Risk Score &lt; 30)</option>
          </select>
        </div>

        {/* Filter Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Work Categories</option>
            <option value="Drinking Water Sector">Drinking Water Sector</option>
            <option value="Roads, Pathways and Bridges">Roads & Transport</option>
            <option value="Education">Education</option>
            <option value="Health and Family Welfare">Health & Family Welfare</option>
            <option value="Other Public Facilities">Other Public Facilities</option>
            <option value="Sanitation and Public Health">Sanitation & Public Health</option>
          </select>
        </div>

        {/* Search button / Results Counter */}
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg shadow transition">
            Search
          </button>
          <span className="text-slate-500 font-semibold">Loaded {projects.length} works</span>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Loading Projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No projects match the selected filters.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
              <tr>
                <th className="p-3">Risk</th>
                <th className="p-3">Project ID & Description</th>
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
              {projects.map((p) => {
                const workId = p.work_id || p.projectId;
                const workTitle = p.work_description || p.workDescription || 'MPLADS Work';
                const riskLevel = p.risk_level || p.riskLevel || 'LOW';
                const riskScore = p.prototype_risk_score !== undefined ? p.prototype_risk_score : (p.riskScore || 0);
                const sanctioned = p.sanctioned_amount || p.sanctionedAmount || 0;
                const spent = p.total_disbursed || p.totalDisbursed || 0;
                const vendorName = p.vendor_name || p.vendorName || 'Not Assigned';
                const category = p.work_type || p.workType || 'General';
                const status = p.work_status || p.workStatus || 'Sanctioned';

                return (
                  <tr 
                    key={workId} 
                    onClick={() => navigate(`/projects/${encodeURIComponent(workId)}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 
                        riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {riskScore}/100 ({riskLevel})
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{workTitle}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{workId}</p>
                    </td>
                    <td className="p-3 text-slate-700">{p.state} / {p.district}</td>
                    <td className="p-3 text-slate-600">{category}</td>
                    <td className="p-3 font-semibold text-slate-900">₹{(sanctioned / 100000).toFixed(1)} L</td>
                    <td className="p-3 font-semibold text-red-600">₹{(spent / 100000).toFixed(1)} L</td>
                    <td className="p-3 text-slate-700">{vendorName}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                        {status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${encodeURIComponent(workId)}`); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] px-3 py-1 rounded transition"
                      >
                        View Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-600 font-bold">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
