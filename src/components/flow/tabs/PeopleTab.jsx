import ChipInput from '../../common/ChipInput';
import DocumentUploader from '../../common/DocumentUploader';

function PeopleTab({ 
  peopleData = {}, 
  onPeopleDataChange,
  flowId,
  projectId,
  userId 
}) {
  const peopleCategories = [
    'Angajati',
    'Reprezentanti clienti',
    'Reprezentanti furnizori',
    'Parteneri de afaceri',
    'Consultanti externi',
    'Auditori'
  ];

  const notificationMethods = [
    'In Scris',
    'Email',
    'Telefonic',
    'SMS',
    'Portal web',
    'Notificare in aplicatie'
  ];

  const handleFieldChange = (field, value) => {
    onPeopleDataChange({
      ...peopleData,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* People Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Persoane vizate
        </label>
        <ChipInput
          value={peopleData.categories || []}
          onChange={(categories) => handleFieldChange('categories', categories)}
          placeholder="Selecteaza categorii de persoane..."
          suggestions={peopleCategories}
          className="w-full"
        />
      </div>

      {/* Notification Methods */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metode de instiintare a persoanelor vizate
        </label>
        <ChipInput
          value={peopleData.notificationMethods || []}
          onChange={(methods) => handleFieldChange('notificationMethods', methods)}
          placeholder="Selecteaza metode de notificare..."
          suggestions={notificationMethods}
          className="w-full"
        />
      </div>

      <hr className="my-6" />

      {/* Document Upload Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Documente modalitati de informare
        </h3>
        <DocumentUploader
          flowId={flowId}
          projectId={projectId}
          userId={userId}
          documents={peopleData.documents || []}
          onDocumentsChange={(documents) => handleFieldChange('documents', documents)}
          section="people"
        />
      </div>
    </div>
  );
}

export default PeopleTab;