# MediVault — AI-Powered Personal Healthcare Assistance Platform
## Architectural Blueprint, System Design & Beginner-Friendly Implementation Plan

> **For B.Tech Final-Year Computer Science & Engineering Project**  
> **Student Guide**: Complete step-by-step, zero-assumed-knowledge engineering blueprint.  
> **Core Guarantee**: Fully modular, zero Google Maps dependencies (Leaflet + OpenStreetMap only), medical-safety guardrails, server-side Gemini AI proxy, and strict Firestore isolation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Safety & Architectural Invariants**:
> 1. **Medical Non-Diagnostic Invariant**: MediVault provides informational explanations and categorization only. It will never provide autonomous medical diagnoses, alter dosages, or advise stopping medications. Every AI output is accompanied by clinical disclaimer banners.
> 2. **Maps & Location Independence**: Strictly uses **Leaflet (v1.9+)** and **OpenStreetMap (Nominatim & Overpass API)**. Absolutely no Google Maps JavaScript API, Google Places API, or Google Cloud Maps keys are used.
> 3. **AI Key Security**: The Gemini API key remains strictly server-side (`process.env.GEMINI_API_KEY`) via Express proxy endpoints (`/api/ai/*`). The browser client never touches or stores the API key.
> 4. **Incremental Phased Delivery**: Development proceeds strictly phase-by-phase. Phase 1 begins only with foundational UI navigation, shell layout, and mock state, waiting for your approval at each stage.

---

## 1. Final Technology Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (React 19 + TS)                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                        Tailwind CSS UI                         │   │
│   │  [Dashboard]  [Medical Vault]  [Symptom Assessment]            │   │
│   │  [Medication Assistant]  [Specialist Finder (Leaflet + OSM)]   │   │
│   │  [Health Timeline]  [Share Records]  [Profile & Settings]      │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│            ┌───────────────────────┴──────────────────────┐            │
│            │ Client Services / State Handlers             │            │
│            └───────┬──────────────────────────────┬───────┘            │
└────────────────────┼──────────────────────────────┼────────────────────┘
                     │ REST (JSON)                  │ Client SDK
                     ▼                              ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────┐
│        EXPRESS BACKEND SERVER           │  │     FIREBASE PLATFORM     │
│       (Node.js / tsx runtime)           │  │                           │
│                                         │  │  ┌─────────────────────┐  │
│  ┌───────────────────────────────────┐  │  │  │ Firebase Auth       │  │
│  │ /api/ai/symptoms                  │  │  │  │ (User Session)      │  │
│  │ /api/ai/medication-explain        │  │  │  └─────────────────────┘  │
│  │ /api/ai/extract-document          │  │  │  ┌─────────────────────┐  │
│  └─────────────────┬─────────────────┘  │  │  │ Cloud Firestore     │  │
│                    │                     │  │  │ (Structured Data &  │  │
│                    ▼                     │  │  │  Audit Logs)        │  │
│  ┌───────────────────────────────────┐  │  │  └─────────────────────┘  │
│  │ @google/genai SDK                 │  │  │  ┌─────────────────────┐  │
│  │ (gemini-3.8-flash)                │  │  │  │ Cloud Storage       │  │
│  │ Secure server-side API Key        │  │  │  │ (Encrypted Medical  │  │
│  └─────────────────┬─────────────────┘  │  │  │  Files & Scans)     │  │
└────────────────────┼────────────────────┘  │  └─────────────────────┘  │
                     │                       └───────────────────────────┘
                     ▼
       ┌───────────────────────────┐
       │     Google Gemini API     │
       └───────────────────────────┘
