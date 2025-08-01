import React from 'react';
import { FileText, Mail, CheckCircle, Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  currentStep: 'pdf' | 'email' | 'complete';
  progress: number;
  recipientCount: number;
  sentCount: number;
  errors: string[];
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  currentStep,
  progress,
  recipientCount,
  sentCount,
  errors
}) => {
  if (!isOpen) return null;

  const getStepIcon = (step: string, isActive: boolean, isComplete: boolean) => {
    if (isComplete) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (isActive) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    
    switch (step) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'email':
        return <Mail className="w-5 h-5 text-gray-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: string) => {
    const stepOrder = ['pdf', 'email', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Creating Signature Request
          </h3>

          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            {/* PDF Generation */}
            <div className="flex items-center space-x-3">
              {getStepIcon('pdf', currentStep === 'pdf', getStepStatus('pdf') === 'complete')}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Converting document to PDF
                </div>
                <div className="text-xs text-gray-500">
                  Preserving signature field positions
                </div>
              </div>
            </div>

            {/* Email Sending */}
            <div className="flex items-center space-x-3">
              {getStepIcon('email', currentStep === 'email', getStepStatus('email') === 'complete')}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Sending email notifications
                </div>
                <div className="text-xs text-gray-500">
                  {currentStep === 'email' ? `${sentCount}/${recipientCount} recipients notified` : 'Preparing emails'}
                </div>
              </div>
            </div>

            {/* Complete */}
            <div className="flex items-center space-x-3">
              {getStepIcon('complete', currentStep === 'complete', getStepStatus('complete') === 'complete')}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Request created successfully
                </div>
                <div className="text-xs text-gray-500">
                  Recipients can now sign the document
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="text-sm font-medium text-red-800 mb-1">
                Some issues occurred:
              </div>
              <ul className="text-xs text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Current Status */}
          <div className="text-center text-sm text-gray-600">
            {currentStep === 'pdf' && 'Converting document...'}
            {currentStep === 'email' && `Sending emails (${sentCount}/${recipientCount})...`}
            {currentStep === 'complete' && 'All done! 🎉'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;