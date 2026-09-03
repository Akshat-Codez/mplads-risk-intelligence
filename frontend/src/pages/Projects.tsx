import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Download, RotateCcw } from '../components/common/Icons';
import { MOCK_PROJECTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { getAllCanonicalStates, getCanonicalDistricts } from '../data/indiaHierarchy';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role } = useAuth();

  // Role-Enforced Scoping Initial State
  const defaultState = (role === 'STATE' || role === 'DISTRICT') ? (user?.state || 'ALL') : 'ALL';
  const defaultDistrict = role === 'DISTRICT' ? (user?.district || 'ALL') : 'ALL';
  const defaultVendor = searchParams.get('vendor') || 'ALL';

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [selectedVendor, setSelectedVendor] = useState(defaultVendor);
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    if (role === 'STATE' || role === 'DISTRICT') {
      setSelectedState(user?.state || 'ALL');
    }
    if (role === 'DISTRICT') {
      setSelectedDistrict(user?.district || 'ALL');
    }
  }, [role, user]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedState, selectedDistrict, selectedVendor, selectedRisk, selectedCategory]);

  // Extract unique States from authoritative directory
  const uniqueStates = useMemo(() => {
    return ['ALL', ...getAllCanonicalStates()];
  }, []);

  // Extract unique Vendors dynamically
  const uniqueVendors = useMemo(() => {
    const vendors = Array.from(new Set(
      MOCK_PROJECTS
        .map(p => p.vendorName)
        .filter(v => v && typeof v === 'string' && v.trim() && v.trim() !== 'Unknown Vendor' && v.trim() !== 'N/A')
    )).sort();
    return ['ALL', ...vendors];
  }, []);

  // Extract ALL valid Districts based on selected State
  const uniqueDistricts = useMemo(() => {
    const targetState = selectedState === 'ALL' ? (user?.state || '') : selectedState;
    if (targetState && targetState !== 'ALL' && targetState !== 'All India') {
      const canonical = getCanonicalDistricts(targetState);
      if (canonical.length > 0) {
        return ['ALL', ...canonical];
      }
    }
    return ['ALL'];
  }, [selectedState, user]);

  // Filtered Projects Logic
  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(p => {
      // 1. Text Search Across Title, ID, MP, Vendor
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || 
        (p.workTitle && p.workTitle.toLowerCase().includes(search)) || 
        (p.projectId && p.projectId.toLowerCase().includes(search)) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(search)) ||
        (p.district && p.district.toLowerCase().includes(search));

      // 2. Strict Role-Enforced Jurisdiction Scoping
      let matchesState = true;
      if (role === 'STATE' || role === 'DISTRICT') {
        const userState = (user?.state || 'Karnataka').toUpperCase();
        matchesState = (p.state && p.state.toUpperCase().includes(userState)) || (userState && userState.includes((p.state || '').toUpperCase()));
      } else if (selectedState !== 'ALL') {
        matchesState = p.state === selectedState;
      }

      let matchesDistrict = true;
      if (role === 'DISTRICT') {
        const userDist = (user?.district || 'BENGALURU URBAN').toUpperCase();
        matchesDistrict = (p.district && p.district.toUpperCase().includes(userDist)) || (userDist && userDist.includes((p.district || '').toUpperCase()));
      } else if (selectedDistrict !== 'ALL') {
        matchesDistrict = p.district === selectedDistrict;
      }

      // 3. Vendor / Contractor Filter
      let matchesVendor = true;
      if (selectedVendor !== 'ALL') {
        matchesVendor = Boolean(p.vendorName && p.vendorName.toLowerCase().trim() === selectedVendor.toLowerCase().trim());
      }

      // 4. Risk Level Filter
      const matchesRisk = selectedRisk === 'ALL' || p.riskLevel === selectedRisk;

      // 5. Category Filter
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

      return matchesSearch && matchesState && matchesDistrict && matchesVendor && matchesRisk && matchesCategory;
    });
  }, [searchTerm, selectedState, selectedDistrict, selectedVendor, selectedRisk, selectedCategory, role, user]);

  // Sort by risk score descending
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => b.riskScore - a.riskScore);
  }, [filteredProjects]);

  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE) || 1;

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProjects, page]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedVendor('ALL');
    if (role === 'MINISTRY' || role === 'MINISTER') {
      setSelectedState('ALL');
      setSelectedDistrict('ALL');
    } else if (role === 'STATE') {
      setSelectedDistrict('ALL');
    }
    setSelectedRisk('ALL');
    setSelectedCategory('ALL');
  };

  const handleExportCSV = () => {
    if (sortedProjects.length === 0) return;
    const headers = ["Work ID", "Title", "State", "District", "Sanctioned (Rs)", "Spent (Rs)", "Vendor", "Risk Score", "Status"];
    const rows = sortedProjects.map(p => [
      `"${p.projectId}"`,
      `"${p.workTitle.replace(/"/g, '""')}"`,
      `"${p.state}"`,
      `"${p.district}"`,
      p.sanctionedAmount,
      p.actualExpenditure,
      `"${p.vendorName}"`,
      p.riskScore,
      `"${p.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `MPLADS_Works_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              {role === 'DISTRICT' ? 'Local Works Queue' :
               role === 'STATE' ? 'District Projects Explorer' : 'MPLADS Projects Explorer'}
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
              {role === 'DISTRICT' ? `District Scope: ${user?.district}` :
               role === 'STATE' ? `State Scope: ${user?.state}` : 'National Scope: All India'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {role === 'DISTRICT' ? `Viewing works belonging strictly to ${user?.district} District.` :
             role === 'STATE' ? `Viewing works belonging strictly to ${user?.state} State with District filtering.` :
             'Filter, search, and audit public infrastructure works across all constituencies.'}
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow flex items-center space-x-2 transition cursor-pointer"
        >
          <Download size={15} />
          <span>Export Filtered CSV ({sortedProjects.length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Filter size={16} className="text-blue-600" />
            <span>Jurisdiction & Risk Filters</span>
          </div>
          <button 
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-medium">
          
          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Search Work / Vendor</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Title, ID, Vendor..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-medium"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            </div>
          </div>

          {/* State Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">State Jurisdiction</label>
            <select
              value={selectedState}
              disabled={role === 'STATE' || role === 'DISTRICT'}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('ALL');
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold disabled:bg-slate-200/60"
            >
              {uniqueStates.map(st => (
                <option key={st} value={st}>{st === 'ALL' ? '🇮🇳 All India' : `State: ${st}`}</option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">District Selector</label>
            <select
              value={selectedDistrict}
              disabled={role === 'DISTRICT'}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold disabled:bg-slate-200/60"
            >
              {uniqueDistricts.map(dst => (
                <option key={dst} value={dst}>{dst === 'ALL' ? `📍 All Districts in ${selectedState}` : `District: ${dst}`}</option>
              ))}
            </select>
          </div>

          {/* Vendor Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Contractor / Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold truncate"
            >
              <option value="ALL">🏢 All Vendors</option>
              {uniqueVendors.filter(v => v !== 'ALL').slice(0, 150).map(vnd => (
                <option key={vnd} value={vnd}>{vnd}</option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">AI Risk Assessment</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold"
            >
              <option value="ALL">⚠️ All Risk Levels</option>
              <option value="CRITICAL">🔴 Critical Risk (80-100)</option>
              <option value="HIGH">🟠 High Risk (50-79)</option>
              <option value="MEDIUM">🟡 Moderate Risk (25-49)</option>
              <option value="LOW">🟢 Low Risk (0-24)</option>
              <option value="INSUFFICIENT DATA">⚪ Insufficient Data (&lt;40% Confidence)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
          Showing <strong className="text-blue-600 font-bold">{sortedProjects.length}</strong> Works for {role === 'DISTRICT' ? `District ${user?.district}` : role === 'STATE' ? `State ${user?.state}` : 'Nationwide'} Scope
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">RISK SCORE</th>
              <th className="p-3.5">PROJECT ID & DESCRIPTION</th>
              <th className="p-3.5">STATE / DISTRICT</th>
              <th className="p-3.5">SANCTIONED</th>
              <th className="p-3.5">SPENT</th>
              <th className="p-3.5">VENDOR</th>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500 font-bold">
                  No works found for your assigned jurisdiction ({user?.state} / {user?.district}).
                </td>
              </tr>
            ) : (
              paginatedProjects.map((p) => {
                const targetId = p.projectId || p.id;
                return (
                  <tr 
                    key={p.id || p.projectId} 
                    onClick={() => navigate(`/app/projects/${encodeURIComponent(targetId)}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] inline-block ${
                        p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH' || p.riskScore >= 50 ? 'bg-red-100 text-red-800 border border-red-300' : 
                        p.riskLevel === 'MEDIUM' || p.riskScore >= 25 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 
                        p.riskLevel === 'INSUFFICIENT DATA' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {p.riskLevel === 'INSUFFICIENT DATA' ? 'INSUFFICIENT DATA' : `${p.riskScore}/100 (${p.riskLevel})`}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm">
                      <p className="font-bold text-slate-900 leading-snug">{p.workTitle}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.projectId}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{p.state}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{p.district}</p>
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {p.sanctionedAmount && p.sanctionedAmount > 0 
                        ? `₹${(p.sanctionedAmount / 100000).toFixed(1)} L` 
                        : p.recommendedAmount && p.recommendedAmount > 0 
                        ? `₹${(p.recommendedAmount / 100000).toFixed(1)} L (Rec.)` 
                        : 'Not Sanctioned'}
                    </td>
                    <td className="p-3.5 font-extrabold text-red-600">
                      {p.actualExpenditure && p.actualExpenditure > 0 
                        ? `₹${(p.actualExpenditure / 100000).toFixed(1)} L` 
                        : (p.sanctionedAmount ? '₹0.0 L (Unspent)' : 'Not Disbursed')}
                    </td>
                    <td className="p-3.5 text-slate-800 font-semibold">{p.vendorName}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[10px] font-bold border border-slate-200 whitespace-nowrap">
                        {p.status || 'Not Inspected'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/projects/${encodeURIComponent(targetId)}`); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded shadow transition cursor-pointer whitespace-nowrap"
                      >
                        View Audit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm cursor-pointer"
          >
            Previous
          </button>
          <span className="text-slate-700 font-extrabold text-xs px-3">
            Page {page} of {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition shadow-sm cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
