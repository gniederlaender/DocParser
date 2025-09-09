import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ErrorDisplayProps } from '../types';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onReset
}) => {
  const isNetworkError = error.toLowerCase().includes('network') ||
                         error.toLowerCase().includes('connect') ||
                         error.toLowerCase().includes('server');

  const isValidationError = error.toLowerCase().includes('validation') ||
                           error.toLowerCase().includes('invalid') ||
                           error.toLowerCase().includes('file');

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-error-600" />
          </div>

          {/* Error Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isNetworkError ? 'Connection Error' :
             isValidationError ? 'Validation Error' :
             'Something went wrong'}
          </h3>

          {/* Error Message */}
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {error}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            )}

            {onReset && (
              <button
                onClick={onReset}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            )}

            {!onRetry && !onReset && (
              <button
                onClick={() => window.location.reload()}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-xs text-gray-500">
            {isNetworkError && (
              <p>
                If this problem persists, please check:
                <br />• Your internet connection
                <br />• Server availability
                <br />• Firewall settings
              </p>
            )}

            {isValidationError && (
              <p>
                Please check:
                <br />• File format is supported
                <br />• File size is within limits
                <br />• Document type is selected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
