import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  Building2, 
  FileText, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowLeft,
  BriefcasePlus,
  ExternalLink
} from '../components/common/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { MOCK_PROJECTS } from '../data/mockData';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCaseModal, setShowCaseModal] = useState(false);

  const project = MOCK_PROJECTS.find(p => p.id === id) || MOCK_PROJECTS[0];

  const peerChartData = [
    { name: 'Comparable Median', cost: project.peerMedianAmount / 100000 },
    { name: 'This Project (#MPL-2026)', cost: project.actualExpenditure / 100000 }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate('/projects')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects Explorer</span>
        </button>

        <button
          onClick={() => setShowCaseModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-2 transition"
        >
          <BriefcasePlus size={16} />
          <span>Create Investigation Case</span>
        </button>
      </div>

      {/* Main Project Title Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-red-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-0.5 rounded-full font-bold">
                Risk Score: {project.riskScore}/100 ({project.riskLevel})
              </span>
              <span className="text-xs text-slate-400 font-mono">{project.projectId}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{project.workTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Hon'ble MP:</strong> {project.mpName} | <strong>District:</strong> {project.district}, {project.state}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center min-w-[160px]">
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">AI Risk Index</span>
            <h2 className="text-3xl font-extrabold text-red-600 mt-0.5">{project.riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span></h2>
            <span className="text-[11px] font-bold text-red-700">Requires Audit</span>
          </div>
        </div>

        {/* Project Attribute Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-slate-400 font-medium">Category</span>
            <p className="font-semibold text-slate-800">{project.category}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Implementing Agency</span>
            <p className="font-semibold text-slate-800">{project.implementingAgency}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Vendor Contractor</span>
            <p className="font-semibold text-slate-800">{project.vendorName}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Sanctioned Amount</span>
            <p className="font-semibold text-slate-800">₹{(project.sanctionedAmount / 100000).toFixed(1)} Lakhs</p>
          </div>
        </div>
      </div>

      {/* Horizontal Lifecycle Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Execution Lifecycle</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="font-bold text-emerald-700">1. Recommended</p>
            <p className="text-[10px] text-slate-500 mt-1">{project.recommendationDate}</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="font-bold text-emerald-700">2. Sanctioned</p>
            <p className="text-[10px] text-slate-500 mt-1">{project.sanctionDate}</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-bold text-blue-700">3. Work Started</p>
            <p className="text-[10px] text-slate-500 mt-1">In Progress</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-bold text-amber-700">4. AI Flagged</p>
            <p className="text-[10px] text-slate-500 mt-1">Risk Score 91/100</p>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-bold text-red-700">5. Case Created</p>
            <p className="text-[10px] text-slate-500 mt-1">Under Audit</p>
          </div>
        </div>
      </div>

      {/* AI Anomaly Explanation Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Why was this project flagged by AI?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.anomalies.map((a) => (
            <div key={a.id} className="bg-white p-5 rounded-xl border-l-4 border-l-red-600 border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px]">
                  +{a.scoreContribution}% Weight
                </span>
              </div>
              <p className="text-slate-600">{a.explanation}</p>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-slate-800 text-[11px]">
                <strong>Metric:</strong> {a.supportingMetric}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peer Comparison Bar Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Peer Category Benchmark Comparison</h3>
          <p className="text-xs text-slate-500">Comparison against median expenditure of similar community infrastructure works</p>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peerChartData} layout="vertical">
              <XAxis type="number" stroke="#94a3b8" fontSize={11} unit=" L" />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={180} />
              <Tooltip />
              <Bar dataKey="cost" fill="#EF4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-xs text-red-700 font-semibold">
          ⚠ Unit expenditure of ₹42.0 Lakhs is 42% higher than comparable peer median (₹25.8 Lakhs).
        </div>
      </div>

      {/* Visual & Geo Location Evidence */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Visual & GeoTag Integrity Audit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Uploaded Baseline Photo</span>
            <img src={project.beforePhotoUrl} alt="Before" className="rounded-lg h-44 w-full object-cover border border-slate-300" />
            <span className="text-[10px] text-slate-400 block">[DEMO IMAGE - Site Photo #1]</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Uploaded Progress Photo</span>
            <img src={project.afterPhotoUrl} alt="After" className="rounded-lg h-44 w-full object-cover border border-slate-300" />
            <span className="text-[10px] text-slate-400 block">[DEMO IMAGE - Site Photo #2]</span>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs space-y-1">
          <p className="font-bold text-red-700">⚠ Location Mismatch Alert:</p>
          <p className="text-red-600">
            Target Site GPS: ({project.regLatitude}, {project.regLongitude}) vs Photo EXIF GPS: ({project.photoLatitude}, {project.photoLongitude}). Distance gap: <strong>{project.gpsDistanceMeters} meters (8.4 km away)</strong>.
          </p>
        </div>
      </div>

      {/* Modal: Create Investigation */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Investigation Case</h3>
              <button onClick={() => setShowCaseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Case Priority</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold">
                  <option value="CRITICAL">Critical (Immediate Freeze Order)</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Authority</label>
                <input type="text" value="District Authority (Varanasi)" readOnly className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-semibold text-slate-700" />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Investigation Notes</label>
                <textarea rows={3} placeholder="Add notes for field verification team..." className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowCaseModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
              <button 
                onClick={() => {
                  setShowCaseModal(false);
                  alert('Case #CASE-MPL-2026-00481 created successfully! Notification sent to District Authority.');
                  navigate('/investigations');
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow"
              >
                Confirm Case Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
