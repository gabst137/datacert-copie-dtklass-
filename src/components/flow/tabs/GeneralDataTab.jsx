import ChipInput from '../../common/ChipInput';

function GeneralDataTab({ 
  generalData = {}, 
  selectedUsers = [],
  status = 'NU',
  valid = false,
  onGeneralDataChange,
  onMetaChange 
}) {
  const availableUsers = [
    'iulianbulandra',
    'mihaelacoseru',
    'admin',
    'manager',
    'operator1',
    'operator2'
  ];

  const handleFieldChange = (field, value) => {
    onGeneralDataChange({
      ...generalData,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* Status Badges and Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'Aprobat' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
          
          <button
            type="button"
            onClick={() => onMetaChange({ status: status === 'Aprobat' ? 'NU' : 'Aprobat' })}
            className={`px-4 py-1 rounded-md text-sm font-medium ${
              status === 'Aprobat'
                ? 'bg-gray-500 text-white hover:bg-gray-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {status === 'Aprobat' ? 'Revoca' : 'Aprobat'}
          </button>
        </div>
        
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          onClick={() => {
            // Clone flow functionality - will be implemented in parent
            console.log('Clone flow');
          }}
        >
          Cloneaza flux
        </button>
      </div>

      {/* Selected Users */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Utilizatori Selectati
        </label>
        <ChipInput
          value={selectedUsers}
          onChange={(users) => onMetaChange({ selectedUsers: users })}
          placeholder="Add users..."
          suggestions={availableUsers}
          className="w-full"
        />
      </div>

      <hr className="my-6" />

      {/* Flow Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nume flux
        </label>
        <input
          type="text"
          value={generalData.fluxName || ''}
          onChange={(e) => handleFieldChange('fluxName', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Documente financiar contabile"
        />
      </div>

      {/* Flow Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descriere flux
        </label>
        <textarea
          value={generalData.fluxDescription || ''}
          onChange={(e) => handleFieldChange('fluxDescription', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={4}
          placeholder="Realizarea/inregistrarea procesleor contabile ale societatii conform contract"
        />
      </div>

      {/* Valid Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="valid"
          checked={valid}
          onChange={(e) => onMetaChange({ valid: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="valid" className="ml-2 text-sm font-medium text-gray-700">
          Valid
        </label>
      </div>
    </div>
  );
}

export default GeneralDataTab;