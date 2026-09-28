import React from 'react';
import { 
  LayoutDashboard, 
  FolderLock, 
  Stethoscope, 
  Pill, 
  Clock, 
  Share2, 
  UserCheck, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type NavigationTab = 
  | 'dashboard'
  | 'vault'
  | 'symptoms'
  | 'medications'
  | 'timeline'
  | 'sharing'
  | 'profile';

interface Props {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  documentCount?: number;
  activeMedCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  documentCount = 0,
  activeMedCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & recent activity'
    },
    {
      id: 'vault' as NavigationTab,
      label: 'Medical Vault',
      icon: FolderLock,
      badge: documentCount > 0 ? documentCount : undefined,
      description: 'Prescriptions, labs & scans'
    },
    {
      id: 'symptoms' as NavigationTab,
      label: 'Symptom Assessment',
      icon: Stethoscope,
      aiBadge: true,
      description: 'AI clinical guidance'
    },
    {
      id: 'medications' as NavigationTab,
      label: 'Medication Assistant',
      icon: Pill,
      badge: activeMedCount > 0 ? activeMedCount : undefined,
      description: 'Prescription explainer'
    },
    {
      id: 'timeline' as NavigationTab,
      label: 'Health Timeline',
      icon: Clock,
      description: 'Chronological milestones'
    },
    {
      id: 'sharing' as NavigationTab,
      label: 'Share Records',
      icon: Share2,
      description: 'Expiring doctor links'
    },
    {
      id: 'profile' as NavigationTab,
      label: 'Profile & Settings',
      icon: UserCheck,
      description: 'Emergency & health data'
    }
  ];

  const handleSelect = (id: NavigationTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-30 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clinical Modules
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all
                    ${isActive 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <span className="truncate block leading-tight">{item.label}</span>
                      <span className={`text-[10px] block font-normal truncate ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.aiBadge && !isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        AI
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Safety Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Medical Safety Rule</span>
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              MediVault never provides autonomous diagnosis or alters physician dosages.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
