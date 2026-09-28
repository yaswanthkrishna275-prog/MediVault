import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MedicalVaultView } from './components/vault/MedicalVaultView';
import { SymptomAssessmentView } from './components/symptoms/SymptomAssessmentView';
import { MedicationAssistantView } from './components/medication/MedicationAssistantView';
import { HealthTimelineView } from './components/timeline/HealthTimelineView';
import { ShareRecordsView } from './components/sharing/ShareRecordsView';
import { SharedAccessPortal } from './components/sharing/SharedAccessPortal';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { AuthModal } from './components/auth/AuthModal';
import { EmergencyAlertModal } from './components/common/EmergencyAlertModal';
import { ProjectGuideModal } from './components/docs/ProjectGuideModal';
import { MedicalDisclaimer } from './components/common/MedicalDisclaimer';

import { 
  MedicalDocument, 
  Medication, 
  TimelineEvent, 
  SharedRecord 
} from './types';
import { dbService, SAMPLE_DOCUMENTS, SAMPLE_MEDICATIONS, SAMPLE_TIMELINE } from './services/dbService';

function MainApp() {
  const { user, userProfile, isDemoUser, updateProfileData } = useAuth();
  
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<string | undefined>(undefined);

  // Shared Link Portal mode (doctor view)
  const [portalShareId, setPortalShareId] = useState<string | null>(null);
  const [portalCode, setPortalCode] = useState<string>('');

  // Primary data state
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Check URL params for direct shared doctor link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    const code = params.get('code');
    if (shareId) {
      setPortalShareId(shareId);
      if (code) setPortalCode(code);
    }
  }, []);

  // Current active user ID
  const effectiveUserId = user?.uid || (isDemoUser ? 'demo_user_btech_2026' : 'demo_user_btech_2026');

  // Load records
  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [docs, meds, time, shares] = await Promise.all([
        dbService.getDocuments(effectiveUserId),
        dbService.getMedications(effectiveUserId),
        dbService.getTimelineEvents(effectiveUserId),
        dbService.getSharedRecords(effectiveUserId)
      ]);

      setDocuments(docs);
      setMedications(meds);
      setTimelineEvents(time);
      setSharedRecords(shares);
    } catch (err) {
      console.warn('Error loading MediVault data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [effectiveUserId]);

  // Document actions
  const handleAddDocument = async (docData: Omit<MedicalDocument, 'id' | 'createdAt'>) => {
    const created = await dbService.addDocument(docData);
    setDocuments(prev => [created, ...prev]);

    // Automatically add milestone in health timeline
    await dbService.addTimelineEvent({
      userId: effectiveUserId,
      title: `Uploaded ${created.category}: ${created.title}`,
      eventType: created.category === 'Prescription' ? 'Prescription' : created.category === 'Lab Report' ? 'Lab Test' : 'Hospital Visit',
      date: created.date,
      description: created.notes || `New ${created.category} stored in patient medical vault.`,
      doctorOrFacility: created.doctorName || created.facilityName,
      relatedDocumentId: created.id
    });

    // Refresh timeline
    const refreshedTime = await dbService.getTimelineEvents(effectiveUserId);
    setTimelineEvents(refreshedTime);

    return created;
  };

  const handleUpdateDocument = async (id: string, updates: Partial<MedicalDocument>) => {
    await dbService.updateDocument(id, updates);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleDeleteDocument = async (id: string) => {
    await dbService.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Medication actions
  const handleAddMedication = async (medData: Omit<Medication, 'id' | 'createdAt'>) => {
    const created = await dbService.addMedication(medData);
    setMedications(prev => [created, ...prev]);

    // Timeline record
    await dbService.addTimelineEvent({
      userId: effectiveUserId,
      title: `Prescribed: ${created.name} (${created.dosage})`,
      eventType: 'Medication',
      date: created.startDate,
      description: `${created.frequency} (${created.timing}). ${created.instructions}`,
      doctorOrFacility: created.prescribingDoctor
    });
    const refreshedTime = await dbService.getTimelineEvents(effectiveUserId);
    setTimelineEvents(refreshedTime);

    return created;
  };

  const handleToggleMedication = async (id: string, isActive: boolean) => {
    await dbService.toggleMedicationActive(id, isActive);
    setMedications(prev => prev.map(m => m.id === id ? { ...m, isActive } : m));
  };

  const handleDeleteMedication = async (id: string) => {
    await dbService.deleteMedication(id);
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  // Timeline actions
  const handleAddTimelineEvent = async (eventData: Omit<TimelineEvent, 'id' | 'createdAt'>) => {
    const created = await dbService.addTimelineEvent(eventData);
    setTimelineEvents(prev => [created, ...prev]);
    return created;
  };

  const handleDeleteTimelineEvent = async (id: string) => {
    await dbService.deleteTimelineEvent(id);
    setTimelineEvents(prev => prev.filter(t => t.id !== id));
  };

  // Sharing actions
  const handleCreateShare = async (
    title: string,
    recipient: string,
    docIds: string[],
    hours: number,
    snapshot: Partial<MedicalDocument>[]
  ) => {
    const created = await dbService.createSharedRecord(
      effectiveUserId,
      title,
      recipient,
      docIds,
      hours,
      snapshot
    );
    setSharedRecords(prev => [created, ...prev]);
    return created;
  };

  const handleRevokeShare = async (shareId: string) => {
    await dbService.revokeShare(shareId);
    setSharedRecords(prev => prev.map(s => s.id === shareId ? { ...s, isRevoked: true } : s));
  };

  // Reset to default sample records for B.Tech project demo
  const handleResetDemoData = () => {
    localStorage.setItem('medivault_local_docs', JSON.stringify(SAMPLE_DOCUMENTS));
    localStorage.setItem('medivault_local_meds', JSON.stringify(SAMPLE_MEDICATIONS));
    localStorage.setItem('medivault_local_timeline', JSON.stringify(SAMPLE_TIMELINE));
    localStorage.removeItem('medivault_local_shares');
    loadAllData();
  };

  // If in Doctor Shared Access Portal mode
  if (portalShareId) {
    return (
      <SharedAccessPortal
        shareId={portalShareId}
        initialCode={portalCode}
        onExitPortal={() => {
          setPortalShareId(null);
          // Clean URL
          window.history.pushState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
        onEmergencyClick={() => {
          setEmergencyNotice('You have triggered the Emergency Medical Protocol. Please call 112 or local emergency services immediately.');
          setIsEmergencyOpen(true);
        }}
        activeTab={activeTab}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
          documentCount={documents.length}
          activeMedCount={medications.filter(m => m.isActive).length}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              userName={userProfile?.displayName || user?.displayName || 'Yaswanth (Student Demo)'}
              isDemoUser={isDemoUser || !user}
              documents={documents}
              medications={medications}
              timeline={timelineEvents}
              onNavigate={(tab) => setActiveTab(tab)}
              onUploadClick={() => setActiveTab('vault')}
            />
          )}

          {activeTab === 'vault' && (
            <MedicalVaultView
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              isDemoUser={isDemoUser}
              userId={effectiveUserId}
            />
          )}

          {activeTab === 'symptoms' && (
            <SymptomAssessmentView
              userId={effectiveUserId}
              onSaveAssessment={async (assessment) => {
                return await dbService.saveSymptomAssessment(assessment);
              }}
              onTriggerEmergencyModal={(notice) => {
                setEmergencyNotice(notice);
                setIsEmergencyOpen(true);
              }}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationAssistantView
              medications={medications}
              onAddMedication={handleAddMedication}
              onToggleMedication={handleToggleMedication}
              onDeleteMedication={handleDeleteMedication}
              userId={effectiveUserId}
            />
          )}

          {activeTab === 'timeline' && (
            <HealthTimelineView
              events={timelineEvents}
              documents={documents}
              onAddEvent={handleAddTimelineEvent}
              onDeleteEvent={handleDeleteTimelineEvent}
              onViewDocument={(doc) => {
                setActiveTab('vault');
              }}
              userId={effectiveUserId}
            />
          )}

          {activeTab === 'sharing' && (
            <ShareRecordsView
              sharedRecords={sharedRecords}
              documents={documents}
              onCreateShare={handleCreateShare}
              onRevokeShare={handleRevokeShare}
              userId={effectiveUserId}
              onOpenDoctorPortal={(id) => {
                setPortalShareId(id);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettingsView
              profile={userProfile}
              onUpdateProfile={updateProfileData}
              onResetDemoData={handleResetDemoData}
            />
          )}

        </main>
      </div>

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <EmergencyAlertModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        notice={emergencyNotice}
      />

      <ProjectGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
