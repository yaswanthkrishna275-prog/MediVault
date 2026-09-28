import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  MedicalDocument, 
  Medication, 
  SymptomAssessment, 
  TimelineEvent, 
  SharedRecord 
} from '../types';

// Local storage key prefixes for demo/offline resilience
const LS_DOCS_KEY = 'medivault_local_docs';
const LS_MEDS_KEY = 'medivault_local_meds';
const LS_SYMPTOMS_KEY = 'medivault_local_symptoms';
const LS_TIMELINE_KEY = 'medivault_local_timeline';
const LS_SHARES_KEY = 'medivault_local_shares';

// Sample pre-populated healthcare data for instant demonstration
export const SAMPLE_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc-sample-1',
    userId: 'demo_user_btech_2026',
    title: 'Post-Operative Recovery Prescription',
    category: 'Prescription',
    date: '2026-09-15',
    doctorName: 'Dr. Ramesh Sharma, MD (Internal Medicine)',
    facilityName: 'Apollo City Hospital',
    fileUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    fileName: 'prescription_dr_sharma_sept2026.pdf',
    fileSize: 420000,
    fileType: 'application/pdf',
    notes: 'Prescribed for acute bronchitis and seasonal allergy symptoms.',
    tags: ['Respiratory', 'Prescription', 'Antibiotic'],
    isExtracted: true,
    extractedData: {
      doctorName: 'Dr. Ramesh Sharma, MD',
      hospitalName: 'Apollo City Hospital',
      date: '2026-09-15',
      diagnosisMentioned: ['Acute Bronchitis', 'Allergic Rhinitis'],
      medications: [
        { name: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '1 tablet', frequency: 'Twice daily', instructions: 'Take after food for 5 consecutive days' },
        { name: 'Montelukast + Levocetirizine', dosage: '1 tablet', frequency: 'Once daily at bedtime', instructions: 'Take with warm water' }
      ],
      tests: [
        { testName: 'Chest X-Ray (PA View)', result: 'Mild bronchial thickening; no active consolidation' }
      ],
      followUpDate: '2026-09-22',
      confidenceNote: 'OCR confidence 98%. Please review prescription instructions with your doctor or pharmacist.'
    },
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'doc-sample-2',
    userId: 'demo_user_btech_2026',
    title: 'Comprehensive Metabolic Panel & Lipid Profile',
    category: 'Lab Report',
    date: '2026-08-20',
    doctorName: 'Dr. Ananya Iyer, MD (Pathology)',
    facilityName: 'Metropolis Diagnostics Center',
    fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80',
    fileName: 'lipid_metabolic_panel_aug2026.pdf',
    fileSize: 680000,
    fileType: 'application/pdf',
    notes: 'Routine annual preventive health checkup.',
    tags: ['Blood Test', 'Lipid', 'Annual Checkup'],
    isExtracted: true,
    extractedData: {
      doctorName: 'Dr. Ananya Iyer',
      hospitalName: 'Metropolis Diagnostics Center',
      date: '2026-08-20',
      diagnosisMentioned: ['Borderline High Total Cholesterol'],
      tests: [
        { testName: 'Fasting Blood Glucose', result: '92 mg/dL', normalRange: '70 - 99 mg/dL' },
        { testName: 'HbA1c', result: '5.4 %', normalRange: 'Below 5.7 % (Normal)' },
        { testName: 'Total Cholesterol', result: '208 mg/dL', normalRange: '< 200 mg/dL (Desirable)' },
        { testName: 'HDL (Good) Cholesterol', result: '52 mg/dL', normalRange: '> 40 mg/dL' },
        { testName: 'LDL (Bad) Cholesterol', result: '130 mg/dL', normalRange: '< 100 mg/dL' }
      ],
      followUpDate: '2026-11-20',
      confidenceNote: 'Extracted with high confidence from certified laboratory report.'
    },
    createdAt: '2026-08-20T14:30:00Z'
  },
  {
    id: 'doc-sample-3',
    userId: 'demo_user_btech_2026',
    title: 'Lumbar Spine Digital X-Ray Examination',
    category: 'Scan',
    date: '2026-06-11',
    doctorName: 'Dr. Vivek Menon, MS Ortho',
    facilityName: 'Fortis Multi-Specialty Hospital',
    fileUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    fileName: 'lumbar_spine_xray_june2026.pdf',
    fileSize: 1250000,
    fileType: 'application/pdf',
    notes: 'Evaluated for mild lower back stiffness after ergonomic strain.',
    tags: ['Orthopedics', 'X-Ray', 'Spine'],
    isExtracted: true,
    extractedData: {
      doctorName: 'Dr. Vivek Menon',
      hospitalName: 'Fortis Multi-Specialty Hospital',
      date: '2026-06-11',
      diagnosisMentioned: ['Normal vertebral alignment; early lumbar muscular strain'],
      followUpDate: 'As needed',
      confidenceNote: 'Radiological summary verified.'
    },
    createdAt: '2026-06-11T09:15:00Z'
  }
];

