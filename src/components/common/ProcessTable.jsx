import { useState } from 'react';

function ProcessTable({ processes = [], onChange }) {
  const [expandedRows, setExpandedRows] = useState({});

  const processingActivities = [
    'Stocare date',
    'Colectare date',
    'Inregistrare',
    'Organizare Date',
    'Structurare Date',
    'Consultare date',
    'Extragere date',
    'Utilizare date',
    'divulgare date (prin transmitere, diseminare sau punere la dispozitie in orice alt mod)',
    'stergere sau distrugere date',
    'adaptare sau modificare date',
    'aliniere sau combinare date'
  ];

  const addProcess = () => {
    const newProcess = {
      id: Date.now().toString(),
      name: '',
      activities: [],
      dcpGroups: {
        info: '',
        fields: []
      },
      dataSources: [],
      operators: []
    };
    onChange([...processes, newProcess]);
  };

  const updateProcess = (index, field, value) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeProcess = (index) => {
    onChange(processes.filter((_, i) => i !== index));
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Procese</h3>
        
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">Procese</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Documente financiar contabile"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={processes[0]?.name || ''}
              onChange={(e) => {
                if (processes.length === 0) {
                  addProcess();
                } else {
                  updateProcess(0, 'name', e.target.value);
                }
              }}
            />
            <button
              type="button"
              onClick={addProcess}
              className="text-gray-500 hover:text-gray-700"
              title="Add process"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {processes.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Proces</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Activitati de procesare</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Grupari DCP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Surse de Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Operatori</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((process, index) => (
                <tr key={process.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={process.name}
                      onChange={(e) => updateProcess(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Process name"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleRow(index)}
                        className="w-full text-left border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {process.activities.length > 0 
                          ? `${process.activities.length} selected`
                          : 'Select activities...'}
                      </button>
                      
                      {expandedRows[index] && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {processingActivities.map((activity) => (
                            <label key={activity} className="flex items-center px-3 py-2 hover:bg-gray-50 text-sm">
                              <input
                                type="checkbox"
                                checked={process.activities.includes(activity)}
                                onChange={(e) => {
                                  const activities = e.target.checked
                                    ? [...process.activities, activity]
                                    : process.activities.filter(a => a !== activity);
                                  updateProcess(index, 'activities', activities);
                                }}
                                className="mr-2"
                              />
                              {activity}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={process.dcpGroups.info || ''}
                        onChange={(e) => updateProcess(index, 'dcpGroups', {
                          ...process.dcpGroups,
                          info: e.target.value
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Info furnizor"
                      />
                      <textarea
                        value={process.dcpGroups.fields.join(' | ')}
                        onChange={(e) => updateProcess(index, 'dcpGroups', {
                          ...process.dcpGroups,
                          fields: e.target.value.split(' | ').filter(Boolean)
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Fields (separated by |)"
                        rows="2"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={process.dataSources[0] || ''}
                      onChange={(e) => updateProcess(index, 'dataSources', [e.target.value])}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="Furnizor">Furnizor</option>
                      <option value="Client">Client</option>
                      <option value="Angajat">Angajat</option>
                      <option value="Sistem intern">Sistem intern</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={process.operators[0] || ''}
                      onChange={(e) => updateProcess(index, 'operators', [e.target.value])}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="Dermastyle">Dermastyle</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Operator extern">Operator extern</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeProcess(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove process"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProcessTable;