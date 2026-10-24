import React from 'react';
import { User } from '../types.ts';
import { ShoppingBag, Wallet, Shield, Store, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string, arg?: any) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogout,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top micro-strip */}
      <div className="bg-[#0E5A3C] text-emerald-50 text-xs py-1.5 px-4 text-center font-medium tracking-wide">
        Pay a little every day. Receive items in rotation every 10 days · Secured by ChaMall M-Pesa Till <span className="font-bold text-amber-300">000000</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single Brand element */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 shrink-0 hover:opacity-90 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-[#0E5A3C] text-amber-300 flex items-center justify-center font-black text-lg shadow-sm">
              C
            </span>
            <span>
              Ali<span className="text-[#0E5A3C]">baird</span> <span className="text-[#FF6A00]">Chama</span>
            </span>
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search appliances, electronics, solar, cookware..."
                className="w-full pl-3.5 pr-20 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C] focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => onNavigate('home')}
                className="absolute right-1 top-1 bottom-1 px-3 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-semibold rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Zone 2: Clean single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#0E5A3C] transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'home' ? 'text-[#0E5A3C] font-semibold' : ''
              }`}
            >
              Announcements
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate('my-chamas')}
                className={`hover:text-[#0E5A3C] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'my-chamas' ? 'text-[#0E5A3C] font-semibold' : ''
                }`}
              >
                My Chamas
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => onNavigate('wallet')}
                className={`flex items-center gap-1.5 hover:text-[#0E5A3C] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'wallet' ? 'text-[#0E5A3C] font-semibold' : ''
                }`}
              >
                <Wallet className="w-4 h-4 text-slate-400" />
                <span>Wallet</span>
                {currentUser.credit > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    KSh {currentUser.credit.toLocaleString()}
                  </span>
                )}
              </button>
            )}

            {currentUser?.role === 'merchant' && (
              <button
                onClick={() => onNavigate('vendor-dashboard')}
                className={`flex items-center gap-1.5 hover:text-[#0E5A3C] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'vendor-dashboard' ? 'text-[#0E5A3C] font-semibold' : ''
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Merchant Hub</span>
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`flex items-center gap-1.5 hover:text-[#0E5A3C] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'admin-dashboard' ? 'text-[#0E5A3C] font-semibold' : ''
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary user action / profile */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {currentUser.role}
                    {currentUser.role === 'merchant' && currentUser.verified ? ' (Verified)' : ''}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0E5A3C] hover:bg-[#0b4830] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Switch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
