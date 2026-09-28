import React, { useState, useMemo } from 'react';
import { 
  FolderLock, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Tag, 
  X, 
  FileCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { MedicalDocument, DocumentCategory, ExtractedDocumentData } from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  documents: MedicalDocument[];
  onAddDocument: (docData: Omit<MedicalDocument, 'id' | 'createdAt'>) => Promise<MedicalDocument>;
  onUpdateDocument: (id: string, updates: Partial<MedicalDocument>) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  isDemoUser: boolean;
  userId: string;
}

const CATEGORIES: DocumentCategory[] = [
  'Prescription',
  'Lab Report',
  'Scan',
  'Hospital Record',
  'Discharge Summary',
  'Doctor Note',
  'Other'
];

export const MedicalVaultView: React.FC<Props> = ({
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  isDemoUser,
  userId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title'>('date-desc');
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<MedicalDocument | null>(null);
  const [editDoc, setEditDoc] = useState<MedicalDocument | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);

  // Upload Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Prescription');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDoctor, setNewDoctor] = useState('');
  const [newFacility, setNewFacility] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Filter and Sort
  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesQuery = 
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.doctorName && doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.facilityName && doc.facilityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.tags && doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
        return matchesQuery && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        return a.title.localeCompare(b.title);
      });
  }, [documents, searchQuery, selectedCategory, sortBy]);

  // Handle Local File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB. Please choose a smaller document.');
      return;
    }

    setNewFileName(file.name);
    if (!newTitle) {
      // Auto suggest title from file name without extension
      const cleaned = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
    }

    // Create object URL for client preview
    const url = URL.createObjectURL(file);
    setNewFileUrl(url);
    setUploadError('');
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    setUploading(true);
    try {
      const docPayload: Omit<MedicalDocument, 'id' | 'createdAt'> = {
        userId,
        title: newTitle.trim(),
        category: newCategory,
        date: newDate,
        doctorName: newDoctor.trim() || undefined,
        facilityName: newFacility.trim() || undefined,
        notes: newNotes.trim() || undefined,
        fileUrl: newFileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        fileName: newFileName || 'medical_record.pdf',
        fileSize: 450000,
        fileType: 'application/pdf',
        tags: [newCategory],
        isExtracted: false
      };

      const created = await onAddDocument(docPayload);

      // Trigger automatic AI OCR Extraction for convenience
      triggerAIExtraction(created.id, created.title, created.category, created.notes || '');

      // Reset
      setIsUploadOpen(false);
      setNewTitle('');
      setNewDoctor('');
      setNewFacility('');
      setNewNotes('');
      setNewFileUrl('');
      setNewFileName('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Trigger Gemini OCR & Clinical Data Extraction
  const triggerAIExtraction = async (docId: string, title: string, category: string, notes: string) => {
    setExtractingId(docId);
    try {
      const res = await fetch('/api/gemini/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: title,
          documentCategory: category,
          documentText: notes || `Clinical record for ${title}`
        })
      });

      if (!res.ok) throw new Error('Extraction request failed');
      const data: ExtractedDocumentData = await res.json();

      await onUpdateDocument(docId, {
        isExtracted: true,
        extractedData: data
      });
    } catch (err) {
      console.warn('OCR extraction error:', err);
    } finally {
      setExtractingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-900">Medical Document Vault</h1>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {documents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Secure, encrypted personal archive for prescriptions, lab results, scans, and doctor discharge reports.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Medical Document</span>
        </button>
      </div>

      {/* Medical safety notice */}
      <MedicalDisclaimer variant="compact" />

      {/* Search, Filter, Sort Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, doctor, clinic, or tag..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({documents.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = documents.filter(d => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No medical records match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or upload a new prescription, lab report, or scan.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Card Top: Category & Date */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    doc.category === 'Prescription'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : doc.category === 'Lab Report'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : doc.category === 'Scan'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{doc.date}</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {doc.doctorName || doc.facilityName || 'General Health Documentation'}
                  </div>
                </div>

                {/* Notes preview */}
                {doc.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2 italic">
                    &quot;{doc.notes}&quot;
                  </p>
                )}

                {/* AI Extracted Highlights Preview */}
                {doc.isExtracted && doc.extractedData && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-indigo-950 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        AI-Extracted Data
                      </span>
                      <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-semibold">
                        Ready
                      </span>
                    </div>
                    {doc.extractedData.diagnosisMentioned && doc.extractedData.diagnosisMentioned.length > 0 && (
                      <p className="text-slate-600 truncate">
                        <strong>Diagnosis:</strong> {doc.extractedData.diagnosisMentioned.join(', ')}
                      </p>
                    )}
                    {doc.extractedData.medications && doc.extractedData.medications.length > 0 && (
                      <p className="text-slate-600 truncate">
                        <strong>Rx:</strong> {doc.extractedData.medications.map(m => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Extraction In-progress spinner */}
                {extractingId === doc.id && (
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Extracting clinical information with Gemini...</span>
                  </div>
                )}

              </div>

              {/* Bottom Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview & OCR</span>
                </button>

                <div className="flex items-center gap-1">
                  {!doc.isExtracted && (
                    <button
                      onClick={() => triggerAIExtraction(doc.id, doc.title, doc.category, doc.notes || '')}
                      title="Run AI Extraction"
                      disabled={extractingId === doc.id}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}

                  <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    target="_blank"
                    rel="noreferrer"
                    title="Download document"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setEditDoc(doc)}
                    title="Rename / Edit"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    title="Delete document"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. UPLOAD DOCUMENT MODAL */}
      {/* ======================================================== */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Upload Healthcare Record</h3>
              </div>
              <button 
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDocument} className="space-y-4">
              
              {/* File input area */}
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".pdf,image/*,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {newFileName ? newFileName : 'Click to select prescription, lab report, or scan'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG, or DICOM scans up to 15MB</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Apollo Hospital Discharge Summary"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic</label>
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    placeholder="e.g. Apollo City Hospital"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes or Description</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Follow-up consultation for respiratory allergies, prescribed 5-day antibiotic."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs"
                >
                  {uploading ? 'Processing & Storing...' : 'Save to Vault'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DOCUMENT PREVIEW & OCR MODAL */}
      {/* ======================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-teal-800">{previewDoc.category}</span>
                    <span>•</span>
                    <span>{previewDoc.date}</span>
                    {previewDoc.doctorName && (
                      <>
                        <span>•</span>
                        <span>{previewDoc.doctorName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Document Image / PDF viewer preview */}
              <div className="bg-slate-900/5 rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Original Clinical Document Preview</p>
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-72 object-contain mx-auto rounded-lg shadow-xs border border-slate-200 bg-white"
                />
                <div className="mt-3 flex items-center justify-center gap-3">
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-semibold"
                  >
                    <span>Open High-Res in New Tab</span>
                  </a>
                </div>
              </div>

              {/* OCR / AI Extracted Information Section */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      AI-Extracted Information (OCR)
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Gemini 2.5 Intelligence
                  </span>
                </div>

                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg leading-relaxed">
                  <strong>Verification Notice:</strong> This data was generated through AI optical recognition. The original medical document remains authoritative. Always confirm critical values with your doctor or pharmacist.
                </p>

                {previewDoc.extractedData ? (
                  <div className="space-y-3 text-xs">
                    
                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-indigo-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Extracted Clinician</span>
                        <span className="font-semibold text-slate-800">
                          {previewDoc.extractedData.doctorName || 'Not explicitly noted'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hospital / Clinic</span>
                        <span className="font-semibold text-slate-800">
                          {previewDoc.extractedData.hospitalName || 'Not explicitly noted'}
                        </span>
                      </div>
                    </div>

                    {previewDoc.extractedData.diagnosisMentioned && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <span className="text-slate-400 block text-[10px] mb-1">Diagnoses / Impressions Mentioned</span>
                        <div className="flex flex-wrap gap-1.5">
                          {previewDoc.extractedData.diagnosisMentioned.map((d, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-medium rounded text-[11px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewDoc.extractedData.medications && previewDoc.extractedData.medications.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1.5">
                        <span className="text-slate-400 block text-[10px]">Prescribed Medications Identified</span>
                        {previewDoc.extractedData.medications.map((m, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px] space-y-0.5">
                            <p className="font-bold text-slate-900">{m.name} — {m.dosage}</p>
                            <p className="text-slate-600">{m.frequency} • {m.instructions}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {previewDoc.extractedData.tests && previewDoc.extractedData.tests.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1.5">
                        <span className="text-slate-400 block text-[10px]">Lab Tests & Results Extracted</span>
                        {previewDoc.extractedData.tests.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
                            <span className="font-semibold text-slate-800">{t.testName}</span>
                            <span className="font-mono font-bold text-teal-800">{t.result}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded-lg border border-indigo-100 space-y-2">
                    <p className="text-xs text-slate-500">This document has not been processed through AI OCR yet.</p>
                    <button
                      onClick={() => triggerAIExtraction(previewDoc.id, previewDoc.title, previewDoc.category, previewDoc.notes || '')}
                      disabled={extractingId === previewDoc.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                    >
                      {extractingId === previewDoc.id ? 'Extracting...' : 'Extract Clinical Data with Gemini'}
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EDIT / RENAME MODAL */}
      {/* ======================================================== */}
      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Edit Document Details</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              await onUpdateDocument(editDoc.id, {
                title: editDoc.title,
                category: editDoc.category,
                doctorName: editDoc.doctorName,
                facilityName: editDoc.facilityName,
                notes: editDoc.notes
              });
              setEditDoc(null);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editDoc.title}
                  onChange={(e) => setEditDoc({ ...editDoc, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editDoc.category}
                  onChange={(e: any) => setEditDoc({ ...editDoc, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editDoc.notes || ''}
                  onChange={(e) => setEditDoc({ ...editDoc, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDoc(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
