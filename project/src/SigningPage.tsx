import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Pen, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from './utils/supabase';

interface SignatureRequest {
  id: string;
  title: string;
  message: string;
  sender_email: string;
  status: string;
}

interface SignatureField {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string | null;
  signed_at: string | null;
}

const SigningPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const requestId = searchParams.get('request') || searchParams.get('requestId');
  const recipientId = searchParams.get('recipient') || searchParams.get('recipientId');

  useEffect(() => {
    // Add debug information
    const urlParams = {
      requestId,
      recipientId,
      allParams: Object.fromEntries(searchParams.entries())
    };
    setDebugInfo(urlParams);
    console.log('URL Parameters:', urlParams);
    
    if (requestId && recipientId) {
      loadSigningData();
    } else {
      setError(`Invalid signing link. Missing parameters: ${!requestId ? 'request ID' : ''} ${!recipientId ? 'recipient ID' : ''}`);
      setLoading(false);
    }
  }, [requestId, recipientId]);

  const loadSigningData = async () => {
    try {
      console.log('Loading signing data for:', { requestId, recipientId });
      
      // Load signature request
      const { data: requestData, error: requestError } = await supabase
        .from('signature_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Request error:', requestError);
        throw new Error(`Failed to load signature request: ${requestError.message} (Code: ${requestError.code})`);
      }
      
      console.log('Request data loaded:', requestData);

      // Load recipient
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipients')
        .select('*')
        .eq('id', recipientId)
        .eq('request_id', requestId)
        .single();

      if (recipientError) {
        console.error('Recipient error:', recipientError);
        throw new Error(`Failed to load recipient: ${recipientError.message} (Code: ${recipientError.code})`);
      }
      
      console.log('Recipient data loaded:', recipientData);

      // Load signature fields for this recipient
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('signature_fields')
        .select('*')
        .eq('request_id', requestId)
        .eq('recipient_id', recipientId);

      if (fieldsError) {
        console.error('Fields error:', fieldsError);
        throw new Error(`Failed to load signature fields: ${fieldsError.message} (Code: ${fieldsError.code})`);
      }
      
      console.log('Fields data loaded:', fieldsData);

      setRequest(requestData);
      setFields(fieldsData || []);
    } catch (err) {
      console.error('Error loading signing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document. Please try again or contact the sender.');
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeField) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeField) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    if (!activeField) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL();
    
    try {
      const { error } = await supabase
        .from('signature_fields')
        .update({
          value: signatureData,
          signed_at: new Date().toISOString()
        })
        .eq('id', activeField);

      if (error) throw error;

      // Update local state
      setFields(prev => prev.map(field => 
        field.id === activeField 
          ? { ...field, value: signatureData, signed_at: new Date().toISOString() }
          : field
      ));

      setActiveField(null);
      clearSignature();
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Failed to save signature. Please try again.');
    }
  };

  const updateFieldValue = async (fieldId: string, value: string) => {
    try {
      console.log('Updating field value:', { fieldId, value });
      
      const { error } = await supabase
        .from('signature_fields')
        .update({
          value: value,
          signed_at: new Date().toISOString()
        })
        .eq('id', fieldId);

      if (error) {
        console.error('Supabase error updating field:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Field value updated successfully');
      
      setFields(prev => prev.map(field => 
        field.id === fieldId 
          ? { ...field, value, signed_at: new Date().toISOString() }
          : field
      ));
    } catch (err) {
      console.error('Error updating field:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to update field: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    }
  };

  const completeDocument = async () => {
    setSigning(true);
    
    try {
      console.log('Completing document for recipient:', recipientId);
      
      // Update recipient status
      const { error: recipientError } = await supabase
        .from('recipients')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      if (recipientError) {
        console.error('Error updating recipient status:', recipientError);
        throw new Error(`Failed to update recipient status: ${recipientError.message}`);
      }

      console.log('Recipient status updated successfully');
      
      // Check if all recipients have signed
      const { data: allRecipients, error: allRecipientsError } = await supabase
        .from('recipients')
        .select('status')
        .eq('request_id', requestId);

      if (allRecipientsError) {
        console.error('Error checking all recipients:', allRecipientsError);
        throw new Error(`Failed to check recipient statuses: ${allRecipientsError.message}`);
      }

      console.log('All recipients status:', allRecipients);
      
      const allSigned = allRecipients?.every(r => r.status === 'signed');

      if (allSigned) {
        console.log('All recipients have signed, updating request status');
        
        // Update request status to completed
        const { error: requestError } = await supabase
          .from('signature_requests')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (requestError) {
          console.error('Error updating request status:', requestError);
          throw new Error(`Failed to update request status: ${requestError.message}`);
        }
        
        console.log('Request status updated to completed');
      }

      alert('✅ Document signed successfully! Thank you for completing the signature process.');
      
    } catch (err) {
      console.error('Error completing document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to complete document: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Document</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const requiredFields = fields.filter(f => f.type === 'signature');
  const completedFields = fields.filter(f => f.value && f.signed_at);
  const canComplete = requiredFields.every(f => f.value && f.signed_at);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {request?.title || 'Document Signing'}
                </h1>
                <p className="text-sm text-gray-500">
                  From: {request?.sender_email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {completedFields.length} of {fields.length} fields completed
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedFields.length / Math.max(fields.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {request?.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Message from sender:</h3>
            <p className="text-blue-800">{request.message}</p>
          </div>
        )}

        {/* Document */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="relative">
            {/* Sample Document Content */}
            <div className="space-y-8">
              <div className="text-center border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {request?.title || 'Document Title'}
                </h1>
                <p className="text-gray-600 text-lg">
                  Professional Document for Electronic Signature
                </p>
              </div>

              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  This document serves as a comprehensive agreement between the parties involved. 
                  All terms and conditions outlined herein are binding upon execution by the 
                  designated signatories.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Important Notice</h3>
                  <p className="text-blue-800">
                    By signing this document electronically, you acknowledge that your electronic 
                    signature has the same legal effect as a handwritten signature.
                  </p>
                </div>

                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• All parties agree to the terms outlined</li>
                      <li>• Electronic signatures are legally binding</li>
                      <li>• Document is effective upon all signatures</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Review document carefully</li>
                      <li>• Sign in designated areas</li>
                      <li>• Submit completed document</li>
                    </ul>
                  </div>
                </div>

                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                  in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>
            </div>

            {/* Signature Fields */}
            {fields.map((field) => (
              <div
                key={field.id}
                className={`absolute border-2 rounded-lg transition-all ${
                  field.value && field.signed_at
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500 bg-blue-50 cursor-pointer hover:bg-blue-100'
                }`}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width}px`,
                  height: `${field.height}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  if (!field.value && field.type === 'signature') {
                    setActiveField(field.id);
                  }
                }}
              >
                {field.value && field.signed_at ? (
                  <div className="flex items-center space-x-2 text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">
                      {field.type === 'signature' && 'Signed'}
                      {field.type === 'initial' && 'Initialed'}
                      {field.type === 'date' && 'Dated'}
                    </span>
                  </div>
                ) : (
                  <div className="text-blue-700 font-medium text-xs text-center">
                    {field.type === 'signature' && (
                      <>
                        <Pen className="w-4 h-4 mx-auto mb-1" />
                        Click to Sign
                      </>
                    )}
                    {field.type === 'initial' && (
                      <>
                        <span className="text-sm font-bold">AB</span>
                        <div>Click to Initial</div>
                      </>
                    )}
                    {field.type === 'date' && (
                      <>
                        <Calendar className="w-4 h-4 mx-auto mb-1" />
                        <input
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateFieldValue(field.id, e.target.value)}
                          className="text-xs border-none bg-transparent text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signature Modal */}
        {activeField && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Your Signature
                </h3>
                
                <div className="border border-gray-300 rounded-lg mb-4">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={clearSignature}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setActiveField(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSignature}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={completeDocument}
            disabled={!canComplete || signing}
            className={`px-8 py-4 rounded-lg font-semibold transition-all ${
              canComplete && !signing
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {signing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Completing Document...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Complete Document
              </>
            )}
          </button>
          
          {!canComplete && (
            <p className="text-sm text-gray-500 mt-2">
              Please complete all required signature fields before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SigningPage;