```

### Architectural Highlights for Your Viva & Review:
1. **Frontend Layer**: Built with **React 19**, **TypeScript**, and **Tailwind CSS**. Modular, component-driven layout using Lucide icons for high-contrast accessibility.
2. **Backend API Layer**: **Node.js + Express** (executed with `tsx`) serving as a secure server-side API proxy. This ensures `GEMINI_API_KEY` is completely isolated from the browser and allows server-side validation of sharing tokens.
3. **Database & Storage Layer**: **Firebase Authentication** manages user identity. **Cloud Firestore** stores structured records with owner-based Security Rules. **Firebase Storage** stores encrypted PDFs and scans.
4. **Mapping & Geocoding Layer**: Open-source **Leaflet** library paired with **OpenStreetMap** raster tiles and public OpenStreetMap geocoding endpoints. No proprietary billing or Google Maps keys required.

---

## 2. Project Folder Structure

A clean, modular structure following enterprise and B.Tech academic project standards:

```
medivault/
├── .env.example                     # Sample configuration template (never commit real secrets)
├── .gitignore                       # Prevents committing node_modules, .env, and dist
├── index.html                       # HTML5 entry point with responsive viewport & fonts
├── metadata.json                    # AI Studio platform capabilities & permission metadata
├── package.json                     # Dependency manifests & development scripts
├── tsconfig.json                    # Strict TypeScript compilation rules
├── vite.config.ts                   # Vite build & bundler configuration
│
├── server.ts                        # Backend Express server (handles /api/ai and /api/share)
│
├── public/
│   ├── favicon.svg                  # MediVault medical cross icon
│   └── marker-icon.png              # Leaflet custom map markers
│
└── src/
    ├── main.tsx                     # React client mounting point
    ├── index.css                    # Tailwind CSS stylesheet with design tokens
    ├── App.tsx                      # Top-level shell (Navigation, State, Route Controller)
    │
    ├── types/                       # TypeScript interfaces & data contracts
    │   ├── user.ts                  # User profile, emergency contact, settings
    │   ├── document.ts              # Medical document types, categories, OCR results
    │   ├── symptom.ts               # Symptom queries, severity, AI assessment schema
    │   ├── medication.ts            # Prescription, dosage explanation, timings
    │   ├── specialist.ts            # Specialist categories, OSM clinic results
    │   ├── timeline.ts              # Chronological health events
    │   └── share.ts                 # Expiring doctor share tokens & permissions
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx           # Accessible top navigation bar
    │   │   ├── Sidebar.tsx          # Section switcher (Dashboard, Vault, Symptoms, etc.)
    │   │   └── DisclaimerBanner.tsx # Prominent clinical safety disclaimer
    │   │
    │   ├── dashboard/
    │   │   ├── DashboardOverview.tsx# Metrics cards, quick actions, emergency shortcut
    │   │   └── RecentActivity.tsx   # Quick view of recent records and medications
    │   │
    │   ├── vault/
    │   │   ├── DocumentList.tsx     # Categorized grid/table with search & filters
    │   │   ├── DocumentUploadModal.tsx # Drag-and-drop file upload with category tagging
    │   │   └── DocumentViewer.tsx   # In-app viewer + AI extracted data side panel
    │   │
    │   ├── symptoms/
    │   │   ├── SymptomForm.tsx      # Severity, duration, age-group, and symptoms input
    │   │   ├── EmergencyNotice.tsx  # Red-flag emergency detection alert
    │   │   └── AssessmentResult.tsx # Structured AI recommendations & recommended specialty
    │   │
    │   ├── specialist/
    │   │   ├── SpecialistFinder.tsx # Specialty selector + manual/browser location bar
    │   │   ├── LeafletMap.tsx       # Leaflet interactive map with pins and popups
    │   │   └── FacilityList.tsx     # Filterable list of nearby clinics, distance, and directions
    │   │
    │   ├── medication/
    │   │   ├── MedicationAssistant.tsx # Prescription input (text or image)
    │   │   └── DosageExplainer.tsx  # Plain-English translation of food/timing instructions
    │   │
    │   ├── timeline/
    │   │   ├── HealthTimeline.tsx   # Interactive vertical chronological event stream
    │   │   └── AddEventModal.tsx    # Manual doctor consultation / test event entry
    │   │
    │   ├── share/
    │   │   ├── ShareRecordsModal.tsx# Multi-select document picker with 24h/48h expiry
    │   │   └── ActiveSharesList.tsx # Audit list with instant "Revoke Access" action
    │   │
    │   └── profile/
    │       ├── UserProfile.tsx      # Personal info, blood group, allergies, emergency contact
    │       └── PrivacySettings.tsx  # Data download, session security, and account controls
    │
    ├── lib/
    │   ├── firebase.ts              # Firebase client initialization & auth helpers
    │   ├── osmService.ts            # Overpass API / Nominatim location queries
    │   └── utils.ts                 # Date formatters, file size helpers, validator guards
    │
    └── services/
        └── api.ts                   # Client-side fetch helpers for Express /api routes
