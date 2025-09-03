// src/components/FlowPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

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
  const [meta, setMeta] = useState({ flowName: '', flowDescription: '', status: 'NU', valid: false, selectedUsers: [] });
  const [formData, setFormData] = useState({ generalData: { fluxName: '', fluxDescription: '' }, dataProcessing: { processes: [] } });
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
          setMeta({
            flowName: data.flowName || '',
            flowDescription: data.flowDescription || '',
            status: data.status || 'NU',
            valid: !!data.valid,
            selectedUsers: Array.isArray(data.selectedUsers) ? data.selectedUsers : [],
          });
          setFormData({
            generalData: data.generalData || { fluxName: data.flowName || '', fluxDescription: data.flowDescription || '' },
            dataProcessing: data.dataProcessing || { processes: [] },
            ...(data.formData || {}),
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, projectId, flowId]);

  async function handleSave() {
    if (!currentUser || !projectId || !flowId) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}/flows/${flowId}`), {
        ...meta,
        lastModified: serverTimestamp(),
        formData: { ...formData },
        generalData: formData.generalData,
        dataProcessing: formData.dataProcessing,
      });
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function updateGeneral(key, value) {
    setFormData((prev) => ({ ...prev, generalData: { ...prev.generalData, [key]: value } }));
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-gray-600">Loading flow...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{meta.flowName || 'Flow'}</h1>
          <p className="text-gray-600">Edit flow details</p>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50">Back</button>
          )}
          <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Meta quick fields */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Flow name</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={meta.flowName} onChange={(e) => setMeta({ ...meta, flowName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })}>
              <option value="Aprobat">Aprobat</option>
              <option value="NU">NU</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={meta.flowDescription} onChange={(e) => setMeta({ ...meta, flowDescription: e.target.value })} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={meta.valid} onChange={(e) => setMeta({ ...meta, valid: e.target.checked })} />
            Valid
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 flex gap-2">
        <Tab id="general" active={activeTab === 'general'} onClick={setActiveTab}>Date generale</Tab>
        <Tab id="people" active={activeTab === 'people'} onClick={setActiveTab}>Persoane vizate</Tab>
        <Tab id="processing" active={activeTab === 'processing'} onClick={setActiveTab}>Prelucrarea datelor</Tab>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="grid gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Denumire flux</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={formData.generalData?.fluxName || ''}
                onChange={(e) => updateGeneral('fluxName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Descriere flux</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={4}
                value={formData.generalData?.fluxDescription || ''}
                onChange={(e) => updateGeneral('fluxDescription', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'people' && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-600">Add fields for people categories here (placeholder).</p>
        </div>
      )}

      {activeTab === 'processing' && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-600">Add fields for data processing (processes, sources, operators) here (placeholder).</p>
        </div>
      )}
    </div>
  );
}

export default FlowPage;

