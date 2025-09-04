// src/components/FlowPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

// Import all tab components
import InternalDataFlowTab from './flow/tabs/InternalDataFlowTab';
import ExternalSEEFlowTab from './flow/tabs/ExternalSEEFlowTab';
import ThirdCountryTransferTab from './flow/tabs/ThirdCountryTransferTab';
import DataProcessingTab from './flow/tabs/DataProcessingTab';
import DataStorageTab from './flow/tabs/DataStorageTab';
import SecurityMeasuresTab from './flow/tabs/SecurityMeasuresTab';
import FlowDiagramModal from './flow/FlowDiagramModal';
import DataCategoriesTab from './flow/tabs/DataCategoriesTab';

// Import utilities
import { exportFlowToPDF } from '../utils/pdfGenerator';
import ErrorBoundary from './common/ErrorBoundary';
import { useNotify } from '../contexts/NotificationContext';

function Tab({ id, active, onClick, children }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`mr-2 mb-2 px-4 py-2 text-sm rounded-md border transition-colors ${
        active
          ? 'border-indigo-400 text-indigo-700 shadow-sm bg-white'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
      }`}
    >
      {children}
    </button>
  );
}

function FlowPage({ projectId: projectIdProp, flow: flowProp, onBack }) {
  const notify = useNotify();
  const { currentUser } = useAuth();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Meta information
  const [meta, setMeta] = useState({ 
    flowName: '', 
    flowDescription: '', 
    status: 'NU', 
    valid: false, 
    selectedUsers: [] 
  });
  
  // Comprehensive form data structure
  const [formData, setFormData] = useState({
    generalData: { fluxName: '', fluxDescription: '' },
    peopleData: { categories: [], notificationMethods: [], documents: [] },
    legalData: { legalBasis: [], legalDetails: '', documents: [] },
    processingData: { purposes: [], recipientCategories: [] },
    storageData: { 
      policy: '', 
      duration: { value: 10, unit: 'Ani' }, 
      policyDetails: '', 
      recipientCategories: [],
      documents: [] 
    },
    securityData: { 
      technicalMeasures: [], 
      organizationalMeasures: [], 
      policyDocument: '',
      documents: [] 
    }
  });
  
  const [processes, setProcesses] = useState([]);
  const [diagramData, setDiagramData] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  // Track changed top-level fields to minimize Firestore update payload
  const changedKeysRef = useRef(new Set());

  // Memoized callback for diagram modal close to prevent unnecessary re-renders
  const handleDiagramModalClose = useCallback(() => {
    setShowDiagramModal(false);
  }, []);

  // Memoized callback for categoryMatrix updates to prevent unnecessary re-renders
  const handleCategoryMatrixChange = useCallback((categoryMatrix) => {
    setFormData(prev => ({ ...prev, categoryMatrix }));
    changedKeysRef.current.add('categoryMatrix');
  }, []);

  const projectId = flowProp?.projectId || projectIdProp || params.projectId;
  const flowId = flowProp?.id || params.flowId;

  // Load flow data on mount or when identifying parameters change
  useEffect(() => {
    async function load() {
      if (!currentUser || !projectId || !flowId) return;
      try {
        const d = await getDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}/flows/${flowId}`));
        if (d.exists()) {
          const data = d.data();
          
          // Load meta information
          setMeta({
            flowName: data.flowName || '',
            flowDescription: data.flowDescription || '',
            status: data.status || 'NU',
            valid: !!data.valid,
            selectedUsers: Array.isArray(data.selectedUsers) ? data.selectedUsers : [],
          });
          
          // Load comprehensive form data
          setFormData({
            generalData: data.generalData || { fluxName: data.flowName || '', fluxDescription: data.flowDescription || '' },
            peopleData: data.peopleData || { categories: [], notificationMethods: [], documents: [] },
            legalData: data.legalData || { legalBasis: [], legalDetails: '', documents: [] },
            processingData: data.processingData || { purposes: [], recipientCategories: [] },
            storageData: data.storageData || { 
              policy: '', 
              duration: { value: 10, unit: 'Ani' }, 
              policyDetails: '', 
              recipientCategories: [],
              documents: []
            },
            securityData: data.securityData || { 
              technicalMeasures: [], 
              organizationalMeasures: [], 
              documents: [] 
            },
            categoryMatrix: data.categoryMatrix || {}
          });
          
          // Load processes
          setProcesses(Array.isArray(data.processes) ? data.processes : []);
          
          // Load diagram data
          setDiagramData(data.diagramData || null);
        }
      } catch (error) {
        console.error('Error loading flow:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, projectId, flowId]); // Only reload when identifying parameters change

  // Manual save only (auto-save disabled)
  const handleSave = useCallback(async () => {
    if (!currentUser || !projectId || !flowId) {
      notify.error('Nu se poate salva: datele de identificare lipsesc.');
      return;
    }
    try {
      setSaving(true);
      // Build minimal update payload
      const updatePayload = { lastModified: serverTimestamp() };
      // Meta keys changed
      for (const key of changedKeysRef.current) {
        if (key === 'generalData' || key === 'peopleData' || key === 'legalData' || key === 'processingData' || key === 'storageData' || key === 'securityData' || key === 'categoryMatrix') {
          updatePayload[key] = formData[key];
        } else if (key === 'processes') {
          updatePayload.processes = processes;
        } else if (key === 'diagramData') {
          updatePayload.diagramData = diagramData;
        } else if (key in meta) {
          updatePayload[key] = meta[key];
        }
      }
      // If nothing tracked (manual save), include everything like before
      if (Object.keys(updatePayload).length === 1) {
        Object.assign(updatePayload, { ...meta, ...formData, processes, diagramData });
      }
      await updateDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}/flows/${flowId}`), updatePayload);
      setLastSaved(new Date());
      changedKeysRef.current.clear();
    } catch (e) {
      console.error('Save failed', e);
      notify.error('Salvarea a eșuat. Încearcă din nou.');
    } finally {
      setSaving(false);
    }
  }, [currentUser, projectId, flowId, meta, formData, processes, diagramData, notify]);
  
  // Note: auto-save intentionally disabled for better control
  
  // Clone flow functionality
  async function handleCloneFlow() {
    if (!currentUser || !projectId || !flowId) {
      notify.error('Clonarea a eșuat: date lipsă.');
      return;
    }
    
    try {
      const newFlowData = {
        ...meta,
        ...formData,
        processes,
        flowName: `${meta.flowName} (Copy)`,
        status: 'NU',
        lastModified: serverTimestamp(),
        clonedFrom: flowId
      };
      
      const docRef = await addDoc(
        collection(db, `companies/${currentUser.uid}/projects/${projectId}/flows`),
        newFlowData
      );
      
      notify.success(`Flux clonat cu succes (ID: ${docRef.id}).`);
    } catch (e) {
      console.error('Clone failed', e);
      notify.error('Clonarea a eșuat.');
    }
  }

  // Memoized update handlers for each data section to prevent unnecessary re-renders
  const updateGeneralData = useCallback((data) => {
    setFormData(prev => ({ ...prev, generalData: data }));
    changedKeysRef.current.add('generalData');
  }, []);
  
  const updatePeopleData = useCallback((data) => {
    setFormData(prev => ({ ...prev, peopleData: data }));
    changedKeysRef.current.add('peopleData');
  }, []);
  
  const updateLegalData = useCallback((data) => {
    setFormData(prev => ({ ...prev, legalData: data }));
    changedKeysRef.current.add('legalData');
  }, []);
  
  const updateProcessingData = useCallback((data) => {
    setFormData(prev => ({ ...prev, processingData: data }));
    changedKeysRef.current.add('processingData');
  }, []);
  
  const updateStorageData = useCallback((data) => {
    setFormData(prev => ({ ...prev, storageData: data }));
    changedKeysRef.current.add('storageData');
  }, []);
  
  const updateSecurityData = useCallback((data) => {
    setFormData(prev => ({ ...prev, securityData: data }));
    changedKeysRef.current.add('securityData');
  }, []);
  
  // Memoized update handler for meta data to prevent unnecessary re-renders
  // Helper to update meta if needed by future UI bits
  // Note: not currently used; remove to avoid linter complaints
  
  const updateProcesses = useCallback((list) => {
    changedKeysRef.current.add('processes');
    setProcesses(list);
  }, []);
  
  const updateDiagramData = useCallback((data) => {
    changedKeysRef.current.add('diagramData');
    setDiagramData(data);
  }, []);
  
  // Handle PDF export
  const handlePDFExport = () => {
    try {
      const fileName = exportFlowToPDF(formData, meta, processes);
      console.log(`PDF exported: ${fileName}`);
    } catch (error) {
      console.error('PDF export failed:', error);
      notify.error('Exportul PDF a eșuat.');
    }
  };

  // Close the actions menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-gray-600">Loading flow...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{meta.flowName || 'Flow'}</h1>
          <p className="text-gray-600">
            Edit flow details
            {lastSaved && (
              <span className="ml-2 text-xs text-gray-500">
                (Last saved: {lastSaved.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <div className="ml-0 mr-2">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </>
              ) : (
                'Salveaza'
              )}
            </button>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Actiuni
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md overflow-hidden" style={{ zIndex: 20 }}>
                {onBack && (
                  <button
                    onClick={() => { setMenuOpen(false); onBack(); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Inapoi
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setShowDiagramModal(true); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Vizualizeaza diagrama
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handlePDFExport(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Exporta PDF
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleCloneFlow(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Cloneaza flux
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="mb-4">
        <div className="bg-white border border-gray-200 rounded-md p-2 flex flex-wrap">
          <Tab id="general" active={activeTab === 'general'} onClick={setActiveTab}>Flux intern</Tab>
          <Tab id="people" active={activeTab === 'people'} onClick={setActiveTab}>Flux extern (SEE)</Tab>
          <Tab id="legal" active={activeTab === 'legal'} onClick={setActiveTab}>Transfer state terțe</Tab>
          <Tab id="processing" active={activeTab === 'processing'} onClick={setActiveTab}>Prelucrare date</Tab>
          <Tab id="categories" active={activeTab === 'categories'} onClick={setActiveTab}>Categorii date</Tab>
          <Tab id="storage" active={activeTab === 'storage'} onClick={setActiveTab}>Stocare date</Tab>
          <Tab id="security" active={activeTab === 'security'} onClick={setActiveTab}>Securitate</Tab>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <ErrorBoundary>
          <InternalDataFlowTab
            generalData={formData.generalData}
            onGeneralDataChange={updateGeneralData}
          />
        </ErrorBoundary>
      )}
      
      {activeTab === 'people' && (
        <ErrorBoundary>
          <ExternalSEEFlowTab
            peopleData={formData.peopleData}
            onPeopleDataChange={updatePeopleData}
          />
        </ErrorBoundary>
      )}
      
      {activeTab === 'legal' && (
        <ErrorBoundary>
          <ThirdCountryTransferTab
            legalData={formData.legalData}
            onLegalDataChange={updateLegalData}
          />
        </ErrorBoundary>
      )}
      
      {activeTab === 'processing' && (
        <ErrorBoundary>
          <DataProcessingTab
            processingData={formData.processingData}
            processes={processes}
            onProcessingDataChange={updateProcessingData}
            onProcessesChange={updateProcesses}
          />
        </ErrorBoundary>
      )}

      {activeTab === 'categories' && (
        <ErrorBoundary>
          <DataCategoriesTab
            categoryMatrix={formData.categoryMatrix}
            onChange={handleCategoryMatrixChange}
          />
        </ErrorBoundary>
      )}
      
      {activeTab === 'storage' && (
        <ErrorBoundary>
          <DataStorageTab
            storageData={formData.storageData}
            onStorageDataChange={updateStorageData}
            flowId={flowId}
            projectId={projectId}
            userId={currentUser?.uid}
          />
        </ErrorBoundary>
      )}
      
      {activeTab === 'security' && (
        <ErrorBoundary>
          <SecurityMeasuresTab
            securityData={formData.securityData}
            onSecurityDataChange={updateSecurityData}
          />
        </ErrorBoundary>
      )}
      
      {/* Flow Diagram Modal */}
      <ErrorBoundary>
        <FlowDiagramModal
          isOpen={showDiagramModal}
          onClose={handleDiagramModalClose}
          formData={formData}
          processes={processes}
          diagramData={diagramData}
          onDiagramChange={updateDiagramData}
          flowId={flowId}
          projectId={projectId}
          userId={currentUser?.uid}
        />
      </ErrorBoundary>

    </div>
  );
}

export default FlowPage;