```

---

## 3. Required Software Installation List

To run this project on any computer (Windows, macOS, or Linux):

1. **Node.js (LTS version 20.x or 22.x)**:
   - What it is: The JavaScript runtime engine that executes both the Vite development server and the Express backend.
   - Download from: https://nodejs.org
   - Verify in terminal: `node -v` and `npm -v`.
2. **VS Code (Visual Studio Code)**:
   - Recommended editor for beginner developers with built-in terminal and TypeScript autocomplete.
   - Recommended extensions: *Tailwind CSS IntelliSense*, *ESLint*, *Prettier*.
3. **Web Browser (Google Chrome, Firefox, or Edge)**:
   - For previewing the app, testing responsive mobile viewports, and inspecting network requests.

---

## 4. Required Accounts & Services

Everything used in MediVault is **100% free tier eligible**:

1. **Google AI Studio Account**:
   - Purpose: To generate a free `GEMINI_API_KEY` for symptom assessment, prescription explanation, and OCR document extraction.
   - Website: https://aistudio.google.com
2. **Firebase Account (Google Cloud)**:
   - Purpose: To create a free Spark-tier Firebase project for Authentication, Firestore NoSQL Database, and Firebase Storage.
   - Website: https://console.firebase.google.com
3. **OpenStreetMap / Leaflet**:
   - **No account or credit card required!**
   - Tile server: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
   - Geocoding: OpenStreetMap Nominatim and Overpass API (free public healthcare facility search).

---

## 5. Environment Variables

Create a file named `.env` in the root folder (copied from `.env.example`).

```env
# ===================================================
# SERVER-SIDE SECRETS (Never expose to browser)
# ===================================================
GEMINI_API_KEY="your_gemini_api_key_from_google_ai_studio"
PORT=3000

# ===================================================
# CLIENT-SIDE FIREBASE CONFIGURATION
# (Safe to be public as protected by Firestore Rules)
# ===================================================
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
```

> [!NOTE]
> In Google AI Studio Build, `GEMINI_API_KEY` is automatically injected into the server environment runtime. Notice there is **NO** `GOOGLE_MAPS_API_KEY`, fulfilling the OpenStreetMap requirement.

---

## 6. Firebase Setup Requirements

When you enable Firebase in the project:
1. **Firebase Authentication**:
   - Enable **Google Sign-In** and **Email/Password** provider in the Firebase Console under `Build > Authentication > Sign-in method`.
2. **Cloud Firestore**:
   - Create a Firestore Database in Production or Test mode in your closest region.
   - Deploy security rules guaranteeing that users can only read and write their own documents (`request.auth.uid == resource.data.userId`).
3. **Firebase Storage**:
   - Create a Storage bucket for document uploads with rules restricting file access to authenticated owners and verified share-token holders.

---

## 7. Gemini API Setup Requirements

1. **Model Selection**: We use **`gemini-3.8-flash`** for rapid symptom analysis, medication instructions, and document summarization. It is cost-efficient, fast, and multimodal.
2. **Safety Prompt Engineering**:
   - Every system instruction strictly forbids diagnosing diseases or modifying prescriptions.
   - Outputs enforce structured JSON formatting for clean UI rendering.
3. **Server-Side Isolation**:
   - Calls use `@google/genai` inside `server.ts` with telemetry headers:
   ```ts
   import { GoogleGenAI } from "@google/genai";
   const ai = new GoogleGenAI({
     apiKey: process.env.GEMINI_API_KEY,
     httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
   });
   ```

---

## 8. Leaflet & OpenStreetMap Setup Requirements

1. **Dependencies**:
   - `leaflet`: The core interactive map JavaScript library.
   - `@types/leaflet`: TypeScript definitions for autocomplete and safety.
2. **OpenStreetMap Tiles**:
   - Attribution: `"© OpenStreetMap contributors"` (legal requirement).
3. **Browser Geolocation & Manual Fallback**:
   - First requests browser GPS permission (`navigator.geolocation.getCurrentPosition`).
   - If denied or unsupported: Provides a search bar allowing the user to type a city, area name, or PIN code (geocoded via Nominatim).
4. **Healthcare Queries**:
   - Queries OpenStreetMap Overpass API for healthcare tags: `amenity=hospital`, `amenity=clinic`, `amenity=doctors`, `amenity=pharmacy`.
   - Renders interactive Leaflet markers with popups showing facility name, address, distance, and an external directions link.

---

## 9. Firestore Database Schema

The database is structured into 8 isolated collections:

### 1. `users/{userId}`
```typescript
interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

