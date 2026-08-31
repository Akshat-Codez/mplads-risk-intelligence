import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GISMap } from '../components/gis/GISMap';
import { computeStateGISMetrics, computeDistrictGISMetrics } from '../services/gisService';
import { MOCK_PROJECTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { ShieldAlert, Filter, Download, ArrowRight, RotateCcw, MapPin, Building2 } from '../components/common/Icons';

export const GISAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const defaultViewMode = (role === 'STATE' || role === 'DISTRICT') ? 'STATE' : 'NATIONAL';
  const defaultState = (role === 'STATE' || role === 'DISTRICT') ? (user?.state || 'Karnataka') : 'ALL';
  const defaultDistrict = role === 'DISTRICT' ? (user?.district || 'BENGALURU URBAN') : 'ALL';

  const [viewMode, setViewMode] = useState<'NATIONAL' | 'STATE'>(defaultViewMode);
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pinModeEnabled, setPinModeEnabled] = useState(false);

  const stateMetrics = useMemo(() => computeStateGISMetrics(MOCK_PROJECTS), []);
  const districtMetrics = useMemo(() => computeDistrictGISMetrics(MOCK_PROJECTS, selectedState), [selectedState]);

  const activeStateMetric = useMemo(() => {
    if (selectedState === 'ALL') return null;
    return stateMetrics.find(s => s.state.toUpperCase().includes(selectedState.toUpperCase()));
  }, [stateMetrics, selectedState]);

  const handleSelectState = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('ALL');
    setViewMode('STATE');
  };

  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    navigate(`/app/projects/${project.id}`);
  };

  return (
    <div className="p-6 space-y-6 font-sans bg-slate-100/70 min-h-screen">
      
      {/* Uber-Style Clean Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              🇮🇳 Uber-Style GIS Spatial Engine
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight pt-1">
            GIS Corruption & Anomaly Heatmap
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Clean, high-contrast spatial risk intelligence across Indian States & Districts.
          </p>
        </div>

        {/* View Mode Pill Toggle & Add Pin Mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-extrabold shadow-inner">
            <button
              onClick={() => { setViewMode('NATIONAL'); setSelectedState('ALL'); setSelectedDistrict('ALL'); }}
              disabled={role === 'STATE' || role === 'DISTRICT'}
              className={`px-5 py-2.5 rounded-xl transition cursor-pointer ${
                viewMode === 'NATIONAL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇳 All India Map
            </button>
            <button
              onClick={() => { setViewMode('STATE'); if (selectedState === 'ALL') setSelectedState('Karnataka'); }}
              className={`px-5 py-2.5 rounded-xl transition cursor-pointer ${
                viewMode === 'STATE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 State & District Map
            </button>
          </div>

          <button
            onClick={() => setPinModeEnabled(!pinModeEnabled)}
            className={`px-4 py-2.5 rounded-2xl transition cursor-pointer font-extrabold text-xs flex items-center space-x-2 shadow-sm ${
              pinModeEnabled ? 'bg-purple-700 text-white ring-2 ring-purple-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>📍 Add Pin Mode</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pinModeEnabled ? 'bg-white text-purple-900' : 'bg-slate-200 text-slate-800'}`}>
              {pinModeEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Uber-Style Floating Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center space-x-2 text-slate-900 uppercase tracking-wider text-[11px]">
          <Filter size={16} className="text-blue-600" />
          <span>Interactive Map Controls:</span>
        </div>

        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-slate-600">State / UT:</label>
            <select
              value={selectedState}
              disabled={role === 'STATE' || role === 'DISTRICT'}
              onChange={(e) => handleSelectState(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 disabled:bg-slate-200/60"
            >
              <option value="ALL">🇮🇳 All India (28 States)</option>
              {stateMetrics.map(st => (
                <option key={st.state} value={st.state}>{st.state} ({st.riskCategory} RISK)</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-slate-600">District Focus:</label>
            <select
              value={selectedDistrict}
              disabled={role === 'DISTRICT'}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 disabled:bg-slate-200/60"
            >
              <option value="ALL">All Districts</option>
              {districtMetrics.map(dst => (
                <option key={dst.district} value={dst.district}>{dst.district}</option>
              ))}
            </select>
          </div>

          {(selectedState !== 'ALL' || selectedDistrict !== 'ALL') && (
            <button
              onClick={() => { setSelectedState('ALL'); setSelectedDistrict('ALL'); setViewMode('NATIONAL'); }}
              className="text-slate-500 hover:text-slate-900 flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <GISMap
        viewMode={viewMode}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        stateMetrics={stateMetrics}
        districtMetrics={districtMetrics}
        projects={MOCK_PROJECTS}
        pinModeEnabled={pinModeEnabled}
        onSelectState={handleSelectState}
        onSelectDistrict={handleSelectDistrict}
        onSelectProject={handleSelectProject}
      />

      {/* Uber-Style Metric Drawer & High Risk Works List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Jurisdiction Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-base font-serif">Jurisdiction Risk Summary</h3>
            <span className="text-[10px] font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold">
              {viewMode === 'NATIONAL' ? 'ALL INDIA' : selectedState}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <span className="font-extrabold text-slate-700">Shading Risk Category:</span>
              <span 
                className="px-3 py-1 rounded-full font-black text-white text-[11px] shadow-sm"
                style={{ backgroundColor: activeStateMetric?.color || '#EF4444' }}
              >
                {activeStateMetric?.riskCategory || 'HIGH'} RISK ({activeStateMetric?.avgRiskScore || 65}/100)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold text-[10px] uppercase block">Tracked Works</span>
                <span className="text-2xl font-black text-slate-900">{activeStateMetric?.totalWorks || MOCK_PROJECTS.length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold text-[10px] uppercase block">High Risk Flagged</span>
                <span className="text-2xl font-black text-red-600">{activeStateMetric?.highRiskCount || 6} Works</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Risk Works Queue */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-base font-serif">High Risk Spatial Works Queue</h3>
            <button onClick={() => navigate('/app/projects')} className="text-xs font-bold text-blue-600 hover:underline">
              Open Full Projects Explorer →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 text-xs font-medium">
            {MOCK_PROJECTS.filter(p => p.riskScore >= 60).map(p => (
              <div 
                key={p.id} 
                onClick={() => handleSelectProject(p)}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex justify-between items-center transition cursor-pointer"
              >
                <div className="space-y-0.5 max-w-md">
                  <h4 className="font-extrabold text-slate-900">{p.workTitle}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">{p.state} • {p.district} • Vendor: {p.vendorName}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-red-600 text-sm block">{p.riskScore}/100</span>
                  <span className="text-[10px] text-slate-900 font-extrabold hover:underline">Inspect →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
