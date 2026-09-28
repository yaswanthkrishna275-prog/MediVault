import React, { useState } from 'react';
import { 
  Pill, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import { Medication } from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  medications: Medication[];
  onAddMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => Promise<Medication>;
  onToggleMedication: (id: string, isActive: boolean) => Promise<void>;
  onDeleteMedication: (id: string) => Promise<void>;
  userId: string;
}

export const MedicationAssistantView: React.FC<Props> = ({
  medications,
  onAddMedication,
  onToggleMedication,
  onDeleteMedication,
  userId
}) => {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [medicineQuery, setMedicineQuery] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Add Medication Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Twice daily');
  const [timing, setTiming] = useState<'Before Food' | 'After Food' | 'With Food' | 'As Needed'>('After Food');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState('');
  const [instructions, setInstructions] = useState('');
  const [purpose, setPurpose] = useState('');

  // Explain Prescription / Medicine via Gemini API
  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineQuery.trim() && !prescriptionText.trim()) {
      setError('Please provide at least a medicine or supplement name.');
      return;
    }

    setError('');
    setExplaining(true);

    try {
      const res = await fetch('/api/gemini/explain-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: medicineQuery,
          prescriptionText: prescriptionText
        })
      });

      if (!res.ok) throw new Error('Medication explainer service unavailable.');
      const data = await res.json();
      setExplanationResult(data);

      // Pre-fill modal fields if the user wants to log this medication into their tracker
      setName(data.medicine_name || medicineQuery);
      setPurpose(data.what_it_is || (data.common_uses && data.common_uses[0]) || '');
      const genInfo = data.general_use_information;
      const genUseSummary = typeof genInfo === 'object' && genInfo !== null
        ? [
            genInfo.frequency,
            genInfo.time_of_day,
            genInfo.food || genInfo.food_timing,
            genInfo.how_to_use || genInfo.administration,
            genInfo.additional_timing
          ].filter(Boolean).join('. ')
        : (typeof genInfo === 'string' ? genInfo : '');
      setInstructions(data.prescription_explanation || genUseSummary || prescriptionText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to explain medication.');
    } finally {
      setExplaining(false);
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    await onAddMedication({
      userId,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      timing,
      startDate,
      prescribingDoctor: doctor.trim() || undefined,
      instructions: instructions.trim(),
      purpose: purpose.trim() || undefined,
      isActive: true
    });

    setIsAddOpen(false);
    setName('');
    setDosage('');
    setDoctor('');
    setInstructions('');
    setPurpose('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">Medication Assistant & Schedule Tracker</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Understand your prescribed drugs, decipher doctor instructions, and maintain an organized medication schedule.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescribed Medicine</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <MedicalDisclaimer variant="banner" />

      {/* Two Column Grid: Explainer on Left / Active Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Prescription Explainer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Medicine & Prescription Explainer
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleExplain} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Medicine / Supplement Name *
                </label>
                <input
                  type="text"
                  required
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                  placeholder="e.g. Glucosamine, Paracetamol, or Amoxicillin"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prescription Note / Doctor Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="Optional — e.g. 1 tab twice daily after food for 5 days (leave empty if you don't have one)"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={explaining}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {explaining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Medicine & Instructions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Explain Medicine & Guidance</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>MediVault provides general medicine knowledge and interprets written prescriptions; it never invents dosages or alters doctor regimens.</span>
              </div>
            </form>
          </div>

          {/* AI Explanation Output Card */}
          {explanationResult && (
            <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Patient-Friendly Interpretation
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 capitalize">
                    {explanationResult.medicine_name || medicineQuery}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs"
                >
                  Save to Schedule
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 1. What It Is */}
                {explanationResult.what_it_is && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      What It Is
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{explanationResult.what_it_is}</p>
                  </div>
                )}

                {/* 2. What It Is Commonly Used For */}
                {explanationResult.common_uses && explanationResult.common_uses.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      What It Is Commonly Used For
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {explanationResult.common_uses.map((use: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{use}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. General Use Information */}
                {explanationResult.general_use_information && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      General Use Information
                    </h4>
                    {typeof explanationResult.general_use_information === 'object' && explanationResult.general_use_information !== null ? (
                      <div className="space-y-2 text-slate-700">
                        {explanationResult.general_use_information.frequency && (
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">Frequency:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {explanationResult.general_use_information.frequency}
                            </p>
                          </div>
                        )}
                        {explanationResult.general_use_information.time_of_day && (
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">Time of day:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {explanationResult.general_use_information.time_of_day}
                            </p>
                          </div>
                        )}
                        {(explanationResult.general_use_information.food || explanationResult.general_use_information.food_timing) && (
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">Food:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {explanationResult.general_use_information.food || explanationResult.general_use_information.food_timing}
                            </p>
                          </div>
                        )}
                        {(explanationResult.general_use_information.how_to_use || explanationResult.general_use_information.administration) && (
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">How to use:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {explanationResult.general_use_information.how_to_use || explanationResult.general_use_information.administration}
                            </p>
                          </div>
                        )}
                        {explanationResult.general_use_information.additional_timing && (
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">Timing & Precautions:</span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {explanationResult.general_use_information.additional_timing}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{explanationResult.general_use_information}</p>
                    )}
                  </div>
                )}

                {/* 4. Common Side Effects (If Experienced) */}
                {explanationResult.common_side_effects && explanationResult.common_side_effects.length > 0 && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Common Side Effects (If Experienced)
                    </h4>
                    <p className="text-[10px] text-slate-500 italic">Some people may experience:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {explanationResult.common_side_effects.map((item: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Prescription Instructions (ONLY IF USER PROVIDED A PRESCRIPTION) */}
                {explanationResult.prescription_explanation && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider">
                        Prescription Instructions
                      </span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 font-semibold px-1.5 py-0.2 rounded">
                        From Your Note
                      </span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed font-medium">
                      {explanationResult.prescription_explanation}
                    </p>
                  </div>
                )}

                {/* 6. Final Note */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-950 text-[11px] leading-relaxed space-y-1">
                  <span className="font-bold block text-amber-900 uppercase tracking-wider text-[10px]">
                    Final Note
                  </span>
                  <p className="text-amber-800">
                    {explanationResult.final_note || "General medicine information is provided for educational purposes. For your individual situation, consider your doctor's or pharmacist's advice, especially if you are unsure about the dose, timing, food instructions, or how to use the medicine."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Medications Schedule */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Medication Regimens ({medications.length})
                </h2>
              </div>
            </div>

            {medications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Pill className="w-8 h-8 mx-auto text-slate-300" />
                <p>No medications recorded in your schedule.</p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs"
                >
                  Add Your First Medicine
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      med.isActive 
                        ? 'border-emerald-200 bg-white shadow-2xs' 
                        : 'border-slate-200 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{med.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                          {med.frequency} • <span className="font-normal text-slate-600">{med.timing}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleMedication(med.id, !med.isActive)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            med.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {med.isActive ? 'Active' : 'Completed'}
                        </button>

                        <button
                          onClick={() => onDeleteMedication(med.id)}
                          className="p-1 text-slate-300 hover:text-red-500 rounded"
                          title="Delete medication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {med.instructions && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                        &quot;{med.instructions}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Started: {med.startDate}</span>
                      {med.prescribingDoctor && <span>Dr: {med.prescribingDoctor}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Medication Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Add Medication to Tracker</h3>
            
            <form onSubmit={handleSaveMedication} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Once a week">Once a week</option>
                    <option value="As needed (SOS)">As needed (SOS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Timing</label>
                  <select
                    value={timing}
                    onChange={(e: any) => setTiming(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="After Food">After Food</option>
                    <option value="Before Food">Before Food</option>
                    <option value="With Food">With Food</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prescribing Doctor</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Sharma"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specific Written Instructions</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with warm water for 5 days."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

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
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
