import React, { useState, useCallback } from 'react';
import { DocumentType, UploadResponse, ErrorCode } from './types/api';

interface UploadPageProps {
  documentTypes: DocumentType[];
  onUpload: (file: File, documentType: string) => Promise<UploadResponse>;
}

const UploadPage: React.FC<UploadPageProps> = ({ documentTypes, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!file) return 'Please select a file';

    const selectedType = documentTypes.find(type => type.id === selectedDocumentType);
    if (!selectedType) return 'Please select a document type first';

    // Check file size
    if (file.size > selectedType.maxFileSize) {
      return `File size exceeds maximum limit of ${selectedType.maxFileSize / 1024 / 1024}MB`;
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!selectedType.supportedFormats.includes(fileExtension || '')) {
      return `Unsupported file format. Supported formats: ${selectedType.supportedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setResults(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }, [selectedDocumentType, documentTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!selectedFile || !selectedDocumentType) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await onUpload(selectedFile, selectedDocumentType);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        setResults(response.data.extractedData);
      } else {
        setError(response.error?.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedDocumentType('');
    setError(null);
    setResults(null);
    setUploadProgress(0);
  };

  const canSubmit = selectedFile && selectedDocumentType && !isUploading;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Document Parser
        </h1>

        {!results ? (
          <>
            {/* Document Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select document type...</option>
                {documentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                  accept={selectedDocumentType ?
                    documentTypes.find(t => t.id === selectedDocumentType)?.supportedFormats.map(f => `.${f}`).join(',') :
                    undefined
                  }
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="text-gray-600">
                    {selectedFile ? (
                      <div>
                        <p className="font-medium text-green-600">✓ {selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-lg">Drop your document here, or click to browse</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedDocumentType ?
                            `Supported formats: ${documentTypes.find(t => t.id === selectedDocumentType)?.supportedFormats.join(', ')}` :
                            'Select document type first'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  canSubmit
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isUploading ? 'Processing...' : 'Extract Data'}
              </button>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-6">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {uploadProgress < 100 ? 'Processing document...' : 'Complete!'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Results Display */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Extracted Data</h2>
              <div className="space-x-4">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                >
                  Download JSON
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                >
                  Process Another
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
