import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, RotateCcw, Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Home, CreditCard, Shield, ShoppingCart, HelpCircle } from 'lucide-react';
import { HaushaltsrechnungData } from '../types';

interface HaushaltsrechnungDisplayProps {
  data: HaushaltsrechnungData;
  confidence: number;
  processingTime: number;
  onDownload: () => void;
  onReset: () => void;
}

const HaushaltsrechnungDisplay: React.FC<HaushaltsrechnungDisplayProps> = ({
  data,
  confidence,
  processingTime,
  onDownload,
  onReset
}) => {
  const [copied, setCopied] = useState(false);

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
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const categoryIcons = {
    wohnkosten: <Home className="h-5 w-5" />,
    kreditraten: <CreditCard className="h-5 w-5" />,
    versicherungen: <Shield className="h-5 w-5" />,
    lebenshaltungskosten: <ShoppingCart className="h-5 w-5" />,
    unallocated: <HelpCircle className="h-5 w-5" />
  };

  const categoryLabels = {
    wohnkosten: 'Wohnkosten',
    kreditraten: 'Kreditraten',
    versicherungen: 'Versicherungen',
    lebenshaltungskosten: 'Lebenshaltungskosten',
    unallocated: 'Nicht zugeordnet'
  };

  const categoryColors = {
    wohnkosten: 'bg-blue-100 text-blue-800',
    kreditraten: 'bg-purple-100 text-purple-800',
    versicherungen: 'bg-green-100 text-green-800',
    lebenshaltungskosten: 'bg-orange-100 text-orange-800',
    unallocated: 'bg-gray-100 text-gray-800'
  };

  const netto = data.einnahmen.total - data.ausgaben.total;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Haushaltsrechnung
              </h2>
              {data.period && (
                <p className="text-gray-600 mt-1">
                  Zeitraum: {data.period}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Confidence Score */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getConfidenceColor(confidence)}`}>
                {getConfidenceIcon(confidence)}
                <span className="text-sm font-medium">
                  {formatPercentage(confidence)} Vertrauen
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

        {/* Validation Status */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              data.validation.totalSumCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.validation.totalSumCorrect ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                Gesamtsumme {data.validation.totalSumCorrect ? 'korrekt' : 'fehlerhaft'}
              </span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              data.validation.subCategoriesSumCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.validation.subCategoriesSumCorrect ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                Kategorien-Summe {data.validation.subCategoriesSumCorrect ? 'korrekt' : 'fehlerhaft'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Einnahmen */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Einnahmen</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(data.einnahmen.total)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {formatPercentage(data.einnahmen.confidence)} Vertrauen
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Ausgaben */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Ausgaben</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(data.ausgaben.total)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {formatPercentage(data.ausgaben.confidence)} Vertrauen
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Netto */}
          <div className={`rounded-lg p-6 border ${
            netto >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  netto >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Netto
                </p>
                <p className={`text-2xl font-bold ${
                  netto >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(netto)}
                </p>
                <p className={`text-xs mt-1 ${
                  netto >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {netto >= 0 ? 'Überschuss' : 'Defizit'}
                </p>
              </div>
              {netto >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ausgaben nach Kategorien
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.ausgaben.categories).map(([key, category]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${categoryColors[key as keyof typeof categoryColors]}`}>
                      {categoryIcons[key as keyof typeof categoryIcons]}
                    </div>
                    <span className="font-medium text-gray-900">
                      {categoryLabels[key as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatPercentage(category.confidence)}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(category.amount)}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${data.ausgaben.total > 0 ? (category.amount / data.ausgaben.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={onDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>JSON herunterladen</span>
          </button>

          <button
            onClick={handleCopy}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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

export default HaushaltsrechnungDisplay;
