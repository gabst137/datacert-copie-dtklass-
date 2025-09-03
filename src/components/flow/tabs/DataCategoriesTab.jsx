import { useMemo, useState, useEffect, useRef, memo } from 'react';

const HEADERS = [
  'Enumerare / Listing',
  'Modalitatea de prelucrare / Processing method',
  'Durata prelucrării / Processing period',
  'Durata prelucrare exclusiv prin stocare / Exclusive storage retention period',
  'Temei legal al duratei prelucării / Legal basis for retention period'
];

const DEFAULT_ROWS = [
  {
    id: 'idData',
    label:
      'Date de identificare (nume, prenume, sex, adresă, data nașterii) / ID data (name, surname, address)'
  },
  {
    id: 'contactData',
    label:
      'Date de contact (număr de telefon, adresă de email, adresă poștală) / Contact data (phone number, email address, postal address)'
  },
  {
    id: 'educationData',
    label:
      'Date legate de studii, certificări, competențe / Data related to education, certifications, skills'
  },
  {
    id: 'personalLife',
    label:
      'Aspecte legate de viața personală (stil de viață, situație familială etc.) / Personal life data (lifestyle, family situation, etc.)'
  },
  {
    id: 'economic',
    label:
      'Informații de ordin economic și financiar (venituri, situație financiară, situație fiscală etc.) / Economic and financial information (income, financial situation, tax situation, etc.)'
  },
  {
    id: 'professional',
    label:
      'Date legate de activitatea profesională desfășurată / Data related to professional activity'
  },
  { id: 'media', label: 'Imagini, voce / Photos, videos, voice' },
  {
    id: 'connection',
    label: 'Date de conexiune (adresă IP, loguri de acces etc.) / Connection data (IP address, access logs etc.)'
  },
  {
    id: 'location',
    label: 'Date de localizare (GPS, GSM etc.) / Location data (GPS, GSM etc.)'
  },
  {
    id: 'identityNumbers',
    label:
      'CNP, serie și număr act identitate/pașaport, permis auto / PIN, series and number of ID card/ driving license'
  },
  { id: 'other', label: 'Alte categorii de date / Other data categories' }
];

function DataCategoriesTab({ categoryMatrix = {}, onChange }) {
  // Keep a local draft so typing doesn't fight re-renders from parent
  const [draft, setDraft] = useState(() => ({ ...(categoryMatrix || {}) }));
  const suppressPushRef = useRef(false);
  const debounceRef = useRef(null);

  // When parent provides new data (switch flow, load), sync into draft
  useEffect(() => {
    suppressPushRef.current = true;
    setDraft({ ...(categoryMatrix || {}) });
  }, [categoryMatrix]);

  // Debounced push of local draft to parent
  useEffect(() => {
    if (suppressPushRef.current) {
      suppressPushRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange && onChange(draft);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [draft]);

  const updateCell = (rowId, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: value,
      },
    }));
  };

  // Keep track of expanded state for row dropdowns
  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((m) => ({ ...m, [id]: !m[id] }));

  // Build list with ONLY currently selected rows (data), ordered with defaults first
  const defaultIds = new Set(DEFAULT_ROWS.map((r) => r.id));
  const selectedDefaultRows = DEFAULT_ROWS.filter((r) => draft[r.id]).map((r) => ({ id: r.id, label: r.label }));
  const customRowEntries = Object.keys(draft)
    .filter((k) => !defaultIds.has(k))
    .map((k) => ({ id: k, label: draft[k]?.__label || 'Categorie personalizată' }));

  const rows = [...selectedDefaultRows, ...customRowEntries];

  // Dropdown menu for adding default rows
  const [menuOpen, setMenuOpen] = useState(false);
  const availableOptions = DEFAULT_ROWS.filter((r) => !draft[r.id]);

  const addDefaultRow = (rowId) => {
    const rowDef = DEFAULT_ROWS.find((r) => r.id === rowId);
    if (!rowDef) return;
    const next = {
      ...draft,
      [rowId]: {
        __label: rowDef.label,
        enumerare: '',
        method: '',
        period: '',
        storageOnly: '',
        legalBasis: ''
      }
    };
    setDraft(next);
    setOpen((m) => ({ ...m, [rowId]: true }));
    setMenuOpen(false);
  };

  const addCustomRow = (label) => {
    const id = `custom_${Date.now()}`;
    const next = {
      ...draft,
      [id]: {
        __label: label || 'Categorie personalizată',
        enumerare: '',
        method: '',
        period: '',
        storageOnly: '',
        legalBasis: ''
      }
    };
    setDraft(next);
    setOpen((m) => ({ ...m, [id]: true }));
  };

  const removeCustomRow = (id) => {
    const next = { ...draft };
    delete next[id];
    setDraft(next);
  };

  const FieldRow = ({ rowId, field, label }) => {
    const value = (draft[rowId] && draft[rowId][field]) || '';
    const filled = String(value).trim().length > 0;
    return (
      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 38%) 1fr', gap: 12 }}>
        <div className="text-sm text-gray-700" style={{ alignSelf: 'center' }}>{label}</div>
        <input
          type="text"
          className={`w-full px-3 py-2 text-sm border rounded-md ${filled ? 'border-green-500 bg-white' : 'border-gray-300 bg-gray-50 text-gray-700'}`}
          value={value}
          onChange={(e) => updateCell(rowId, field, e.target.value)}
          placeholder="—"
        />
      </div>
    );
  };

  let customName = '';

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-sm font-medium" style={{ marginBottom: 12 }}>Categorii de date personale prelucrate</div>

      {/* Picker for default categories */}
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
          const label = defaultIds.has(row.id) ? row.label : (draft[row.id]?.__label || row.label);
          const rowData = draft[row.id] || {};
          const completedCount = ['enumerare','method','period','storageOnly','legalBasis']
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
                  <span className="text-xs text-gray-600">{completedCount}/5 completate</span>
                  {/* Remove button for selected categories */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomRow(row.id); }}
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
                    <FieldRow rowId={row.id} field="enumerare" label={HEADERS[0]} />
                    <FieldRow rowId={row.id} field="method" label={HEADERS[1]} />
                    <FieldRow rowId={row.id} field="period" label={HEADERS[2]} />
                    <FieldRow rowId={row.id} field="storageOnly" label={HEADERS[3]} />
                    <FieldRow rowId={row.id} field="legalBasis" label={HEADERS[4]} />
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
                          onChange={(e) => {
                            const next = { ...draft, [row.id]: { ...(draft[row.id] || {}), __label: e.target.value } };
                            setDraft(next);
                          }}
                          value={draft[row.id]?.__label || ''}
                        />
                        <button onClick={() => removeCustomRow(row.id)} className="text-xs border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50">Șterge</button>
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
            id="newCategoryName"
            type="text"
            placeholder="Ex: Date biometrice"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = e.currentTarget.value.trim();
                if (name) {
                  addCustomRow(name);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('newCategoryName');
              const name = input?.value?.trim();
              if (name) {
                addCustomRow(name);
                if (input) input.value = '';
              }
            }}
            className="border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50"
          >
            Adaugă
          </button>
        </div>
        <div className="text-xs text-gray-600 mt-2">Câmpurile necompletate sunt afișate gri; cele completate au contur verde.</div>
      </div>
    </div>
  );
}

export default memo(DataCategoriesTab);
