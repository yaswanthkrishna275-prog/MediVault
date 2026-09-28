import React from 'react';
import { 
  FolderLock, 
  Stethoscope, 
  Pill, 
  Clock, 
  Share2, 
  ArrowUpRight, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Activity, 
  ShieldCheck, 
  User,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { MedicalDocument, Medication, TimelineEvent } from '../../types';
import { NavigationTab } from '../layout/Sidebar';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  userName: string;
  isDemoUser: boolean;
  documents: MedicalDocument[];
  medications: Medication[];
  timeline: TimelineEvent[];
  onNavigate: (tab: NavigationTab) => void;
  onUploadClick: () => void;
}

export const DashboardView: React.FC<Props> = ({
  userName,
  isDemoUser,
  documents,
  medications,
  timeline,
  onNavigate,
  onUploadClick
}) => {
  const activeMedications = medications.filter(m => m.isActive);
  const recentDocs = documents.slice(0, 3);
  const recentEvents = timeline.slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30">
              {isDemoUser ? 'Student Demonstration Profile' : 'Verified Patient Vault'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {userName || 'Patient'}
          </h1>
          <p className="text-sm text-teal-100 leading-relaxed">
            Your encrypted health repository is active. You have <strong>{documents.length}</strong> medical records secured, <strong>{activeMedications.length}</strong> ongoing medication schedules, and clinical guidance ready whenever you need.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={onUploadClick}
              className="px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <FolderLock className="w-4 h-4 text-teal-700" />
              <span>Upload Medical Record</span>
            </button>
            <button
              onClick={() => onNavigate('symptoms')}
              className="px-4 py-2 bg-teal-600/60 hover:bg-teal-600/80 text-white text-xs font-semibold rounded-xl border border-teal-400/30 transition-colors inline-flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Check Symptoms with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <MedicalDisclaimer variant="banner" />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => onNavigate('vault')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Stored Records</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{documents.length}</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1 flex items-center gap-1">
            <span>Prescriptions & lab reports</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('medications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Medicines</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeMedications.length}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span>Prescription tracker</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('timeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Health Milestones</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{timeline.length}</div>
          <div className="text-[11px] text-blue-700 font-medium mt-1 flex items-center gap-1">
            <span>Doctor visits & history</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('sharing')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Shared Links</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">Encrypted</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1 flex items-center gap-1">
            <span>Temporary doctor access</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Healthcare Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <button
            onClick={onUploadClick}
            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <FolderLock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Upload Record</p>
            <p className="text-[10px] text-slate-500 mt-0.5">PDF, Scans, Labs</p>
          </button>

          <button
            onClick={() => onNavigate('symptoms')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Check Symptoms</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Clinical guidance</p>
          </button>

          <button
            onClick={() => onNavigate('medications')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pill className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Medication AI</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Prescription note</p>
          </button>

          <button
            onClick={() => onNavigate('timeline')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Health Timeline</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Care history</p>
          </button>

          <button
            onClick={() => onNavigate('sharing')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-xs transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Share2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Share Records</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Expiring doctor link</p>
          </button>

        </div>
      </div>

      {/* Two Column Section: Recent Records & Ongoing Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Medical Documents */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Medical Documents</h3>
            </div>
            <button
              onClick={() => onNavigate('vault')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
            >
              <span>View All ({documents.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No medical documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate('vault')}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-medium text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">{doc.category}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        {doc.doctorName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{doc.doctorName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {doc.isExtracted && (
                    <span className="shrink-0 text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                      OCR Extracted
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ongoing Medications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Current Prescribed Regimen</h3>
            </div>
            <button
              onClick={() => onNavigate('medications')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Manage Regimen</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeMedications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active medications logged.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeMedications.map((med) => (
                <div
                  key={med.id}
                  className="p-3 rounded-lg border border-slate-100 bg-emerald-50/20 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{med.name} — {med.dosage}</p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-emerald-800">{med.frequency}</span> ({med.timing})
                    </p>
                    {med.instructions && (
                      <p className="text-[10px] text-slate-500 italic line-clamp-1">
                        &quot;{med.instructions}&quot;
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Health Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Chronological Care Timeline</h3>
          </div>
          <button
            onClick={() => onNavigate('timeline')}
            className="text-xs text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            <span>Full Timeline ({timeline.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {evt.eventType}
                </span>
                <span className="text-slate-400">{evt.date}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{evt.title}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2">{evt.description}</p>
              {evt.doctorOrFacility && (
                <p className="text-[10px] text-slate-400 font-medium">@ {evt.doctorOrFacility}</p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
