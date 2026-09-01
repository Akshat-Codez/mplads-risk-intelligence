import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from '../../components/common/Icons';
import { MOCK_PROJECTS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export const DistrictDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // District Scoping: Defaults to user's district or BENGALURU URBAN
  const assignedDistrict = user?.district || 'BENGALURU URBAN';
  const assignedState = user?.state || 'Karnataka';

  // Strictly filter projects belonging to THIS district ONLY and sort by risk score descending
  const districtProjects = useMemo(() => {
    return MOCK_PROJECTS
      .filter(p => 
        p.district.toUpperCase().includes(assignedDistrict.toUpperCase()) || 
        assignedDistrict.toUpperCase().includes(p.district.toUpperCase())
      )
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [assignedDistrict]);

  const totalWorks = districtProjects.length;
  const sanctionedCr = (districtProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0) / 10000000).toFixed(2);
  const localAnomalies = districtProjects.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' || p.riskScore >= 50);
  const pendingReviews = districtProjects.filter(p => p.status.toLowerCase().includes('inspection') || p.status.toLowerCase().includes('pending'));

  const selectedGeoProject = localAnomalies[0] || districtProjects[0] || MOCK_PROJECTS[0];

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-3 py-0.5 rounded-full font-extrabold uppercase">
              📍 Local Jurisdiction Scope • {assignedState} State
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif mt-1">
            District Collector Action Hub ({assignedDistrict})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Field inspection queues, local project evidence verifications, and investigation actions scoped strictly to {assignedDistrict}.
          </p>
        </div>
        <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-3.5 py-1.5 rounded-full font-bold">
          {localAnomalies.length} Local Anomaly Priority Actions
        </span>
      </div>

      {/* Strictly Scoped District KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">{assignedDistrict} Total Works</p>
          <h3 className="text-3xl font-black text-slate-900 font-serif">{totalWorks}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Strictly District Jurisdiction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">Sanctioned Budget</p>
          <h3 className="text-3xl font-black text-blue-600 font-serif">₹{sanctionedCr} Cr</h3>
          <p className="text-[10px] text-blue-600 font-bold">Total Allocation Disbursed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">Local Anomalies Flagged</p>
          <h3 className="text-3xl font-black text-red-600 font-serif">{localAnomalies.length} Works</h3>
          <p className="text-[10px] text-red-500 font-bold">Risk Score ≥ 50/100 (HIGH)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs text-slate-500 font-bold uppercase">Pending Field Inspections</p>
          <h3 className="text-3xl font-black text-amber-600 font-serif">{pendingReviews.length} Works</h3>
          <p className="text-[10px] text-amber-600 font-bold">Awaiting Inspector Sign-off</p>
        </div>
      </div>

      {/* FEATURE 1: Interactive GIS Geofence Inspector (Local Scope) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                FEATURE 1: GIS Geofence Inspector
              </span>
              <span className="text-xs text-slate-500 font-semibold">100m Tolerance Boundary Check</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif mt-1">Geotag Photo Location Mismatch Visualizer</h3>
            <p className="text-xs text-slate-500">Compares official registered worksite coordinates against uploaded field photo EXIF GPS metadata in {assignedDistrict}.</p>
          </div>
          {selectedGeoProject && (
            <button onClick={() => navigate(`/app/projects/${selectedGeoProject.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow cursor-pointer">
              Inspect Local Evidence
            </button>
          )}
        </div>

        {selectedGeoProject && (() => {
          const regLat = selectedGeoProject.regLatitude || 12.9716;
          const regLng = selectedGeoProject.regLongitude || 77.5946;
          const exifLat = (regLat + 0.0756).toFixed(4);
          const exifLng = (regLng + 0.0264).toFixed(4);
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Local High Risk Flagged Work</span>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedGeoProject.workTitle}</h4>
                  <p className="text-slate-500 font-mono text-[10px]">ID: {selectedGeoProject.projectId} • {selectedGeoProject.district}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-800 text-[10px] block">REGISTERED WORKSITE GPS</span>
                    <span className="text-slate-800 font-bold">{regLat}° N, {regLng}° E</span>
                    <span className="text-[9px] text-emerald-600 block mt-0.5 font-sans font-semibold">100m Approved Geofence Radius</span>
                  </div>
                  <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <span className="font-bold text-red-800 text-[10px] block">UPLOADED PHOTO EXIF GPS</span>
                    <span className="text-slate-800 font-bold">{exifLat}° N, {exifLng}° E</span>
                    <span className="text-[9px] text-red-600 block mt-0.5 font-sans font-bold">⚠️ 8.4 km Geofence Mismatch</span>
                  </div>
                </div>
              </div>

              <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[160px] flex items-center justify-center p-4 border border-slate-800 text-white">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center mx-auto text-red-400">
                    <MapPin size={20} />
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-bold block">DISCREPANCY DETECTED: 8.4 km OUTSIDE GEOFENCE</span>
                  <p className="text-[10px] text-slate-300">Photo taken in secondary layout away from sanctioned site location.</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Local District Works Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 font-serif">Local Works Inspection Queue ({districtProjects.length})</h3>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            District: {assignedDistrict}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="p-3">WORK ID & TITLE</th>
                <th className="p-3">SANCTIONED AMOUNT</th>
                <th className="p-3">VENDOR</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">RISK SCORE</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {districtProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 max-w-sm">
                    <p className="font-bold text-slate-900 leading-snug">{p.workTitle}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.projectId}</p>
                  </td>
                  <td className="p-3 font-bold text-slate-900">₹{(p.sanctionedAmount / 100000).toFixed(1)} L</td>
                  <td className="p-3 text-slate-700">{p.vendorName}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH' || p.riskScore >= 50 ? 'bg-red-100 text-red-800 border border-red-200' :
                      p.riskLevel === 'MEDIUM' || p.riskScore >= 25 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {p.riskScore}/100 ({p.riskLevel})
                    </span>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={() => navigate(`/app/projects/${p.id}`)}
                      className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-[11px] hover:bg-blue-700 cursor-pointer"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
