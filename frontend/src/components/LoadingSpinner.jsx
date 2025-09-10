import React from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading...", fullScreen = true }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg animate-pulse">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
          </div>
          
          {/* Spinning Loader */}
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Coaching Institute</h2>
            <p className="text-gray-600">{message}</p>
          </div>
          
          {/* Progress Animation */}
          <div className="mt-8 w-64 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Inline spinner for smaller components
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;