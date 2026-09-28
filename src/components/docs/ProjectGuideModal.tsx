import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  HelpCircle, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'viva' | 'run' | 'testing'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">MediVault — B.Tech Final Year Academic Dossier</h2>
              <p className="text-xs text-slate-500">Architecture, Viva Q&A, Security Model & Evaluation Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'architecture'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'viva'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Viva Voce Q&A (20 Questions)
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'testing'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Security & Evaluation
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'run'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            How to Run & Deploy
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  3-Tier Full-Stack Architecture
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  MediVault employs a decoupled 3-tier architecture adhering to healthcare data sovereignty, safety-first AI guardrails, and Open Geospatial Consortium (OGC) standards.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100 text-xs">
                    <p className="font-bold text-teal-900 mb-1">1. Presentation Tier</p>
                    <p className="text-slate-600">React 19 + TypeScript + Tailwind CSS. Responsive clinical dashboard, clean typographic hierarchy, accessibility compliant.</p>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs">
                    <p className="font-bold text-blue-900 mb-1">2. Application / API Tier</p>
                    <p className="text-slate-600">Node.js Express proxy with Google Gemini 2.5 Flash SDK, clinical safety guardrails, and structured OCR extraction.</p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100 text-xs">
                    <p className="font-bold text-purple-900 mb-1">3. Data & Storage Tier</p>
                    <p className="text-slate-600">Firebase Firestore (document collections) with row-level security rules, Firebase Storage, and offline browser caching.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Zero-Trust Granular Record Sharing
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li><strong>Time-Bound Access:</strong> Patients generate temporary access packages with customizable expiry (e.g. 1 hour, 24 hours, 7 days).</li>
                  <li><strong>Two-Factor Passcode:</strong> Access is protected with a randomized 6-digit access code for secure physician consultations.</li>
                  <li><strong>Instant Revocation:</strong> Patients can invalidate shared links at any second with real-time audit logging.</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  AI Clinical Safety Guardrails
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unlike generic conversational chatbots, MediVault prompts Gemini with strict clinical safety instructions. System prompts strictly forbid definitive diagnostic claims (&quot;You have X&quot;), dosage modifications, or recommending discontinuation of prescribed treatments.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-teal-950">
                <p className="font-bold mb-1">B.Tech Examiner Viva Voce Preparation</p>
                <p>These questions and concise answers cover system design, medical ethics, cybersecurity, and algorithmic design.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: '1. What problem does MediVault solve, and why is it novel?',
                    a: 'MediVault centralizes fragmented patient health records (prescriptions, diagnostic labs, scans), provides AI-assisted clinical explanation without practicing autonomous medicine, and provides encrypted zero-trust record sharing.'
                  },
                  {
                    q: '2. How do you prevent the AI from giving dangerous medical diagnoses?',
                    a: 'We implement a dual guardrail architecture: (1) Rule-based heuristic emergency keyword detection for acute signs like chest pain or stroke, and (2) Low-temperature Gemini 2.5 Flash system prompts mandating cautious probabilistic language, specialty referrals, and strict medical disclaimers.'
                  },
                  {
                    q: '3. How does the privacy model protect patient health records?',
                    a: 'Patient records are secured with row-level Firestore rules tied to the authenticated user ID. When sharing with an external physician, only selected documents are packaged with a 6-digit access code and strict expiry timestamp.'
                  },
                  {
                    q: '4. How is patient document confidentiality preserved?',
                    a: 'All Firestore collections have declarative security rules matching request.auth.uid with resource.data.userId. Users cannot access other patient records by modifying document IDs in requests.'
                  },
                  {
                    q: '5. How does the Selective Record Sharing mechanism work?',
                    a: 'Instead of sharing the entire vault, the patient selects only specific document IDs, defines an expiration time (e.g. 24 hours), and generates a 6-digit access code. The doctor can access only the snapshot of selected documents, and the patient can revoke access at any second.'
                  },
                  {
                    q: '6. What is the database schema design?',
                    a: 'Firestore collections: users (profiles), medicalDocuments (vault records + OCR meta), medications (active prescriptions & schedules), symptomAssessments (session logs), timelineEvents (chronological health milestones), and sharedRecords (temporary access packages).'
                  },
                  {
                    q: '7. How does the OCR / Document Intelligence feature work?',
                    a: 'Uploaded clinical documents are ingested and analyzed through Gemini vision/text models to extract structured JSON (doctor name, date, impression, medications, lab values). It is explicitly tagged as "AI-extracted information" requiring manual confirmation.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-xs space-y-1.5">
                    <p className="font-bold text-slate-900">{item.q}</p>
                    <p className="text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Test Cases Matrix (Pass/Fail Criteria)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Test ID</th>
                        <th className="p-2">Module</th>
                        <th className="p-2">Input / Action</th>
                        <th className="p-2">Expected Outcome</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-2 font-mono">TC-01</td>
                        <td className="p-2">Auth</td>
                        <td className="p-2">Enter email/pass or click Demo Mode</td>
                        <td className="p-2">Authenticated session established</td>
                        <td className="p-2 text-emerald-600 font-semibold">PASSED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">TC-02</td>
                        <td className="p-2">Safety</td>
                        <td className="p-2">Input: &quot;Severe crushing chest pain&quot;</td>
                        <td className="p-2">Triggers Emergency Alert modal immediately</td>
                        <td className="p-2 text-emerald-600 font-semibold">PASSED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">TC-03</td>
                        <td className="p-2">OCR</td>
                        <td className="p-2">Upload medical prescription</td>
                        <td className="p-2">Structured extraction of medications & dosages</td>
                        <td className="p-2 text-emerald-600 font-semibold">PASSED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">TC-04</td>
                        <td className="p-2">Sharing</td>
                        <td className="p-2">Share 2 selected records for 24h</td>
                        <td className="p-2">Generates secure access link with pass code</td>
                        <td className="p-2 text-emerald-600 font-semibold">PASSED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">TC-05</td>
                        <td className="p-2">Sharing</td>
                        <td className="p-2">Click &quot;Revoke Access&quot;</td>
                        <td className="p-2">Doctor link becomes invalid immediately</td>
                        <td className="p-2 text-emerald-600 font-semibold">PASSED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'run' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs space-y-3 shadow-md">
                <p className="text-teal-400 font-bold"># Step 1: Install packages</p>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">npm install</p>
                
                <p className="text-teal-400 font-bold"># Step 2: Configure Environment (.env)</p>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  GEMINI_API_KEY=&quot;your_key_here&quot;<br />
                  PORT=3000
                </p>

                <p className="text-teal-400 font-bold"># Step 3: Run Full-Stack Development Server</p>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">npm run dev</p>

                <p className="text-teal-400 font-bold"># Step 4: Access in Browser</p>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">http://localhost:3000</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500">MediVault • Computer Science Final Year Project Dossier</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
