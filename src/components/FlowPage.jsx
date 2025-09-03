// src/components/FlowPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

// Import all tab components
import GeneralDataTab from './flow/tabs/GeneralDataTab';
import PeopleTab from './flow/tabs/PeopleTab';
import LegalBasisTab from './flow/tabs/LegalBasisTab';
import DataProcessingTab from './flow/tabs/DataProcessingTab';
import DataStorageTab from './flow/tabs/DataStorageTab';
import SecurityTab from './flow/tabs/SecurityTab';
import FlowDiagramModal from './flow/FlowDiagramModal';
import DataCategoriesTab from './flow/tabs/DataCategoriesTab';

// Import utilities
import { exportFlowToPDF } from '../utils/pdfGenerator';

function Tab({ id, active, onClick, children }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm border-b-2 ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
    >
      {children}
    </button>
  );
}

function FlowPage({ projectId: projectIdProp, flow: flowProp, onBack }) {
  const { currentUser } = useAuth();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveTimer, setSaveTimer] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  
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

  const projectId = flowProp?.projectId || projectIdProp || params.projectId;
  const flowId = flowProp?.id || params.flowId;

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
              policyDocument: '',
              documents: [] 
            },
            categoryMatrix: data.categoryMatrix || (data.formData && data.formData.categoryMatrix) || undefined,
            ...(data.formData || {}),
          });
          
          // Load processes
          setProcesses(data.processes || []);
          
          // Load diagram data
          setDiagramData(data.diagramData || null);
          
          setLastSaved(data.lastModified?.toDate());
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, projectId, flowId]);

  // Auto-save functionality with debouncing
  const handleSave = useCallback(async () => {
    if (!currentUser || !projectId || !flowId) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}/flows/${flowId}`), {
        ...meta,
        ...formData,
        processes,
        diagramData,
        lastModified: serverTimestamp(),
      });
      setLastSaved(new Date());
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [currentUser, projectId, flowId, meta, formData, processes]);
  
  // Trigger auto-save on data changes
  useEffect(() => {
    if (loading) return;
    
    // Clear existing timer
    if (saveTimer) clearTimeout(saveTimer);
    
    // Set new timer for auto-save (2 seconds delay)
    const timer = setTimeout(() => {
      handleSave();
    }, 2000);
    
    setSaveTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [meta, formData, processes, diagramData]);
  
  // Clone flow functionality
  async function handleCloneFlow() {
    if (!currentUser || !projectId || !flowId) return;
    
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
      
      alert(`Flow cloned successfully! New flow ID: ${docRef.id}`);
    } catch (e) {
      console.error('Clone failed', e);
      alert('Failed to clone flow.');
    }
  }

  // Update handlers for each data section
  const updateGeneralData = (data) => {
    setFormData(prev => ({ ...prev, generalData: data }));
  };
  
  const updatePeopleData = (data) => {
    setFormData(prev => ({ ...prev, peopleData: data }));
  };
  
  const updateLegalData = (data) => {
    setFormData(prev => ({ ...prev, legalData: data }));
  };
  
  const updateProcessingData = (data) => {
    setFormData(prev => ({ ...prev, processingData: data }));
  };
  
  const updateStorageData = (data) => {
    setFormData(prev => ({ ...prev, storageData: data }));
  };
  
  const updateSecurityData = (data) => {
    setFormData(prev => ({ ...prev, securityData: data }));
  };
  
  const updateMeta = (updates) => {
    setMeta(prev => ({ ...prev, ...updates }));
  };
  
  // Handle PDF export
  const handlePDFExport = () => {
    try {
      const fileName = exportFlowToPDF(formData, meta, processes);
      console.log(`PDF exported: ${fileName}`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-gray-600">Loading flow...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50">Back</button>
          )}
          <button 
            onClick={() => setShowDiagramModal(true)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Diagram
          </button>
          <button 
            onClick={handlePDFExport}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
          <button 
            onClick={handleCloneFlow} 
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50"
          >
            Clone Flow
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center gap-2"
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
      </div>


      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 flex gap-2 flex-wrap">
        <Tab id="general" active={activeTab === 'general'} onClick={setActiveTab}>Date generale</Tab>
        <Tab id="people" active={activeTab === 'people'} onClick={setActiveTab}>Persoane vizate</Tab>
        <Tab id="legal" active={activeTab === 'legal'} onClick={setActiveTab}>Detalii temei legal</Tab>
        <Tab id="processing" active={activeTab === 'processing'} onClick={setActiveTab}>Prelucrare date</Tab>
        <Tab id="categories" active={activeTab === 'categories'} onClick={setActiveTab}>Categorii date</Tab>
        <Tab id="storage" active={activeTab === 'storage'} onClick={setActiveTab}>Stocare date</Tab>
        <Tab id="security" active={activeTab === 'security'} onClick={setActiveTab}>Securitate</Tab>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <GeneralDataTab
          generalData={formData.generalData}
          selectedUsers={meta.selectedUsers}
          status={meta.status}
          valid={meta.valid}
          onGeneralDataChange={updateGeneralData}
          onMetaChange={updateMeta}
        />
      )}
      
      {activeTab === 'people' && (
        <PeopleTab
          peopleData={formData.peopleData}
          onPeopleDataChange={updatePeopleData}
          flowId={flowId}
          projectId={projectId}
          userId={currentUser?.uid}
        />
      )}
      
      {activeTab === 'legal' && (
        <LegalBasisTab
          legalData={formData.legalData}
          onLegalDataChange={updateLegalData}
          flowId={flowId}
          projectId={projectId}
          userId={currentUser?.uid}
        />
      )}
      
      {activeTab === 'processing' && (
        <DataProcessingTab
          processingData={formData.processingData}
          processes={processes}
          onProcessingDataChange={updateProcessingData}
          onProcessesChange={setProcesses}
        />
      )}

      {activeTab === 'categories' && (
        <DataCategoriesTab
          categoryMatrix={formData.categoryMatrix}
          onChange={(m) => setFormData((prev) => ({ ...prev, categoryMatrix: m }))}
        />
      )}
      
      {activeTab === 'storage' && (
        <DataStorageTab
          storageData={formData.storageData}
          onStorageDataChange={updateStorageData}
          flowId={flowId}
          projectId={projectId}
          userId={currentUser?.uid}
        />
      )}
      
      {activeTab === 'security' && (
        <SecurityTab
          securityData={formData.securityData}
          onSecurityDataChange={updateSecurityData}
          flowId={flowId}
          projectId={projectId}
          userId={currentUser?.uid}
        />
      )}
      
      {/* Flow Diagram Modal */}
      <FlowDiagramModal
        isOpen={showDiagramModal}
        onClose={() => setShowDiagramModal(false)}
        formData={formData}
        processes={processes}
        diagramData={diagramData}
        onDiagramChange={setDiagramData}
        flowId={flowId}
        projectId={projectId}
        userId={currentUser?.uid}
      />

    </div>
  );
}

export default FlowPage;
