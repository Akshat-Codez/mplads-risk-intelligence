import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { StateEmblem } from '../components/common/StateEmblem';
import { UserCheck, KeyRound } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { MOCK_PROJECTS } from '../data/mockData';
import api from '../services/api';

function extractLocations(projects: any[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const p of projects) {
    if (!p.state) continue;
    const st = p.state.trim();
    if (!st || st === 'UNKNOWN') continue;
    if (!map[st]) map[st] = [];
    if (p.district) {
      const dt = p.district.trim();
      if (dt && dt !== 'UNKNOWN' && !map[st].includes(dt)) {
        map[st].push(dt);
      }
    }
  }
  for (const st of Object.keys(map)) {
    map[st].sort();
  }
  return map;
}

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'MINISTRY';

  const defaultLocations = extractLocations(MOCK_PROJECTS);
  const defaultStates = Object.keys(defaultLocations).sort();

  const [username, setUsername] = useState('GOV-MOSPI-001');
  const [password, setPassword] = useState('••••••••••••');
  const [captchaInput, setCaptchaInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [locations, setLocations] = useState<Record<string, string[]>>(defaultLocations);
  const [selectedState, setSelectedState] = useState(defaultStates[0] || 'Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState(defaultLocations[defaultStates[0]]?.[0] || '');
  
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Fetch dynamic locations from authoritative backend API
    api.get('/auth/locations')
      .then(res => {
        const data = res.data;
        if (data.stateDistricts && Object.keys(data.stateDistricts).length > 0) {
          const locs: Record<string, string[]> = data.stateDistricts;
          setLocations(locs);
          const states = Object.keys(locs).sort();
          if (states.length > 0) {
            setSelectedState(prev => (locs[prev] ? prev : states[0]));
            setSelectedDistrict(prev => {
              const curDistricts = locs[selectedState] || locs[states[0]] || [];
              return curDistricts.includes(prev) ? prev : (curDistricts[0] || '');
            });
          }
        }
      })
      .catch(err => {
        console.warn('Could not load locations from API:', err);
      });
  }, []);

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const districts = locations[st] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    } else {
      setSelectedDistrict('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(
        username,
        selectedRole,
        selectedRole === 'MINISTRY' || selectedRole === 'MINISTER' ? 'All India' : (selectedState || 'All India'),
        selectedRole === 'DISTRICT' ? (selectedDistrict || 'All Districts') : 'All Districts'
      );
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleDemoMode = async (demoRole: Role, demoState?: string, demoDistrict?: string) => {
    setError(null);
    const effectiveState = demoState || selectedState || 'Uttar Pradesh';
    const distList = locations[effectiveState] || [];
    const effectiveDistrict = demoDistrict || selectedDistrict || distList[0] || 'Varanasi';

    try {
      await login(
        `DEMO-${demoRole}-2026`,
        demoRole,
        demoRole === 'MINISTRY' || demoRole === 'MINISTER' ? 'All India' : effectiveState,
        demoRole === 'DISTRICT' ? effectiveDistrict : 'All Districts'
      );
      navigate('/app');
    } catch (err: any) {
      setError('Demo login failed. Make sure server is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Official Parliament / Leadership Image Banner */}
        <div className="relative bg-slate-950 text-white flex flex-col justify-between p-8 overflow-hidden min-h-[500px]">
          {/* Full Space Portrait Image */}
          <img
            src="https://tse4.mm.bing.net/th/id/OIP.evmb_tz_sypCxmQYEqEZCAAAAA?r=0&w=400&h=400&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="Official Government Portal"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          {/* Subtle gradient overlay to ensure top badge and bottom typography remain crisp */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/70" />

          {/* Top Left Tag */}
          <div className="relative z-10">
            <span className="bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              🇮🇳 Official Government Portal
            </span>
          </div>

          {/* Bottom Left Title */}
          <div className="relative z-10 space-y-2 pt-32">
            <h1 className="text-4xl font-black font-serif text-white tracking-tight drop-shadow-md">eSAKSHI</h1>
            <p className="text-xs text-slate-200 font-medium leading-relaxed drop-shadow">
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

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-xs px-3 py-2 rounded-lg font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Authority Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="MINISTER">👔 1. Hon'ble Minister (Executive National View)</option>
                <option value="MINISTRY">🏛️ 2. Ministry MoSPI (National Operations)</option>
                <option value="STATE">🏢 3. State Nodal Authority (State Review)</option>
                <option value="DISTRICT">📍 4. District Collector DC (District Field Audits)</option>
              </select>
            </div>

            {/* Dynamic State Selection for State & District Authority */}
            {(selectedRole === 'STATE' || selectedRole === 'DISTRICT') && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Authorized State <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-600"
                >
                  {Object.keys(locations).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic District Selection for District Authority */}
            {selectedRole === 'DISTRICT' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Authorized District ({selectedState}) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-purple-50 border border-purple-300 text-purple-950 font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-purple-600"
                >
                  {(locations[selectedState] || []).map(dt => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>
            )}

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
              Login as {selectedRole === 'DISTRICT' ? `${selectedDistrict} DC` : selectedRole === 'STATE' ? `${selectedState} Nodal` : 'National Authority'}
            </button>

            <p className="text-[10px] text-red-500 text-center font-medium">
              If the OTP is not received via SMS, please check your registered email inbox for the OTP.
            </p>
          </form>

          {/* Quick Demo Logins for Hackathon */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Hackathon Quick Demo Logins:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => handleDemoMode('MINISTRY')} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded border border-blue-200">
                🏛️ MoSPI National (All India)
              </button>
              <button onClick={() => handleDemoMode('STATE', 'Karnataka')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded border border-emerald-200">
                🏢 State Nodal (Karnataka)
              </button>
              <button onClick={() => handleDemoMode('DISTRICT', 'Bihar', 'PURBI CHAMPARAN')} className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded border border-purple-200">
                📍 DC Purbi Champaran
              </button>
              <button onClick={() => handleDemoMode('STATE', 'Uttar Pradesh')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded border border-amber-200">
                🏢 State Nodal (Uttar Pradesh)
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
