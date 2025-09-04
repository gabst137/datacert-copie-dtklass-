import { memo, useRef, useState } from 'react';
import { sanitizeInput } from '../../../utils/helpers';

// Internal data flow within Data Controller
const HEADERS = [
  'Denumire departament / Department',
  'Modalitate acces / Access method',
];

const FieldInput = memo(({ value, onChange, placeholder }) => (
  <input
    type="text"
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder || '—'}
  />
));

const FieldRow = memo(({ label, value, onChange }) => (
  <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 38%) 1fr', gap: 12 }}>
    <div className="text-sm text-gray-700" style={{ alignSelf: 'center' }}>{label}</div>
    <FieldInput value={value} onChange={onChange} />
  </div>
));

function InternalDataFlowTab({ generalData = {}, onGeneralDataChange }) {
  const newDeptRef = useRef(null);
  // Persist under generalData.internalFlow
  const data = generalData.internalFlow || {};

  const update = (updated) => {
    onGeneralDataChange?.({
      ...generalData,
      internalFlow: updated,
    });
  };

  const updateCell = (rowId, field, value) => {
    const updated = {
      ...data,
      [rowId]: {
        ...data[rowId],
        [field]: value,
      },
    };
    update(updated);
  };

  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((m) => ({ ...m, [id]: !m[id] }));

  const rows = Object.keys(data).map((k) => ({ id: k, label: data[k]?.__label || 'Departament intern / Internal department' }));

  const addRow = (label) => {
    const id = `row_${Date.now()}`;
    const updated = {
      ...data,
      [id]: {
        __label: label || 'Departament intern / Internal department',
        departmentName: '',
        accessMode: '',
      },
    };
    update(updated);
    setOpen((m) => ({ ...m, [id]: true }));
  };

  const removeRow = (id) => {
    const updated = { ...data };
    delete updated[id];
    update(updated);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-sm font-medium" style={{ marginBottom: 12 }}>
        Fluxul intern al datelor (în interiorul Operatorului)
      </div>

      <div className="text-xs text-gray-600" style={{ marginBottom: 8 }}>
        Adaugă câte o intrare per departament intern.
      </div>

      <div>
        {rows.map((row) => {
          const rowData = data[row.id] || {};
          const completedCount = ['departmentName','accessMode']
            .reduce((acc, k) => acc + (rowData[k] && String(rowData[k]).trim() ? 1 : 0), 0);
          return (
            <div key={row.id} className="rounded-lg" style={{ marginBottom: 16 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(row.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(row.id); } }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white rounded-lg shadow-sm"
                style={{ border: '2px solid #e5e7eb' }}
              >
                <div className="flex items-center" style={{ gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open[row.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-gray-900">{row.label}</span>
                </div>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <span className="text-xs text-gray-600">{completedCount}/2 completate</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                    className="text-xs rounded-md px-2 py-1 hover:bg-gray-50"
                    style={{ border: '1px solid #d1d5db' }}
                  >
                    Elimină
                  </button>
                </div>
              </div>

              {open[row.id] && (
                <div className="bg-gray-50 rounded-lg" style={{ padding: 14, border: '1px solid #e5e7eb', borderTop: '0' }}>
                  <div className="grid" style={{ gap: 12 }}>
                    <FieldRow label={HEADERS[0]} value={rowData.departmentName || ''} onChange={(v) => updateCell(row.id, 'departmentName', v)} />
                    <FieldRow label={HEADERS[1]} value={rowData.accessMode || ''} onChange={(v) => updateCell(row.id, 'accessMode', v)} />
                  </div>

                  <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                    <div className="text-xs text-gray-600">
                      Etichetă: <strong>{row.label}</strong>
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Redenumește eticheta rândului"
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                        value={data[row.id]?.__label || ''}
                        onChange={(e) => {
                          const updated = { 
                            ...data, 
                            [row.id]: { 
                              ...data[row.id], 
                              __label: e.target.value 
                            } 
                          };
                          update(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200" style={{ marginTop: 16, paddingTop: 12 }}>
        <div className="text-sm font-medium" style={{ marginBottom: 8 }}>Adaugă departament intern</div>
        <div className="flex" style={{ gap: 8 }}>
          <input
            id="newInternalDeptLabel"
            ref={newDeptRef}
            type="text"
            placeholder="Departament intern / Internal department"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = sanitizeInput(e.currentTarget.value, 200);
                if (name && name.length > 0) {
                  addRow(name);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = newDeptRef.current;
              const name = sanitizeInput(input?.value || '', 200);
              addRow(name || 'Departament intern / Internal department');
              if (input) input.value = '';
            }}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50"
          >
            Adaugă
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(InternalDataFlowTab);
