import axios, { AxiosResponse } from 'axios';
import {
  UploadResponse,
  ComparisonResponse,
  DocumentTypesResponse,
  DocumentType,
  UploadRequest
} from '../types';

// Create axios instance with default config
const getApiBaseURL = (): string => {
  // If explicit API URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For development, try to determine the backend URL automatically
  if (process.env.NODE_ENV === 'development') {
    const currentHost = window.location.hostname;
    return `http://${currentHost}:3001/api`;
  }
  
  // Fallback
  return 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorMessage = data?.error?.message || `Server error: ${status}`;

      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

export class ApiService {
  /**
   * Upload and process a document
   */
  static async uploadDocument(file: File, documentType: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response: AxiosResponse<UploadResponse> = await api.post('/upload', formData, {
        // Upload progress tracking
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          console.log(`Upload progress: ${percentCompleted}%`);
        },
        timeout: 60000, // 60 seconds for file upload
      });

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload and compare multiple documents
   */
  static async compareDocuments(files: File[], documentType: string): Promise<ComparisonResponse> {
    try {
      const formData = new FormData();
      
      // Append all files
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      
      formData.append('documentType', documentType);

      const response: AxiosResponse<ComparisonResponse> = await api.post('/upload/compare', formData, {
        // Upload progress tracking
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          console.log(`Comparison upload progress: ${percentCompleted}%`);
        },
        timeout: 120000, // 2 minutes for comparison processing
      });

      return response.data;
    } catch (error: any) {
      console.error('Comparison upload error:', error);
      throw error;
    }
  }

  /**
   * Get all available document types
   */
  static async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const response: AxiosResponse<DocumentTypesResponse> = await api.get('/document-types');

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch document types');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Get document types error:', error);
      throw error;
    }
  }

  /**
   * Get specific document type by ID
   */
  static async getDocumentType(id: string): Promise<DocumentType> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DocumentType }> = await api.get(`/document-types/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(`Document type '${id}' not found`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Get document type error:', error);
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const baseURL = getApiBaseURL();
      const healthURL = window.location.origin + '/health';
      console.log('Testing connection to:', healthURL);
      
      const response = await axios.get(healthURL, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get upload statistics
   */
  static async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    maxFileSize: number;
    supportedFormats: string[];
  }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: {
          totalFiles: number;
          totalSize: number;
          maxFileSize: number;
          supportedFormats: string[];
        }
      }> = await api.get('/upload/stats');

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch upload statistics');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Get upload stats error:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, documentType: DocumentType): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > documentType.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${(documentType.maxFileSize / 1024 / 1024).toFixed(1)}MB`
      };
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!documentType.supportedFormats.includes(fileExtension || '')) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${documentType.supportedFormats.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get supported MIME types for a document type
   */
  static getMimeTypesForDocumentType(documentType: DocumentType): string[] {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return documentType.supportedFormats
      .map(format => mimeTypes[format])
      .filter(Boolean);
  }
}

export default ApiService;
