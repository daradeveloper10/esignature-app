import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface Recipient {
  id: string;
  name: string;
  emails: string[];
  role: 'signer' | 'reviewer' | 'cc';
}

interface DraggableRecipientProps {
  recipient: Recipient;
  index: number;
  onRemove: (id: string) => void;
  onUpdateRecipient: (id: string, updates: Partial<Recipient>) => void;
  onAddEmail: (recipientId: string, email: string) => void;
  onRemoveEmail: (recipientId: string, emailIndex: number) => void;
  onInsertField: (recipientId: string, type: 'signature' | 'initial' | 'date') => void;
  getFieldCount: (recipientId: string, type: 'signature' | 'initial' | 'date') => number;
  isDragMode: boolean;
}

const DraggableRecipient: React.FC<DraggableRecipientProps> = ({
  recipient,
  index,
  onRemove,
  onUpdateRecipient,
  onAddEmail,
  onRemoveEmail,
  onInsertField,
  getFieldCount,
  isDragMode
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: recipient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  if (isDragMode) {
    // Simplified drag mode view
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          flex items-center space-x-3 p-4 bg-white border-2 rounded-lg transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 shadow-lg bg-blue-50 scale-105' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Sequence Number */}
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
          {index + 1}
        </div>

        {/* Recipient Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 mb-1">
            <div className="flex items-center space-x-2">
              <span>Signer {index + 1}:</span>
              <span className="text-blue-600">{recipient.name || `Recipient ${String.fromCharCode(65 + index)}`}</span>
            </div>
          </div>
          <div className="space-y-1">
            {recipient.emails.map((email, emailIndex) => (
              <div key={emailIndex} className="text-sm text-gray-700 font-medium truncate">
                {email}
              </div>
            ))}
            {recipient.emails.length === 0 && (
              <div className="text-sm text-red-500 italic">⚠️ No email added</div>
            )}
            {recipient.emails.length > 1 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-xs text-amber-800">
                  Any of these {recipient.emails.length} people can sign
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(recipient.id)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Remove recipient"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Full edit mode view (existing functionality)
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* Recipient Header */}
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          value={recipient.name}
          onChange={(e) => onUpdateRecipient(recipient.id, { name: e.target.value })}
          placeholder={`Recipient ${String.fromCharCode(65 + index)}`}
          className="font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 focus:rounded px-2 py-1 -mx-2 -my-1"
        />
        <button
          onClick={() => onRemove(recipient.id)}
          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Remove
        </button>
      </div>

      {/* Email Management */}
      <div className="mb-4 space-y-2">
        {/* Email Tags */}
        {recipient.emails.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-300 rounded-md min-h-[40px]">
            {recipient.emails.map((email, emailIndex) => (
              <div
                key={emailIndex}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
              >
                <span>{email}</span>
                <button
                  onClick={() => onRemoveEmail(recipient.id, emailIndex)}
                  className="hover:bg-blue-200 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Multiple Email Notification */}
        {recipient.emails.length > 1 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-amber-800">
                <span className="font-medium">Multiple signers:</span> Any of these {recipient.emails.length} people can sign for this recipient.
              </div>
            </div>
          </div>
        )}
        
        {/* Email Input */}
        <div className="bg-white border border-gray-300 rounded-md">
          <input
            type="email"
            placeholder="Enter email address"
            className="w-full px-3 py-2 text-sm border-0 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const email = (e.target as HTMLInputElement).value.trim();
                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  onAddEmail(recipient.id, email);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Signature Fields */}
      <div className="space-y-2">
        {/* Signature */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Signature * ({getFieldCount(recipient.id, 'signature')})
            </span>
          </div>
          <button
            onClick={() => onInsertField(recipient.id, 'signature')}
            disabled={recipient.emails.length === 0}
            className={`px-3 py-1 text-xs border rounded transition-colors font-medium ${
              recipient.emails.length === 0
                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'text-blue-600 border-blue-300 hover:bg-blue-50'
            }`}
            title={recipient.emails.length === 0 ? 'Add an email address first' : 'Insert signature field'}
          >
            Insert
          </button>
        </div>

        {/* Initials */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">AB</span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Initials ({getFieldCount(recipient.id, 'initial')})
            </span>
          </div>
          <button
            onClick={() => onInsertField(recipient.id, 'initial')}
            disabled={recipient.emails.length === 0}
            className={`px-3 py-1 text-xs border rounded transition-colors font-medium ${
              recipient.emails.length === 0
                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'text-green-600 border-green-300 hover:bg-green-50'
            }`}
            title={recipient.emails.length === 0 ? 'Add an email address first' : 'Insert initial field'}
          >
            Insert
          </button>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Date ({getFieldCount(recipient.id, 'date')})
            </span>
          </div>
          <button
            onClick={() => onInsertField(recipient.id, 'date')}
            disabled={recipient.emails.length === 0}
            className={`px-3 py-1 text-xs border rounded transition-colors font-medium ${
              recipient.emails.length === 0
                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'text-purple-600 border-purple-300 hover:bg-purple-50'
            }`}
            title={recipient.emails.length === 0 ? 'Add an email address first' : 'Insert date field'}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraggableRecipient;