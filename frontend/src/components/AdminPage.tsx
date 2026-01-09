import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, Search, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import ApiService from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';

interface LoanOfferRecord {
  id?: number;
  fileName: string;
  anbieter?: string;
  angebotsdatum?: string;
  kreditbetrag?: string;
  auszahlungsbetrag?: string;
  auszahlungsdatum?: string;
  datum1Rate?: string;
  laufzeit?: string;
  ratenanzahl?: string;
  kreditende?: string;
  sondertilgungen?: string;
  restwert?: string;
  fixzinssatz?: string;
  fixzinsperiode?: string;
  fixzinssatz_in_jahren?: string;
  sollzinssatz?: string;
  effektivzinssatz?: string;
  bearbeitungsgebuehr?: string;
  schaetzgebuehr?: string;
  kontofuehrungsgebuehr?: string;
  kreditpruefkosten?: string;
  vermittlerentgelt?: string;
  grundbucheintragungsgebuehr?: string;
  grundbuchseingabegebuehr?: string;
  grundbuchsauszug?: string;
  grundbuchsgesuch?: string;
  legalisierungsgebuehr?: string;
  gesamtkosten?: string;
  gesamtbetrag?: string;
  monatsrate?: string;
  createdAt?: string;
}

const AdminPage: React.FC = () => {
  const [offers, setOffers] = useState<LoanOfferRecord[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<LoanOfferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOffer, setEditingOffer] = useState<LoanOfferRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [schnelleingabe, setSchnelleingabe] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    basic: true,
    kreditdaten: false,
    zinskonditionen: false,
    einzelgebuehren: false,
    gesamtkosten: false,
  });

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [searchTerm, offers]);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getAllLoanOffers();
      setOffers(data);
      setFilteredOffers(data);
    } catch (error: any) {
      toast.error(`Fehler beim Laden der Angebote: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOffers = () => {
    if (!searchTerm.trim()) {
      setFilteredOffers(offers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = offers.filter(offer => 
      offer.anbieter?.toLowerCase().includes(term) ||
      offer.fileName?.toLowerCase().includes(term) ||
      offer.kreditbetrag?.toLowerCase().includes(term)
    );
    setFilteredOffers(filtered);
  };

  const handleEdit = (offer: LoanOfferRecord) => {
    setEditingOffer({ ...offer });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingOffer({
      fileName: '',
      anbieter: '',
      angebotsdatum: '',
    });
    setIsCreating(true);
    setSchnelleingabe(true); // Reset to default when creating new offer
  };

  const handleCancel = () => {
    setEditingOffer(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingOffer) return;

    if (!editingOffer.fileName) {
      toast.error('Dateiname ist erforderlich');
      return;
    }

    try {
      if (isCreating) {
        await ApiService.createLoanOffer(editingOffer);
        toast.success('Angebot erfolgreich erstellt');
      } else {
        if (!editingOffer.id) {
          toast.error('Angebot-ID fehlt');
          return;
        }
        await ApiService.updateLoanOffer(editingOffer.id, editingOffer);
        toast.success('Angebot erfolgreich aktualisiert');
      }
      handleCancel();
      loadOffers();
    } catch (error: any) {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateField = (field: keyof LoanOfferRecord, value: string) => {
    if (!editingOffer) return;
    setEditingOffer({
      ...editingOffer,
      [field]: value
    });
  };

  const getFieldLabel = (field: string): string => {
    // Special case: map sollzinssatz to Anschlusszinssatz
    if (field === 'sollzinssatz') {
      return 'Anschlusszinssatz';
    }
    // Default: capitalize and add spaces before capital letters
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Angebote werden geladen..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Angebots-Verwaltung</h1>
              <p className="mt-2 text-sm text-gray-600">
                Verwalten Sie alle Kreditangebote in der Datenbank
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Neues Angebot
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Anbieter, Dateiname oder Kreditbetrag suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Gesamt Angebote</div>
            <div className="text-2xl font-bold text-gray-900">{offers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Gefiltert</div>
            <div className="text-2xl font-bold text-gray-900">{filteredOffers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Anbieter</div>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(offers.map(o => o.anbieter).filter(Boolean)).size}
            </div>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Aktionen</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Anbieter</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Angebotsdatum</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Kreditbetrag</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Fixzinssatz</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Fixzinssatz in Jahren</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Anschlusszinssatz</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Effektivzinssatz</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      {searchTerm ? 'Keine Angebote gefunden' : 'Keine Angebote vorhanden'}
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">Bearbeiten</span>
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{offer.id}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 max-w-[200px] truncate" title={offer.anbieter || ''}>{offer.anbieter || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{offer.angebotsdatum || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{offer.kreditbetrag || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{offer.fixzinssatz || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{offer.fixzinssatz_in_jahren || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 max-w-[160px] truncate" title={offer.sollzinssatz || ''}>{offer.sollzinssatz || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 max-w-[160px] truncate" title={offer.effektivzinssatz || ''}>{offer.effektivzinssatz || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit/Create Modal */}
        {editingOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isCreating ? 'Neues Angebot erstellen' : `Angebot #${editingOffer.id} bearbeiten`}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {isCreating && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schnelleingabe}
                        onChange={(e) => setSchnelleingabe(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Schnelleingabe</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Schnelleingabe Mode - Simplified Form */}
                {isCreating && schnelleingabe ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dateiname *</label>
                      <input
                        type="text"
                        value={editingOffer.fileName}
                        onChange={(e) => updateField('fileName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Anbieter</label>
                      <input
                        type="text"
                        value={editingOffer.anbieter || ''}
                        onChange={(e) => updateField('anbieter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Angebotsdatum</label>
                      <input
                        type="text"
                        value={editingOffer.angebotsdatum || ''}
                        onChange={(e) => updateField('angebotsdatum', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="DD.MM.YYYY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kreditbetrag</label>
                      <input
                        type="text"
                        value={editingOffer.kreditbetrag || ''}
                        onChange={(e) => updateField('kreditbetrag', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Laufzeit</label>
                      <input
                        type="text"
                        value={editingOffer.laufzeit || ''}
                        onChange={(e) => updateField('laufzeit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fixzinssatz</label>
                      <input
                        type="text"
                        value={editingOffer.fixzinssatz || ''}
                        onChange={(e) => updateField('fixzinssatz', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fixzinssatz in Jahren</label>
                      <input
                        type="text"
                        value={editingOffer.fixzinssatz_in_jahren || ''}
                        onChange={(e) => updateField('fixzinssatz_in_jahren', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Anschlusszinssatz</label>
                      <input
                        type="text"
                        value={editingOffer.sollzinssatz || ''}
                        onChange={(e) => updateField('sollzinssatz', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effektivzinssatz</label>
                      <input
                        type="text"
                        value={editingOffer.effektivzinssatz || ''}
                        onChange={(e) => updateField('effektivzinssatz', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Basic Info */}
                    <div>
                      <button
                        onClick={() => toggleSection('basic')}
                        className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-900 mb-4"
                      >
                        <span>Grundinformationen</span>
                        {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      {expandedSections.basic && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dateiname *</label>
                            <input
                              type="text"
                              value={editingOffer.fileName}
                              onChange={(e) => updateField('fileName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Anbieter</label>
                            <input
                              type="text"
                              value={editingOffer.anbieter || ''}
                              onChange={(e) => updateField('anbieter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Angebotsdatum</label>
                            <input
                              type="text"
                              value={editingOffer.angebotsdatum || ''}
                              onChange={(e) => updateField('angebotsdatum', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              placeholder="DD.MM.YYYY"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                {/* Kreditdaten */}
                <div>
                  <button
                    onClick={() => toggleSection('kreditdaten')}
                    className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-900 mb-4"
                  >
                    <span>Kreditdaten</span>
                    {expandedSections.kreditdaten ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {expandedSections.kreditdaten && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['kreditbetrag', 'auszahlungsbetrag', 'auszahlungsdatum', 'datum1Rate', 'laufzeit', 'ratenanzahl', 'kreditende', 'sondertilgungen', 'restwert'].map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={editingOffer[field as keyof LoanOfferRecord] || ''}
                            onChange={(e) => updateField(field as keyof LoanOfferRecord, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zinskonditionen */}
                <div>
                  <button
                    onClick={() => toggleSection('zinskonditionen')}
                    className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-900 mb-4"
                  >
                    <span>Zinskonditionen</span>
                    {expandedSections.zinskonditionen ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {expandedSections.zinskonditionen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['fixzinssatz', 'fixzinsperiode', 'fixzinssatz_in_jahren', 'sollzinssatz', 'effektivzinssatz'].map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel(field)}
                          </label>
                          <input
                            type="text"
                            value={editingOffer[field as keyof LoanOfferRecord] || ''}
                            onChange={(e) => updateField(field as keyof LoanOfferRecord, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Einzelgebühren */}
                <div>
                  <button
                    onClick={() => toggleSection('einzelgebuehren')}
                    className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-900 mb-4"
                  >
                    <span>Einzelgebühren</span>
                    {expandedSections.einzelgebuehren ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {expandedSections.einzelgebuehren && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['bearbeitungsgebuehr', 'schaetzgebuehr', 'kontofuehrungsgebuehr', 'kreditpruefkosten', 'vermittlerentgelt', 'grundbucheintragungsgebuehr', 'grundbuchseingabegebuehr', 'grundbuchsauszug', 'grundbuchsgesuch', 'legalisierungsgebuehr'].map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={editingOffer[field as keyof LoanOfferRecord] || ''}
                            onChange={(e) => updateField(field as keyof LoanOfferRecord, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gesamtkosten & Zahlungen */}
                <div>
                  <button
                    onClick={() => toggleSection('gesamtkosten')}
                    className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-900 mb-4"
                  >
                    <span>Gesamtkosten & Zahlungen</span>
                    {expandedSections.gesamtkosten ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {expandedSections.gesamtkosten && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['gesamtkosten', 'gesamtbetrag', 'monatsrate'].map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={editingOffer[field as keyof LoanOfferRecord] || ''}
                            onChange={(e) => updateField(field as keyof LoanOfferRecord, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

