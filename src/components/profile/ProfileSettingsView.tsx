import React, { useState } from 'react';
import { 
  UserCheck, 
  Shield, 
  Phone, 
  MapPin, 
  Heart, 
  AlertTriangle, 
  Check, 
  Save, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  profile: UserProfile | null;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onResetDemoData: () => void;
}

export const ProfileSettingsView: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onResetDemoData
}) => {
  const { isDemoUser, logout } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O+');
  const [city, setCity] = useState(profile?.city || 'Bengaluru');
  const [country, setCountry] = useState(profile?.country || 'India');
  
  // Emergency contact
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContact?.phone || '');
  const [emergencyRel, setEmergencyRel] = useState(profile?.emergencyContact?.relationship || 'Parent');

  // Medical tags
  const [allergies, setAllergies] = useState((profile?.knownAllergies || []).join(', '));
  const [conditions, setConditions] = useState((profile?.chronicConditions || []).join(', '));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const allergiesArr = allergies.split(',').map(s => s.trim()).filter(Boolean);
    const conditionsArr = conditions.split(',').map(s => s.trim()).filter(Boolean);

    await onUpdateProfile({
      displayName,
      dateOfBirth,
      bloodGroup,
      city,
      country,
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRel
      },
      knownAllergies: allergiesArr,
      chronicConditions: conditionsArr
    });

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-900">Patient Profile & Safety Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your emergency contacts, blood group, allergies, and location preferences for clinical accuracy.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile Updated Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details & Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Personal & Demographic Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default City (Search Area)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email (Authenticated)</label>
              <input
                type="text"
                disabled
                value={profile?.email || 'yaswanth.student@medivault.edu'}
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2.5 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Emergency SOS Contact */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Phone className="w-4 h-4 text-red-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Emergency Contact (Clinical SOS)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. Sriram Raman"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                placeholder="e.g. Parent / Spouse / Sibling"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Known Allergies & Health Conditions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Medical Profile & Health Alerts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Known Drug / Environmental Allergies (comma separated)
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
              <p className="text-[10px] text-slate-400 mt-1">Cross-checked during symptom guidance and medication reviews.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chronic Health Conditions (comma separated)
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Mild Asthma, Hypertension, Type 2 Diabetes"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
              <p className="text-[10px] text-slate-400 mt-1">Informs general self-care recommendations.</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

      {/* Demo State & Academic Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Academic Project Environment & Reset
        </h3>
        <p className="text-xs text-slate-500">
          For project evaluation and viva defense: You can restore sample verified clinical documents, active prescriptions, and care milestones at any time.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (confirm('Reset to default pre-populated B.Tech sample records?')) {
                onResetDemoData();
              }
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Records & Timeline</span>
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ml-auto"
          >
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>

      <MedicalDisclaimer variant="footer" />

    </div>
  );
};
