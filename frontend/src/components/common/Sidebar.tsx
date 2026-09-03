import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FolderKanban, 
  Building2, 
  Briefcase, 
  PieChart, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  MapPin 
} from './Icons';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  MINISTER: [
    { label: 'Executive Portfolio', path: '/app/minister', icon: BarChart3 },
    { label: 'GIS Project Risk Map', path: '/app/gis-analytics', icon: MapPin },
    { label: 'Portfolio Projects', path: '/app/projects', icon: FolderKanban },
    { label: 'Portfolio Analytics', path: '/app/analytics', icon: PieChart }
  ],
  MINISTRY: [
    { label: 'National Overview', path: '/app/ministry', icon: BarChart3 },
    { label: 'Projects Explorer', path: '/app/projects', icon: FolderKanban },
    { label: 'GIS Project Risk Map', path: '/app/gis-analytics', icon: MapPin },
    { label: 'Vendors & Cartels', path: '/app/vendors', icon: Building2 },
    { label: 'Investigations & Audits', path: '/app/investigations', icon: Briefcase },
    { label: 'Analytics & Reports', path: '/app/analytics', icon: PieChart },
    { label: 'Audit Trail', path: '/app/audit-trail', icon: History }
  ],
  STATE: [
    { label: 'State Overview', path: '/app/state', icon: BarChart3 },
    { label: 'GIS Project Risk Map', path: '/app/gis-analytics', icon: MapPin },
    { label: 'District Projects', path: '/app/projects', icon: FolderKanban },
    { label: 'Vendor Concentration', path: '/app/vendors', icon: Building2 },
    { label: 'Escalated Cases', path: '/app/investigations', icon: Briefcase },
    { label: 'State Analytics', path: '/app/analytics', icon: PieChart },
    { label: 'Audit Trail', path: '/app/audit-trail', icon: History }
  ],
  DISTRICT: [
    { label: 'District Action Hub', path: '/app/district', icon: BarChart3 },
    { label: 'GIS Project Risk Map', path: '/app/gis-analytics', icon: MapPin },
    { label: 'Local Works Queue', path: '/app/projects', icon: FolderKanban },
    { label: 'Field Audits & Inspections', path: '/app/investigations', icon: Briefcase }
  ]
};

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  const location = useLocation();

  const currentNavItems = NAV_BY_ROLE[role] || NAV_BY_ROLE['MINISTRY'];

  // Robust active check ensuring National Overview is immediately highlighted upon login
  const isItemActive = (itemPath: string) => {
    // 1. Direct path match
    if (location.pathname === itemPath) return true;
    
    // 2. Default landing path matching when on /app or /app/
    if (location.pathname === '/app' || location.pathname === '/app/') {
      if (role === 'MINISTRY' && itemPath === '/app/ministry') return true;
      if (role === 'MINISTER' && itemPath === '/app/minister') return true;
      if (role === 'STATE' && itemPath === '/app/state') return true;
      if (role === 'DISTRICT' && itemPath === '/app/district') return true;
    }

    // 3. Sub-route matching (e.g. /app/projects/123 -> /app/projects)
    if (itemPath !== '/app/ministry' && itemPath !== '/app/minister' && itemPath !== '/app/state' && itemPath !== '/app/district') {
      if (location.pathname.startsWith(itemPath)) return true;
    }

    return false;
  };

  return (
    <aside 
      className={`bg-[#0A2540] text-slate-300 flex flex-col justify-between transition-all duration-300 h-screen sticky top-0 z-40 border-r border-slate-800 shrink-0 overflow-y-auto ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow">
                N
              </div>
              <div>
                <h1 className="font-extrabold text-white text-base tracking-wide font-serif">NIRMAN</h1>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  {role === 'MINISTER' ? 'Minister Portfolio' :
                   role === 'STATE' ? 'State Authority' :
                   role === 'DISTRICT' ? 'District Collector' : 'Ministry MoSPI'}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base mx-auto">
              N
            </div>
          )}

          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  active 
                    ? 'bg-[#E65100] text-white shadow-md font-bold' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer */}
      {!collapsed && (
        <div className="p-4 text-[10px] text-slate-500 border-t border-slate-800/60 text-center font-mono">
          MoSPI Official Portal • v2.4
        </div>
      )}
    </aside>
  );
};
