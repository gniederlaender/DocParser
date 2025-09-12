// API Interface Definitions for Document Parser

// Document Types
export interface DocumentType {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
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

// Error Types
export enum ErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_DOCUMENT_TYPE = 'UNSUPPORTED_DOCUMENT_TYPE',
  LLM_SERVICE_ERROR = 'LLM_SERVICE_ERROR',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  INVALID_RESPONSE_FORMAT = 'INVALID_RESPONSE_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// Configuration Types
export interface AppConfig {
  port: number;
  uploadDir: string;
  maxFileSize: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  llm: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

// Utility Types
export type ExtractedData = InvoiceData | ReceiptData | BusinessCardData | ResumeData;
export type SupportedFormat = 'pdf' | 'png' | 'jpg' | 'jpeg' | 'docx';

// Frontend State Types
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: ExtractedData | null;
  selectedDocumentType: string | null;
}

export interface AppState {
  upload: UploadState;
  documentTypes: DocumentType[];
  isLoading: boolean;
}
