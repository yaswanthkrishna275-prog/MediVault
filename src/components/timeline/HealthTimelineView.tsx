import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  FileText, 
  Stethoscope, 
  Hospital, 
  Pill, 
  Activity, 
  Trash2, 
  ExternalLink, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { TimelineEvent, MedicalDocument } from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  events: TimelineEvent[];
  documents: MedicalDocument[];
  onAddEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<TimelineEvent>;
  onDeleteEvent: (id: string) => Promise<void>;
  onViewDocument: (doc: MedicalDocument) => void;
  userId: string;
}

const EVENT_TYPES = [
  'Doctor Consultation',
  'Lab Test',
  'Prescription',
  'Hospital Visit',
  'Diagnosis',
  'Medication',
  'Follow-up'
] as const;

export const HealthTimelineView: React.FC<Props> = ({
  events,
  documents,
  onAddEvent,
  onDeleteEvent,
  onViewDocument,
  userId
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<TimelineEvent['eventType']>('Doctor Consultation');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [facility, setFacility] = useState('');
  const [relatedDocId, setRelatedDocId] = useState('');

  const filteredEvents = events.filter(e => 
    selectedType === 'ALL' || e.eventType === selectedType
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    await onAddEvent({
      userId,
      title: title.trim(),
      eventType,
      date,
      description: description.trim(),
      doctorOrFacility: facility.trim() || undefined,
      relatedDocumentId: relatedDocId || undefined
    });

    setIsAddOpen(false);
    setTitle('');
    setDescription('');
    setFacility('');
    setRelatedDocId('');
  };

  const getEventIcon = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'Doctor Consultation':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'Lab Test':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Prescription':
      case 'Medication':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'Hospital Visit':
        return <Hospital className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Chronological Care Timeline</h1>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {events.length} Milestones
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete longitudinal history of consultations, tests, prescriptions, and health diagnoses.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Health Event</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold text-[11px] shrink-0 pl-1">Filter by:</span>
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedType === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Events ({events.length})
        </button>
        {EVENT_TYPES.map((type) => {
          const count = events.filter(e => e.eventType === type).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{type}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p>No health events found in this category.</p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:inset-0 before:left-3 md:before:left-4 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((evt) => {
            const relatedDoc = documents.find(d => d.id === evt.relatedDocumentId);

            return (
              <div key={evt.id} className="relative group">
                
                {/* Node Dot on Timeline */}
                <div className="absolute -left-6 md:-left-8 top-1.5 w-7 h-7 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 flex items-center justify-center shadow-xs transition-colors z-10">
                  {getEventIcon(evt.eventType)}
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {evt.eventType}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{evt.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        <span>{evt.date}</span>
                      </div>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        title="Delete milestone"
                        className="p-1 text-slate-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    {evt.doctorOrFacility ? (
                      <span className="text-slate-500 font-medium">
                        Institution / Physician: <strong className="text-slate-700">{evt.doctorOrFacility}</strong>
                      </span>
                    ) : (
                      <span></span>
                    )}

                    {relatedDoc && (
                      <button
                        onClick={() => onViewDocument(relatedDoc)}
                        className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document ({relatedDoc.category})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Health Event Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Add Health Timeline Event</h3>
            
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow-up Cardiology Consult"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor or Facility Name</label>
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Sharma / Apollo Hospital"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Details / Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Blood pressure 120/80 mmHg. Advised moderate aerobic exercise and dietary sodium reduction."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {documents.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Vault Document (Optional)</label>
                  <select
                    value={relatedDocId}
                    onChange={(e) => setRelatedDocId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="">-- No linked document --</option>
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>{d.title} ({d.category})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Save Milestone
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
