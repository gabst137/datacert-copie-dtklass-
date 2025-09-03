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

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="overflow-auto">
        <table className="w-full border border-gray-300" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th
                className="text-left text-sm font-medium border border-gray-300 px-3 py-2"
                style={{ background: '#e9d5ff' }}
              >
                Categorii de date personale prelucrate / Categories of processed personal data
              </th>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left text-sm font-medium border border-gray-300 px-3 py-2"
                  style={{ background: '#d9ead3' }}
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
  );
}

export default DataCategoriesTab;

