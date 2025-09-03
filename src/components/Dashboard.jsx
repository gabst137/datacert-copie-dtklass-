// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

function Dashboard({ onOpenProject, onOpenFlow }) {
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
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
      // delete all flows under project
      const flowsCol = collection(db, `companies/${currentUser.uid}/projects/${pid}/flows`);
      const snap = await getDocs(flowsCol);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      // delete the project doc
      await deleteDoc(doc(db, `companies/${currentUser.uid}/projects/${pid}`));
    } catch (e) {
      console.error('Failed to delete project', e);
      alert('Failed to delete project');
    }
  }

  async function handleCreateFlow(project) {
    if (!currentUser) return;
    const pid = project.id;
    const name = (newFlowName[pid] || '').trim();
    if (!name) return;
    try {
      const colRef = collection(db, `companies/${currentUser.uid}/projects/${pid}/flows`);
      await addDoc(colRef, {
        flowName: name,
        flowDescription: '',
        status: 'NU',
        selectedUsers: [],
        valid: false,
        lastModified: serverTimestamp(),
        formData: {},
        generalData: { fluxName: name, fluxDescription: '' },
      });
      setNewFlowName((m) => ({ ...m, [pid]: '' }));
    } catch (e) {
      console.error('Failed to create flow', e);
      alert('Failed to create flow');
    }
  }

  async function handleDeleteFlow(project, flow) {
    if (!currentUser) return;
    const ok = window.confirm(`Delete flow "${flow.flowName}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, `companies/${currentUser.uid}/projects/${project.id}/flows/${flow.id}`));
    } catch (e) {
      console.error('Failed to delete flow', e);
      alert('Failed to delete flow');
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
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-200 bg-gray-50">
                <div className="col-span-6">Project</div>
                <div className="col-span-3">Created</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>
              {projects.map((project) => (
                <div key={project.id} className="border-b border-gray-200">
                  <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50">
                    <div className="col-span-6 flex items-center gap-2">
                      <button onClick={() => toggleExpand(project)} className="text-gray-600 hover:text-gray-800">
                        {/* caret icon */}
                        <svg className={`h-5 w-5 transform transition-transform ${expanded[project.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="font-medium text-gray-900">{project.projectName}</span>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">{project.createdAt?.toDate().toLocaleDateString() || '—'}</div>
                    <div className="col-span-3 flex justify-end gap-3">
                      <button title="Open" onClick={() => onOpenProject ? onOpenProject(project) : navigate(`/dashboard/projects/${project.id}`)} className="text-indigo-600 hover:text-indigo-700 text-sm">Open</button>
                      <button title="Delete project" onClick={() => handleDeleteProject(project)} className="text-gray-500 hover:text-red-600">
                        {/* trash icon */}
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 002-2h2a2 2 0 002 2m-7 0h10" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {expanded[project.id] && (
                    <div className="bg-gray-50 px-8 py-3">
                      {/* Add flow inline */}
                      <div className="flex gap-2 mb-3">
                        <input
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="New flow name"
                          value={newFlowName[project.id] || ''}
                          onChange={(e) => setNewFlowName((m) => ({ ...m, [project.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow(project)}
                        />
                        <button onClick={() => handleCreateFlow(project)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm">Add Flow</button>
                      </div>

                      {flowsLoading[project.id] ? (
                        <div className="text-sm text-gray-600">Loading flows...</div>
                      ) : !flows[project.id] || flows[project.id].length === 0 ? (
                        <div className="text-sm text-gray-600">No flows yet.</div>
                      ) : (
                        <div className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
                          {flows[project.id].map((f) => (
                            <div key={f.id} className="flex items-center justify-between px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800 text-sm">{f.flowName || 'Untitled flow'}</span>
                                <span className="text-xs text-gray-500">{f.status || 'NU'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => onOpenFlow && onOpenFlow({ ...f, projectId: project.id })} className="text-indigo-600 hover:text-indigo-700 text-sm">Open</button>
                                <button title="Delete flow" onClick={() => handleDeleteFlow(project, f)} className="text-gray-500 hover:text-red-600">
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
