import DocumentUploader from '../../common/DocumentUploader';

function LegalBasisTab({ 
  legalData = {}, 
  onLegalDataChange,
  flowId,
  projectId,
  userId 
}) {
  const legalBasisOptions = [
    { id: 'consent', label: 'Consimtamant' },
    { id: 'contract', label: 'Executare contract' },
    { id: 'legitimate', label: 'Interes legitim' },
    { id: 'legal', label: 'Obligatie legala' },
    { id: 'public', label: 'Interes public' },
    { id: 'vital', label: 'Protejarea intereselor vitale' }
  ];

  const handleFieldChange = (field, value) => {
    onLegalDataChange({
      ...legalData,
      [field]: value
    });
  };

  const handleCheckboxChange = (basisId) => {
    const currentBasis = legalData.legalBasis || [];
    const updated = currentBasis.includes(basisId)
      ? currentBasis.filter(b => b !== basisId)
      : [...currentBasis, basisId];
    handleFieldChange('legalBasis', updated);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* Legal Basis Checkboxes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Temei legal</h3>
        <div className="grid grid-cols-2 gap-4">
          {legalBasisOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(legalData.legalBasis || []).includes(option.id)}
                onChange={() => handleCheckboxChange(option.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Legal Details */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detalii temei legal
        </label>
        <textarea
          value={legalData.legalDetails || ''}
          onChange={(e) => handleFieldChange('legalDetails', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={4}
          placeholder="Legea contabilitatii..."
        />
      </div>

      <hr className="my-6" />

      {/* Document Upload Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Documente temei legal
        </h3>
        <DocumentUploader
          flowId={flowId}
          projectId={projectId}
          userId={userId}
          documents={legalData.documents || []}
          onDocumentsChange={(documents) => handleFieldChange('documents', documents)}
          section="legal"
        />
      </div>
    </div>
  );
}

export default LegalBasisTab;