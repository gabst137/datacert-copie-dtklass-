import { useMemo } from 'react';

const HEADERS = [
  'Enumerare / Listing',
  'Modalitatea de prelucrare / Processing method',
  'Durata prelucrării / Processing period',
  'Durata prelucrare exclusiv prin stocare / Exclusive storage retention period',
  'Temei legal al duratei prelucării / Legal basis for retention period'
];

const ROWS = [
  {
    id: 'idData',
    label: 'Date de identificare (nume, prenume, sex, adresă, data nașterii) / ID data (name, surname, address)'
  },
  {
    id: 'contactData',
    label: 'Date de contact (număr de telefon, adresă de email, adresă poștală) / Contact data (phone number, email address, postal address)'
  },
  {
    id: 'educationData',
    label: 'Date legate de studii, certificări, competențe / Data related to education, certifications, skills'
  },
  {
    id: 'personalLife',
    label: 'Aspecte legate de viața personală (stil de viață, situație familială etc.) / Personal life data (lifestyle, family situation, etc.)'
  },
  {
    id: 'economic',
    label: 'Informații de ordin economic și financiar (venituri, situație financiară, situație fiscală etc.) / Economic and financial information (income, financial situation, tax situation, etc.)'
  },
  {
    id: 'professional',
    label: 'Date legate de activitatea profesională desfășurată / Data related to professional activity'
  },
  {
    id: 'media',
    label: 'Imagini, voce / Photos, videos, voice'
  },
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
    label: 'CNP, serie și număr act identitate/pașaport, permis auto / PIN, series and number of ID card/ driving license'
  },
  {
    id: 'other',
    label: 'Alte categorii de date / Other data categories'
  }
];

function CategoriesMatrix({ open, onClose, matrixData = {}, onChange }) {
  const initial = useMemo(() => {
    const base = {};
    ROWS.forEach((r) => {
      base[r.id] = {
        enumerare: '',
        method: '',
        period: '',
        storageOnly: '',
        legalBasis: ''
      };
    });
    return base;
  }, []);

  const data = { ...initial, ...matrixData };

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black" style={{ opacity: 0.4 }} onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 bg-white rounded-md shadow-lg border border-gray-200 max-w-6xl w-[95vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Categorii de date personale prelucrate</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Închide</button>
          </div>
        </div>

        {/* Table */}
        <div className="p-3 overflow-auto">
          <table className="w-full border border-gray-300" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="text-left text-sm font-medium border border-gray-300 px-3 py-2"
                  style={{ position: 'sticky', top: 0, background: '#e9d5ff', zIndex: 1 }}
                >
                  Categorii de date personale prelucrate / Categories of processed personal data
                </th>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="text-left text-sm font-medium border border-gray-300 px-3 py-2"
                    style={{ position: 'sticky', top: 0, background: '#d9ead3', zIndex: 1 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.id}>
                  <td className="align-top border border-gray-300 px-3 py-2 text-sm" style={{ background: '#e9f5e6', width: '28%' }}>
                    {row.label}
                  </td>
                  <td className="align-top border border-gray-300 p-0" style={{ minWidth: 220 }}>
                    <textarea
                      className="w-full p-2 text-sm"
                      rows={3}
                      value={data[row.id]?.enumerare || ''}
                      onChange={(e) => updateCell(row.id, 'enumerare', e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="align-top border border-gray-300 p-0" style={{ minWidth: 200 }}>
                    <textarea
                      className="w-full p-2 text-sm"
                      rows={3}
                      value={data[row.id]?.method || ''}
                      onChange={(e) => updateCell(row.id, 'method', e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="align-top border border-gray-300 p-0" style={{ minWidth: 180 }}>
                    <textarea
                      className="w-full p-2 text-sm"
                      rows={3}
                      value={data[row.id]?.period || ''}
                      onChange={(e) => updateCell(row.id, 'period', e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="align-top border border-gray-300 p-0" style={{ minWidth: 220 }}>
                    <textarea
                      className="w-full p-2 text-sm"
                      rows={3}
                      value={data[row.id]?.storageOnly || ''}
                      onChange={(e) => updateCell(row.id, 'storageOnly', e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="align-top border border-gray-300 p-0" style={{ minWidth: 200 }}>
                    <textarea
                      className="w-full p-2 text-sm"
                      rows={3}
                      value={data[row.id]?.legalBasis || ''}
                      onChange={(e) => updateCell(row.id, 'legalBasis', e.target.value)}
                      placeholder="—"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CategoriesMatrix;

