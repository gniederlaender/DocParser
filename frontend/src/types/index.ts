// Document Types
export interface DocumentType {
  id: string;
  name: string;
  description: string;
  promptTemplate?: string;
  supportedFormats: string[];
  maxFileSize: number;
  validationRules?: ValidationRule[];
  maxFiles?: number;
  minFiles?: number;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'email';
  pattern?: RegExp;
}

// API Request/Response Types
export interface UploadRequest {
  file: File;
  documentType: string;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    extractedData: Record<string, any>;
    documentType: string;
    processingTime: number;
    confidence: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ComparisonResponse {
  success: boolean;
  data?: {
    individualOffers: LoanOfferData[];
    comparison: ComparisonData;
    documentType: string;
    processingTime: number;
    confidence: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RegistrationResponse {
  success: boolean;
  data?: {
    individualOffers: LoanOfferData[];
    documentType: string;
    processingTime: number;
    confidence: number;
    databaseSave: {
      success: boolean;
      savedCount: number;
      error?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DocumentTypesResponse {
  success: boolean;
  data?: DocumentType[];
  error?: {
    code: string;
    message: string;
  };
}

// Extracted Data Types
export interface InvoiceData {
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  lineItems?: LineItem[];
  taxAmount?: number;
  dueDate?: string;
  paymentTerms?: string;
}

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ReceiptData {
  merchantName?: string;
  transactionDate?: string;
  totalAmount?: number;
  items?: ReceiptItem[];
  paymentMethod?: string;
  taxAmount?: number;
}

export interface ReceiptItem {
  name: string;
  price?: number;
  quantity?: number;
}

export interface BusinessCardData {
  name?: string;
  title?: string;
  company?: string;
  phoneNumbers?: string[];
  emailAddresses?: string[];
  physicalAddress?: Address;
  website?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ResumeData {
  personalInfo?: PersonalInfo;
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  linkedin?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationDate?: string;
  gpa?: number;
}

export interface Certification {
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface KaufvertragData {
  buyer?: string;
  seller?: string;
  object?: string;
  price?: number;
  propertyAddress?: string;
  notary?: string;
  contractDate?: string;
  transferDate?: string;
  conditions?: string;
}

export interface LoanOfferData {
  // Kreditdaten
  kreditbetrag?: string;
  auszahlungsbetrag?: string;
  auszahlungsdatum?: string;
  datum1Rate?: string;
  ratenanzahl?: string;
  kreditende?: string;
  sondertilgungen?: string;
  restwert?: string;
  
  // Zinskonditionen
  fixzinssatz?: string;
  fixzinsperiode?: string;
  sollzinssatz?: string;
  effektivzinssatz?: string;
  
  // Einzelgebühren
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
  
  // Gesamtkosten
  gesamtkosten?: string;
  gesamtbetrag?: string;
  
  // Metadaten
  anbieter?: string;
  angebotsdatum?: string;
  fileName?: string;
}

export interface ComparisonData {
  parameters?: string[];
  offers?: {
    [offerId: string]: {
      [parameter: string]: any;
    };
  };
  bestOffer?: {
    parameter: string;
    offerId: string;
    value: any;
    reason?: string;
  }[];
  // Handle nested structure from backend
  comparison?: {
    parameters: string[];
    offers: {
      [offerId: string]: {
        [parameter: string]: any;
      };
    };
    bestOffer: {
      parameter: string;
      offerId: string;
      value: any;
      reason?: string;
    }[];
  };
}

export interface HaushaltsrechnungData {
  period?: string;
  einnahmen: {
    total: number;
    confidence: number;
  };
  ausgaben: {
    total: number;
    confidence: number;
    categories: {
      wohnkosten: {
        amount: number;
        confidence: number;
      };
      kreditraten: {
        amount: number;
        confidence: number;
      };
      versicherungen: {
        amount: number;
        confidence: number;
      };
      lebenshaltungskosten: {
        amount: number;
        confidence: number;
      };
      unallocated: {
        amount: number;
        confidence: number;
      };
    };
  };
  validation: {
    totalSumCorrect: boolean;
    subCategoriesSumCorrect: boolean;
    overallConfidence: number;
  };
}

// Error Types
export enum ErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_DOCUMENT_TYPE = 'UNSUPPORTED_DOCUMENT_TYPE',
  LLM_SERVICE_ERROR = 'LLM_SERVICE_ERROR',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  INVALID_RESPONSE_FORMAT = 'INVALID_RESPONSE_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// Frontend State Types
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: ExtractedData | null;
  selectedDocumentType: string | null;
  selectedFile: File | null;
}

export interface AppState {
  upload: UploadState;
  documentTypes: DocumentType[];
  isLoading: boolean;
}

// Utility Types
export type ExtractedData = KaufvertragData | InvoiceData | ReceiptData | BusinessCardData | ResumeData | LoanOfferData | HaushaltsrechnungData;
export type SupportedFormat = 'pdf' | 'png' | 'jpg' | 'jpeg' | 'docx';

// Component Props Types
export interface UploadPageProps {
  documentTypes: DocumentType[];
  onUpload: (file: File, documentType: string) => Promise<UploadResponse>;
  onCompare?: (files: File[], documentType: string) => Promise<ComparisonResponse>;
}

export interface DocumentTypeSelectorProps {
  documentTypes: DocumentType[];
  selectedType: string | null;
  onTypeChange: (typeId: string) => void;
}

export interface ResultsDisplayProps {
  data: ExtractedData;
  documentType: string;
  confidence: number;
  processingTime: number;
  onDownload: () => void;
  onReset: () => void;
}

export interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
}

export interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onReset?: () => void;
}