### 2. `medicalDocuments/{documentId}`
```typescript
interface MedicalDocument {
  id: string;
  userId: string; // Document owner
  title: string;
  category: 'Prescription' | 'Lab Report' | 'Scan' | 'Hospital Record' | 'Discharge Summary' | 'Doctor Note' | 'Other';
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  doctorName?: string;
  facilityName?: string;
  documentDate: string;
  aiExtractedData?: {
    detectedDiagnosis?: string[];
    medications?: Array<{ name: string; dosage: string; frequency: string }>;
    testResults?: Array<{ test: string; result: string; unit: string; flag: 'Normal' | 'High' | 'Low' }>;
    followUpDate?: string;
    confidenceScore: number;
    rawNotes?: string;
  };
  createdAt: string;
}
```

### 3. `medications/{medicationId}`
```typescript
interface MedicationRecord {
  id: string;
  userId: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string; // e.g. "Twice a day"
  timing: 'Before food' | 'After food' | 'With food' | 'Bedtime' | 'As needed';
  durationDays?: number;
  startDate: string;
  endDate?: string;
  prescribedByDoctor?: string;
  purposeSummary?: string; // AI generated explanation of general use
  specialInstructions?: string;
  isActive: boolean;
}
```

### 4. `symptomAssessments/{assessmentId}`
```typescript
interface SymptomAssessment {
  id: string;
  userId: string;
  symptomsText: string;
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  ageGroup: 'Child' | 'Young Adult' | 'Adult' | 'Senior';
  isEmergencyAlert: boolean;
  aiResponse: {
    symptomsIdentified: string[];
    possibleHealthCategories: string[];
    possibleConditions: string[];
    suggestedSpecialty: string;
    generalSelfCare: string[];
    warningSigns: string[];
    whenToSeekImmediateCare: string;
    medicalDisclaimer: string;
  };
  createdAt: string;
}
```

### 5. `timelineEvents/{eventId}`
```typescript
interface TimelineEvent {
  id: string;
  userId: string;
  eventDate: string;
  title: string;
  category: 'Doctor Visit' | 'Report Upload' | 'Prescription' | 'Lab Test' | 'Hospital Visit' | 'Vaccination' | 'Follow-up';
  description: string;
  doctorOrHospital?: string;
  linkedDocumentId?: string;
  createdAt: string;
}
```

### 6. `shareLinks/{shareId}`
```typescript
interface ShareLink {
  shareId: string; // Cryptographic unguessable token
  userId: string;  // Owner of documents
  recipientDoctorName?: string;
  selectedDocumentIds: string[];
  expiresAt: string; // ISO 8601 Timestamp (e.g. 24h or 48h)
  isRevoked: boolean;
  accessCount: number;
  createdAt: string;
}
```

