import { Handle, Position } from '@xyflow/react';

// Entity Node (Rectangle) - for people, clients, operators
export const EntityNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-indigo-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-indigo-100">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {data.subLabel && (
            <div className="text-xs text-gray-500">{data.subLabel}</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
    </div>
  );
};

// Process Node (Diamond/Rectangle with icon) - for data processing activities
export const ProcessNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-green-200">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="ml-2 w-56">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {Array.isArray(data.lines) && data.lines.length > 0 ? (
            <ul className="mt-1 text-xs text-gray-700 list-disc list-inside space-y-0.5">
              {data.lines.slice(0, 6).map((line, idx) => (
                <li key={idx} className="truncate" title={line}>{line}</li>
              ))}
              {data.lines.length > 6 && (
                <li className="text-gray-500">+{data.lines.length - 6} more…</li>
              )}
            </ul>
          ) : (
            data.activities && data.activities.length > 0 && (
              <div className="text-xs text-gray-500">{data.activities.length} activities</div>
            )
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
};

// Storage Node (Cylinder shape) - for databases and storage
export const StorageNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-t-lg rounded-b-3xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-blue-200">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {data.duration && (
            <div className="text-xs text-gray-500">
              {data.duration}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};

// Transfer Node (Arrow shape) - for data transfers
export const TransferNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-orange-200">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {data.method && (
            <div className="text-xs text-gray-500">{data.method}</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
    </div>
  );
};

// Security Node - for security measures
export const SecurityNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-red-200">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {data.measures && (
            <div className="text-xs text-gray-500">
              {data.measures.length} measures
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500"
      />
    </div>
  );
};

// Data Categories Node - for personal data categories captured in the matrix
export const DataCategoriesNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
      <div className="flex items-center">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-purple-200">
          <svg className="w-6 h-6 text-purple-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </div>
        <div className="ml-2 w-80">
          <div className="text-sm font-bold text-gray-700">{data.label}</div>
          {Array.isArray(data.items) && data.items.length > 0 && (
            <ul className="mt-1 text-xs text-gray-700 list-disc list-inside space-y-0.5">
              {data.items.slice(0, 6).map((it, idx) => (
                <li key={idx} className="whitespace-normal break-words" title={it}>{it}</li>
              ))}
              {data.items.length > 6 && (
                <li className="text-gray-500">+{data.items.length - 6} more…</li>
              )}
            </ul>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
};

export const nodeTypes = {
  entity: EntityNode,
  process: ProcessNode,
  storage: StorageNode,
  transfer: TransferNode,
  security: SecurityNode,
  data: DataCategoriesNode
};
