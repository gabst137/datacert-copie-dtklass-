import { useState, useCallback, useEffect } from 'react';
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

  // Sync local state with prop changes to prevent race conditions
  useEffect(() => {
    if (diagramData !== localDiagramData) {
      setLocalDiagramData(diagramData);
    }
  }, [diagramData]); // Removed localDiagramData from deps to avoid infinite loop

  // Handle diagram changes locally and propagate to parent
  const handleDiagramChange = useCallback((newDiagramData) => {
    setLocalDiagramData(newDiagramData);
    if (onDiagramChange) {
      onDiagramChange(newDiagramData);
    }
  }, [onDiagramChange]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} fullscreen backdropClosable={false}>
      <FlowChart
        formData={formData}
        processes={processes}
        diagramData={localDiagramData}
        onDiagramChange={handleDiagramChange}
        flowId={flowId}
        projectId={projectId}
        userId={userId}
        fullHeight={true}
      />
    </Modal>
  );
}

export default FlowDiagramModal;
