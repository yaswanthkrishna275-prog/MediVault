import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notice?: string;
}

export const EmergencyAlertModal: React.FC<Props> = ({ isOpen, onClose, notice }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500 overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-7 h-7 text-red-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Urgent Medical Alert</h3>
            <p className="text-xs text-red-700 font-medium">Potentially high-risk symptoms identified</p>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-red-950 text-sm leading-relaxed mb-5">
          <p className="font-semibold mb-1">Immediate Action Recommended:</p>
          <p>{notice || 'The reported symptoms (e.g. chest pain, breathing difficulty, or neurological signs) could signify a critical condition requiring rapid clinical evaluation.'}</p>
        </div>

        <div className="space-y-3 mb-6 text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
            <span>Do not wait for symptoms to resolve on their own.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
            <span>Contact local emergency services immediately: <strong>112 (India / EU)</strong> or <strong>911 (US)</strong>.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
            <span>Have someone assist you to the nearest hospital emergency room. Do not drive yourself if dizzy or in severe distress.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="tel:112"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors text-center"
          >
            <PhoneCall className="w-4 h-4" />
            Call Emergency (112)
          </a>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 px-4 rounded-xl transition-colors"
          >
            I Understand, Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
