import React from 'react';
import { Database, Upload, CheckCircle2, AlertCircle } from '../components/common/Icons';

export const DataIngestion: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Data Sources & e-SAKSHI Scraper</h1>
        <p className="text-xs text-slate-500">Monitor e-SAKSHI live data feeds, upload raw CSV datasets, and inspect data quality scores</p>
      </div>

      {/* Data Quality Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Completeness Score</p>
          <h3 className="text-2xl font-extrabold mt-1 text-emerald-600">97.4%</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Duplicate Records</p>
          <h3 className="text-2xl font-extrabold mt-1 text-slate-900">1.2%</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Invalid Values</p>
          <h3 className="text-2xl font-extrabold mt-1 text-slate-900">0.4%</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Pipeline Status</p>
          <h3 className="text-2xl font-extrabold mt-1 text-blue-600">Connected</h3>
        </div>
      </div>

      {/* CSV Upload Area */}
      <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 text-center space-y-3">
        <Upload className="mx-auto text-blue-600" size={32} />
        <h3 className="font-bold text-slate-900 text-sm">Upload Raw e-SAKSHI CSV / XLSX File</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Drag and drop your raw e-SAKSHI dataset export here to normalize fields and run through the AI anomaly detection pipeline.
        </p>
        <button 
          onClick={() => alert('Simulating original e-SAKSHI CSV dataset import and cleaning...')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition"
        >
          Select CSV File
        </button>
      </div>
    </div>
  );
};
