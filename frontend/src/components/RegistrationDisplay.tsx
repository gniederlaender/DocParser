import React from 'react';
import { CheckCircle, AlertCircle, Download, RotateCcw, Database } from 'lucide-react';
import { RegistrationResponse } from '../types';

interface RegistrationDisplayProps {
  data: RegistrationResponse['data'];
  onDownload: () => void;
  onReset: () => void;
}

const RegistrationDisplay: React.FC<RegistrationDisplayProps> = ({ data, onDownload, onReset }) => {
  if (!data) return null;

  const { individualOffers, databaseSave } = data;

  // Add safety checks
  if (!individualOffers || !Array.isArray(individualOffers)) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler bei der Datenverarbeitung</h2>
            <p className="text-gray-600 mb-4">Die Registrierungsdaten konnten nicht korrekt geladen werden.</p>
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
      'monatsrate': 'Monatsrate',
      'anbieter': 'Anbieter',
      'angebotsdatum': 'Angebotsdatum'
    };
    return displayNames[param] || param;
  };

  const getParameterValue = (offer: any, param: string): any => {
    return offer[param];
  };

  const allParameters = [
    { type: 'section', title: 'Anbieter & Grunddaten' },
    'anbieter', 'angebotsdatum',
    { type: 'section', title: 'Kreditdaten' },
    'kreditbetrag', 'auszahlungsbetrag', 'auszahlungsdatum', 'datum1Rate',
    'ratenanzahl', 'kreditende', 'sondertilgungen', 'restwert', 'monatsrate',
    { type: 'section', title: 'Zinskonditionen' },
    'fixzinssatz', 'fixzinsperiode', 'sollzinssatz', 'effektivzinssatz',
    { type: 'section', title: 'Gebühren & Kosten' },
    'bearbeitungsgebuehr', 'schaetzgebuehr', 'kontofuehrungsgebuehr', 'kreditpruefkosten',
    'vermittlerentgelt', 'grundbucheintragungsgebuehr', 'grundbuchseingabegebuehr', 'grundbuchsauszug',
    'grundbuchsgesuch', 'legalisierungsgebuehr', 'gesamtkosten', 'gesamtbetrag'
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Angebote erfolgreich erfasst
          </h2>
          <p className="text-gray-600 mb-4">
            {individualOffers.length} Darlehensangebot{individualOffers.length !== 1 ? 'e' : ''} verarbeitet
          </p>
          
          {/* Database Save Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
            databaseSave.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Database className="h-4 w-4 mr-2" />
            {databaseSave.success 
              ? `${databaseSave.savedCount} Angebot${databaseSave.savedCount !== 1 ? 'e' : ''} in Datenbank gespeichert`
              : `Datenbankfehler: ${databaseSave.error || 'Unbekannter Fehler'}`
            }
          </div>
        </div>
      </div>

      {/* Individual Offers */}
      <div className="space-y-6">
        {individualOffers.map((offer, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Angebot {index + 1}: {offer.fileName || 'Unbekannte Datei'}
              </h3>
              <div className="text-sm text-gray-500">
                {offer.anbieter && `Anbieter: ${offer.anbieter}`}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allParameters.map((param, index) => {
                // Handle section headers
                if (typeof param === 'object' && param.type === 'section') {
                  return (
                    <div key={`section-${index}`} className="col-span-full">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6 first:mt-0 border-b border-gray-300 pb-2">
                        {param.title}
                      </h3>
                    </div>
                  );
                }
                
                // Handle parameter fields
                const value = getParameterValue(offer, param as string);
                if (value === null || value === undefined || value === '') return null;
                
                return (
                  <div key={param as string} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {getParameterDisplayName(param as string)}
                    </div>
                    <div className="text-sm text-gray-900 font-mono">
                      {formatValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={onDownload}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>JSON herunterladen</span>
        </button>
        <button
          onClick={onReset}
          className="btn-primary flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Neue Angebote erfassen</span>
        </button>
      </div>
    </div>
  );
};

export default RegistrationDisplay;
