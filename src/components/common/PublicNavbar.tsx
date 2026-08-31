import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StateEmblem } from './StateEmblem';
import { UserCheck, ArrowRight, ChevronDown } from './Icons';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  return (
    <header className="bg-white border-b-4 border-b-[#E65100] shadow-sm sticky top-0 z-50 font-sans">
      {/* Top National Govt Header Strip */}
      <div className="bg-[#0A2540] text-white px-6 py-1.5 flex flex-wrap justify-between items-center text-[11px] tracking-wide">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-amber-400">🇮🇳 GOVERNMENT OF INDIA</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-200 font-medium">MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION (MoSPI)</span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] font-medium text-slate-300">
          <a href="#about-mplads" className="hover:text-white transition">About MPLADS</a>
          <a href="#guidelines" className="hover:text-white transition">Scheme Guidelines</a>
          <a href="#about-us" className="hover:text-white transition">About Us</a>
          <a href="#contact" className="hover:text-white transition">Help & Contact</a>
        </div>
      </div>

      {/* Main Branding & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center gap-6">
        {/* Brand Logo with State Emblem */}
        <Link to="/" className="flex items-center space-x-3 shrink-0">
          <StateEmblem size={46} />
          <div className="border-l-2 border-slate-200 pl-3">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-[#0A2540] font-serif">NIRMAN</h1>
              <span className="bg-[#E65100]/10 text-[#E65100] border border-[#E65100]/30 text-[10px] font-extrabold px-2 py-0.5 rounded">
                MoSPI OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-[10px] text-slate-600 font-bold tracking-wide uppercase mt-0.5">
              National Infra Reporting & Monitoring Analytics Network
            </p>
          </div>
        </Link>

        {/* Center Nav Links with PERFECT EQUAL COMPACT SPACING */}
        <nav className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider">
          <Link to="/" className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-[#E65100] text-[#0A2540] whitespace-nowrap transition">
            HOME
          </Link>
          <a href="#about-mplads" className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-[#E65100] whitespace-nowrap transition">
            ABOUT MPLADS
          </a>
          <a href="#guidelines" className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-[#E65100] whitespace-nowrap transition">
            GUIDELINES
          </a>
          <a href="#about-us" className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-[#E65100] whitespace-nowrap transition">
            ABOUT US
          </a>
          <a href="#contact" className="px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-[#E65100] whitespace-nowrap transition">
            HELP & CONTACT
          </a>
        </nav>

        {/* Action Buttons Container */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Sign In Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="bg-[#0A2540] hover:bg-[#002B49] text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <UserCheck size={16} />
              <span>SIGN IN (4 ROLES)</span>
              <ChevronDown size={14} />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-xs font-semibold space-y-1">
                <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase border-b">
                  Select Authority Role Sign In
                </div>
                <button onClick={() => { setShowRoleDropdown(false); navigate('/login?role=MINISTER'); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded flex items-center justify-between text-slate-800">
                  <span>👔 Hon'ble Minister</span>
                  <ArrowRight size={14} className="text-amber-600" />
                </button>
                <button onClick={() => { setShowRoleDropdown(false); navigate('/login?role=MINISTRY'); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center justify-between text-slate-800">
                  <span>🏛️ Ministry (MoSPI) Ops</span>
                  <ArrowRight size={14} className="text-blue-600" />
                </button>
                <button onClick={() => { setShowRoleDropdown(false); navigate('/login?role=STATE'); }} className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded flex items-center justify-between text-slate-800">
                  <span>🏢 State Nodal Authority</span>
                  <ArrowRight size={14} className="text-emerald-600" />
                </button>
                <button onClick={() => { setShowRoleDropdown(false); navigate('/login?role=DISTRICT'); }} className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded flex items-center justify-between text-slate-800">
                  <span>📍 District Collector (DC)</span>
                  <ArrowRight size={14} className="text-purple-600" />
                </button>
              </div>
            )}
          </div>

          <Link
            to="/register"
            className="bg-[#E65100] hover:bg-[#c64500] text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow transition whitespace-nowrap"
          >
            REGISTER AUTHORITY
          </Link>
        </div>
      </div>
    </header>
  );
};
