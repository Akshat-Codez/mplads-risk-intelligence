import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut } from './Icons';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, setScope } = useAuth();
  const navigate = useNavigate();
  const [showScopeModal, setShowScopeModal] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const handleScopeChange = async (targetRole: Role, targetState?: string, targetDistrict?: string) => {
    try {
      await setScope(targetRole, targetState, targetDistrict);
      setShowScopeModal(false);
      window.location.reload(); // Refresh page to re-fetch scoped queries cleanly
    } catch (e) {
      console.error(e);
    }
  };

  const getScopeBadge = () => {
    if (role === 'DISTRICT') {
      return (
        <button
          onClick={() => setShowScopeModal(!showScopeModal)}
          className="flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
          title="Click to switch authority jurisdiction scope"
        >
          <span>📍</span>
          <span>DISTRICT:</span>
          <span className="font-extrabold text-purple-950 underline">{user?.district || 'BENGALURU URBAN'}, {user?.state || 'Karnataka'}</span>
        </button>
      );
    }
    if (role === 'STATE') {
      return (
        <button
          onClick={() => setShowScopeModal(!showScopeModal)}
          className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
          title="Click to switch authority jurisdiction scope"
        >
          <span>🏢</span>
          <span>STATE:</span>
          <span className="font-extrabold text-emerald-950 underline">{user?.state || 'Karnataka'}</span>
        </button>
      );
    }
    return (
      <button
        onClick={() => setShowScopeModal(!showScopeModal)}
        className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
        title="Click to switch authority jurisdiction scope"
      >
        <span>🏛️</span>
        <span>SCOPE:</span>
        <span className="font-extrabold text-blue-950 underline">National (All India — 1,051 Works)</span>
      </button>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 font-sans shadow-sm">
      {/* Global Search Bar */}
      <div className="relative w-80">
        <input
          type="text"
          placeholder="Search Project ID, Work Title, MP, Vendor..."
          className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
        />
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
      </div>

      {/* Center / Left: Authority Scope Pill */}
      <div className="relative">
        {getScopeBadge()}

        {/* Quick Scope Switcher Popup for Demo/Evaluation */}
        {showScopeModal && (
          <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-300 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2">
            <div className="font-bold text-slate-800 border-b pb-1 flex justify-between">
              <span>Authority Scope Switcher</span>
              <span className="text-[10px] text-slate-400 font-normal">SIH Demo</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleScopeChange('MINISTRY', 'All India', 'All Districts')}
                className={`w-full text-left p-2 rounded font-bold flex items-center justify-between ${role === 'MINISTRY' ? 'bg-blue-100 text-blue-900' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <span>🏛️ National (All India)</span>
                <span className="text-[10px] text-slate-500">1,051 Works</span>
              </button>
              <button
                onClick={() => handleScopeChange('STATE', 'Karnataka', 'All Districts')}
                className={`w-full text-left p-2 rounded font-bold flex items-center justify-between ${role === 'STATE' && user?.state === 'Karnataka' ? 'bg-emerald-100 text-emerald-900' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <span>🏢 State: Karnataka</span>
                <span className="text-[10px] text-slate-500">120 Works</span>
              </button>
              <button
                onClick={() => handleScopeChange('DISTRICT', 'Karnataka', 'BENGALURU URBAN')}
                className={`w-full text-left p-2 rounded font-bold flex items-center justify-between ${role === 'DISTRICT' && user?.district === 'BENGALURU URBAN' ? 'bg-purple-100 text-purple-900' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <span>📍 District: Bengaluru Urban</span>
                <span className="text-[10px] text-purple-700 font-extrabold">99 Works</span>
              </button>
              <button
                onClick={() => handleScopeChange('STATE', 'Uttar Pradesh', 'All Districts')}
                className={`w-full text-left p-2 rounded font-bold flex items-center justify-between ${role === 'STATE' && user?.state === 'Uttar Pradesh' ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <span>🏢 State: Uttar Pradesh</span>
                <span className="text-[10px] text-slate-500">429 Works</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right User Actions & Top Right Sign Out */}
      <div className="flex items-center space-x-4">
        
        {/* Socket.IO Live Notifications */}
        <button 
          onClick={() => navigate('/app/notifications')}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Info Profile Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-sm shadow">
            <User size={18} />
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-bold text-slate-900 leading-none">{user?.name || 'Authority Officer'}</p>
            <p className="text-[10px] text-blue-700 font-semibold mt-0.5">{user?.role} — {user?.state}</p>
          </div>
        </div>

        {/* Top Right Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
          title="Sign Out"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
