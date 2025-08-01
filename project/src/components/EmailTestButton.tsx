import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const EmailTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testEmailConfiguration = async () => {
    if (!testEmail.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an email address to receive the test email',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setTestResult({
        success: false,
        message: 'Please enter a valid email address',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: testEmail.trim()
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Mail className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Email Configuration Test</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Test your SendGrid configuration to ensure emails can be sent properly.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Email Address *
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          You will receive a test email at this address
        </p>
      </div>

      <button
        onClick={testEmailConfiguration}
        disabled={isLoading || !testEmail.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
          isLoading || !testEmail.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Testing Configuration...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span>Test Email Setup</span>
          </>
        )}
      </button>

      {testResult && (
        <div className={`mt-4 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className={`font-medium ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.message}
              </div>
              {testResult.details && (
                <div className="mt-2 text-sm">
                  {typeof testResult.details === 'object' ? (
                    <div className="space-y-1">
                      {Object.entries(testResult.details).map(([key, value]) => (
                        <div key={key} className={`${
                          testResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {String(testResult.details)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTestButton;