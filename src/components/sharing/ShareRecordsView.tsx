import React, { useState } from 'react';
import { 
  Share2, 
  Lock, 
  Clock, 
  Copy, 
  Check, 
  Eye, 
  Ban, 
  AlertCircle, 
  FileText, 
  Plus, 
  Calendar, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { SharedRecord, MedicalDocument } from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  sharedRecords: SharedRecord[];
  documents: MedicalDocument[];
  onCreateShare: (
    title: string,
    recipient: string,
    docIds: string[],
    hours: number,
    snapshot: Partial<MedicalDocument>[]
  ) => Promise<SharedRecord>;
  onRevokeShare: (shareId: string) => Promise<void>;
  userId: string;
  onOpenDoctorPortal: (shareId: string) => void;
}

export const ShareRecordsView: React.FC<Props> = ({
  sharedRecords,
  documents,
  onCreateShare,
  onRevokeShare,
  userId,
  onOpenDoctorPortal
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const toggleDocSelect = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleGenerateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTitle.trim() || !recipient.trim()) {
      setError('Please provide a title and doctor/clinic name.');
      return;
    }
    if (selectedDocIds.length === 0) {
      setError('Please select at least one document to share.');
      return;
    }

    const selectedDocs = documents.filter(d => selectedDocIds.includes(d.id));
    const snapshot = selectedDocs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      date: d.date,
      doctorName: d.doctorName,
      facilityName: d.facilityName,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      notes: d.notes,
      extractedData: d.extractedData
    }));

    await onCreateShare(
      shareTitle.trim(),
      recipient.trim(),
      selectedDocIds,
      durationHours,
      snapshot
    );

    setIsCreateOpen(false);
    setShareTitle('');
    setRecipient('');
    setSelectedDocIds([]);
    setError('');
  };

  const copyShareLink = (share: SharedRecord) => {
    const url = `${window.location.origin}?shareId=${share.id}&code=${share.accessCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Secure Selective Record Sharing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grant temporary, granular access to chosen prescriptions or scans with 6-digit passcode authentication.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shared Link</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-purple-950">Patient Privacy Protection Architecture</p>
          <p className="text-purple-800 mt-0.5 leading-relaxed">
            MediVault never exposes your entire medical vault. The doctor receives a read-only snapshot containing exclusively the specific files you checked. Access expires automatically after the chosen time, and can be revoked instantly.
          </p>
        </div>
      </div>

      {/* Active Shares List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Active & Historical Share Links ({sharedRecords.length})
        </h2>

        {sharedRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Share2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p>You have not shared any records yet.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs"
            >
              Share Selected Records
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedRecords.map((share) => {
              const isExpired = new Date(share.expiresAt).getTime() < Date.now();
              const isInactive = share.isRevoked || isExpired;

              return (
                <div
                  key={share.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isInactive 
                      ? 'border-slate-200 bg-slate-50 opacity-60' 
                      : 'border-purple-200 bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900">{share.shareTitle}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          share.isRevoked
                            ? 'bg-red-100 text-red-800'
                            : isExpired
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {share.isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Shared with: <strong className="text-slate-700">{share.recipientDoctorOrEntity}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isInactive && (
                        <button
                          onClick={() => copyShareLink(share)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          {copiedId === share.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === share.id ? 'Link Copied!' : 'Copy Link'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDoctorPortal(share.id)}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Doctor View</span>
                      </button>

                      {!share.isRevoked && !isExpired && (
                        <button
                          onClick={() => onRevokeShare(share.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Access Code: <strong className="font-mono text-purple-800 font-bold">{share.accessCode}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Expires: {new Date(share.expiresAt).toLocaleString()}</span>
                    </span>
                    <span>Includes <strong>{share.documentIds.length}</strong> records</span>
                    <span>Views: <strong>{share.viewCount}</strong></span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Share Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Create Selective Share Package</h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateShare} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="e.g. Second Opinion Consultation Package"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipient Doctor / Clinic *</label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiration Window</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value={1}>1 Hour (Immediate Consult)</option>
                    <option value={24}>24 Hours (Recommended)</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>
              </div>

              {/* Documents Selection Checkbox List */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Specific Records to Include ({selectedDocIds.length} chosen)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                  {documents.length === 0 ? (
                    <p className="text-slate-400 p-2 text-center">No documents in vault yet.</p>
                  ) : (
                    documents.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleDocSelect(doc.id)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected 
                              ? 'bg-purple-50 border-purple-300 text-purple-950' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-semibold truncate">{doc.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {doc.category} • {doc.date}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Generate Doctor Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MedicalDisclaimer variant="compact" />

    </div>
  );
};
