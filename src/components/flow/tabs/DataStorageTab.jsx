import ChipInput from '../../common/ChipInput';
import DocumentUploader from '../../common/DocumentUploader';

function DataStorageTab({ 
  storageData = {}, 
  onStorageDataChange,
  flowId,
  projectId,
  userId 
}) {
  const durationUnits = ['Ani', 'Luni', 'Zile'];
  
  const recipientCategories = [
    'Imputernicitul operatorului',
    'Autoritati publice centrale/locale',
    'Societati bancare',
    'Furnizori de servicii IT',
    'Consultanti externi',
    'Parteneri contractuali'
  ];

  const handleFieldChange = (field, value) => {
    onStorageDataChange({
      ...storageData,
      [field]: value
    });
  };

  const handleDurationChange = (field, value) => {
    onStorageDataChange({
      ...storageData,
      duration: {
        ...(storageData.duration || { value: 10, unit: 'Ani' }),
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* Storage Policy */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Politica de stocare a datelor
        </label>
        <textarea
          value={storageData.policy || ''}
          onChange={(e) => handleFieldChange('policy', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          placeholder="POLITICA DE CONFIDENTIALITATE SI SECURITATE A PRELUCRARII DATELOR CU CARACTER PERSONAL..."
        />
      </div>

      {/* Document Upload for Storage Policy */}
      <div className="mb-6">
        <DocumentUploader
          flowId={flowId}
          projectId={projectId}
          userId={userId}
          documents={storageData.documents || []}
          onDocumentsChange={(documents) => handleFieldChange('documents', documents)}
          section="storage"
        />
      </div>

      {/* Processing Duration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Durata procesarii
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={storageData.duration?.value || 10}
            onChange={(e) => handleDurationChange('value', parseInt(e.target.value) || 0)}
            className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="1"
          />
          <select
            value={storageData.duration?.unit || 'Ani'}
            onChange={(e) => handleDurationChange('unit', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {durationUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Storage Policy Details */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detalii politica de stocare
        </label>
        <textarea
          value={storageData.policyDetails || ''}
          onChange={(e) => handleFieldChange('policyDetails', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          placeholder="10 ani pentru datele prelucrare până la 15.01.2023 și 5 ani pentru datele prelucrate dupa 15.01.2023"
        />
      </div>

      <hr className="my-6" />

      {/* Recipient Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorii destinatari ale datelor cu caracter personal transferate
        </label>
        <ChipInput
          value={storageData.recipientCategories || []}
          onChange={(categories) => handleFieldChange('recipientCategories', categories)}
          placeholder="Selecteaza categorii de destinatari..."
          suggestions={recipientCategories}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default DataStorageTab;