// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { deleteFlowStorage } from '../utils/storageCleanup';
import { useNotify } from '../contexts/NotificationContext';

function Dashboard({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [expanded, setExpanded] = useState({}); // { [projectId]: boolean }
  const [flows, setFlows] = useState({}); // { [projectId]: Flow[] }
  const [flowsLoading, setFlowsLoading] = useState({}); // { [projectId]: boolean }
  const [newFlowName, setNewFlowName] = useState({}); // { [projectId]: string }
  const [unsubs, setUnsubs] = useState({}); // { [projectId]: () => void }
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();

  // Fetch projects and show the full dashboard
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, `companies/${currentUser.uid}/projects`),
      orderBy('createdAt', 'desc')
    );

    // Safety timeout so UI doesn't hang if network is slow
    const timeoutId = setTimeout(() => setLoading(false), 2500);

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(projectsData);
        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error('Error fetching projects:', error);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  async function handleCreateProject() {
    if (!currentUser || !newProjectName.trim() || creatingProject) return;
    try {
      setCreatingProject(true);
      const colRef = collection(db, `companies/${currentUser.uid}/projects`);
      const docRef = await addDoc(colRef, {
        projectName: newProjectName.trim(),
        createdAt: serverTimestamp(),
      });
      setNewProjectName('');
      setShowCreateForm(false);
      // Expand the new project inline
      setExpanded((e) => ({ ...e, [docRef.id]: true }));
    } catch (error) {
      console.error('Failed to create project:', error);
      notify.error('Crearea proiectului a eșuat.');
    } finally {
      setCreatingProject(false);
    }
  }

  function toggleExpand(project) {
    const pid = project.id;
    setExpanded((prev) => ({ ...prev, [pid]: !prev[pid] }));

    const willExpand = !expanded[pid];
    if (willExpand) {
      // start listening flows if not already
      if (!unsubs[pid]) {
        setFlowsLoading((l) => ({ ...l, [pid]: true }));
        const q = query(
          collection(db, `companies/${currentUser.uid}/projects/${pid}/flows`),
          orderBy('lastModified', 'desc')
        );
        const unsubscribe = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFlows((m) => ({ ...m, [pid]: items }));
            setFlowsLoading((l) => ({ ...l, [pid]: false }));
          },
          () => setFlowsLoading((l) => ({ ...l, [pid]: false }))
        );
        setUnsubs((u) => ({ ...u, [pid]: unsubscribe }));
      }
    } else {
      // collapsing: we can keep listener or clean it up
      // For memory, unsubscribe and clear
      if (unsubs[pid]) {
        unsubs[pid]();
        setUnsubs((u) => {
          const { [pid]: _, ...rest } = u; // eslint-disable-line no-unused-vars
          return rest;
        });
      }
    }
  }

  async function handleDeleteProject(project) {
    if (!currentUser) return;
    const pid = project.id;
    const ok = window.confirm(`Delete project "${project.projectName}" and all its flows?`);
    if (!ok) return;
    try {
      setDeletingProjectId(pid);
      // delete all flows under project (docs + storage)
      const flowsCol = collection(db, `companies/${currentUser.uid}/projects/${pid}/flows`);
      const snap = await getDocs(flowsCol);
      const deletions = snap.docs.map(async (d) => {
        try {
          // Run storage cleanup with timeout, but do not block doc deletion
          await deleteFlowStorage(currentUser.uid, d.id, { timeoutMs: 3000 });
        } catch (_) {}
        try {
          await deleteDoc(d.ref);
        } catch (err) {
          console.error('Failed deleting flow doc', d.id, err);
        }
      });
      await Promise.allSettled(deletions);
      // delete the project doc
      await deleteDoc(doc(db, `companies/${currentUser.uid}/projects/${pid}`));
      // optimistic local update so UI responds immediately
      setProjects((list) => list.filter((p) => p.id !== pid));
      // clean any listeners/state for this project
      if (unsubs[pid]) {
        try { unsubs[pid](); } catch (_) {}
      }
      setUnsubs((u) => {
        const { [pid]: _, ...rest } = u; // eslint-disable-line no-unused-vars
        return rest;
      });
      setExpanded((e) => {
        const { [pid]: _, ...rest } = e; // eslint-disable-line no-unused-vars
        return rest;
      });
    } catch (e) {
      console.error('Failed to delete project', e);
      notify.error('Ștergerea proiectului a eșuat.');
    } finally {
      setDeletingProjectId(null);
    }
  }

  async function handleCreateFlow(project) {
    if (!currentUser) return;
    const pid = project.id;
    const name = (newFlowName[pid] || '').trim();
    if (!name) return;
    try {
      const colRef = collection(db, `companies/${currentUser.uid}/projects/${pid}/flows`);
      const docRef = await addDoc(colRef, {
        flowName: name,
        flowDescription: '',
        status: 'NU',
        selectedUsers: [],
        valid: false,
        lastModified: serverTimestamp(),
        formData: {},
        generalData: { fluxName: name, fluxDescription: '' },
      });
      // Optimistic UI update so the newly created flow appears immediately
      setFlows((m) => {
        const prev = m[pid] || [];
        const optimistic = {
          id: docRef.id,
          flowName: name,
          flowDescription: '',
          status: 'NU',
          selectedUsers: [],
          valid: false,
          // Provide a shape compatible with the renderer (uses ?.toDate())
          lastModified: { toDate: () => new Date() },
          generalData: { fluxName: name, fluxDescription: '' },
        };
        return { ...m, [pid]: [optimistic, ...prev] };
      });
      setNewFlowName((m) => ({ ...m, [pid]: '' }));
    } catch (e) {
      console.error('Failed to create flow', e);
      notify.error('Crearea fluxului a eșuat.');
    }
  }

  async function handleDeleteFlow(project, flow) {
    if (!currentUser) return;
    const ok = window.confirm(`Delete flow "${flow.flowName}"?`);
    if (!ok) return;
    try {
      await deleteFlowStorage(currentUser.uid, flow.id);
      await deleteDoc(doc(db, `companies/${currentUser.uid}/projects/${project.id}/flows/${flow.id}`));
    } catch (e) {
      console.error('Failed to delete flow', e);
      notify.error('Ștergerea fluxului a eșuat.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">DClass</h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <span className="text-gray-700 font-medium">Business Process Manager</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">
                Welcome, {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Projects</h2>
              <p className="mt-2 text-gray-600">Manage your business processes and workflows</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              New Project
            </button>
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Project name (e.g., HR Management, Marketing)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingProject ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                  }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Projects Table with expandable flows */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(229,231,235,0.6)' }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button onClick={() => toggleExpand(project)} className="mr-3 text-gray-700"
                              style={{
                                height: '32px', width: '32px', borderRadius: '10px',
                                background: '#f3f4ff', border: '1px solid #e5e7eb',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                              }} aria-label="Toggle flows">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ transform: expanded[project.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div>
                        <div className="text-xl font-semibold text-gray-900">{project.projectName}</div>
                        <div className="text-sm text-gray-600">Created {project.createdAt?.toDate().toLocaleDateString() || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        title="Open"
                        onClick={() => (onOpenProject ? onOpenProject(project) : navigate(`/dashboard/projects/${project.id}`))}
                        className="border border-gray-300 text-indigo-700 rounded-md text-sm font-medium"
                        style={{ height: '36px', padding: '0 16px', background: '#fff' }}
                      >
                        Open
                      </button>
                      <button
                        title="Delete project"
                        onClick={() => handleDeleteProject(project)}
                        disabled={deletingProjectId === project.id}
                        className="border border-gray-300 text-gray-600 rounded-md flex items-center justify-center"
                        aria-label="Delete project"
                        style={{ height: '36px', width: '36px', marginRight: '6px', background: '#fff' }}
                      >
                        {deletingProjectId === project.id ? (
                          <span className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ height: 20, width: 20 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 002-2h2a2 2 0 002 2m-7 0h10" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded flows section */}
                  {expanded[project.id] && (
                    <div className="mt-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center gap-3">
                        <input
                          className="flex-1 border border-gray-300 rounded-md px-3 h-10 text-sm"
                          placeholder="New flow name"
                          value={newFlowName[project.id] || ''}
                          onChange={(e) => setNewFlowName((m) => ({ ...m, [project.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow(project)}
                        />
                        <button onClick={() => handleCreateFlow(project)}
                                className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm text-white"
                                style={{ background: '#4f46e5' }}
                        >
                          Add Flow
                        </button>
                      </div>

                      {flowsLoading[project.id] ? (
                        <div className="text-sm text-gray-600">Loading flows...</div>
                      ) : !flows[project.id] || flows[project.id].length === 0 ? (
                        <div className="text-sm text-gray-600">No flows yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {flows[project.id].map((f) => (
                            <div
                              key={f.id}
                              className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex items-center justify-between"
                              style={{ boxShadow: '0 6px 14px rgba(0,0,0,0.04), 0 0 0 1px rgba(229,231,235,0.7)', minHeight: '64px' }}
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900">{f.flowName || 'Untitled flow'}</div>
                                <div className="text-xs text-gray-600">Status: {f.status || 'NU'}</div>
                                <div className="text-xs text-gray-500">Updated: {f.lastModified?.toDate ? f.lastModified.toDate().toLocaleString() : '—'}</div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => navigate(`/dashboard/projects/${project.id}/flows/${f.id}`)}
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium text-white"
                                  style={{ height: '40px', padding: '0 18px', background: '#16a34a' }}
                                >
                                  Open
                                </button>
                                <button title="Delete flow" onClick={() => handleDeleteFlow(project, f)} className="text-gray-500 hover:text-red-600" aria-label="Delete flow">
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 002-2h2a2 2 0 002 2m-7 0h10" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
