// src/components/Project.jsx
import { useParams, Link } from 'react-router-dom';

function Project() {
  const { projectId } = useParams();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Project: {projectId}</h1>
        <Link to="/dashboard" className="text-indigo-600 hover:underline">Back to Dashboard</Link>
      </div>
      <p className="text-gray-600">Project detail view placeholder. We will list flows here.</p>
    </div>
  );
}

export default Project;

