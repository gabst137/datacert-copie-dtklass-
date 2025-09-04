import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNotify } from '../../contexts/NotificationContext';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Panel,
  getNodesBounds,
  getViewportForBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import { nodeTypes } from './FlowChartNodes';

// Auto-generation algorithm for creating flowchart from flow data
const generateFlowChart = (formData, processes = []) => {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  let edgeId = 0;
  
  // Helper to create a node
  const createNode = (type, label, position, data = {}) => {
    const node = {
      id: `node-${nodeId++}`,
      type,
      position,
      data: { label, ...data }
    };
    nodes.push(node);
    return node.id;
  };
  
  // Helper to create an edge
  const createEdge = (source, target, label = '') => {
    edges.push({
      id: `edge-${edgeId++}`,
      source,
      target,
      label,
      animated: true,
      style: { stroke: '#6366f1' }
    });
  };

  // Layout configuration for 7-tab structure
  const mainTabSpacing = 300;
  const subItemSpacing = 180;
  const startX = 100;
  const startY = 100;
  
  let currentX = startX;
  
  // Helper to sanitize user input to prevent XSS attacks
  const sanitizeInput = (input) => {
    if (!input) return '';
    return String(input).replace(/[<>'"&]/g, (match) => {
      const htmlEntities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
      return htmlEntities[match] || match;
    });
  };

  // Helper to create sub-nodes for a main category
  const createCategoryWithSubItems = (mainTitle, dataObject, mainNodeType, subNodeType, x, y) => {
    if (!dataObject || typeof dataObject !== 'object' || Object.keys(dataObject).length === 0) return [];
    
    const createdNodes = [];
    
    // Create main category node with sanitized title
    const mainNodeId = createNode(
      mainNodeType,
      sanitizeInput(mainTitle),
      { x, y },
      { subLabel: `${Object.keys(dataObject).length} items` }
    );
    createdNodes.push(mainNodeId);
    
    // Create sub-nodes for each data item with proper null checking
    const entries = Object.entries(dataObject).filter(([, v]) => v && typeof v === 'object');
    entries.forEach(([key, value], index) => {
      const subY = y + 120 + (index * subItemSpacing);
      
      // Create bullet points from filled fields with sanitization
      const bulletPoints = [];
      if (value.enumerare) bulletPoints.push(`Enumerare: ${sanitizeInput(value.enumerare)}`);
      if (value.relevantDocs) bulletPoints.push(`Documente: ${sanitizeInput(value.relevantDocs)}`);
      if (value.method) bulletPoints.push(`Method: ${sanitizeInput(value.method)}`);
      if (value.period) bulletPoints.push(`Period: ${sanitizeInput(value.period)}`);
      if (value.storageOnly) bulletPoints.push(`Storage: ${sanitizeInput(value.storageOnly)}`);
      if (value.legalBasis) bulletPoints.push(`Legal Basis: ${sanitizeInput(value.legalBasis)}`);
      if (value.recipient) bulletPoints.push(`Recipient: ${sanitizeInput(value.recipient)}`);
      if (value.category) bulletPoints.push(`Category: ${sanitizeInput(value.category)}`);
      if (value.destState) bulletPoints.push(`State: ${sanitizeInput(value.destState)}`);
      if (value.transferType) bulletPoints.push(`Transfer: ${sanitizeInput(value.transferType)}`);
      
      // Sanitize node label
      const nodeLabel = sanitizeInput(value.__label || value.name) || `Item ${index + 1}`;
      
      const subNodeId = createNode(
        subNodeType,
        nodeLabel,
        { x, y: subY },
        { items: bulletPoints.length > 0 ? bulletPoints : ['Selected item'] }
      );
      
      createdNodes.push(subNodeId);
      
      // Connect sub-node to main node
      createEdge(mainNodeId, subNodeId, 'Contains');
    });
    
    return createdNodes;
  };

  // Create the 7 main category sections
  const allCreatedNodes = [];
  
  // 1. Flux intern (Internal Flow)
  if (formData.generalData?.internalFlow) {
    const nodes = createCategoryWithSubItems(
      'Flux intern',
      formData.generalData.internalFlow,
      'entity',
      'process',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 2. Flux extern (SEE) - External SEE transfers
  if (formData.peopleData?.externalSEE) {
    const nodes = createCategoryWithSubItems(
      'Flux extern (SEE)',
      formData.peopleData.externalSEE,
      'transfer',
      'entity',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 3. Transfer state terte - Third country transfers
  if (formData.legalData?.thirdCountries) {
    const nodes = createCategoryWithSubItems(
      'Transfer state terte',
      formData.legalData.thirdCountries,
      'transfer',
      'entity',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 4. Prelucrare date - Processing data (special categories)
  if (formData.processingData?.specialCategories) {
    const nodes = createCategoryWithSubItems(
      'Prelucrare date',
      formData.processingData.specialCategories,
      'process',
      'data',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 5. Categorii date - Data categories matrix
  if (formData.categoryMatrix) {
    const nodes = createCategoryWithSubItems(
      'Categorii date',
      formData.categoryMatrix,
      'data',
      'data',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 6. Stocare date - Storage data
  if (formData.storageData?.matrix) {
    const nodes = createCategoryWithSubItems(
      'Stocare date',
      formData.storageData.matrix,
      'storage',
      'storage',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  // 7. Securitate - Security measures matrix
  if (formData.securityData?.matrix) {
    const nodes = createCategoryWithSubItems(
      'Securitate',
      formData.securityData.matrix,
      'security',
      'security',
      currentX,
      startY
    );
    allCreatedNodes.push(...nodes);
    if (nodes.length > 0) currentX += mainTabSpacing;
  }
  
  return { nodes, edges };
};

function FlowChart({ 
  formData, 
  processes = [], 
  diagramData = null,
  onDiagramChange,
  flowId,
  projectId,
  userId,
  fullHeight = false
}) {
  const notify = useNotify();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Generate initial flowchart on component mount or when data changes
  useEffect(() => {
    if (diagramData?.nodes && diagramData?.edges) {
      // Use saved diagram if available
      setNodes(diagramData.nodes);
      setEdges(diagramData.edges);
      setIsAutoLayout(false);
    } else if (isAutoLayout) {
      // Auto-generate from flow data
      const { nodes: generatedNodes, edges: generatedEdges } = generateFlowChart(formData, processes);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    }
  }, [formData, processes, diagramData, isAutoLayout]);
  
  const onNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      if (onDiagramChange) {
        onDiagramChange({ nodes: newNodes, edges });
      }
    },
    [nodes, edges, onDiagramChange]
  );
  
  const onEdgesChange = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
      if (onDiagramChange) {
        onDiagramChange({ nodes, edges: newEdges });
      }
    },
    [nodes, edges, onDiagramChange]
  );
  
  // Selected node + updater
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const handleUpdateSelectedNode = (mergeData) => {
    setNodes((prev) => {
      const next = prev.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...mergeData(n.data || {}) } } : n);
      if (onDiagramChange) onDiagramChange({ nodes: next, edges });
      return next;
    });
  };
  
  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(
        { ...params, animated: true, style: { stroke: '#6366f1' } },
        edges
      );
      setEdges(newEdges);
      if (onDiagramChange) {
        onDiagramChange({ nodes, edges: newEdges });
      }
    },
    [nodes, edges, onDiagramChange]
  );
  
  // Auto-layout function
  const handleAutoLayout = () => {
    const { nodes: generatedNodes, edges: generatedEdges } = generateFlowChart(formData, processes);
    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setIsAutoLayout(true);
    if (onDiagramChange) {
      onDiagramChange({ nodes: generatedNodes, edges: generatedEdges });
    }
  };

  // Auto-fit view when diagram changes and instance is ready
  useEffect(() => {
    if (reactFlowInstance) {
      try {
        reactFlowInstance.fitView({ padding: 0.2 });
      } catch (_) {
        // ignore fitView errors
      }
    }
  }, [reactFlowInstance, nodes.length, edges.length]);
  
  // Export as image (hi-DPI, guards empty diagram)
  const handleExportImage = useCallback(() => {
    if (!nodes || nodes.length === 0) {
      notify.info('Nimic de exportat. Adăugați noduri în diagramă.');
      return;
    }
    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    );

    const flowElement = document.querySelector('.react-flow__viewport');

    if (flowElement) {
      toPng(flowElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: nodesBounds.width + 100,
        height: nodesBounds.height + 100,
        style: {
          width: nodesBounds.width + 100,
          height: nodesBounds.height + 100,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      })
        .then((dataUrl) => {
          // Sanitize filename to prevent path traversal attacks
          const sanitizeFilename = (name) => {
            if (!name) return 'diagram';
            return String(name).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
          };
          
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `flowchart_${sanitizeFilename(flowId)}.png`;
          a.click();
        })
        .catch((err) => {
          console.error('Failed to export image:', err);
          notify.error('Exportul imaginii a eșuat.');
        });
    }
  }, [nodes, flowId, notify]);
  
  // Add new node
  const handleAddNode = (type = 'entity') => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { label: 'New Node' }
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setIsAutoLayout(false);
    
    if (onDiagramChange) {
      onDiagramChange({ nodes: newNodes, edges });
    }
  };
  
  return (
    <div
      className={
        `w-full ${fullHeight ? 'h-full' : ''} ${fullHeight ? '' : 'bg-white border border-gray-200 rounded-lg'}`
      }
      style={fullHeight ? { height: '100%', minHeight: 520 } : { height: '60vh', minHeight: 520 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onSelectionChange={({ nodes: sel = [] }) => setSelectedNodeId(sel[0]?.id || null)}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: '100%', height: '100%' }}
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={16} />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'entity': return '#6366f1';
              case 'process': return '#10b981';
              case 'storage': return '#3b82f6';
              case 'transfer': return '#f97316';
              case 'security': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          className="bg-white border border-gray-300"
        />
        <Controls />
        
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={handleAutoLayout}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Auto Layout
          </button>
          <button
            onClick={() => reactFlowInstance && reactFlowInstance.fitView({ padding: 0.2 })}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Fit View
          </button>
          <button
            onClick={handleExportImage}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Export PNG
          </button>
        </Panel>
        
        <Panel position="top-left" className="flex gap-2">
          <select
            onChange={(e) => handleAddNode(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            value=""
          >
            <option value="" disabled>Add Node...</option>
            <option value="entity">Entity</option>
            <option value="process">Process</option>
            <option value="storage">Storage</option>
            <option value="transfer">Transfer</option>
            <option value="security">Security</option>
          </select>
        </Panel>

        {selectedNode && (
          <Panel position="bottom-right" className="bg-white border border-gray-300 rounded-md p-3 w-80 shadow-md">
            <div className="text-sm font-semibold text-gray-800 mb-2">Edit node</div>
            <label className="block text-xs text-gray-600 mb-1">Title</label>
            <input
              type="text"
              className="w-full mb-2 px-2 py-1 border border-gray-300 rounded"
              value={selectedNode.data?.label || ''}
              onChange={(e) => handleUpdateSelectedNode(() => ({ label: e.target.value }))}
            />

            {(Array.isArray(selectedNode.data?.lines) || Array.isArray(selectedNode.data?.items)) && (
              <>
                <label className="block text-xs text-gray-600 mb-1">Sub-items (one per line)</label>
                <textarea
                  className="w-full h-28 mb-2 px-2 py-1 border border-gray-300 rounded text-xs"
                  value={(selectedNode.data?.lines || selectedNode.data?.items || []).join('\n')}
                  onChange={(e) => {
                    const arr = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                    handleUpdateSelectedNode((data) => (data.lines ? { lines: arr } : { items: arr }));
                  }}
                />
              </>
            )}

            <div className="flex justify-between items-center mt-1">
              <button className="text-xs text-gray-600 hover:text-gray-800" onClick={() => setSelectedNodeId(null)}>Close</button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