export const SAMPLE_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    userId: 'demo_user_btech_2026',
    name: 'Amoxicillin + Clavulanic Acid',
    dosage: '625 mg',
    frequency: 'Twice a day (Every 12 hours)',
    timing: 'After Food',
    startDate: '2026-09-15',
    endDate: '2026-09-20',
    prescribingDoctor: 'Dr. Ramesh Sharma',
    instructions: 'Complete full 5-day course even if symptoms improve early. Stay well hydrated.',
    purpose: 'Bacterial respiratory infection control',
    isActive: true,
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'med-2',
    userId: 'demo_user_btech_2026',
    name: 'Montelukast + Levocetirizine',
    dosage: '10mg / 5mg',
    frequency: 'Once a day at bedtime',
    timing: 'After Food',
    startDate: '2026-09-15',
    endDate: '2026-09-25',
    prescribingDoctor: 'Dr. Ramesh Sharma',
    instructions: 'Take 30 minutes before sleep to avoid mild daytime drowsiness.',
    purpose: 'Relief from allergic sneezing and airway inflammation',
    isActive: true,
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'med-3',
    userId: 'demo_user_btech_2026',
    name: 'Vitamin D3 (Cholecalciferol)',
    dosage: '60,000 IU',
    frequency: 'Once a week (Sunday morning)',
    timing: 'With Food',
    startDate: '2026-08-25',
    endDate: '2026-10-25',
    prescribingDoctor: 'Dr. Ananya Iyer',
    instructions: 'Take with a glass of milk or healthy dietary fats for optimal absorption.',
    purpose: 'Bone density and general immune maintenance',
    isActive: true,
    createdAt: '2026-08-25T11:00:00Z'
  }
];

export const SAMPLE_TIMELINE: TimelineEvent[] = [
  {
    id: 'time-1',
    userId: 'demo_user_btech_2026',
    title: 'Consultation for Persistent Cough & Sore Throat',
    eventType: 'Doctor Consultation',
    date: '2026-09-15',
    description: 'Dr. Ramesh Sharma diagnosed acute bronchitis with seasonal allergic exacerbation. Prescribed 5-day antibiotic regimen and anti-histamine.',
    doctorOrFacility: 'Apollo City Hospital',
    relatedDocumentId: 'doc-sample-1',
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'time-2',
    userId: 'demo_user_btech_2026',
    title: 'Annual Preventive Health & Lipid Screening',
    eventType: 'Lab Test',
    date: '2026-08-20',
    description: 'Metabolic panel, HbA1c, and fasting lipid panel. Blood sugar normal (5.4% HbA1c), borderline LDL cholesterol noted.',
    doctorOrFacility: 'Metropolis Diagnostics Center',
    relatedDocumentId: 'doc-sample-2',
    createdAt: '2026-08-20T14:30:00Z'
  },
  {
    id: 'time-3',
    userId: 'demo_user_btech_2026',
    title: 'Orthopedic Spine Assessment',
    eventType: 'Doctor Consultation',
    date: '2026-06-11',
    description: 'Lower back stiffness evaluated with digital X-Ray. Muscular strain identified; advised ergonomic chair adjustment and core mobility stretches.',
    doctorOrFacility: 'Fortis Multi-Specialty Hospital',
    relatedDocumentId: 'doc-sample-3',
    createdAt: '2026-06-11T09:15:00Z'
  }
];

// Helper to handle local sync for resilience
function getLocalItems<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return defaults;
  }
}

function setLocalItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

