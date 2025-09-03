import ChipInput from '../../common/ChipInput';
import DocumentUploader from '../../common/DocumentUploader';

function SecurityTab({ 
  securityData = {}, 
  onSecurityDataChange,
  flowId,
  projectId,
  userId 
}) {
  const technicalMeasures = [
    'Drepturi de acces',
    'Politica de securitate tehnica',
    'Criptare date',
    'Backup si recuperare',
    'Firewall',
    'Antivirus si antimalware',
    'Monitorizare si logging',
    'Autentificare multi-factor'
  ];

  const organizationalMeasures = [
    'Regulament de ordine interioara',
    'Fisa de post',
    'Proceduri de lucru',
    'Training securitate',
    'Acorduri de confidentialitate',
    'Audit intern',
    'Plan de continuitate',
    'Politica de acces fizic'
  ];

  const handleFieldChange = (field, value) => {
    onSecurityDataChange({
      ...securityData,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* Technical Security Measures */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Masuri tehnice de securitate
        </label>
        <ChipInput
          value={securityData.technicalMeasures || []}
          onChange={(measures) => handleFieldChange('technicalMeasures', measures)}
          placeholder="Selecteaza masuri tehnice..."
          suggestions={technicalMeasures}
          className="w-full"
        />
      </div>

      {/* Organizational Security Measures */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Masuri organizationale de securitate
        </label>
        <ChipInput
          value={securityData.organizationalMeasures || []}
          onChange={(measures) => handleFieldChange('organizationalMeasures', measures)}
          placeholder="Selecteaza masuri organizationale..."
          suggestions={organizationalMeasures}
          className="w-full"
        />
      </div>

      {/* Security Policy Document */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documente masuri de securitate
        </label>
        <textarea
          value={securityData.policyDocument || ''}
          onChange={(e) => handleFieldChange('policyDocument', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          placeholder="POLITICA DE CONFIDENTIALITATE SI SECURITATE A PRELUCRARII DATELOR CU CARACTER PERSONAL A CLINICII DR. LEVENTER"
        />
      </div>

      <hr className="my-6" />

      {/* Document Upload Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Documente masuri de securitate
        </h3>
        <DocumentUploader
          flowId={flowId}
          projectId={projectId}
          userId={userId}
          documents={securityData.documents || []}
          onDocumentsChange={(documents) => handleFieldChange('documents', documents)}
          section="security"
        />
      </div>
    </div>
  );
}

export default SecurityTab;