import { memo, useRef, useState } from 'react';
import { sanitizeInput } from '../../../utils/helpers';

// Headers per screenshot: Security general description table
const HEADERS = [
  'Enumerare / Enlisting',
  'Documente relevante / Relevant documents',
];

// Default rows: physical, technical, organisational measures
const DEFAULT_ROWS = [
  { id: 'physical', label: 'Măsuri fizice / Physical measures' },
  { id: 'technical', label: 'Măsuri tehnice / Technical measures' },
  { id: 'organizational', label: 'Măsuri organizatorice / Organisational measures' },
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

function SecurityMeasuresTab({ securityData = {}, onSecurityDataChange }) {
  const newSecurityRef = useRef(null);
  // Store matrix under securityData.matrix to avoid clashing with legacy fields
  const data = securityData.matrix || {};

  const update = (updated) => {
    onSecurityDataChange?.({
      ...securityData,
      matrix: updated,
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

  const defaultIds = new Set(DEFAULT_ROWS.map((r) => r.id));
  const selectedDefaultRows = DEFAULT_ROWS.filter((r) => data[r.id]).map((r) => ({ id: r.id, label: r.label }));
  const customRowEntries = Object.keys(data)
    .filter((k) => !defaultIds.has(k))
    .map((k) => ({ id: k, label: data[k]?.__label || 'Categorie personalizată' }));
  const rows = [...selectedDefaultRows, ...customRowEntries];

  const [menuOpen, setMenuOpen] = useState(false);
  const availableOptions = DEFAULT_ROWS.filter((r) => !data[r.id]);

  const addDefaultRow = (rowId) => {
    const rowDef = DEFAULT_ROWS.find((r) => r.id === rowId);
    if (!rowDef) return;
    const updated = {
      ...data,
      [rowId]: {
        __label: rowDef.label,
        enumerare: '',
        relevantDocs: '',
      },
    };
    update(updated);
    setOpen((m) => ({ ...m, [rowId]: true }));
    setMenuOpen(false);
  };

  const addCustomRow = (label) => {
    const id = `custom_${Date.now()}`;
    const updated = {
      ...data,
      [id]: {
        __label: label || 'Categorie personalizată',
        enumerare: '',
        relevantDocs: '',
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
        Securitatea datelor (descriere generală)
      </div>

      {/* Picker for default measure categories */}
      <div className="relative" style={{ marginBottom: 16 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          disabled={availableOptions.length === 0}
          className="px-4 py-2 rounded-xl text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: '2px solid #c7d2fe', color: '#3730a3' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {availableOptions.length ? 'Adaugă din listă' : 'Toate categoriile au fost adăugate'}
          </span>
        </button>
        {menuOpen && availableOptions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {availableOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => addDefaultRow(opt.id)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {rows.map((row) => {
          const label = defaultIds.has(row.id) ? row.label : (data[row.id]?.__label || row.label);
          const rowData = data[row.id] || {};
          const completedCount = ['enumerare','relevantDocs']
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
                  <span className="text-gray-900">{label}</span>
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
                    <FieldRow 
                      label={HEADERS[0]} 
                      value={rowData.enumerare || ''}
                      onChange={(value) => updateCell(row.id, 'enumerare', value)}
                    />
                    <FieldRow 
                      label={HEADERS[1]} 
                      value={rowData.relevantDocs || ''}
                      onChange={(value) => updateCell(row.id, 'relevantDocs', value)}
                    />
                  </div>

                  {!defaultIds.has(row.id) && (
                    <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                      <div className="text-xs text-gray-600">
                        Nume categorie: <strong>{label}</strong>
                      </div>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Redenumește categoria"
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                          maxLength={200}
                          value={data[row.id]?.__label || ''}
                          onChange={(e) => {
                            const cleaned = sanitizeInput(e.target.value, 200);
                            const updated = { 
                              ...data, 
                              [row.id]: { 
                                ...data[row.id], 
                                __label: cleaned 
                              } 
                            };
                            update(updated);
                          }}
                        />
                        <button onClick={() => removeRow(row.id)} className="text-xs border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50">Șterge</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200" style={{ marginTop: 16, paddingTop: 12 }}>
        <div className="text-sm font-medium" style={{ marginBottom: 8 }}>Adaugă categorie personalizată</div>
        <div className="flex" style={{ gap: 8 }}>
          <input
            id="newSecurityCategoryName"
            ref={newSecurityRef}
            type="text"
            placeholder="Ex: Alte măsuri"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = sanitizeInput(e.currentTarget.value, 200);
                if (name && name.length > 0) {
                  addCustomRow(name);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = newSecurityRef.current;
              const name = sanitizeInput(input?.value || '', 200);
              if (name && name.length > 0) {
                addCustomRow(name);
                if (input) input.value = '';
              }
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

export default memo(SecurityMeasuresTab);
