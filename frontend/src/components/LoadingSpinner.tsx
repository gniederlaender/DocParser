import React from 'react';
import { LoadingSpinnerProps } from '../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  progress
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>

      {message && (
        <div className="text-center">
          <p className="text-gray-700 font-medium">{message}</p>
          {progress !== undefined && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2 w-32 mx-auto overflow-hidden">
                <div
                  className="bg-primary-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{progress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
