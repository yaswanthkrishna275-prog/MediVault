import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  variant?: 'banner' | 'compact' | 'footer';
  className?: string;
}

export const MedicalDisclaimer: React.FC<Props> = ({ variant = 'banner', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-lg ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>Educational guidance only. Never replaces direct medical consultation or emergency care.</span>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <footer className={`mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span><strong>MediVault v1.0</strong> — B.Tech Computer Science Final Year Project</span>
        </div>
        <p className="text-center md:text-right max-w-xl">
          Medical Disclaimer: MediVault is an educational healthcare assistant. It does not provide medical diagnosis, prescribe drugs, or alter existing prescriptions. For emergencies, please call local emergency medical services immediately.
        </p>
      </footer>
    );
  }

  return (
    <div className={`bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 shadow-xs flex items-start gap-3 ${className}`}>
      <div className="p-1 bg-amber-100 rounded-md shrink-0 text-amber-700 mt-0.5">
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="font-semibold text-amber-950">Important Medical Safety & Educational Notice</p>
        <p className="text-amber-800 leading-relaxed">
          MediVault does not diagnose diseases, recommend drug dosages, or substitute licensed physicians. Information presented is algorithmic and educational. Always confirm with your physician or pharmacist. In acute emergencies, dial emergency services immediately.
        </p>
      </div>
    </div>
  );
};
