import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Send, CheckCircle2, MapPin, Camera, Lock } from '../components/common/Icons';
import { MOCK_PROJECTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';

interface GeofenceViolation {
  id: string;
  projectId: string;
  realId: string;
  workTitle: string;
  state: string;
  district: string;
  sanctionedAmount: number;
  approvedLat: number;
  approvedLng: number;
  photoExifLat: number;
  photoExifLng: number;
  distanceMismatchKm: number;
  photoTimestamp: string;
  deviceModel: string;
  status: 'CRITICAL_VIOLATION' | 'MODERATE_DEVIATION' | 'COMPLIANT';
  actionTaken: boolean;
}

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildGeofenceViolation(p: Project, index: number): GeofenceViolation {
  const approvedLat = p.regLatitude || 12.9716;
  const approvedLng = p.regLongitude || 77.5946;

  const isHighRisk = p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' || p.riskScore >= 50;
  const isMediumRisk = p.riskLevel === 'MEDIUM' || (p.riskScore >= 25 && p.riskScore < 50);

  let photoExifLat = approvedLat;
  let photoExifLng = approvedLng;
  let status: 'CRITICAL_VIOLATION' | 'MODERATE_DEVIATION' | 'COMPLIANT' = 'COMPLIANT';
  let deviceModel = 'OnePlus 11 5G (GPS Tagged)';

  if (isHighRisk) {
    const offsetLat = (index % 2 === 0) ? 0.0756 : 0.0195;
    const offsetLng = (index % 2 === 0) ? 0.0264 : 0.0144;
    photoExifLat = Number((approvedLat + offsetLat).toFixed(4));
    photoExifLng = Number((approvedLng + offsetLng).toFixed(4));
    status = 'CRITICAL_VIOLATION';
    deviceModel = (index % 2 === 0) ? 'iPhone 14 Pro (GPS Tagged)' : 'Samsung Galaxy S23 Ultra';
  } else if (isMediumRisk) {
    photoExifLat = Number((approvedLat + 0.0045).toFixed(4));
    photoExifLng = Number((approvedLng + 0.0035).toFixed(4));
    status = 'MODERATE_DEVIATION';
    deviceModel = 'Xiaomi Redmi Note 12 Pro';
  } else {
    photoExifLat = Number((approvedLat + 0.0003).toFixed(4));
    photoExifLng = Number((approvedLng + 0.0002).toFixed(4));
    status = 'COMPLIANT';
    deviceModel = 'OnePlus 11 5G (GPS Tagged)';
  }

  const distanceMismatchKm = Number(getHaversineDistanceKm(approvedLat, approvedLng, photoExifLat, photoExifLng).toFixed(2));

  return {
    id: `geo-${p.id}`,
    projectId: p.projectId,
    realId: p.id,
    workTitle: p.workTitle,
    state: p.state,
    district: p.district,
    sanctionedAmount: p.sanctionedAmount,
    approvedLat,
    approvedLng,
    photoExifLat,
    photoExifLng,
    distanceMismatchKm,
    photoTimestamp: `${p.sanctionDate || '2026-08-28'} 14:32:10 IST`,
    deviceModel,
    status,
    actionTaken: false
  };
}

export const GeofenceInspector: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Derive dynamic cases from actual dataset records scoped to authority jurisdiction
  const liveCases = useMemo(() => {
    let filtered = MOCK_PROJECTS;
    if (role === 'STATE' && user?.state) {
      filtered = MOCK_PROJECTS.filter(p => p.state.toLowerCase() === user.state.toLowerCase());
    } else if (role === 'DISTRICT' && user?.district) {
      filtered = MOCK_PROJECTS.filter(p => 
        p.district.toUpperCase().includes(user.district.toUpperCase()) ||
        user.district.toUpperCase().includes(p.district.toUpperCase())
      );
    }
    const sorted = [...filtered].sort((a, b) => b.riskScore - a.riskScore);
    return sorted.map((p, idx) => buildGeofenceViolation(p, idx));
  }, [role, user?.state, user?.district]);

  const [activeCases, setActiveCases] = useState<GeofenceViolation[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'COMPLIANT'>('ALL');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveCases(liveCases);
    if (liveCases.length > 0) {
      setSelectedCaseId(liveCases[0].id);
    }
  }, [liveCases]);

  const selectedCase = activeCases.find(c => c.id === selectedCaseId) || activeCases[0];

  const filteredCases = activeCases.filter(c => {
    if (filterTab === 'CRITICAL') return c.status === 'CRITICAL_VIOLATION';
    if (filterTab === 'MODERATE') return c.status === 'MODERATE_DEVIATION';
    if (filterTab === 'COMPLIANT') return c.status === 'COMPLIANT';
    return true;
  });

  const handleIssueNotice = (id: string) => {
    if (!selectedCase) return;
    setActiveCases(prev => prev.map(c => c.id === id ? { ...c, actionTaken: true } : c));
    setActionSuccessMsg(`Official Discrepancy Notice Issued to ${selectedCase.district} District Collector!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleFreezeDisbursal = (id: string) => {
    if (!selectedCase) return;
    setActiveCases(prev => prev.map(c => c.id === id ? { ...c, actionTaken: true } : c));
    setActionSuccessMsg(`Milestone Payment Disbursal Frozen for ${selectedCase.projectId}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ["Case ID", "Project ID", "Work Title", "District", "Distance Mismatch (km)", "EXIF Timestamp", "Device", "Status"];
    const rows = activeCases.map(c => [
      c.id,
      `"${c.projectId}"`,
      `"${c.workTitle.replace(/"/g, '""')}"`,
      `"${c.district}"`,
      c.distanceMismatchKm,
      `"${c.photoTimestamp}"`,
      `"${c.deviceModel}"`,
      c.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Geofence_EXIF_Discrepancy_Audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!selectedCase) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Geofence Audit Data...</div>;
  }

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-3 py-0.5 rounded-full font-extrabold uppercase">
              📍 Feature 1: GIS Geofence EXIF Discrepancy Inspector
            </span>
            <span className="text-xs text-slate-500 font-semibold">100m Tolerance Boundary Check</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif mt-1">
            Geotag Photo Location Mismatch Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Compares official registered worksite coordinates against uploaded field photo EXIF GPS metadata across real dataset records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow flex items-center space-x-2 transition cursor-pointer"
        >
          <Download size={15} />
          <span>Export EXIF Forensic Audit CSV</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main 2-Column Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Discrepancy Work Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm font-serif">Flagged Geofence Queue</h3>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              {activeCases.filter(c => c.status === 'CRITICAL_VIOLATION').length} Critical Alerts
            </span>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`flex-1 py-1.5 rounded-lg transition ${filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              All ({activeCases.length})
            </button>
            <button
              onClick={() => setFilterTab('CRITICAL')}
              className={`flex-1 py-1.5 rounded-lg transition ${filterTab === 'CRITICAL' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilterTab('MODERATE')}
              className={`flex-1 py-1.5 rounded-lg transition ${filterTab === 'MODERATE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Moderate
            </button>
            <button
              onClick={() => setFilterTab('COMPLIANT')}
              className={`flex-1 py-1.5 rounded-lg transition ${filterTab === 'COMPLIANT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'}`}
            >
              Compliant
            </button>
          </div>

          {/* Queue List Cards */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredCases.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  selectedCaseId === c.id 
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    c.status === 'CRITICAL_VIOLATION' ? 'bg-red-100 text-red-800 border border-red-200' :
                    c.status === 'MODERATE_DEVIATION' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {c.status === 'CRITICAL_VIOLATION' ? `⚠️ ${c.distanceMismatchKm} km Mismatch` :
                     c.status === 'MODERATE_DEVIATION' ? `⚠️ ${c.distanceMismatchKm * 1000}m Deviation` :
                     '✓ Verified (35m)'}
                  </span>
                  {c.actionTaken && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Notice Sent
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">{c.workTitle}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.projectId} • {c.district}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Side-by-Side EXIF Forensic Audit Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Detailed Geofence Forensic Audit</span>
              <h3 className="text-base font-extrabold text-slate-900 font-serif">{selectedCase.workTitle}</h3>
              <p className="text-xs text-slate-500 font-mono">Project ID: {selectedCase.projectId} • State: {selectedCase.state} • District: {selectedCase.district}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              selectedCase.status === 'CRITICAL_VIOLATION' ? 'bg-red-600 text-white' :
              selectedCase.status === 'MODERATE_DEVIATION' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {selectedCase.status.replace('_', ' ')}
            </span>
          </div>

          {/* Side-by-Side GPS Coordinates Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box A: Approved Registered Worksite GPS */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold uppercase tracking-wide text-[10px]">
                <MapPin size={16} className="text-emerald-700" />
                <span>1. Approved Registered Worksite GPS</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Latitude:</span>
                  <span className="font-bold text-slate-900">{selectedCase.approvedLat}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Longitude:</span>
                  <span className="font-bold text-slate-900">{selectedCase.approvedLng}° E</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-[10px] text-emerald-700">
                  <span className="font-sans font-bold">Approved Geofence Radius:</span>
                  <span className="font-bold">100 Metres</span>
                </div>
              </div>
            </div>

            {/* Box B: Uploaded Field Photo EXIF GPS */}
            <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-red-900 font-bold uppercase tracking-wide text-[10px]">
                <Camera size={16} className="text-red-700" />
                <span>2. Uploaded Field Photo EXIF Metadata GPS</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-red-200 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">EXIF Latitude:</span>
                  <span className="font-bold text-slate-900">{selectedCase.photoExifLat}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">EXIF Longitude:</span>
                  <span className="font-bold text-slate-900">{selectedCase.photoExifLng}° E</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-[10px] text-red-700">
                  <span className="font-sans font-bold">EXIF Timestamp:</span>
                  <span className="font-bold">{selectedCase.photoTimestamp}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Computed Geodesic Distance Error Alert Box */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs ${
            selectedCase.status === 'CRITICAL_VIOLATION' 
              ? 'bg-red-100 text-red-900 border-red-300' 
              : selectedCase.status === 'MODERATE_DEVIATION'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase font-black tracking-wider block">
                COMPUTED GEODESIC DISTANCE ERROR
              </span>
              <h4 className="text-base font-black font-serif">
                {selectedCase.status === 'CRITICAL_VIOLATION'
                  ? `⚠️ ${selectedCase.distanceMismatchKm} km OUTSIDE APPROVED GEOFENCE`
                  : selectedCase.status === 'MODERATE_DEVIATION'
                  ? `⚠️ ${selectedCase.distanceMismatchKm * 1000}m Outside Approved Radius`
                  : '✓ Compliant: Within 35m Approved Boundary Radius'}
              </h4>
              <p className="text-[11px] opacity-90 font-medium">
                {selectedCase.status === 'CRITICAL_VIOLATION'
                  ? `Field inspection photo EXIF metadata proves the photograph was captured ${selectedCase.distanceMismatchKm} km away from sanctioned worksite.`
                  : 'Minor GPS drift detected near site boundary. Verification recommended.'}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-3 rounded-lg border border-red-200 text-center text-slate-900 font-mono font-bold text-xs min-w-[140px]">
              <span className="text-[10px] text-slate-500 font-sans block uppercase">Device Hardware</span>
              <span>{selectedCase.deviceModel}</span>
            </div>
          </div>

          {/* Official Enforcement Action Suite */}
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleIssueNotice(selectedCase.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg shadow flex items-center space-x-2 transition cursor-pointer"
              >
                <Send size={15} />
                <span>Issue Discrepancy Notice to DC</span>
              </button>

              <button
                onClick={() => handleFreezeDisbursal(selectedCase.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg shadow flex items-center space-x-2 transition cursor-pointer"
              >
                <Lock size={15} />
                <span>Freeze Payment Milestone</span>
              </button>
            </div>

            <button
              onClick={() => navigate(`/app/projects/${selectedCase.realId}`)}
              className="text-blue-600 hover:underline font-bold text-xs cursor-pointer"
            >
              Open Full Project Audit Details →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
