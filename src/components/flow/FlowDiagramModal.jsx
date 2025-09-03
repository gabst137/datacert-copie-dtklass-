import { useState, useCallback } from 'react';
import Modal from '../common/Modal';
import FlowChart from './FlowChart';

function FlowDiagramModal({ 
  isOpen, 
  onClose, 
  formData, 
  processes, 
  diagramData,
  onDiagramChange,
  flowId,
  projectId,
  userId 
}) {
  const [localDiagramData, setLocalDiagramData] = useState(diagramData);

  // Handle diagram changes locally and propagate to parent
  const handleDiagramChange = useCallback((newDiagramData) => {
    setLocalDiagramData(newDiagramData);
    if (onDiagramChange) {
      onDiagramChange(newDiagramData);
    }
  }, [onDiagramChange]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flow Diagram Visualization"
      size="xlarge"
    >
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Interactive flow diagram showing data movement through your business process. 
            You can drag nodes, create connections, and export the diagram as an image.
          </p>
        </div>
        
        <FlowChart
          formData={formData}
          processes={processes}
          diagramData={localDiagramData}
          onDiagramChange={handleDiagramChange}
          flowId={flowId}
          projectId={projectId}
          userId={userId}
        />
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Tip: Use "Auto Layout" to automatically arrange nodes, or drag them manually for custom positioning.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default FlowDiagramModal;