// src/components/ProjectPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

function ProjectPage({ project: projectProp, onBack, onOpenFlow }) {
  const { currentUser } = useAuth();
  const params = useParams();
  const [project, setProject] = useState(projectProp || null);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  const projectId = project?.id || params.projectId;

  useEffect(() => {
    let unsubscribe = () => {};
    let timeoutId;
    async function init() {
      if (!currentUser || !projectId) return;

      // If we don't have a full project object (route case), try to fetch it
      if (!project && params.projectId) {
        try {
          const d = await getDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}`));
          if (d.exists()) setProject({ id: d.id, ...d.data() });
        } catch (_) {}
      }

      const q = query(
        collection(db, `companies/${currentUser.uid}/projects/${projectId}/flows`),
        orderBy('lastModified', 'desc')
      );

      timeoutId = setTimeout(() => setLoading(false), 2500);
      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFlows(items);
          setLoading(false);
          clearTimeout(timeoutId);
        },
        () => {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      );
    }
    init();

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [currentUser, projectId]);

  async function handleCreateFlow() {
    if (!currentUser || !projectId || !newFlowName.trim() || creating) return;
    try {
      setCreating(true);
      const colRef = collection(db, `companies/${currentUser.uid}/projects/${projectId}/flows`);
      const initial = {
        flowName: newFlowName.trim(),
        flowDescription: newFlowDescription.trim() || '',
        status: 'NU',
        selectedUsers: [],
        valid: false,
        lastModified: serverTimestamp(),
        formData: {},
        generalData: { fluxName: newFlowName.trim(), fluxDescription: newFlowDescription.trim() || '' },
      };
      await addDoc(colRef, initial);
      setNewFlowName('');
      setNewFlowDescription('');
    } catch (e) {
      console.error('Failed to create flow', e);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteFlow(e, flow) {
    // Prevent the card's onClick (open) from firing
    if (e) e.stopPropagation();
    if (!currentUser || !projectId) return;
    const ok = window.confirm(`Delete flow "${flow.flowName || 'Untitled flow'}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, `companies/${currentUser.uid}/projects/${projectId}/flows/${flow.id}`));
    } catch (err) {
      console.error('Failed to delete flow', err);
      alert('Failed to delete flow');
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.projectName || 'Project'}</h1>
          <p className="text-gray-600">Flows inside this project</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50">Back</button>
        )}
      </div>

      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Flow</h3>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Flow name"
            value={newFlowName}
            onChange={(e) => setNewFlowName(e.target.value)}
          />
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Description (optional)"
            value={newFlowDescription}
            onChange={(e) => setNewFlowDescription(e.target.value)}
          />
          <button
            onClick={handleCreateFlow}
            disabled={creating || !newFlowName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Flow'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading flows...</div>
      ) : flows.length === 0 ? (
        <div className="text-center text-gray-600 py-12">No flows yet. Create one above.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-sm hover:shadow cursor-pointer"
              style={{ boxShadow: '0 6px 14px rgba(0,0,0,0.04), 0 0 0 1px rgba(229,231,235,0.7)', minHeight: '68px' }}
              onClick={() => onOpenFlow && onOpenFlow({ ...flow, projectId })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{flow.flowName || 'Untitled flow'}</div>
                  <div className="text-sm text-gray-500">{flow.flowDescription || 'No description'}</div>
                  <div className="text-xs text-gray-500">Updated: {flow.lastModified?.toDate ? flow.lastModified.toDate().toLocaleString() : '—'}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{flow.status || '—'}</span>
                  <button
                    title="Open"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium text-white"
                    style={{ height: '40px', padding: '0 18px', background: '#16a34a' }}
                    onClick={(e) => { e.stopPropagation(); onOpenFlow && onOpenFlow({ ...flow, projectId }); }}
                  >
                    Open
                  </button>
                  <button
                    title="Delete flow"
                    className="text-gray-500 hover:text-red-600"
                    onClick={(e) => handleDeleteFlow(e, flow)}
                    aria-label="Delete flow"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 002-2h2a2 2 0 002 2m-7 0h10" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectPage;
