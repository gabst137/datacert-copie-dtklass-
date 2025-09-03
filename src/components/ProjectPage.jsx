// src/components/ProjectPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
              className="bg-white shadow rounded-md p-4 border border-gray-200 cursor-pointer hover:shadow-md"
              onClick={() => onOpenFlow && onOpenFlow({ ...flow, projectId })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{flow.flowName || 'Untitled flow'}</div>
                  <div className="text-sm text-gray-500">{flow.flowDescription || 'No description'}</div>
                </div>
                <div className="text-sm text-gray-600">{flow.status || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectPage;

