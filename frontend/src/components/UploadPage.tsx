import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Download, RotateCcw } from 'lucide-react';
import DocumentTypeSelector from './DocumentTypeSelector';
import ResultsDisplay from './ResultsDisplay';
import LoadingSpinner from './LoadingSpinner';
import { UploadPageProps, DocumentType, UploadResponse } from '../types';
import ApiService from '../services/apiService';

const UploadPage: React.FC<UploadPageProps> = ({ documentTypes, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const selectedType = documentTypes.find(type => type.id === selectedDocumentType);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!selectedType) {
      return { isValid: false, error: 'Please select a document type first' };
    }

    return ApiService.validateFile(file, selectedType);
  }, [selectedType]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    if (!validation.isValid) {
      setError(validation.error!);
      toast.error(validation.error!);
      return;
    }

    setSelectedFile(file);
    setError(null);
    toast.success(`File "${file.name}" selected successfully`);
  }, [validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: selectedType ? {
      ...ApiService.getMimeTypesForDocumentType(selectedType).reduce((acc, mime) => {
        acc[mime] = [];
        return acc;
      }, {} as Record<string, string[]>)
    } : undefined,
    multiple: false,
    disabled: !selectedDocumentType
  });

  const handleDocumentTypeChange = useCallback((typeId: string) => {
    setSelectedDocumentType(typeId);
    setSelectedFile(null);
    setError(null);
    setResults(null);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile || !selectedDocumentType) {
      toast.error('Please select both a file and document type');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setResults(null);

    const toastId = toast.loading('Processing document...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      const startTime = Date.now();
      const response: UploadResponse = await onUpload(selectedFile, selectedDocumentType);
      const endTime = Date.now();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setProcessingTime(endTime - startTime);

      if (response.success && response.data) {
        setResults(response.data.extractedData);
        setConfidence(response.data.confidence);
        toast.success('Document processed successfully!', { id: toastId });
      } else {
        const errorMessage = response.error?.message || 'Processing failed';
        setError(errorMessage);
        toast.error(errorMessage, { id: toastId });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;

    try {
      const dataStr = JSON.stringify(results, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_data_${selectedDocumentType}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      toast.success('JSON file downloaded successfully');
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedDocumentType('');
    setError(null);
    setResults(null);
    setUploadProgress(0);
    setProcessingTime(0);
    setConfidence(0);
  };

  const canSubmit = selectedFile && selectedDocumentType && !isUploading && !error;

  if (results && selectedType) {
    return (
      <ResultsDisplay
        data={results}
        documentType={selectedType.name}
        confidence={confidence}
        processingTime={processingTime}
        onDownload={handleDownload}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dokument hochladen
          </h2>
          <p className="text-gray-600">
            Laden Sie ein Dokument hoch und wählen Sie den Typ aus, um strukturierte Daten mit KI zu extrahieren
          </p>
        </div>

        {/* Document Type Selection */}
        <div className="mb-6">
          <DocumentTypeSelector
            documentTypes={documentTypes}
            selectedType={selectedDocumentType}
            onTypeChange={handleDocumentTypeChange}
          />
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <div
            {...getRootProps()}
            className={`dropzone cursor-pointer transition-colors duration-200 ${
              isDragActive ? 'dropzone-active' : ''
            } ${!selectedDocumentType ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              {selectedFile ? (
                <>
                  <CheckCircle className="h-12 w-12 text-success-500 mb-4" />
                  <p className="text-lg font-medium text-success-700 mb-2">
                    Datei ausgewählt
                  </p>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {ApiService.formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {selectedDocumentType
                      ? 'Ziehen Sie Ihr Dokument hierher oder klicken Sie zum Durchsuchen'
                      : 'Wählen Sie zuerst einen Dokumententyp aus'
                    }
                  </p>
                  {selectedDocumentType && (
                    <p className="text-sm text-gray-500">
                      Unterstützte Formate: {selectedType?.supportedFormats.join(', ').toUpperCase()}
                      <br />
                      Maximale Größe: {(selectedType?.maxFileSize || 0) / 1024 / 1024}MB
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-error-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-error-800 font-medium">Upload-Fehler</p>
                <p className="text-error-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">
                {uploadProgress < 100 ? 'Dokument wird verarbeitet...' : 'Fertig!'}
              </p>
              <p className="text-sm font-medium text-primary-600">
                {uploadProgress}%
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <LoadingSpinner />
                <span>Verarbeitung...</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                <span>Daten extrahieren</span>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Benötigen Sie Hilfe? Stellen Sie sicher, dass Ihr Dokument klar und lesbar ist, um die besten Ergebnisse zu erzielen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
