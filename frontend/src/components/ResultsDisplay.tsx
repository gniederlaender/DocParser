import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, RotateCcw, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { ResultsDisplayProps, HaushaltsrechnungData } from '../types';
import HaushaltsrechnungDisplay from './HaushaltsrechnungDisplay';

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  data,
  documentType,
  confidence,
  processingTime,
  onDownload,
  onReset
}) => {
  const [copied, setCopied] = useState(false);

  // Use specialized display for haushaltsrechnung
  if (documentType === 'haushaltsrechnung' && 'einnahmen' in data && 'ausgaben' in data) {
    return (
      <HaushaltsrechnungDisplay
        data={data as HaushaltsrechnungData}
        confidence={confidence}
        processingTime={processingTime}
        onDownload={onDownload}
        onReset={onReset}
      />
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600 bg-success-100';
    if (confidence >= 0.6) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Extraktionsergebnisse
              </h2>
              <p className="text-gray-600 mt-1">
                Ihr {documentType} wurde erfolgreich verarbeitet
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Confidence Score */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getConfidenceColor(confidence)}`}>
                {getConfidenceIcon(confidence)}
                <span className="text-sm font-medium">
                  {(confidence * 100).toFixed(1)}% Vertrauen
                </span>
              </div>

              {/* Processing Time */}
              <div className="text-right">
                <p className="text-sm text-gray-500">Verarbeitungszeit</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingTime}ms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={onDownload}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>JSON herunterladen</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn-secondary flex items-center space-x-2"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>JSON kopieren</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Weiteres verarbeiten</span>
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="mb-6">
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  Extrahierte Daten (JSON)
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Extrahierte Felder:</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">
                    {Object.keys(data).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-auto">
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  background: 'transparent',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={true}
              >
                {JSON.stringify(data, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className="text-sm text-gray-900 break-words">
                {typeof value === 'object' && value !== null
                  ? Array.isArray(value)
                    ? `${value.length} items`
                    : `${Object.keys(value).length} fields`
                  : String(value)
                }
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <p>
              Diese Daten wurden mit KI extrahiert. Bitte überprüfen und validieren Sie die Ergebnisse vor der Verwendung.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onReset}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Weiteres Dokument verarbeiten →
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
