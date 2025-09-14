import { DocumentType } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentTypeService {
  private documentTypes: DocumentType[] = [];
  private readonly configPath: string;
  private readonly promptsPath: string;

  constructor() {
    this.configPath = path.join(__dirname, '../../src/config/documentTypes.json');
    this.promptsPath = path.join(__dirname, '../../src/config/prompts');
    this.loadDocumentTypes();
  }

  private loadDocumentTypes(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(configData);
        this.documentTypes = config.documentTypes || [];
      } else {
        // Create default document types if config doesn't exist
        this.documentTypes = this.getDefaultDocumentTypes();
        this.saveDocumentTypes();
      }
    } catch (error) {
      console.error('Error loading document types:', error);
      this.documentTypes = this.getDefaultDocumentTypes();
    }
  }

  private saveDocumentTypes(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const config = {
        documentTypes: this.documentTypes,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving document types:', error);
      throw new Error('Failed to save document types configuration');
    }
  }

  private getDefaultDocumentTypes(): DocumentType[] {
    return [
      {
        id: 'kaufvertrag',
        name: 'Kaufvertraggg',
        description: 'Immobilien-Kaufvertrag Daten extrahieren',
        supportedFormats: ['pdf', 'docx'],
        maxFileSize: 15 * 1024 * 1024, // 15MB
        promptTemplate: 'kaufvertrag_prompt.txt'
      },
      {
        id: 'angebotsvergleich',
        name: 'Angebotsvergleich',
        description: 'Darlehensangebote vergleichen (2-3 Angebote)',
        supportedFormats: ['pdf'],
        maxFileSize: 15 * 1024 * 1024, // 15MB
        promptTemplate: 'angebotsvergleich_prompt.txt',
        maxFiles: 3,
        minFiles: 2
      },
      {
        id: 'invoice',
        name: 'Rechnung',
        description: 'Rechnungsdaten extrahieren',
        supportedFormats: ['pdf', 'png', 'jpg', 'jpeg'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        promptTemplate: 'invoice_prompt.txt'
      },
      {
        id: 'receipt',
        name: 'Kassenbon',
        description: 'Kassenbondaten extrahieren',
        supportedFormats: ['pdf', 'png', 'jpg', 'jpeg'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        promptTemplate: 'receipt_prompt.txt'
      },
      {
        id: 'business_card',
        name: 'Visitenkarte',
        description: 'Kontaktdaten aus Visitenkarten extrahieren',
        supportedFormats: ['png', 'jpg', 'jpeg'],
        maxFileSize: 2 * 1024 * 1024, // 2MB
        promptTemplate: 'business_card_prompt.txt'
      },
      {
        id: 'resume',
        name: 'Lebenslauf',
        description: 'Persönliche und berufliche Informationen aus Lebensläufen extrahieren',
        supportedFormats: ['pdf', 'docx'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        promptTemplate: 'resume_prompt.txt'
      }
    ];
  }

  public getAllDocumentTypes(): DocumentType[] {
    return [...this.documentTypes];
  }

  public getDocumentTypeById(id: string): DocumentType | undefined {
    return this.documentTypes.find(type => type.id === id);
  }

  public getDocumentType(id: string): DocumentType | undefined {
    return this.getDocumentTypeById(id);
  }

  public validateDocumentType(id: string): boolean {
    return this.documentTypes.some(type => type.id === id);
  }

  public validateFileForDocumentType(file: Express.Multer.File, documentTypeId: string): { isValid: boolean; error?: string } {
    const docType = this.getDocumentTypeById(documentTypeId);
    if (!docType) {
      return { isValid: false, error: 'Unsupported document type' };
    }

    // Check file size
    if (file.size > docType.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${Math.round(docType.maxFileSize / 1024 / 1024)}MB`
      };
    }

    // Check file format
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!docType.supportedFormats.includes(fileExtension || '')) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${docType.supportedFormats.join(', ')}`
      };
    }

    return { isValid: true };
  }

  public getPromptTemplate(documentTypeId: string): string | null {
    const docType = this.getDocumentTypeById(documentTypeId);
    if (!docType) return null;

    try {
      const promptPath = path.join(this.promptsPath, docType.promptTemplate);
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, 'utf-8');
      }
      return this.getDefaultPromptTemplate(documentTypeId);
    } catch (error) {
      console.error('Error reading prompt template:', error);
      return this.getDefaultPromptTemplate(documentTypeId);
    }
  }

  private getDefaultPromptTemplate(documentTypeId: string): string {
    const templates: { [key: string]: string } = {
      kaufvertrag: `Sie sind ein Dokumentenanalyse-Assistent, der auf die Extraktion strukturierter Daten aus Immobilien-Kaufverträgen spezialisiert ist.

PFLICHTFELDER:
- buyer: Name des Käufers (Vollständiger Name oder Firma)
- seller: Name des Verkäufers (Vollständiger Name oder Firma)
- object: Beschreibung der Immobilie (Adresse, Art der Immobilie)
- price: Kaufpreis (nur numerischer Wert ohne Währung)

OPTIONALE FELDER:
- propertyAddress: Vollständige Adresse der Immobilie
- notary: Name des Notars
- contractDate: Datum des Vertragsabschlusses (Format: YYYY-MM-DD)
- transferDate: Übergabedatum (Format: YYYY-MM-DD)
- conditions: Besondere Bedingungen oder Klauseln

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.
Wenn ein Feld nicht gefunden wird, verwenden Sie null für Pflichtfelder und lassen Sie optionale Felder weg.`,

      invoice: `Sie sind ein Dokumentenanalyse-Assistent, der auf die Extraktion strukturierter Daten aus Rechnungen spezialisiert ist.

PFLICHTFELDER:
- vendorName: Name des Anbieters/Lieferanten/Unternehmens, das die Rechnung ausgestellt hat
- invoiceNumber: Rechnungsnummer oder Referenznummer
- invoiceDate: Datum der Rechnungsstellung (Format: YYYY-MM-DD)
- totalAmount: Gesamtbetrag (nur numerischer Wert)

OPTIONALE FELDER:
- lineItems: Array einzelner Rechnungspositionen mit Beschreibung, Menge, Einzelpreis, Gesamtpreis
- taxAmount: Gesamter Steuerbetrag (Zahl)
- dueDate: Fälligkeitsdatum
- paymentTerms: Zahlungsbedingungen

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.`,

      receipt: `Sie sind ein Dokumentenanalyse-Assistent, der auf die Extraktion strukturierter Daten aus Kassenbons spezialisiert ist.

PFLICHTFELDER:
- merchantName: Name des Händlers oder Geschäfts
- transactionDate: Datum der Transaktion (Format: YYYY-MM-DD)
- totalAmount: Gesamtbetrag (nur numerischer Wert)

OPTIONALE FELDER:
- items: Array gekaufter Artikel mit Name, Preis, Menge
- paymentMethod: Zahlungsmethode (Bargeld, Karte, etc.)
- taxAmount: Gezahlter Steuerbetrag (Zahl)

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.`,

      business_card: `Sie sind ein Dokumentenanalyse-Assistent, der auf die Extraktion von Kontaktinformationen aus Visitenkarten spezialisiert ist.

PFLICHTFELDER:
- name: Vollständiger Name der Person

OPTIONALE FELDER:
- title: Berufsbezeichnung oder Position
- company: Firmen- oder Organisationsname
- phoneNumbers: Array von Telefonnummern
- emailAddresses: Array von E-Mail-Adressen
- physicalAddress: Objekt mit Straße, Stadt, Bundesland, PLZ, Land
- website: Website-URL

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.`,

      resume: `Sie sind ein Dokumentenanalyse-Assistent, der auf die Extraktion von Informationen aus Lebensläufen spezialisiert ist.

PFLICHTFELDER:
- personalInfo: Objekt mit Name, E-Mail, Telefon (mindestens)

OPTIONALE FELDER:
- workExperience: Array von Berufserfahrungen mit Firma, Position, Daten
- education: Array der Bildungslaufbahn
- skills: Array von Fähigkeiten
- certifications: Array von Zertifizierungen

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.`
    };

    return templates[documentTypeId] || templates.kaufvertrag;
  }

  public addDocumentType(documentType: DocumentType): void {
    if (this.documentTypes.some(type => type.id === documentType.id)) {
      throw new Error(`Document type with id '${documentType.id}' already exists`);
    }

    this.documentTypes.push(documentType);
    this.saveDocumentTypes();
  }

  public updateDocumentType(id: string, updates: Partial<DocumentType>): void {
    const index = this.documentTypes.findIndex(type => type.id === id);
    if (index === -1) {
      throw new Error(`Document type with id '${id}' not found`);
    }

    this.documentTypes[index] = { ...this.documentTypes[index], ...updates };
    this.saveDocumentTypes();
  }

  public deleteDocumentType(id: string): void {
    const index = this.documentTypes.findIndex(type => type.id === id);
    if (index === -1) {
      throw new Error(`Document type with id '${id}' not found`);
    }

    this.documentTypes.splice(index, 1);
    this.saveDocumentTypes();
  }
}

// Export singleton instance
export const documentTypeService = new DocumentTypeService();