### 7. `auditLogs/{logId}`
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: 'DOCUMENT_UPLOAD' | 'DOCUMENT_DELETE' | 'SHARE_LINK_CREATED' | 'SHARE_LINK_REVOKED' | 'RECORD_VIEWED';
  metadata: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
```

---

## 10. Complete 16-Phase Development Roadmap

| Phase | Milestone Name | Objective |
| :--- | :--- | :--- |
| **Phase 1** | **Project Setup & Core Foundation** | Install required dependencies, establish TypeScript interfaces, and build the foundational responsive layout shell with clean navigation. |
| **Phase 2** | **App Shell & Mock Data Store** | Build the interactive navigation controller, top bar, and mock reactive state store for all 8 modules so the UI can be tested offline immediately. |
| **Phase 3** | **Firebase Authentication** | Implement Firebase Auth with Google and Email login, session tracking, and sign-out states. |
| **Phase 4** | **Healthcare Dashboard** | Build metrics cards, health summaries, quick actions, and emergency red-flag button. |
| **Phase 5** | **Medical Vault (Frontend & UI)** | Build document list, categorized filtering (Prescriptions, Scans, Labs), sort by date, and modal previewer. |
| **Phase 6** | **Document Upload & Storage** | Add drag-and-drop file upload, file validation (PDF/Images < 10MB), and Firebase Storage / local upload handler. |
| **Phase 7** | **Gemini AI Backend Integration** | Configure server-side Express routes with `@google/genai` and prompt safety guardrails. |
| **Phase 8** | **Symptom Assessment Engine** | Implement symptom questionnaire, red-flag emergency detection, and structured non-diagnostic guidance. |
| **Phase 9** | **Medication Assistant** | Build prescription explainer translating dosage and food timing instructions into plain English. |
| **Phase 10** | **Leaflet + OpenStreetMap Specialist Finder** | Integrate Leaflet map, GPS geolocator, manual city/PIN fallback, and OSM clinic queries with map pins. |
| **Phase 11** | **Health Timeline** | Create chronological interactive health event stream with document linking. |
| **Phase 12** | **Secure Record Sharing** | Implement selective document sharing with expiring access tokens and instantaneous revocation. |
| **Phase 13** | **Security Hardening & Rules** | Write and test Firestore security rules and audit logging. |
| **Phase 14** | **End-to-End System Testing** | Verify error boundaries, network fallbacks, invalid files, and location permission denial. |
| **Phase 15** | **Production Build & Deployment** | Optimize Vite bundle, test Express proxy build, and verify Cloud Run readiness. |
| **Phase 16** | **B.Tech Academic Documentation** | Generate report chapters: Abstract, DFD, ER diagrams, test cases, and viva Q&A. |

---

## 11. Phase 1 Instructions: What We Will Do First

In Phase 1, we will set up the project foundation:

1. **Install Core Client Dependencies**:
   - `leaflet` and `@types/leaflet`: For OpenStreetMap display.
   - `firebase`: For Authentication and Firestore integration.
2. **Create Core TypeScript Types**:
   - Create `src/types/` contracts for documents, symptoms, medications, specialists, and users.
3. **Implement the Main Navigation Shell (`App.tsx`)**:
   - Professional healthcare navigation bar with active tab indicators for all 8 core modules:
     - 📊 Dashboard
     - 📁 Medical Vault
     - 🩺 Symptom Assessment
     - 🗺️ Specialist Finder (Leaflet)
     - 💊 Medication Assistant
     - 📅 Health Timeline
     - 🔗 Share Records
     - 👤 Profile & Settings
   - Prominent clinical disclaimer banner reminding users this is an educational tool.
   - Clean starter views for each section with zero compilation errors.
4. **How You Will Run It**:
   - Command: `npm run dev`
   - Port: `http://localhost:3000`
   - What you will see: A clean, responsive healthcare application dashboard shell where you can switch between all 8 modules smoothly.
