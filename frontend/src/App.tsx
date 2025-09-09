import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import UploadPage from './components/UploadPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import { DocumentType, UploadResponse } from './types';
import ApiService from './services/apiService';

const App: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Test API connection
      const connected = await ApiService.testConnection();
      setIsConnected(connected);

      if (!connected) {
        setError('Verbindung zum Backend-Server nicht möglich. Bitte stellen Sie sicher, dass der Server läuft.');
        return;
      }

      // Load document types
      const types = await ApiService.getDocumentTypes();
      setDocumentTypes(types);

    } catch (err: any) {
      console.error('App initialization error:', err);
      setError(err.message || 'Anwendung konnte nicht initialisiert werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File, documentType: string): Promise<UploadResponse> => {
    return await ApiService.uploadDocument(file, documentType);
  };

  const handleRetry = () => {
    initializeApp();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner message="Dokumenten-Parser wird initialisiert..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <ErrorDisplay
          error={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="card max-w-md mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
                <svg className="h-6 w-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Verbindung fehlgeschlagen</h3>
              <p className="mt-2 text-sm text-gray-600">
                Verbindung zum Dokumenten-Parser-Server nicht möglich. Bitte überprüfen Sie Ihre Netzwerkverbindung und den Serverstatus.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleRetry}
                  className="btn-primary"
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Dokumenten-Parser</h1>
                <p className="text-sm text-gray-500">Strukturierte Daten aus Dokumenten mit KI extrahieren</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {documentTypes.length} Dokumententypen verfügbar
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-success-500 rounded-full"></div>
                <span className="ml-2 text-sm text-success-600">Verbunden</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <UploadPage
          documentTypes={documentTypes}
          onUpload={handleUpload}
        />
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
