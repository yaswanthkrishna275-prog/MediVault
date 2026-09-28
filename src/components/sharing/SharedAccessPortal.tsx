import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  FileText, 
  Clock, 
  User, 
  Eye, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { SharedRecord, MedicalDocument } from '../../types';
import { dbService } from '../../services/dbService';

interface Props {
  shareId: string;
  initialCode?: string;
  onExitPortal: () => void;
}

export const SharedAccessPortal: React.FC<Props> = ({
  shareId,
  initialCode = '',
  onExitPortal
}) => {
  const [record, setRecord] = useState<SharedRecord | null>(null);
  const [accessCode, setAccessCode] = useState(initialCode);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePreviewDoc, setActivePreviewDoc] = useState<Partial<MedicalDocument> | null>(null);

  useEffect(() => {
    loadShare();
  }, [shareId]);

  const loadShare = async () => {
    setLoading(true);
    const data = await dbService.getSharedRecordById(shareId);
    setRecord(data);
    setLoading(false);

    if (data && initialCode && initialCode === data.accessCode) {
      verifyCode(initialCode, data);
    }
  };

  const verifyCode = async (codeToTest: string, currentRecord: SharedRecord | null = record) => {
    if (!currentRecord) {
      setError('Shared record not found.');
      return;
    }

    if (currentRecord.isRevoked) {
      setError('Access Revoked: The patient has revoked access to these medical records.');
      return;
    }

    if (new Date(currentRecord.expiresAt).getTime() < Date.now()) {
      setError('Access Expired: This sharing link has expired.');
      return;
    }

    if (codeToTest.trim() === currentRecord.accessCode) {
      setIsAuthenticated(true);
      setError('');
      await dbService.recordShareView(shareId);
    } else {
      setError('Invalid 6-digit access code. Please verify with the patient.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(accessCode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-2 text-xs">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Verifying secure link authorization...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-3 shadow-lg border border-slate-200">
          <AlertOctagon className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Record Not Found</h2>
          <p className="text-xs text-slate-500">
            This sharing link does not exist or may have been permanently removed.
          </p>
          <button
            onClick={onExitPortal}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Back to Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">MediVault</span>
              <span className="text-[10px] bg-teal-900/60 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-700/50">
                Clinician Access Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Restricted Read-Only Medical Record Snapshot</p>
          </div>
        </div>

        <button
          onClick={onExitPortal}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Portal</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto">
        
        {!isAuthenticated ? (
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl max-w-md mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500 text-purple-300 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{record.shareTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Designated for: <strong>{record.recipientDoctorOrEntity}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500 rounded-xl text-xs text-red-200 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleCodeSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-center">
                  Enter 6-Digit Access Passcode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g. 549120"
                  className="w-full text-center text-xl tracking-widest font-mono font-bold bg-slate-900 border border-slate-600 rounded-xl py-2.5 text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Provided to you securely by the patient.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                Authenticate & View Records
              </button>
            </form>

            <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400">
              Access window expires at {new Date(record.expiresAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Authorized Banner */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-bold text-white">{record.shareTitle}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recipient: <strong>{record.recipientDoctorOrEntity}</strong> • Expires: {new Date(record.expiresAt).toLocaleTimeString()}
                </p>
              </div>

              <span className="text-[10px] bg-teal-900 text-teal-200 px-2 py-0.5 rounded border border-teal-700 font-semibold self-start sm:self-auto">
                Authorized Session
              </span>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Authorized Patient Records ({record.documentsSnapshot?.length || 0})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(record.documentsSnapshot || []).map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-bold">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{doc.date}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                      {doc.doctorName && (
                        <p className="text-[11px] text-slate-400">Physician: {doc.doctorName}</p>
                      )}
                      {doc.notes && (
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg">
                          &quot;{doc.notes}&quot;
                        </p>
                      )}

                      {/* OCR summary */}
                      {doc.extractedData?.diagnosisMentioned && (
                        <div className="p-2 bg-slate-900/40 rounded text-[10px] text-teal-300 border border-teal-900">
                          <strong>Diagnosis Mentioned:</strong> {doc.extractedData.diagnosisMentioned.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                      <button
                        onClick={() => setActivePreviewDoc(doc)}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Document</span>
                      </button>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        High-Res Image
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Document modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{activePreviewDoc.title}</h3>
              <button
                onClick={() => setActivePreviewDoc(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
            <img
              src={activePreviewDoc.fileUrl}
              alt={activePreviewDoc.title}
              className="max-h-96 object-contain mx-auto rounded-lg bg-black"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-center text-[10px] text-slate-500">
        MediVault Confidential Record Portal • All actions logged • For authorized medical review only
      </footer>

    </div>
  );
};
