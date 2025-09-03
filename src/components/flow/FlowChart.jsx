import { useState, useCallback, useEffect } from 'react';
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
  
  // Layout positions
  let xPos = 50;
  let yPos = 50;
  const xSpacing = 250;
  const ySpacing = 120;
  
  // Step 1: Create entity nodes for people categories
  const peopleNodeIds = [];
  if (formData.peopleData?.categories?.length > 0) {
    formData.peopleData.categories.forEach((category, index) => {
      const nodeId = createNode(
        'entity',
        category,
        { x: xPos, y: yPos + (index * 80) },
        { subLabel: 'Data Subject' }
      );
      peopleNodeIds.push(nodeId);
    });
    xPos += xSpacing;
  }
  
  // Step 2: Create collection/input node if notification methods exist
  let collectionNodeId = null;
  if (formData.peopleData?.notificationMethods?.length > 0) {
    collectionNodeId = createNode(
      'transfer',
      'Data Collection',
      { x: xPos, y: yPos + 40 },
      { method: formData.peopleData.notificationMethods.join(', ') }
    );
    
    // Connect people to collection
    peopleNodeIds.forEach(personId => {
      createEdge(personId, collectionNodeId, 'Provides');
    });
    
    xPos += xSpacing;
  }
  
  // Step 3: Create process nodes
  const processNodeIds = [];
  if (processes && processes.length > 0) {
    processes.forEach((process, index) => {
      const nodeId = createNode(
        'process',
        process.name || 'Process',
        { x: xPos, y: yPos + (index * 100) },
        { activities: process.activities || [] }
      );
      processNodeIds.push(nodeId);
      
      // Connect from collection or people
      if (collectionNodeId) {
        createEdge(collectionNodeId, nodeId, 'Input');
      } else if (peopleNodeIds.length > 0) {
        createEdge(peopleNodeIds[0], nodeId, 'Data');
      }
    });
  } else if (formData.processingData?.purposes?.length > 0) {
    // Create a general processing node if no specific processes
    const nodeId = createNode(
      'process',
      'Data Processing',
      { x: xPos, y: yPos + 40 },
      { activities: formData.processingData.purposes }
    );
    processNodeIds.push(nodeId);
    
    if (collectionNodeId) {
      createEdge(collectionNodeId, nodeId, 'Process');
    } else if (peopleNodeIds.length > 0) {
      createEdge(peopleNodeIds[0], nodeId, 'Data');
    }
  }
  
  if (processNodeIds.length > 0) {
    xPos += xSpacing;
  }
  
  // Step 4: Create storage node
  let storageNodeId = null;
  if (formData.storageData?.policy || formData.storageData?.duration) {
    const duration = formData.storageData.duration 
      ? `${formData.storageData.duration.value} ${formData.storageData.duration.unit}`
      : 'Defined period';
      
    storageNodeId = createNode(
      'storage',
      'Data Storage',
      { x: xPos, y: yPos + 40 },
      { duration }
    );
    
    // Connect processes to storage
    if (processNodeIds.length > 0) {
      processNodeIds.forEach(processId => {
        createEdge(processId, storageNodeId, 'Store');
      });
    } else if (collectionNodeId) {
      createEdge(collectionNodeId, storageNodeId, 'Store');
    }
    
    xPos += xSpacing;
  }

  // Step 5: Create Data Categories node from matrix (if present)
  if (formData.categoryMatrix) {
    const entries = Object.entries(formData.categoryMatrix)
      .filter(([, v]) => v && (v.enumerare || v.method || v.period || v.storageOnly || v.legalBasis))
      .map(([k]) => k);
    if (entries.length > 0) {
      const dataNodeId = createNode(
        'data',
        'Categorii date',
        { x: Math.max(50, xPos - 125), y: yPos + 240 },
        { items: entries }
      );
      // connect to process nodes or storage if available
      if (processNodeIds.length > 0) {
        processNodeIds.forEach(pid => createEdge(dataNodeId, pid, 'Date'));
      } else if (storageNodeId) {
        createEdge(dataNodeId, storageNodeId, 'Date');
      }
    }
  }

  // Step 6: Create recipient/transfer nodes
  const recipientCategories = [
    ...(formData.processingData?.recipientCategories || []),
    ...(formData.storageData?.recipientCategories || [])
  ];
  
  if (recipientCategories.length > 0) {
    const uniqueRecipients = [...new Set(recipientCategories)];
    
    uniqueRecipients.forEach((recipient, index) => {
      const nodeId = createNode(
        'entity',
        recipient,
        { x: xPos, y: yPos + (index * 80) },
        { subLabel: 'Data Recipient' }
      );
      
      // Connect from storage or processes
      if (storageNodeId) {
        createEdge(storageNodeId, nodeId, 'Transfer');
      } else if (processNodeIds.length > 0) {
        createEdge(processNodeIds[processNodeIds.length - 1], nodeId, 'Share');
      }
    });
  }
  
  // Step 7: Add security node if security measures exist
  if (formData.securityData?.technicalMeasures?.length > 0 || 
      formData.securityData?.organizationalMeasures?.length > 0) {
    const measures = [
      ...(formData.securityData.technicalMeasures || []),
      ...(formData.securityData.organizationalMeasures || [])
    ];
    
    const securityNodeId = createNode(
      'security',
      'Security Measures',
      { x: xPos / 2, y: yPos + ySpacing + 50 },
      { measures }
    );
    
    // Connect security to storage
    if (storageNodeId) {
      createEdge(securityNodeId, storageNodeId, 'Protects');
    }
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
  userId 
}) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
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
      alert('Nothing to export. Add nodes to the diagram first.');
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
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `flowchart_${flowId || 'diagram'}.png`;
          a.click();
        })
        .catch((err) => {
          console.error('Failed to export image:', err);
          alert('Failed to export flowchart as image');
        });
    }
  }, [nodes, flowId]);
  
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
    <div className="w-full h-[600px] bg-white border border-gray-200 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
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
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
