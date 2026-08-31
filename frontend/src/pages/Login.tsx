import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { StateEmblem } from '../components/common/StateEmblem';
import { UserCheck, KeyRound } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'MINISTRY';

  const [username, setUsername] = useState('GOV-MOSPI-001');
  const [password, setPassword] = useState('••••••••••••');
  const [captchaInput, setCaptchaInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = (targetRole: Role) => {
    switch (targetRole) {
      case 'MINISTER': return '/app/minister';
      case 'STATE': return '/app/state';
      case 'DISTRICT': return '/app/district';
      case 'MINISTRY': default: return '/app/ministry';
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, selectedRole);
    navigate(getDashboardPath(selectedRole));
  };

  const handleDemoMode = (demoRole: Role) => {
    login(`DEMO-${demoRole}-2026`, demoRole);
    navigate(getDashboardPath(demoRole));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Official Parliament Image Banner */}
        <div className="relative bg-slate-900 text-white flex flex-col justify-between p-8 overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

          {/* Top Left Tag */}
          <div className="relative z-10">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              🇮🇳 Official Government Portal
            </span>
          </div>

          {/* Bottom Left Title */}
          <div className="relative z-10 space-y-2">
            <h1 className="text-4xl font-black font-serif text-white tracking-tight">eSAKSHI</h1>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              SANsad sadasya sthaniya KSHetra vikas yojana <br />
              <span className="text-amber-400 font-semibold">(MPLADS Infrastructure Reporting & Analytics)</span>
            </p>
          </div>
        </div>

        {/* Right Side: Official Login Form */}
        <div className="p-8 md:p-10 flex flex-col justify-between space-y-6">
          
          {/* Official Emblem & Header */}
          <div className="text-center space-y-2">
            <StateEmblem size={64} className="mx-auto" darkBg={false} />
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-snug">
              Government of India <br />
              <span className="text-blue-900">Ministry of Statistics and Programme Implementation</span> <br />
              <span className="text-slate-600 font-medium">Members of Parliament Local Area Development Scheme</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-serif pt-2 border-t border-slate-200">Log In</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Authority Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="MINISTER">👔 1. Hon'ble Minister (Executive View)</option>
                <option value="MINISTRY">🏛️ 2. Ministry MoSPI (National Operations)</option>
                <option value="STATE">🏢 3. State Nodal Authority (State Review)</option>
                <option value="DISTRICT">📍 4. District Collector DC (Field Audits)</option>
              </select>
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username / Authority ID"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
                <UserCheck className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            <div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
                <KeyRound className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
              <div className="text-right mt-1">
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to official registered @gov.in email inbox.'); }} className="text-[11px] text-blue-600 hover:underline font-semibold">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Captcha Security Box */}
            <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border border-slate-300">
              <div className="bg-slate-800 text-amber-300 font-mono text-sm px-3 py-1.5 rounded font-extrabold tracking-widest select-none">
                kg2ry
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Captcha"
                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition text-sm cursor-pointer"
            >
              Login
            </button>

            <p className="text-[10px] text-red-500 text-center font-medium">
              If the OTP is not received via SMS, please check your registered email inbox for the OTP.
            </p>
          </form>

          {/* Quick Demo Logins for Hackathon */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Hackathon Quick Demo Logins:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => handleDemoMode('MINISTER')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded border border-amber-200">
                👔 Minister View
              </button>
              <button onClick={() => handleDemoMode('MINISTRY')} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded border border-blue-200">
                🏛️ Ministry MoSPI
              </button>
              <button onClick={() => handleDemoMode('STATE')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded border border-emerald-200">
                🏢 State Nodal
              </button>
              <button onClick={() => handleDemoMode('DISTRICT')} className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded border border-purple-200">
                📍 District DC
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            Copyright © 2026 Ministry of Statistics and Programme Implementation. All Rights Reserved.
          </div>
        </div>

      </div>
    </div>
  );
};
