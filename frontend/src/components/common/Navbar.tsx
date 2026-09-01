import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut } from './Icons';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
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

      {/* Right User Actions & Top Right Sign Out */}
      <div className="flex items-center space-x-4">
        {/* Socket.IO Live Notifications */}
        <button 
          onClick={() => navigate('/app/notifications')}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
