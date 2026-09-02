import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StateEmblem } from './StateEmblem';
import { MoSPILogo } from './MoSPILogo';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 font-sans w-full max-w-full">
      {/* Top National Govt Header Strip */}
      <div className="bg-[#0A1E34] text-white px-4 sm:px-8 py-1.5 flex flex-wrap justify-between items-center text-[10px] sm:text-[11px] tracking-wide font-medium">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-100">GOVERNMENT OF INDIA</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION (MoSPI)</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span>e-SAKSHI Decision Intelligence Gateway</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-semibold">SIH 2026</span>
        </div>
      </div>

      {/* Main Branding & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Left Side: Dual Emblems (Ashoka + MoSPI) + Text Title */}
        <Link to="/" className="flex items-center space-x-3 shrink-0 group">
          <StateEmblem size={44} darkBg={false} />
          <MoSPILogo size={38} />
          <div className="border-l border-slate-300 pl-3">
            <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight tracking-tight">
              National Infra Reporting &amp; <br className="hidden sm:inline" />
              Monitoring Analytics Network (NIRMAN)
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
              MPLADS Risk Intelligence System
            </p>
          </div>
        </Link>

        {/* Right Side: Navigation Links */}
        <nav className="flex items-center space-x-2 sm:space-x-4 text-xs font-bold text-slate-700 tracking-wide">
          <Link
            to="/"
            className={`px-2.5 py-1.5 transition ${
              isActive('/')
                ? 'text-[#E65100] border-b-2 border-[#E65100]'
                : 'hover:text-[#E65100]'
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`px-2.5 py-1.5 transition ${
              isActive('/about')
                ? 'text-[#E65100] border-b-2 border-[#E65100]'
                : 'hover:text-[#E65100]'
            }`}
          >
            About NIRMAN
          </Link>
          <Link
            to="/guidelines"
            className={`px-2.5 py-1.5 transition ${
              isActive('/guidelines')
                ? 'text-[#E65100] border-b-2 border-[#E65100]'
                : 'hover:text-[#E65100]'
            }`}
          >
            Guidelines
          </Link>
          <Link
            to="/help"
            className={`px-2.5 py-1.5 transition ${
              isActive('/help')
                ? 'text-[#E65100] border-b-2 border-[#E65100]'
                : 'hover:text-[#E65100]'
            }`}
          >
            Help
          </Link>
          <Link
            to="/contact"
            className={`px-2.5 py-1.5 transition ${
              isActive('/contact')
                ? 'text-[#E65100] border-b-2 border-[#E65100]'
                : 'hover:text-[#E65100]'
            }`}
          >
            Contact
          </Link>
        </nav>

      </div>
    </header>
  );
};
