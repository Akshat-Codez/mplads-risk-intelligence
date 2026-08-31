import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StateEmblem } from '../components/common/StateEmblem';
import { UserCheck, KeyRound, Mail, User, Building, ArrowRight } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Senior Administrative Officer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [authorityId, setAuthorityId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('MINISTRY');
  const [house, setHouse] = useState('Lok Sabha');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Varanasi');
  const [department, setDepartment] = useState('Data Informatics & Innovation Division (DIID)');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    register(name, email, authorityId, selectedRole, state, district);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-8 md:p-10 space-y-6">
        
        {/* Emblem Header */}
        <div className="text-center space-y-2 border-b border-slate-200 pb-6">
          <StateEmblem size={56} className="mx-auto" />
          <div className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
            Government of India • Ministry of Statistics and Programme Implementation
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif">Detailed Authority Account Registration</h2>
          <p className="text-xs text-slate-500">Register official government credentials to access NIRMAN e-SAKSHI Monitoring Platform</p>
        </div>

        {/* Detailed Form */}
        <form onSubmit={handleRegister} className="space-y-5 text-xs">
          
          {/* Section 1: Personal & Government Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-900 border-b pb-1">
              1. Officer Personal & Designation Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Official Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Designation / Title *</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. District Magistrate / Nodal Officer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email (@gov.in / @nic.in) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.name@gov.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number (For SMS OTP) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Authority Role & Jurisdiction */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-900 border-b pb-1">
              2. Authority Role & Regional Jurisdiction
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Authority ID / Employee Code *</label>
                <input
                  type="text"
                  value={authorityId}
                  onChange={(e) => setAuthorityId(e.target.value)}
                  placeholder="e.g. GOV-MOSPI-UP-04"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Administrative Role *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold"
                >
                  <option value="MINISTER">👔 Hon'ble Minister (Executive Oversight)</option>
                  <option value="MINISTRY">🏛️ Ministry / MoSPI (National Operations)</option>
                  <option value="STATE">🏢 State Nodal Authority (State Review)</option>
                  <option value="DISTRICT">📍 District Collector / DC (Field Audits)</option>
                </select>
              </div>
            </div>

            {selectedRole === 'MINISTER' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parliamentary House</label>
                <select
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="Lok Sabha">Lok Sabha (Lower House)</option>
                  <option value="Rajya Sabha">Rajya Sabha (Upper House)</option>
                </select>
              </div>
            )}

            {(selectedRole === 'STATE' || selectedRole === 'DISTRICT') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State Jurisdiction *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                    required
                  />
                </div>
                {selectedRole === 'DISTRICT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District Jurisdiction *</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Password & Security */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-900 border-b pb-1">
              3. Security Credentials & Password
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition text-sm flex items-center justify-center space-x-2"
          >
            <span>Register Authority Account</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Already registered? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in to your account</Link>
        </div>
      </div>
    </div>
  );
};
