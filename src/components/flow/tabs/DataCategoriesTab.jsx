import { useMemo, useState } from 'react';

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
  // Start with matrix provided from Firestore; do not prefill any defaults.
  const initial = useMemo(() => ({}), []);
  const data = { ...initial, ...categoryMatrix };

  const updateCell = (rowId, field, value) => {
    const next = {
      ...data,
      [rowId]: {
        ...data[rowId],
        [field]: value
      }
    };
    onChange && onChange(next);
  };

  // Keep track of expanded state for row dropdowns
  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((m) => ({ ...m, [id]: !m[id] }));

  // Build list with ONLY currently selected rows (data), ordered with defaults first
  const defaultIds = new Set(DEFAULT_ROWS.map((r) => r.id));
  const selectedDefaultRows = DEFAULT_ROWS.filter((r) => data[r.id]).map((r) => ({ id: r.id, label: r.label }));
  const customRowEntries = Object.keys(data)
    .filter((k) => !defaultIds.has(k))
    .map((k) => ({ id: k, label: data[k]?.__label || 'Categorie personalizată' }));

  const rows = [...selectedDefaultRows, ...customRowEntries];

  // Dropdown menu for adding default rows
  const [menuOpen, setMenuOpen] = useState(false);
  const availableOptions = DEFAULT_ROWS.filter((r) => !data[r.id]);

  const addDefaultRow = (rowId) => {
    const rowDef = DEFAULT_ROWS.find((r) => r.id === rowId);
    if (!rowDef) return;
    const next = {
      ...data,
      [rowId]: {
        __label: rowDef.label,
        enumerare: '',
        method: '',
        period: '',
        storageOnly: '',
        legalBasis: ''
      }
    };
    onChange && onChange(next);
    setOpen((m) => ({ ...m, [rowId]: true }));
    setMenuOpen(false);
  };

  const addCustomRow = (label) => {
    const id = `custom_${Date.now()}`;
    const next = {
      ...data,
      [id]: {
        __label: label || 'Categorie personalizată',
        enumerare: '',
        method: '',
        period: '',
        storageOnly: '',
        legalBasis: ''
      }
    };
    onChange && onChange(next);
    setOpen((m) => ({ ...m, [id]: true }));
  };

  const removeCustomRow = (id) => {
    const next = { ...data };
    delete next[id];
    onChange && onChange(next);
  };

  const Field = ({ rowId, field, label }) => {
    const value = (data[rowId] && data[rowId][field]) || '';
    const filled = String(value).trim().length > 0;
    return (
      <div className="flex-1" style={{ minWidth: 220 }}>
        <div className="text-xs text-gray-600" style={{ marginBottom: 4 }}>{label}</div>
        <textarea
          className={`w-full p-2 text-sm border rounded-md ${filled ? 'border-green-500 bg-white' : 'border-gray-300 bg-gray-50 text-gray-700'}`}
          rows={3}
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
      <div className="relative" style={{ marginBottom: 12 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          disabled={availableOptions.length === 0}
          className="border border-gray-300 px-3 py-2 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableOptions.length ? 'Adaugă din listă' : 'Toate categoriile au fost adăugate'}
        </button>
        {menuOpen && availableOptions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-md" style={{ maxHeight: 260, overflowY: 'auto' }}>
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
          const completedCount = ['enumerare','method','period','storageOnly','legalBasis']
            .reduce((acc, k) => acc + (rowData[k] && String(rowData[k]).trim() ? 1 : 0), 0);
          return (
            <div key={row.id} className="border border-gray-200 rounded-md" style={{ marginBottom: 12 }}>
              <button
                onClick={() => toggle(row.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 rounded-t-md"
              >
                <div className="flex items-center" style={{ gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open[row.id] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-900">{label}</span>
                </div>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span className="text-xs text-gray-600">{completedCount}/5 completate</span>
                  {/* Remove button for selected categories */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomRow(row.id); }}
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50"
                  >
                    Elimină
                  </button>
                </div>
              </button>

              {open[row.id] && (
                <div className="grid" style={{ padding: 12, gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', gap: 12 }}>
                  <Field rowId={row.id} field="enumerare" label={HEADERS[0]} />
                  <Field rowId={row.id} field="method" label={HEADERS[1]} />
                  <Field rowId={row.id} field="period" label={HEADERS[2]} />
                  <Field rowId={row.id} field="storageOnly" label={HEADERS[3]} />
                  <Field rowId={row.id} field="legalBasis" label={HEADERS[4]} />

                  {!defaultIds.has(row.id) && (
                    <div className="flex items-center justify-between" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                      <div className="text-xs text-gray-600">
                        Nume categorie: <strong>{label}</strong>
                      </div>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Redenumește categoria"
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                          onChange={(e) => {
                            const next = { ...data, [row.id]: { ...data[row.id], __label: e.target.value } };
                            onChange && onChange(next);
                          }}
                          value={data[row.id]?.__label || ''}
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

export default DataCategoriesTab;
