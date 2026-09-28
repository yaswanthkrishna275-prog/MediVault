import React, { useState } from 'react';
import { 
  Stethoscope, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Activity, 
  HelpCircle,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { SymptomAssessment } from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  onSaveAssessment: (assessment: Omit<SymptomAssessment, 'id' | 'createdAt'>) => Promise<SymptomAssessment>;
  onTriggerEmergencyModal: (notice?: string) => void;
  userId: string;
}

export const SymptomAssessmentView: React.FC<Props> = ({
  onSaveAssessment,
  onTriggerEmergencyModal,
  userId
}) => {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [duration, setDuration] = useState('3 days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [ageGroup, setAgeGroup] = useState<'Child' | 'Adolescent' | 'Adult' | 'Senior'>('Adult');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<SymptomAssessment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) {
      setError('Please describe your symptoms.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsInput,
          duration,
          severity,
          ageGroup,
          additionalInfo: additionalContext
        })
      });

      if (!res.ok) {
        throw new Error('Symptom assessment service temporarily unavailable.');
      }

      const data = await res.json();

      const assessmentRecord: Omit<SymptomAssessment, 'id' | 'createdAt'> = {
        userId,
        symptoms: symptomsInput,
        duration,
        severity,
        ageGroup,
        additionalInfo: additionalContext,
        symptomsIdentified: data.symptomsIdentified || data.symptoms_identified || [symptomsInput],
        bodySystem: data.bodySystem || data.body_system,
        primaryCategory: data.primaryCategory || data.primary_category || 'General Health Assessment',
        confidence: data.confidence ?? (data.recommended_specialty ? data.recommended_specialty.confidence : undefined),
        needsMoreInformation: data.needsMoreInformation ?? data.needs_more_information ?? false,
        followUpQuestions: data.followUpQuestions || data.follow_up_questions || [],
        possibleHealthCategories: data.possibleHealthCategories || (data.possible_health_categories ? data.possible_health_categories.map((c: any) => typeof c === 'string' ? c : c.name) : []),
        possibleConditions: data.possibleConditions || (data.possible_health_categories ? data.possible_health_categories.map((c: any) => typeof c === 'string' ? c : `${c.name}: ${c.description}`) : []),
        suggestedSpecialty: data.suggestedSpecialty || (data.recommended_specialty ? data.recommended_specialty.name : 'General Physician'),
        specialtyReason: data.specialtyReason || (data.recommended_specialty ? data.recommended_specialty.reason : ''),
        warningSigns: data.warningSigns || (data.warning_signs ? data.warning_signs.map((w: any) => typeof w === 'string' ? w : `${w.sign} — ${w.reason}`) : []),
        warningSignDetails: data.warningSignDetails || data.warning_signs || [],
        generalInformation: data.generalInformation || (Array.isArray(data.general_guidance) ? data.general_guidance.join(' ') : 'Ensure adequate rest, hydration, and medical review.'),
        isEmergency: data.isEmergency || (data.emergency ? data.emergency.is_emergency : false),
        emergencyNotice: data.emergencyNotice || (data.emergency ? data.emergency.message : ''),
        disclaimer: data.disclaimer || 'This tool provides general educational health information and does not provide a medical diagnosis.'
      };

      const saved = await onSaveAssessment(assessmentRecord);
      setAssessmentResult(saved);

      if (data.isEmergency) {
        onTriggerEmergencyModal(data.emergencyNotice || (data.emergency ? data.emergency.message : ''));
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to complete assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptomsInput('');
    setAdditionalContext('');
    setAssessmentResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">AI Symptom Assessment & Clinical Guidance</h1>
        </div>
        <p className="text-xs text-slate-500">
          Enter what you are experiencing to receive structured health category insights and specialist recommendations.
        </p>
      </div>

      {/* Mandatory Safety Notice */}
      <MedicalDisclaimer variant="banner" />

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Describe Symptoms</h2>
            <span className="text-[10px] text-slate-400">Step 1 of 2</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Symptoms *
              </label>
              <textarea
                rows={4}
                required
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="e.g. I have had a dry cough, low-grade fever and mild sore throat for 3 days. Feeling fatigued."
                className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Be as specific as possible regarding sensations, triggers, or timing.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                >
                  <option value="Few hours">Few hours</option>
                  <option value="1-2 days">1 - 2 days</option>
                  <option value="3-5 days">3 - 5 days</option>
                  <option value="1-2 weeks">1 - 2 weeks</option>
                  <option value="More than 2 weeks">More than 2 weeks</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e: any) => setSeverity(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                >
                  <option value="Mild">Mild (Noticeable)</option>
                  <option value="Moderate">Moderate (Interferes with day)</option>
                  <option value="Severe">Severe (Debilitating)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age Group</label>
                <select
                  value={ageGroup}
                  onChange={(e: any) => setAgeGroup(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                >
                  <option value="Child">Child (0-12 yrs)</option>
                  <option value="Adolescent">Adolescent (13-18 yrs)</option>
                  <option value="Adult">Adult (19-64 yrs)</option>
                  <option value="Senior">Senior (65+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical History / Allergies</label>
                <input
                  type="text"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. Asthmatic, Penicillin allergy"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Clinical Context with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Symptoms & Get Guidance</span>
                </>
              )}
            </button>

            {/* Quick pre-fill examples */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Try semantic & open-world tests:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('skin');
                    setDuration('1-2 days');
                    setSeverity('Mild');
                  }}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded text-[10px] font-medium"
                >
                  "skin" (Broad Input Test)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('something wrong with my skin, red patches and irritation');
                    setDuration('3-5 days');
                    setSeverity('Moderate');
                  }}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded text-[10px] font-medium"
                >
                  Natural Skin Phrasing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('my teeth are hurting when I chew');
                    setDuration('1-2 days');
                    setSeverity('Moderate');
                  }}
                  className="px-2 py-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded text-[10px] font-medium"
                >
                  Dental Natural Language
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('my ear feels blocked and ringing');
                    setDuration('3-5 days');
                    setSeverity('Mild');
                  }}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded text-[10px] font-medium"
                >
                  ENT Blocked Ear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('I do not feel well, mild fever and feeling tired all over');
                    setDuration('1-2 days');
                    setSeverity('Mild');
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                >
                  Constitutional (General Physician)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSymptomsInput('Sudden crushing chest tightness with shortness of breath and cold sweat.');
                    setDuration('Few hours');
                    setSeverity('Severe');
                  }}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-[10px] font-bold"
                >
                  Emergency Red-Flag
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Structured AI Assessment Results */}
        <div className="lg:col-span-7 space-y-4">
          
          {!assessmentResult ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Awaiting Symptom Submission</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Fill in your symptoms on the left to receive structured probabilistic health categories, specialist referral advice, and clinical safety warning flags.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 animate-in fade-in duration-300">
              
              {/* Emergency Banner if triggered */}
              {assessmentResult.isEmergency && (
                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-950 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-700 text-sm">
                    <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                    <span>Urgent Medical Attention Advised</span>
                  </div>
                  <p className="leading-relaxed">
                    {assessmentResult.emergencyNotice || 'These symptoms may indicate an acute health condition. Seek emergency medical care immediately.'}
                  </p>
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Emergency (112 / 911)</span>
                  </a>
                </div>
              )}

              {/* Assessment Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Clinical Evaluation Report
                    </span>
                    {assessmentResult.bodySystem && (
                      <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {assessmentResult.bodySystem}
                      </span>
                    )}
                    {assessmentResult.primaryCategory && (
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {assessmentResult.primaryCategory}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Structured Health Assessment
                  </h3>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  New Assessment
                </button>
              </div>

              {/* 1. Symptoms Identified */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Symptoms Identified
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assessmentResult.symptomsIdentified.map((sym, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. Suggested Specialist Card */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                      Recommended Clinical Specialty
                    </span>
                    {assessmentResult.confidence !== undefined && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded">
                        Confidence: {Math.round(assessmentResult.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-teal-950">
                    {assessmentResult.suggestedSpecialty}
                  </p>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    {assessmentResult.specialtyReason || "Consult an in-person specialist for physical examination and objective diagnostic testing."}
                  </p>
                </div>
              </div>

              {/* 2b. Ambiguity Handling & Follow-up Questions Panel */}
              {assessmentResult.followUpQuestions && assessmentResult.followUpQuestions.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {assessmentResult.needsMoreInformation
                        ? "Additional Information Needed to Narrow Assessment"
                        : "Recommended Follow-Up Questions"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {assessmentResult.needsMoreInformation
                      ? "The complaint provided is broad or ambiguous. Answering these clinical questions will help clarify your symptoms:"
                      : "Consider preparing answers to these questions before seeing your doctor:"}
                  </p>
                  <ul className="space-y-1 list-disc pl-4 text-xs text-amber-950 font-medium">
                    {assessmentResult.followUpQuestions.map((q, idx) => (
                      <li key={idx} className="leading-snug">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Possible Health Categories & Conditions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">
                  Possible Health Categories (Non-Diagnostic)
                </span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <p className="text-slate-500 italic text-[11px]">
                    &quot;Possible health conditions that may be associated with these symptoms include:&quot;
                  </p>
                  <ul className="space-y-1 list-disc pl-4 text-slate-800">
                    {assessmentResult.possibleConditions.map((cond, idx) => (
                      <li key={idx} className="leading-snug">{cond}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4. Warning Signs (Red Flags) */}
              {assessmentResult.warningSigns && assessmentResult.warningSigns.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Warning Signs Requiring Urgent Evaluation
                  </span>
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1 text-amber-900">
                    {assessmentResult.warningSigns.map((sign, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{sign}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Supportive General Care */}
              {assessmentResult.generalInformation && (
                <div className="space-y-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block">General Supportive Self-Care:</span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {assessmentResult.generalInformation}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                {assessmentResult.disclaimer}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