export const dbService = {
  // MEDICAL DOCUMENTS
  async getDocuments(userId: string): Promise<MedicalDocument[]> {
    try {
      const q = query(
        collection(db, 'medicalDocuments'), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MedicalDocument));
        return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (err) {
      console.warn('Firestore fetch docs error, using local/sample store:', err);
    }

    const local = getLocalItems<MedicalDocument>(LS_DOCS_KEY, SAMPLE_DOCUMENTS);
    return local.filter(d => d.userId === userId || userId === 'demo_user_btech_2026');
  },

  async addDocument(docData: Omit<MedicalDocument, 'id' | 'createdAt'>): Promise<MedicalDocument> {
    const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newDoc: MedicalDocument = {
      ...docData,
      id,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'medicalDocuments', id), newDoc);
    } catch (err) {
      console.warn('Firestore save doc error, saving locally:', err);
    }

    const current = getLocalItems<MedicalDocument>(LS_DOCS_KEY, SAMPLE_DOCUMENTS);
    setLocalItems(LS_DOCS_KEY, [newDoc, ...current]);
    return newDoc;
  },

  async updateDocument(id: string, updates: Partial<MedicalDocument>): Promise<void> {
    try {
      await updateDoc(doc(db, 'medicalDocuments', id), updates);
    } catch (err) {
      console.warn('Firestore update doc error, updating locally:', err);
    }

    const current = getLocalItems<MedicalDocument>(LS_DOCS_KEY, SAMPLE_DOCUMENTS);
    const updated = current.map(d => d.id === id ? { ...d, ...updates } : d);
    setLocalItems(LS_DOCS_KEY, updated);
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'medicalDocuments', id));
    } catch (err) {
      console.warn('Firestore delete doc error, deleting locally:', err);
    }

    const current = getLocalItems<MedicalDocument>(LS_DOCS_KEY, SAMPLE_DOCUMENTS);
    setLocalItems(LS_DOCS_KEY, current.filter(d => d.id !== id));
  },

  // MEDICATIONS
  async getMedications(userId: string): Promise<Medication[]> {
    try {
      const q = query(collection(db, 'medications'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Medication));
      }
    } catch (err) {
      console.warn('Firestore fetch meds error, using local fallback:', err);
    }

    const local = getLocalItems<Medication>(LS_MEDS_KEY, SAMPLE_MEDICATIONS);
    return local.filter(m => m.userId === userId || userId === 'demo_user_btech_2026');
  },

  async addMedication(medData: Omit<Medication, 'id' | 'createdAt'>): Promise<Medication> {
    const id = 'med_' + Date.now();
    const newMed: Medication = {
      ...medData,
      id,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'medications', id), newMed);
    } catch (err) {
      console.warn('Firestore add med error, saving locally:', err);
    }

    const current = getLocalItems<Medication>(LS_MEDS_KEY, SAMPLE_MEDICATIONS);
    setLocalItems(LS_MEDS_KEY, [newMed, ...current]);
    return newMed;
  },

  async toggleMedicationActive(id: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'medications', id), { isActive });
    } catch (err) {
      console.warn('Firestore toggle med error:', err);
    }

    const current = getLocalItems<Medication>(LS_MEDS_KEY, SAMPLE_MEDICATIONS);
    setLocalItems(LS_MEDS_KEY, current.map(m => m.id === id ? { ...m, isActive } : m));
  },

  async deleteMedication(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'medications', id));
    } catch (err) {
      console.warn('Firestore delete med error:', err);
    }

    const current = getLocalItems<Medication>(LS_MEDS_KEY, SAMPLE_MEDICATIONS);
    setLocalItems(LS_MEDS_KEY, current.filter(m => m.id !== id));
  },

  // SYMPTOM ASSESSMENTS
  async getSymptomAssessments(userId: string): Promise<SymptomAssessment[]> {
    try {
      const q = query(collection(db, 'symptomAssessments'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SymptomAssessment));
      }
    } catch (err) {
      console.warn('Firestore fetch symptoms error:', err);
    }

    const local = getLocalItems<SymptomAssessment>(LS_SYMPTOMS_KEY, []);
    return local.filter(s => s.userId === userId || userId === 'demo_user_btech_2026');
  },

  async saveSymptomAssessment(assessment: Omit<SymptomAssessment, 'id' | 'createdAt'>): Promise<SymptomAssessment> {
    const id = 'symp_' + Date.now();
    const record: SymptomAssessment = {
      ...assessment,
      id,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'symptomAssessments', id), record);
    } catch (err) {
      console.warn('Firestore save symptoms error:', err);
    }

    const current = getLocalItems<SymptomAssessment>(LS_SYMPTOMS_KEY, []);
    setLocalItems(LS_SYMPTOMS_KEY, [record, ...current]);
    return record;
  },

  // HEALTH TIMELINE
  async getTimelineEvents(userId: string): Promise<TimelineEvent[]> {
    try {
      const q = query(collection(db, 'timelineEvents'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const events = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TimelineEvent));
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (err) {
      console.warn('Firestore fetch timeline error:', err);
    }

    const local = getLocalItems<TimelineEvent>(LS_TIMELINE_KEY, SAMPLE_TIMELINE);
    return local
      .filter(t => t.userId === userId || userId === 'demo_user_btech_2026')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'createdAt'>): Promise<TimelineEvent> {
    const id = 'time_' + Date.now();
    const newEvent: TimelineEvent = {
      ...event,
      id,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'timelineEvents', id), newEvent);
    } catch (err) {
      console.warn('Firestore save timeline error:', err);
    }

    const current = getLocalItems<TimelineEvent>(LS_TIMELINE_KEY, SAMPLE_TIMELINE);
    setLocalItems(LS_TIMELINE_KEY, [newEvent, ...current]);
    return newEvent;
  },

  async deleteTimelineEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'timelineEvents', id));
    } catch (err) {
      console.warn('Firestore delete timeline error:', err);
    }

    const current = getLocalItems<TimelineEvent>(LS_TIMELINE_KEY, SAMPLE_TIMELINE);
    setLocalItems(LS_TIMELINE_KEY, current.filter(t => t.id !== id));
  },

  // SECURE SHARED RECORDS
  async getSharedRecords(userId: string): Promise<SharedRecord[]> {
    try {
      const q = query(collection(db, 'sharedRecords'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SharedRecord));
      }
    } catch (err) {
      console.warn('Firestore fetch shares error:', err);
    }

    const local = getLocalItems<SharedRecord>(LS_SHARES_KEY, []);
    return local.filter(s => s.userId === userId || userId === 'demo_user_btech_2026');
  },

  async createSharedRecord(
    userId: string,
    shareTitle: string,
    recipientDoctorOrEntity: string,
    documentIds: string[],
    durationHours: number,
    documentsSnapshot: Partial<MedicalDocument>[]
  ): Promise<SharedRecord> {
    const id = 'share_' + Math.random().toString(36).substring(2, 9);
    // Generate an easy-to-read 6-digit access code for doctor verification
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    const record: SharedRecord = {
      id,
      userId,
      shareTitle,
      recipientDoctorOrEntity,
      documentIds,
      documentsSnapshot,
      accessCode,
      expiresAt,
      isRevoked: false,
      viewCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'sharedRecords', id), record);
    } catch (err) {
      console.warn('Firestore create share error:', err);
    }

    const current = getLocalItems<SharedRecord>(LS_SHARES_KEY, []);
    setLocalItems(LS_SHARES_KEY, [record, ...current]);
    return record;
  },

  async getSharedRecordById(shareId: string): Promise<SharedRecord | null> {
    try {
      const snap = await getDoc(doc(db, 'sharedRecords', shareId));
      if (snap.exists()) {
        return snap.data() as SharedRecord;
      }
    } catch (err) {
      console.warn('Firestore get share by id error:', err);
    }

    const current = getLocalItems<SharedRecord>(LS_SHARES_KEY, []);
    const found = current.find(s => s.id === shareId);
    return found || null;
  },

  async recordShareView(shareId: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      const ref = doc(db, 'sharedRecords', shareId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const count = (snap.data().viewCount || 0) + 1;
        await updateDoc(ref, { viewCount: count, lastViewedAt: now });
      }
    } catch (err) {
      console.warn('Firestore update share view error:', err);
    }

    const current = getLocalItems<SharedRecord>(LS_SHARES_KEY, []);
    setLocalItems(LS_SHARES_KEY, current.map(s => s.id === shareId ? { ...s, viewCount: s.viewCount + 1, lastViewedAt: now } : s));
  },

  async revokeShare(shareId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'sharedRecords', shareId), { isRevoked: true });
    } catch (err) {
      console.warn('Firestore revoke share error:', err);
    }

    const current = getLocalItems<SharedRecord>(LS_SHARES_KEY, []);
    setLocalItems(LS_SHARES_KEY, current.map(s => s.id === shareId ? { ...s, isRevoked: true } : s));
  }
};
