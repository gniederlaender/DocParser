import { DocumentType } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentTypeService {
  private documentTypes: DocumentType[] = [];
  private readonly configPath: string;
  private readonly promptsPath: string;

  constructor() {
    // Resolve config path: works both in dev (src/) and production (dist/)
    // From dist/services/ -> ../../src/config/ -> backend/src/config/
    // From src/services/ -> ../config/ -> backend/src/config/
    const isProduction = __dirname.includes('dist');
    if (isProduction) {
      this.configPath = path.join(__dirname, '../../src/config/documentTypes.json');
      this.promptsPath = path.join(__dirname, '../../src/config/prompts');
    } else {
      this.configPath = path.join(__dirname, '../config/documentTypes.json');
      this.promptsPath = path.join(__dirname, '../config/prompts');
    }
    
    console.log(`📂 Loading document types from: ${this.configPath}`);
    this.loadDocumentTypes();
  }

  private loadDocumentTypes(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(configData);
        this.documentTypes = config.documentTypes || [];
        console.log(`✅ Loaded ${this.documentTypes.length} document types from config`);
      } else {
        // Create default document types if config doesn't exist
        console.warn(`⚠️  Config file not found at ${this.configPath}, using defaults`);
        this.documentTypes = this.getDefaultDocumentTypes();
        this.saveDocumentTypes();
      }
    } catch (error) {
      console.error('❌ Error loading document types:', error);
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
      },
      {
        id: 'haushaltsrechnung',
        name: 'Haushaltsrechnung',
        description: 'Bankkontoauszüge analysieren und Transaktionen kategorisieren',
        supportedFormats: ['pdf'],
        maxFileSize: 2 * 1024 * 1024, // 2MB
        promptTemplate: 'haushaltsrechnung_prompt.txt'
      },
      {
        id: 'angebotserfassung',
        name: 'Angebotserfassung',
        description: 'Darlehensangebote erfassen und in Datenbank speichern (1-3 Angebote)',
        supportedFormats: ['pdf'],
        maxFileSize: 15 * 1024 * 1024, // 15MB
        promptTemplate: 'angebotsvergleich_prompt.txt',
        maxFiles: 3,
        minFiles: 1
      },
      {
        id: 'document_verification',
        name: 'Dokumenten-Verifizierung',
        description: 'Mehrere Dokumente verschiedener Typen verifizieren (Pass, ID-Karte, Kaufvertrag)',
        supportedFormats: ['pdf', 'png', 'jpg', 'jpeg'],
        maxFileSize: 15 * 1024 * 1024, // 15MB
        promptTemplate: '',
        maxFiles: 10,
        minFiles: 1
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

Geben Sie die Daten als gültiges JSON-Objekt mit diesen exakten Feldnamen zurück.`,

      haushaltsrechnung: `Sie sind ein Experte für die Analyse von Bankkontoauszügen und Haushaltsrechnungen. Ihre Aufgabe ist es, alle Transaktionen zu extrahieren, zu kategorisieren und zusammenzufassen.

WICHTIGE ANWEISUNGEN:
1. Analysieren Sie ALLE Transaktionen im Dokument (auch über mehrere Seiten)
2. Summieren Sie Einnahmen und Ausgaben getrennt
3. Kategorisieren Sie Ausgaben in die 4 Hauptkategorien + Unallocated
4. Geben Sie für jede Kategorie eine Confidence-Bewertung (0-100) an
5. Stellen Sie sicher, dass die Summe der Unterkategorien der Gesamtsumme der Ausgaben entspricht

PFLICHTFELDER:
- period: Zeitraum des Kontoauszugs (z.B. "Januar 2024", "01.01.2024 - 31.01.2024")
- einnahmen: Objekt mit total (Summe aller Einnahmen) und confidence (0-100)
- ausgaben: Objekt mit total (Summe aller Ausgaben) und confidence (0-100)
  - categories: Objekt mit 5 Kategorien (jede mit amount und confidence):
    - wohnkosten: Miete, Nebenkosten, Strom, Gas, Wasser, Internet, etc.
    - kreditraten: Kreditraten, Leasingraten, Darlehensraten
    - versicherungen: Alle Versicherungsbeiträge (Haftpflicht, Hausrat, etc.)
    - lebenshaltungskosten: Einkaufen, Restaurants, Freizeit, Kleidung, etc.
    - unallocated: Nicht eindeutig zuordenbare Ausgaben
- validation: Objekt mit:
  - totalSumCorrect: true/false (ob die Gesamtsumme korrekt ist)
  - subCategoriesSumCorrect: true/false (ob Unterkategorien-Summe = Ausgaben-Summe)
  - overallConfidence: Durchschnittliche Confidence aller Kategorien (0-100)

ZAHLENFORMAT:
- Alle Beträge als positive Zahlen (auch Ausgaben)
- Verwenden Sie das englische Zahlenformat für JSON (1234.56, NICHT 1.234,56)
- Runden Sie auf 2 Dezimalstellen
- Beispiel: 1234.56 statt 1.234,56

BEISPIEL JSON-STRUKTUR:
{
  "period": "Januar 2024",
  "einnahmen": {
    "total": 3355.57,
    "confidence": 95
  },
  "ausgaben": {
    "total": 1841.43,
    "confidence": 95,
    "categories": {
      "wohnkosten": {
        "amount": 423.00,
        "confidence": 90
      },
      "kreditraten": {
        "amount": 0.00,
        "confidence": 100
      },
      "versicherungen": {
        "amount": 200.76,
        "confidence": 90
      },
      "lebenshaltungskosten": {
        "amount": 1217.67,
        "confidence": 85
      },
      "unallocated": {
        "amount": 0.00,
        "confidence": 100
      }
    }
  },
  "validation": {
    "totalSumCorrect": true,
    "subCategoriesSumCorrect": true,
    "overallConfidence": 90
  }
}

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
