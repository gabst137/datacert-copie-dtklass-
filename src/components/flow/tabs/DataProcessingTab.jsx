import ChipInput from '../../common/ChipInput';
import ProcessTable from '../../common/ProcessTable';

function DataProcessingTab({ 
  processingData = {}, 
  processes = [],
  onProcessingDataChange,
  onProcessesChange 
}) {
  const processingPurposes = [
    'Gestiune Economico - financiară și administrativă',
    'Marketing și publicitate',
    'Resurse umane',
    'Relatii cu clientii',
    'Conformitate legala',
    'Securitate si supraveghere',
    'Analiza si raportare',
    'Imbunatatirea serviciilor'
  ];

  const recipientCategories = [
    'Imputernicitul operatorului',
    'Autorități publice centrale/locale',
    'Societati bancare',
    'Furnizori de servicii IT',
    'Consultanti externi',
    'Parteneri contractuali',
    'Auditori',
    'Asiguratori'
  ];

  const handleFieldChange = (field, value) => {
    onProcessingDataChange({
      ...processingData,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      {/* Processing Purposes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scopuri prelucrare date
        </label>
        <ChipInput
          value={processingData.purposes || []}
          onChange={(purposes) => handleFieldChange('purposes', purposes)}
          placeholder="Selecteaza scopurile prelucarii..."
          suggestions={processingPurposes}
          className="w-full"
        />
      </div>

      {/* Recipient Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorii destinatari ale datelor cu caracter personal transferate
        </label>
        <ChipInput
          value={processingData.recipientCategories || []}
          onChange={(categories) => handleFieldChange('recipientCategories', categories)}
          placeholder="Selecteaza categorii de destinatari..."
          suggestions={recipientCategories}
          className="w-full"
        />
      </div>

      <hr className="my-6" />

      {/* Process Table */}
      <div>
        <ProcessTable
          processes={processes}
          onChange={onProcessesChange}
        />
      </div>
    </div>
  );
}

export default DataProcessingTab;