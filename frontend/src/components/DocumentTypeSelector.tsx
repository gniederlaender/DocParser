import React from 'react';
import { FileText, Receipt, CreditCard, User, Home, BarChart3 } from 'lucide-react';
import { DocumentTypeSelectorProps } from '../types';

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  documentTypes,
  selectedType,
  onTypeChange
}) => {
  const getTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'kaufvertrag':
        return <Home className="h-6 w-6" />;
      case 'angebotsvergleich':
        return <BarChart3 className="h-6 w-6" />;
      case 'invoice':
        return <FileText className="h-6 w-6" />;
      case 'receipt':
        return <Receipt className="h-6 w-6" />;
      case 'business_card':
        return <CreditCard className="h-6 w-6" />;
      case 'resume':
        return <User className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getTypeColor = (typeId: string, isDisabled: boolean = false) => {
    if (isDisabled) {
      return 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    
    switch (typeId) {
      case 'kaufvertrag':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
      case 'angebotsvergleich':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100';
      case 'invoice':
        return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
      case 'receipt':
        return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
      case 'business_card':
        return 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100';
      case 'resume':
        return 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
    }
  };

  const getSelectedTypeColor = (typeId: string) => {
    switch (typeId) {
      case 'kaufvertrag':
        return 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300';
      case 'angebotsvergleich':
        return 'border-indigo-500 bg-indigo-100 text-indigo-800 ring-2 ring-indigo-300';
      case 'invoice':
        return 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-300';
      case 'receipt':
        return 'border-green-500 bg-green-100 text-green-800 ring-2 ring-green-300';
      case 'business_card':
        return 'border-purple-500 bg-purple-100 text-purple-800 ring-2 ring-purple-300';
      case 'resume':
        return 'border-orange-500 bg-orange-100 text-orange-800 ring-2 ring-orange-300';
      default:
        return 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-300';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Dokumententyp
      </label>

      {documentTypes.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Lade Dokumententypen...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {documentTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const isDisabled = false; // Enable all document types
            const colorClass = isSelected
              ? getSelectedTypeColor(type.id)
              : getTypeColor(type.id, isDisabled);

            return (
              <button
                key={type.id}
                onClick={() => !isDisabled && onTypeChange(type.id)}
                disabled={isDisabled}
                className={`
                  relative p-4 border-2 rounded-lg transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                  ${colorClass}
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3">
                    {getTypeIcon(type.id)}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {type.name}
                  </h3>
                  <p className="text-xs opacity-75 leading-tight">
                    {type.description}
                  </p>
                  <div className="mt-2 text-xs">
                    <span className="inline-block bg-white bg-opacity-50 px-2 py-1 rounded text-xs font-medium">
                      {type.supportedFormats.join(', ').toUpperCase()}
                    </span>
                  </div>

                  {isDisabled && (
                    <div className="mt-2">
                      <span className="inline-block bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs">
                        Deaktiviert
                      </span>
                    </div>
                  )}
                </div>

                {isSelected && !isDisabled && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-primary-600 text-white rounded-full p-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedType && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Ausgewählt: {documentTypes.find(t => t.id === selectedType)?.name}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Laden Sie ein {documentTypes.find(t => t.id === selectedType)?.name}-Dokument hoch, um strukturierte Daten zu extrahieren
              </p>
            </div>
            <button
              onClick={() => onTypeChange('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Ändern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTypeSelector;
