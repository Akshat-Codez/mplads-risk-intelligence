import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  FolderKanban, 
  ShieldAlert, 
  Building2, 
  Briefcase, 
  Bell, 
  PieChart, 
  History, 
  Database,
  ChevronLeft,
  ChevronRight
} from './Icons';
import { StateEmblem } from './StateEmblem';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  MINISTER: [
    { label: 'Executive Overview', path: '/app/minister', icon: BarChart3 },
    { label: 'MP Projects Explorer', path: '/app/projects', icon: FolderKanban },
    { label: 'National Analytics', path: '/app/analytics', icon: PieChart }
  ],
  MINISTRY: [
    { label: 'National Overview', path: '/app/ministry', icon: BarChart3 },
    { label: 'Projects Explorer', path: '/app/projects', icon: FolderKanban },
    { label: 'Risk Intelligence', path: '/app/risk-intelligence', icon: ShieldAlert },
    { label: 'Vendors & Cartels', path: '/app/vendors', icon: Building2 },
    { label: 'Investigations', path: '/app/investigations', icon: Briefcase },
    { label: 'Notifications', path: '/app/notifications', icon: Bell },
    { label: 'Analytics', path: '/app/analytics', icon: PieChart },
    { label: 'Audit Trail', path: '/app/audit-trail', icon: History },
    { label: 'Data Ingestion & Quality', path: '/app/data-ingestion', icon: Database }
  ],
  STATE: [
    { label: 'State Overview', path: '/app/state', icon: BarChart3 },
    { label: 'District Projects', path: '/app/projects', icon: FolderKanban },
    { label: 'Escalated Cases', path: '/app/investigations', icon: Briefcase },
    { label: 'Vendor Cartels', path: '/app/vendors', icon: Building2 },
    { label: 'State Analytics', path: '/app/analytics', icon: PieChart },
    { label: 'Audit Trail', path: '/app/audit-trail', icon: History }
  ],
  DISTRICT: [
    { label: 'District Action Hub', path: '/app/district', icon: BarChart3 },
    { label: 'Local Works Queue', path: '/app/projects', icon: FolderKanban },
    { label: 'Field Audits', path: '/app/investigations', icon: Briefcase },
    { label: 'Notifications', path: '/app/notifications', icon: Bell }
  ]
};

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

  const currentNavItems = NAV_BY_ROLE[role] || NAV_BY_ROLE['MINISTRY'];

  return (
    <aside 
      className={`bg-[#0A2540] text-slate-300 flex flex-col justify-between transition-all duration-300 min-h-screen sticky top-0 z-40 border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <StateEmblem size={36} darkBg={true} />
              <div>
                <h1 className="font-extrabold text-white text-base tracking-wide font-serif">NIRMAN</h1>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  {role === 'MINISTER' ? 'Minister View' :
                   role === 'STATE' ? 'State Authority' :
                   role === 'DISTRICT' ? 'District Collector' : 'Ministry MoSPI'}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <StateEmblem size={32} darkBg={true} className="mx-auto" />
          )}

          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items (Role-Filtered) */}
        <nav className="p-3 space-y-1">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-[#E65100] text-white shadow-md font-bold' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer (Clean Brand Tag) */}
      {!collapsed && (
        <div className="p-4 text-[10px] text-slate-500 border-t border-slate-800/60 text-center font-mono">
          MoSPI Official Portal • v2.4
        </div>
      )}
    </aside>
  );
};
