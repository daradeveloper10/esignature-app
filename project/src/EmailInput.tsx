import React, { useState, KeyboardEvent } from 'react';

interface EmailInputProps {
  onAddEmail: (email: string) => void;
  placeholder?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({ onAddEmail, placeholder = "Enter email address" }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = () => {
    const email = inputValue.trim();
    
    if (!email) return;

    if (isValidEmail(email)) {
      onAddEmail(email);
      setInputValue('');
      setError('');
    } else {
      setError('Please enter a valid email address');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleInputChange = (value: string) => {
    // Don't allow spaces in the input value since space triggers email addition
    if (value.includes(' ')) {
      return;
    }
    
    setInputValue(value);
    if (error) {
      setError('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addEmail}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-md outline-none transition-colors ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Press spacebar or Enter to add email
      </p>
    </div>
  );
};

export default EmailInput;