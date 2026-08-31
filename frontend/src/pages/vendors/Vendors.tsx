import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building2, AlertTriangle, Network, Search, ArrowLeft } from '../../components/common/Icons';

export const Vendors: React.FC = () => {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [riskFilter, setRiskFilter] = useState('');
  
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [contractorProjects, setContractorProjects] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contractors', {
        params: {
          page,
          search,
          risk_level: riskFilter
        }
      });
      setContractors(res.data.contractors);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, [page, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContractors();
  };

  const handleSelectContractor = async (c: any) => {
    setDetailsLoading(true);
    try {
      const [detailRes, projectsRes] = await Promise.all([
        api.get(`/contractors/${c.id}`),
        api.get(`/contractors/${c.id}/projects`)
      ]);
      setSelectedContractor(detailRes.data);
      setContractorProjects(projectsRes.data);
    } catch (err) {
      console.error('Error fetching contractor details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (selectedContractor) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans bg-slate-50 min-h-screen">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedContractor(null)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-3 w-full text-left"
        >
          <ArrowLeft size={16} />
          <span>Back to Contractor Explorer</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-blue-600">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  selectedContractor.contractor_risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                  selectedContractor.contractor_risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  Vendor Risk: {selectedContractor.contractor_risk_level}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                  Data Completeness: {selectedContractor.confidence_score}%
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 mt-2">{selectedContractor.name}</h1>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Normalized Key: {selectedContractor.normalized_name}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center min-w-[150px]">
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">Vendor Concentration Score</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{selectedContractor.contractor_risk_score} <span className="text-xs font-normal text-slate-500">/ 100</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
            <div>
              <span className="text-slate-400 font-medium block">Total Allocated Works</span>
              <span className="font-bold text-slate-800">{selectedContractor.project_count} Projects</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Aggregate Disbursed Cost</span>
              <span className="font-bold text-slate-800">₹{(selectedContractor.total_expenditure).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Average Project Value</span>
              <span className="font-bold text-slate-800">₹{Math.round(selectedContractor.average_project_value).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Geographic Footprint</span>
              <span className="font-bold text-slate-800">{selectedContractor.districts.length} Districts</span>
            </div>
          </div>
        </div>

        {/* Analysis Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Risk Signals */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Vendor Review Flags</h3>
              {selectedContractor.contractor_risk_signals.length === 0 ? (
                <p className="text-xs text-green-600 font-medium">No concentration risks identified based on observed project history.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
                  {selectedContractor.contractor_risk_signals.map((sig: string, i: number) => (
                    <li key={i}>{sig}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Project History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Historically Associated Projects</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Work ID & Description</th>
                      <th className="p-3">Sanctioned Amt</th>
                      <th className="p-3">Disbursed Amt</th>
                      <th className="p-3 text-right">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contractorProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{p.work_description}</p>
                          <p className="font-mono text-[9px] text-slate-400">{p.work_id}</p>
                        </td>
                        <td className="p-3 font-mono">₹{(p.sanctioned_amount || 0).toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">₹{(p.total_disbursed || 0).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${p.risk_level === 'HIGH' ? 'text-red-600' : 'text-slate-700'}`}>{p.prototype_risk_score}/100</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Categories, Districts, Verification Status */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Official Status Info</h3>
              <div className="bg-slate-50 border p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">OFFICIAL REGISTRATION STATUS</span>
                <span className="font-bold text-slate-800">{selectedContractor.official_status}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Source: {selectedContractor.official_status_source}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Geographic Presence</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedContractor.districts.map((dist: string, i: number) => (
                  <span key={i} className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-100 text-[10px]">
                    {dist}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Observed Category Specialization</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedContractor.work_types.map((type: string, i: number) => (
                  <span key={i} className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border text-[10px]">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Contractor Explorer & Concentrator Intelligence</h1>
        <p className="text-xs text-slate-500">Audit contractor allocations, project compatibility limits, and geographic concentrations across all districts</p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        <div className="flex-1 min-w-[200px] relative">
          <input 
            type="text" 
            placeholder="Search contractor profiles by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-2.5 top-3 text-slate-400 font-bold">🔍</span>
        </div>

        <select 
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk Only</option>
          <option value="MEDIUM">Medium Risk Only</option>
          <option value="LOW">Low Risk Only</option>
        </select>

        <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold transition">
          Filter
        </button>
      </form>

      {/* Listing Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Loading Profiles...</div>
        ) : contractors.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No contractor profiles matched the filter criteria.</div>
        ) : (
          <div className="space-y-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Contractor Name</th>
                  <th className="p-3">Projects</th>
                  <th className="p-3">Disbursed Expenditure</th>
                  <th className="p-3">Districts</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contractors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{v.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono uppercase font-semibold">Normalized Key: {v.normalized_name}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{v.project_count} Projects</td>
                    <td className="p-3 font-semibold text-slate-800">₹{(v.total_expenditure).toLocaleString()}</td>
                    <td className="p-3 text-slate-600">{v.districts.length} Districts</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        v.contractor_risk_level === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 
                        v.contractor_risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {v.contractor_risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleSelectContractor(v)}
                        className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1 rounded transition"
                      >
                        Profile Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-100 border rounded disabled:opacity-50 font-bold"
              >
                Previous
              </button>
              <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-slate-100 border rounded disabled:opacity-50 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
