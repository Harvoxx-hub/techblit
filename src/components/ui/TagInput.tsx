import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export default function TagInput({
  label,
  value = [],
  onChange,
  placeholder = "Add tags...",
  helperText,
  icon,
  variant = 'filled'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If user types a comma, add the tag immediately
    if (val.includes(',')) {
      const tags = val.split(',').map(tag => tag.trim()).filter(tag => tag);
      tags.forEach(tag => addTag(tag));
      setInputValue('');
    } else {
      setInputValue(val);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'filled':
        return 'border-transparent bg-gray-50 shadow-none';
      case 'outlined':
        return 'border-2 border-gray-300 bg-transparent shadow-none';
      default:
        return 'border-gray-300 bg-white shadow-sm';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="space-y-2">
        {/* Input field */}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <div className="h-5 w-5">
                {icon}
              </div>
            </div>
          )}
          
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={cn(
              'block w-full rounded-lg transition-all duration-200 ease-in-out',
              'text-gray-900 placeholder:text-gray-400',
              'focus:border-blue-500 focus:ring-blue-500',
              'px-3 py-2.5 text-sm',
              icon && 'pl-10',
              getVariantClasses()
            )}
          />
        </div>

        {/* Tags display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
