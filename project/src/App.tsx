import React, { useState, useRef } from 'react';
import { FileText, Users, Send, Settings, Plus, X, Mail, CheckCircle } from 'lucide-react';
import RecipientList from './components/RecipientList';
import LoadingModal from './components/LoadingModal';
import { EmailService } from './utils/emailService';
import { PDFGenerator } from './utils/pdfGenerator';
import { supabase } from './utils/supabase';
import EmailTestButton from './components/EmailTestButton';

interface Recipient {
  id: string;
  name: string;
  emails: string[];
  role: 'signer' | 'reviewer' | 'cc';
}

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date';
  x: number;
  y: number;
  recipientId: string;
  label: string;
}

const App = React.memo(() => {
  const [currentStep, setCurrentStep] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [message, setMessage] = useState('');
  const [signInOrder, setSignInOrder] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'pdf' | 'email' | 'complete'>('pdf');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loadingErrors, setLoadingErrors] = useState<string[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'initial' | 'date'>('signature');
  const [isFieldMode, setIsFieldMode] = useState(false);
  const [pendingRecipientId, setPendingRecipientId] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  const addRecipient = React.useCallback(() => {
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      name: '',
      emails: [],
      role: 'signer'
    };
    setRecipients(prev => [...prev, newRecipient]);
  }, []);

  const removeRecipient = React.useCallback((id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
    setSignatureFields(prev => prev.filter(f => f.recipientId !== id));
  }, []);

  const updateRecipient = React.useCallback((id: string, updates: Partial<Recipient>) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const addEmailToRecipient = React.useCallback((recipientId: string, email: string) => {
    setRecipients(prev => prev.map(r => {
      if (r.id === recipientId && !r.emails.includes(email)) {
        return { ...r, emails: [...r.emails, email] };
      }
      return r;
    }));
  }, []);

  const removeEmailFromRecipient = React.useCallback((recipientId: string, emailIndex: number) => {
    setRecipients(prev => prev.map(r => {
      if (r.id === recipientId) {
        return { ...r, emails: r.emails.filter((_, index) => index !== emailIndex) };
      }
      return r;
    }));
  }, []);

  const reorderRecipients = React.useCallback((newRecipients: Recipient[]) => {
    setRecipients(newRecipients);
  }, []);

  const insertField = React.useCallback((recipientId: string, type: 'signature' | 'initial' | 'date') => {
    setSelectedFieldType(type);
    setPendingRecipientId(recipientId);
    setIsFieldMode(true);
  }, []);

  const handleDocumentClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFieldMode || !pendingRecipientId) return;

    const rect = documentRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      type: selectedFieldType,
      x,
      y,
      recipientId: pendingRecipientId,
      label: `${selectedFieldType} field`
    };

    setSignatureFields(prev => [...prev, newField]);
    setIsFieldMode(false);
    setPendingRecipientId(null);
  }, [isFieldMode, pendingRecipientId, selectedFieldType]);

  const removeField = React.useCallback((fieldId: string) => {
    setSignatureFields(prev => prev.filter(f => f.id !== fieldId));
  }, []);

  const getFieldCount = React.useCallback((recipientId: string, type: 'signature' | 'initial' | 'date') => {
    return signatureFields.filter(f => f.recipientId === recipientId && f.type === type).length;
  }, [signatureFields]);

  const getFieldColor = React.useCallback((type: 'signature' | 'initial' | 'date') => {
    switch (type) {
      case 'signature': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'initial': return 'bg-green-100 border-green-300 text-green-800';
      case 'date': return 'bg-purple-100 border-purple-300 text-purple-800';
    }
  }, []);

  const canProceedToStep2 = React.useMemo(() => {
    return recipients.length > 0 && 
           recipients.every(r => r.emails.length > 0) &&
           signatureFields.some(f => f.type === 'signature') &&
           documentTitle.trim() !== '';
  }, [recipients, signatureFields, documentTitle]);

  const canSendRequest = React.useMemo(() => {
    return canProceedToStep2 && 
           senderName.trim() !== '' && 
           senderEmail.trim() !== '';
  }, [canProceedToStep2, senderName, senderEmail]);

  // Add a demo mode for testing
  const fillDemoData = React.useCallback(() => {
    setDocumentTitle('Test Contract Agreement');
    setMessage('Please review and sign this test document to verify the eSignature system is working correctly.');
    setSenderName('Demo Sender');
    setSenderEmail('demo@example.com');
    
    // Add a test recipient
    const testRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      name: 'Test Signer',
      emails: ['test@example.com'], // You can change this to your email
      role: 'signer'
    };
    setRecipients([testRecipient]);
  }, []);

  const saveToDatabase = React.useCallback(async (requestData: any) => {
    try {
      // Save signature request
      const { data: requestResult, error: requestError } = await supabase
        .from('signature_requests')
        .insert({
          title: requestData.title,
          message: requestData.message,
          sender_email: requestData.senderEmail,
          status: 'pending',
          'sign_-in_order': requestData.signInOrder
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const requestId = requestResult.id;

      // Save recipients
      const recipientInserts = recipients.map((recipient, index) => ({
        request_id: requestId,
        email: recipient.emails[0], // Primary email
        role: recipient.role,
        signing_order_index: requestData.signInOrder ? index : null,
        status: 'pending'
      }));

      const { data: recipientResults, error: recipientError } = await supabase
        .from('recipients')
        .insert(recipientInserts)
        .select();

      if (recipientError) throw recipientError;

      // Save signature fields
      const fieldInserts = signatureFields.map(field => {
        const recipientIndex = recipients.findIndex(r => r.id === field.recipientId);
        const recipientDbId = recipientResults[recipientIndex]?.id;
        
        return {
          request_id: requestId,
          recipient_id: recipientDbId,
          type: field.type,
          page_number: 1,
          x: field.x,
          y: field.y,
          width: 120,
          height: 30
        };
      });

      const { error: fieldsError } = await supabase
        .from('signature_fields')
        .insert(fieldInserts);

      if (fieldsError) throw fieldsError;

      return { requestId, recipientResults };
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  }, [recipients, signatureFields]);

  const handleSendRequest = React.useCallback(async () => {
    if (!canSendRequest || !documentRef.current) return;

    setIsLoading(true);
    setLoadingStep('pdf');
    setLoadingProgress(0);
    setSentCount(0);
    setLoadingErrors([]);

    try {
      // Step 1: Generate PDF
      setLoadingProgress(20);
      const pdfResult = await PDFGenerator.convertDocumentToPDF(
        documentRef.current,
        signatureFields
      );
      
      setLoadingProgress(40);

      // Step 2: Save to database
      const requestData = {
        title: documentTitle,
        message,
        signInOrder,
        senderEmail,
        senderName
      };

      const { requestId, recipientResults } = await saveToDatabase(requestData);
      setLoadingProgress(60);
      setLoadingStep('email');

      // Step 3: Send emails
      // Map frontend recipient IDs to database UUIDs
      const emailRecipientsWithDbIds = recipients.map((r, index) => ({
        emails: r.emails,
        recipientId: recipientResults[index]?.id || r.id // Use database UUID
      }));

      const signatureRequest = {
        title: documentTitle,
        message,
        signInOrder,
        documentName: `${documentTitle}.pdf`,
        senderName,
        senderEmail
      };
      
      const emailResult = await EmailService.sendSignatureRequest(
        emailRecipientsWithDbIds,
        signatureRequest,
        pdfResult.pdfUrl,
        requestId
      );

      setSentCount(emailResult.sentEmails.length);
      
      if (emailResult.errors.length > 0) {
        setLoadingErrors(emailResult.errors);
      }

      setLoadingProgress(100);
      setLoadingStep('complete');

      // Keep modal open for 2 seconds to show completion
      setTimeout(() => {
        setIsLoading(false);
        if (emailResult.success) {
          alert(`✅ Signature request sent successfully!\n\n📧 ${emailResult.sentEmails.length} emails sent\n📄 Document: ${documentTitle}\n\nRecipients will receive signing instructions via email.`);
        }
      }, 2000);

    } catch (error) {
      console.error('Error sending signature request:', error);
      setLoadingErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
      setLoadingStep('complete');
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        alert('❌ Failed to send signature request. Please check your configuration and try again.');
      }, 2000);
    }
  }, [canSendRequest, documentTitle, message, signInOrder, senderName, senderEmail, recipients, signatureFields, saveToDatabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  eSignature Request
                </h1>
                <p className="text-sm text-gray-500">Microsoft Word Integration</p>
              </div>
            </div>
            
            {/* Professional Step Indicator */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentStep === 1 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <Users className="w-4 h-4" />
                <span>Setup</span>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentStep === 2 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Professional Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {currentStep === 1 && (
              <>
                {/* Document Configuration Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title *
                      </label>
                      <input
                        type="text"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        placeholder="Enter document title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message for recipients"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="signInOrder"
                        checked={signInOrder}
                        onChange={(e) => setSignInOrder(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="signInOrder" className="text-sm font-medium text-gray-700">
                        Recipients must sign in order
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recipients Management Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
                    </div>
                    <button
                      onClick={addRecipient}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Recipient</span>
                    </button>
                  </div>

                  {recipients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No recipients added yet</h4>
                      <p className="text-sm text-gray-500 mb-4">Add recipients to start creating your signature request</p>
                    </div>
                  ) : (
                    <RecipientList
                      recipients={recipients}
                      onReorderRecipients={reorderRecipients}
                      onRemoveRecipient={removeRecipient}
                      onUpdateRecipient={updateRecipient}
                      onAddEmailToRecipient={addEmailToRecipient}
                      onRemoveEmailFromRecipient={removeEmailFromRecipient}
                      onInsertField={insertField}
                      getFieldCount={getFieldCount}
                      signInOrder={signInOrder}
                    />
                  )}
                </div>

                {/* Field Mode Instructions */}
                {isFieldMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Settings className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-blue-900 mb-2">
                          Click to place {selectedFieldType} field
                        </h4>
                        <p className="text-sm text-blue-700 mb-4">
                          Click anywhere on the document preview to place a {selectedFieldType} field for the selected recipient.
                        </p>
                        <button
                          onClick={() => {
                            setIsFieldMode(false);
                            setPendingRecipientId(null);
                          }}
                          className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          Cancel Placement
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <EmailTestButton />

                {/* Demo Data Button */}
                <button
                  onClick={fillDemoData}
                  className="w-full py-3 px-6 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  📝 Fill Demo Data for Testing
                </button>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
                    canProceedToStep2
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue to Send →
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Sender Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sender Information</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Signing Order Card */}
                {signInOrder && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Signing Order</h3>
                    </div>
                    <RecipientList
                      recipients={recipients}
                      onReorderRecipients={reorderRecipients}
                      onRemoveRecipient={removeRecipient}
                      onUpdateRecipient={updateRecipient}
                      onAddEmailToRecipient={addEmailToRecipient}
                      onRemoveEmailFromRecipient={removeEmailFromRecipient}
                      onInsertField={insertField}
                      getFieldCount={getFieldCount}
                      signInOrder={signInOrder}
                    />
                  </div>
                )}

                {/* Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Document:</span>
                      <span className="font-medium text-gray-900">{documentTitle}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Recipients:</span>
                      <span className="font-medium text-gray-900">{recipients.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Signature Fields:</span>
                      <span className="font-medium text-gray-900">{signatureFields.filter(f => f.type === 'signature').length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Signing Order:</span>
                      <span className="font-medium text-gray-900">{signInOrder ? 'Sequential' : 'Any order'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSendRequest}
                    disabled={!canSendRequest}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center space-x-3 ${
                      canSendRequest
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                    <span>Send Signature Request</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-3 px-6 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    ← Back to Setup
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Professional Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {isFieldMode 
                        ? `Click anywhere to place a ${selectedFieldType} field`
                        : 'This is how your document will appear to recipients'
                      }
                    </p>
                  </div>
                  {signatureFields.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {signatureFields.length} field{signatureFields.length !== 1 ? 's' : ''} placed
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                <div
                  ref={documentRef}
                  onClick={handleDocumentClick}
                  className={`relative bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 min-h-[700px] transition-all ${
                    isFieldMode 
                      ? 'cursor-crosshair border-blue-400 bg-blue-50/30' 
                      : 'cursor-default hover:border-gray-400'
                  }`}
                >
                  {/* Professional Document Content */}
                  <div className="space-y-8">
                    <div className="text-center border-b border-gray-200 pb-6">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        {documentTitle || 'Sample Document Title'}
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

                  {/* Professional Signature Fields Overlay */}
                  {signatureFields.map((field) => {
                    const recipient = recipients.find(r => r.id === field.recipientId);
                    const recipientIndex = recipients.findIndex(r => r.id === field.recipientId);
                    
                    return (
                      <div
                        key={field.id}
                        className={`absolute border-2 border-dashed rounded-lg px-3 py-2 text-sm font-medium cursor-pointer hover:opacity-80 transition-all shadow-sm ${getFieldColor(field.type)}`}
                        style={{
                          left: field.x,
                          top: field.y,
                          minWidth: '140px',
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        data-signature-field={field.id}
                      >
                        <div className="flex items-center space-x-2">
                          <span>
                            {field.type === 'signature' && '✍️'}
                            {field.type === 'initial' && '📝'}
                            {field.type === 'date' && '📅'}
                          </span>
                          <span className="truncate">
                            {recipient?.name || `Recipient ${String.fromCharCode(65 + recipientIndex)}`}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Professional Empty State */}
                  {signatureFields.length === 0 && !isFieldMode && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h4 className="text-xl font-medium text-gray-900 mb-2">Add signature fields</h4>
                        <p className="text-gray-500 max-w-sm">
                          Use the recipient panel to add signature, initial, or date fields to your document
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Loading Modal */}
      <LoadingModal
        isOpen={isLoading}
        currentStep={loadingStep}
        progress={loadingProgress}
        recipientCount={recipients.reduce((sum, r) => sum + r.emails.length, 0)}
        sentCount={sentCount}
        errors={loadingErrors}
      />
    </div>
  );
});

App.displayName = 'App';

export default App;