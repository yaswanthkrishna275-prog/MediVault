import React from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Menu,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenGuide: () => void;
  onOpenAuth: () => void;
  onToggleSidebar: () => void;
  onEmergencyClick: () => void;
  activeTab: string;
}

export const Navbar: React.FC<Props> = ({
  onOpenGuide,
  onOpenAuth,
  onToggleSidebar,
  onEmergencyClick,
  activeTab
}) => {
  const { user, userProfile, isDemoUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900">MediVault</span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  AI Healthcare Assistant
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Personal Health Records & Clinical Intelligence</p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Emergency SOS button */}
          <button
            onClick={onEmergencyClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span className="hidden sm:inline">Emergency SOS</span>
            <span className="sm:hidden">112</span>
          </button>

          {/* Academic / Viva Guide Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Project Guide & Viva</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {/* User Profile / Auth State */}
          {user || isDemoUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {userProfile?.displayName || user?.displayName || 'Yaswanth (Demo)'}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-500">
                    {isDemoUser ? 'Demo Mode' : 'Authenticated'}
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200">
                {(userProfile?.displayName || user?.displayName || 'Y').charAt(0).toUpperCase()}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
