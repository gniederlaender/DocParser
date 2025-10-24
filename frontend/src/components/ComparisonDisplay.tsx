import React from 'react';
import { Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { ComparisonResponse, LoanOfferData, ComparisonData } from '../types';

interface ComparisonDisplayProps {
  data: ComparisonResponse['data'];
  onDownload: () => void;
  onReset: () => void;
}

const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({ data, onDownload, onReset }) => {
  if (!data) return null;


  const { individualOffers, comparison } = data;

  // Handle nested comparison structure - the actual comparison data is nested deeper
  const actualComparison = comparison?.comparison || comparison;

  // Add safety checks
  if (!individualOffers || !Array.isArray(individualOffers) || !actualComparison) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler bei der Datenverarbeitung</h2>
            <p className="text-gray-600 mb-4">Die Vergleichsdaten konnten nicht korrekt geladen werden.</p>
            <button onClick={onReset} className="btn-primary">
              Zurück
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === 'nicht angegeben') {
      return 'Nicht angegeben';
    }
    return String(value);
  };

  const getParameterDisplayName = (param: string): string => {
    const displayNames: { [key: string]: string } = {
      'kreditbetrag': 'Kreditbetrag',
      'auszahlungsbetrag': 'Auszahlungsbetrag',
      'auszahlungsdatum': 'Auszahlungsdatum',
      'datum1Rate': 'Datum 1. Rate',
      'ratenanzahl': 'Ratenanzahl',
      'kreditende': 'Kreditende',
      'sondertilgungen': 'Sondertilgungen',
      'restwert': 'Restwert',
      'fixzinssatz': 'Fixzinssatz',
      'fixzinsperiode': 'Fixzinsperiode',
      'sollzinssatz': 'Anschlusskondition',
      'effektivzinssatz': 'Effektivzinssatz',
      'bearbeitungsgebuehr': 'Bearbeitungsgebühr',
      'schaetzgebuehr': 'Schätzgebühr',
      'kontofuehrungsgebuehr': 'Kontoführungsgebühr',
      'kreditpruefkosten': 'Kreditprüfkosten',
      'vermittlerentgelt': 'Vermittlerentgelt',
      'grundbucheintragungsgebuehr': 'Grundbucheintragungsgebühr',
      'grundbuchseingabegebuehr': 'Grundbuchseingabegebühr',
      'grundbuchsauszug': 'Grundbuchsauszug',
      'grundbuchsgesuch': 'Grundbuchsgesuch',
      'legalisierungsgebuehr': 'Legalisierungsgebühr',
      'gesamtkosten': 'Gesamtkosten',
      'gesamtbetrag': 'Gesamtbetrag',
      'monatsrate': 'Monatsrate'
    };
    return displayNames[param] || param;
  };

  const getBestOfferForParameter = (parameter: string) => {
    return actualComparison.bestOffer?.find((offer: any) => offer.parameter === parameter);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Angebotsvergleich
          </h2>
          <p className="text-gray-600">
            Vergleich von {individualOffers.length} Darlehensangeboten
          </p>
        </div>

        {/* Individual Offers Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Angebote im Überblick</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {individualOffers.map((offer, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Angebot {index + 1}
                </h4>
                <p className="text-sm text-gray-600 mb-2">{offer.fileName}</p>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Anbieter:</span> {formatValue(offer.anbieter)}</div>
                  <div><span className="font-medium">Kreditbetrag:</span> {formatValue(offer.kreditbetrag)}</div>
                  <div><span className="font-medium">Auszahlungsbetrag:</span> {formatValue(offer.auszahlungsbetrag)}</div>
                  <div><span className="font-medium">Ratenanzahl:</span> {formatValue(offer.ratenanzahl)}</div>
                  <div><span className="font-medium">Fixzinssatz:</span> {formatValue(offer.fixzinssatz)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Detaillierter Vergleich</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parameter
                  </th>
                  {individualOffers.map((_, index) => (
                    <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Angebot {index + 1}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bestes Angebot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(actualComparison.parameters || []).map((parameter: any, index: number) => {
                  // Handle section headers
                  if (typeof parameter === 'object' && parameter.type === 'section') {
                    return (
                      <tr key={`section-${index}`} className="bg-gray-100">
                        <td colSpan={individualOffers.length + 2} className="px-4 py-3">
                          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1">
                            {parameter.title}
                          </h3>
                        </td>
                      </tr>
                    );
                  }
                  
                  // Handle empty rows (legacy support)
                  if (parameter === '') {
                    return (
                      <tr key={`empty-${index}`} className="h-4">
                        <td colSpan={individualOffers.length + 2} className="px-4 py-2"></td>
                      </tr>
                    );
                  }
                  
                  const bestOffer = getBestOfferForParameter(parameter);
                  return (
                    <tr key={parameter} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getParameterDisplayName(parameter)}
                      </td>
                      {individualOffers.map((offer, index) => {
                        const value = offer[parameter as keyof LoanOfferData];
                        const isBest = bestOffer?.offerId === `angebot_${index + 1}`;
                        return (
                          <td key={index} className={`px-4 py-3 text-sm ${isBest ? 'text-green-600 font-medium' : 'text-gray-900'}`}>
                            <div className="flex items-center">
                              {formatValue(value)}
                              {isBest && <CheckCircle className="h-4 w-4 text-green-500 ml-2" />}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bestOffer && (
                          <div>
                            <div className="font-medium">{formatValue(bestOffer.value)}</div>
                            {bestOffer.reason && (
                              <div className="text-xs text-gray-500 mt-1">{bestOffer.reason}</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* Processing Info */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">Verarbeitungsinformationen</p>
              <p className="text-blue-700 text-sm mt-1">
                Verarbeitungszeit: {data.processingTime}ms | 
                Vertrauen: {(data.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onDownload}
            className="btn-primary px-6 py-3 flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>JSON herunterladen</span>
          </button>
          <button
            onClick={onReset}
            className="btn-secondary px-6 py-3 flex items-center space-x-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Neuer Vergleich</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonDisplay;
