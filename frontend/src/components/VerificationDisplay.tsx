import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Download, RotateCcw, AlertCircle, FileText } from 'lucide-react';
import { VerificationResponse } from '../types';
import ApiService from '../services/apiService';

interface VerificationDisplayProps {
  data: VerificationResponse['data'];
  onDownload: () => void;
  onReset: () => void;
}

const VerificationDisplay: React.FC<VerificationDisplayProps> = ({ data, onDownload, onReset }) => {
  const [animatedItems, setAnimatedItems] = useState<{ [key: string]: Set<string> }>({});

  useEffect(() => {
    if (!data) return;

    // Animate items appearing one by one
    const animationState: { [key: string]: Set<string> } = {};
    
    data.documents.forEach((doc, docIndex) => {
      animationState[doc.documentType] = new Set();
      
      doc.checklist.forEach((item, itemIndex) => {
        setTimeout(() => {
          setAnimatedItems(prev => {
            const newState = { ...prev };
            if (!newState[doc.documentType]) {
              newState[doc.documentType] = new Set();
            }
            newState[doc.documentType].add(item.id);
            return newState;
          });
        }, (docIndex * 500) + (itemIndex * 150)); // Stagger animations
      });
    });
  }, [data]);

  if (!data) return null;

  const getDocumentTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'austrian_passport': 'Österreichischer Reisepass',
      'austrian_id_card': 'Österreichische ID-Karte',
      'real_estate_contract': 'Immobilien-Kaufvertrag'
    };
    return labels[type] || type;
  };

  const isItemAnimated = (docType: string, itemId: string): boolean => {
    return animatedItems[docType]?.has(itemId) || false;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {data.overallVerified ? (
              <CheckCircle className="h-16 w-16 text-success-500" />
            ) : (
              <XCircle className="h-16 w-16 text-error-500" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {data.overallVerified ? 'Alle Dokumente verifiziert' : 'Verifizierung unvollständig'}
          </h2>
          <p className="text-gray-600">
            {data.documents.length} {data.documents.length === 1 ? 'Dokument' : 'Dokumente'} verifiziert in {data.totalProcessingTime}ms
          </p>
        </div>

        {/* Documents List */}
        <div className="space-y-6">
          {data.documents.map((document) => (
            <div
              key={document.documentType}
              className="border border-gray-200 rounded-lg p-6 bg-white"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-primary-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getDocumentTypeLabel(document.documentType)}
                    </h3>
                    <p className="text-sm text-gray-500">{document.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      document.verified ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {document.passedCount}/{document.totalCount}
                    </div>
                    <div className="text-xs text-gray-500">Items bestanden</div>
                  </div>
                  {document.verified ? (
                    <CheckCircle className="h-8 w-8 text-success-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-error-500" />
                  )}
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {document.checklist.map((item) => {
                  const animated = isItemAnimated(document.documentType, item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
                        animated
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 translate-x-4'
                      } ${
                        item.passed
                          ? 'bg-success-50 border border-success-200'
                          : 'bg-error-50 border border-error-200'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {item.passed ? (
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-error-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${
                            item.passed ? 'text-success-900' : 'text-error-900'
                          }`}>
                            {item.label}
                          </p>
                        </div>
                        {item.reason && (
                          <p className={`text-sm mt-1 ${
                            item.passed ? 'text-success-700' : 'text-error-700'
                          }`}>
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Document Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Verarbeitungszeit:</span>
                  <span className="font-medium text-gray-900">{document.processingTime}ms</span>
                </div>
                {document.confidence !== undefined && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Konfidenz:</span>
                    <span className="font-medium text-gray-900">
                      {(document.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Status */}
        <div className={`mt-8 p-4 rounded-lg ${
          data.overallVerified
            ? 'bg-success-50 border border-success-200'
            : 'bg-error-50 border border-error-200'
        }`}>
          <div className="flex items-center space-x-3">
            {data.overallVerified ? (
              <>
                <CheckCircle className="h-6 w-6 text-success-600" />
                <div>
                  <p className="font-semibold text-success-900">
                    Alle Dokumente wurden erfolgreich verifiziert
                  </p>
                  <p className="text-sm text-success-700 mt-1">
                    Alle Checklist-Items wurden bestanden.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-error-600" />
                <div>
                  <p className="font-semibold text-error-900">
                    Verifizierung unvollständig
                  </p>
                  <p className="text-sm text-error-700 mt-1">
                    Einige Checklist-Items wurden nicht bestanden. Bitte überprüfen Sie die Dokumente.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onDownload}
            className="btn-secondary px-6 py-3 flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Bericht herunterladen</span>
          </button>
          <button
            onClick={onReset}
            className="btn-primary px-6 py-3 flex items-center space-x-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Weitere Dokumente verifizieren</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationDisplay;

