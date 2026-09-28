export type DocumentCategory = 
  | 'Prescription'
  | 'Lab Report'
  | 'Scan'
  | 'Hospital Record'
  | 'Discharge Summary'
  | 'Doctor Note'
  | 'Other';

export interface MedicalDocument {
  id: string;
  userId: string;
  title: string;
  category: DocumentCategory;
  date: string;
  doctorName?: string;
  facilityName?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  notes?: string;
  tags?: string[];
  extractedData?: ExtractedDocumentData;
  isExtracted?: boolean;
  createdAt: string;
}

export interface ExtractedDocumentData {
  doctorName?: string;
  hospitalName?: string;
  date?: string;
  diagnosisMentioned?: string[];
  medications?: {
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
  }[];
  tests?: {
    testName: string;
    result?: string;
    normalRange?: string;
  }[];
  followUpDate?: string;
  confidenceNote: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: 'Before Food' | 'After Food' | 'With Food' | 'As Needed';
  startDate: string;
  endDate?: string;
  prescribingDoctor?: string;
  instructions: string;
  purpose?: string;
  isActive: boolean;
  documentId?: string;
  createdAt: string;
}

export interface SymptomAssessment {
  id: string;
  userId: string;
  symptoms: string;
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  ageGroup: 'Child' | 'Adolescent' | 'Adult' | 'Senior';
  additionalInfo?: string;
  symptomsIdentified: string[];
  bodySystem?: string;
  primaryCategory?: string;
  confidence?: number;
  needsMoreInformation?: boolean;
  followUpQuestions?: string[];
  possibleHealthCategories: string[];
  possibleConditions: string[];
  suggestedSpecialty: string;
  specialtyReason?: string;
  warningSigns: string[];
  warningSignDetails?: { sign: string; reason: string; urgency: string }[];
  generalInformation: string;
  isEmergency: boolean;
  emergencyNotice?: string;
  disclaimer: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  userId: string;
  title: string;
  eventType: 'Doctor Consultation' | 'Lab Test' | 'Prescription' | 'Hospital Visit' | 'Diagnosis' | 'Medication' | 'Follow-up';
  date: string;
  description: string;
  doctorOrFacility?: string;
  relatedDocumentId?: string;
  createdAt: string;
}

export interface SharedRecord {
  id: string;
  userId: string;
  shareTitle: string;
  recipientDoctorOrEntity: string;
  documentIds: string[];
  documentsSnapshot?: Partial<MedicalDocument>[];
  accessCode: string;
  expiresAt: string; // ISO String
  isRevoked: boolean;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  knownAllergies?: string[];
  chronicConditions?: string[];
  city?: string;
  country?: string;
}

