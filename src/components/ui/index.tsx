import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { cn } from '@/lib/utils';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, href, leftIcon, rightIcon, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const buttonClasses = cn(baseClasses, variants[variant], sizes[size], className);

    if (href) {
      return (
        <a
          href={href}
          className={buttonClasses}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          )}
          {leftIcon && !loading && (
            <span className="mr-2">{leftIcon}</span>
          )}
          {children}
          {rightIcon && (
            <span className="ml-2">{rightIcon}</span>
          )}
        </a>
      );
    }

    return (
      <button
        className={buttonClasses}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        )}
        {leftIcon && !loading && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Input Component
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isDisabled?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    size = 'md',
    isRequired = false,
    isDisabled = false,
    showCharacterCount = false,
    maxLength,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = React.useState(false);
    const [value, setValue] = React.useState(props.value || props.defaultValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const variants = {
      default: 'border-gray-300 bg-white shadow-sm',
      filled: 'border-transparent bg-gray-50 shadow-none',
      outlined: 'border-2 border-gray-300 bg-transparent shadow-none',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-3 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const focusStyles = {
      default: 'focus:border-blue-500 focus:ring-blue-500',
      filled: 'focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      outlined: 'focus:border-blue-500 focus:ring-blue-500',
    };

    const errorStyles = {
      default: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      filled: 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500',
      outlined: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    };

    const baseClasses = cn(
      'block w-full rounded-lg transition-all duration-200 ease-in-out',
      'text-gray-900 placeholder:text-gray-400 cursor-text',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      'disabled:border-gray-200',
      variants[variant],
      sizes[size],
      error ? errorStyles[variant] : focusStyles[variant],
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    const characterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium transition-colors duration-200',
              error ? 'text-red-700' : 'text-gray-700',
              isDisabled && 'text-gray-400'
            )}
          >
            {label}
            {isRequired && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative group">
          {leftIcon && (
            <div className={cn(
              'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200',
              error ? 'text-red-400' : isFocused ? 'text-blue-500' : 'text-gray-400'
            )}>
              <div className="h-5 w-5">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            className={baseClasses}
            style={{ 
              color: '#111827',
              caretColor: '#111827'
            }} // Ensure dark text and cursor color
            disabled={isDisabled}
            maxLength={maxLength}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(
              'absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none transition-colors duration-200',
              error ? 'text-red-400' : isFocused ? 'text-blue-500' : 'text-gray-400'
            )}>
              <div className="h-5 w-5">
                {rightIcon}
              </div>
            </div>
          )}

          {/* Focus ring for better accessibility */}
          <div className={cn(
            'absolute inset-0 rounded-lg ring-2 ring-transparent transition-all duration-200 pointer-events-none',
            isFocused && !error && 'ring-blue-500/20',
            isFocused && error && 'ring-red-500/20'
          )} />
        </div>

        {/* Helper text and character count */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          
          {showCharacterCount && maxLength && (
            <div className="ml-2 flex-shrink-0">
              <span className={cn(
                'text-xs',
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              )}>
                {characterCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isDisabled?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    variant = 'default',
    size = 'md',
    isRequired = false,
    isDisabled = false,
    showCharacterCount = false,
    maxLength,
    resize = 'vertical',
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const [isFocused, setIsFocused] = React.useState(false);
    const [value, setValue] = React.useState(props.value || props.defaultValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const variants = {
      default: 'border-gray-300 bg-white shadow-sm',
      filled: 'border-transparent bg-gray-50 shadow-none',
      outlined: 'border-2 border-gray-300 bg-transparent shadow-none',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-3 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const focusStyles = {
      default: 'focus:border-blue-500 focus:ring-blue-500',
      filled: 'focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      outlined: 'focus:border-blue-500 focus:ring-blue-500',
    };

    const errorStyles = {
      default: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      filled: 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500',
      outlined: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    };

    const baseClasses = cn(
      'block w-full rounded-lg transition-all duration-200 ease-in-out',
      'text-gray-900 placeholder:text-gray-400 cursor-text',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      'disabled:border-gray-200',
      variants[variant],
      sizes[size],
      resizeStyles[resize],
      error ? errorStyles[variant] : focusStyles[variant],
      className
    );

    const characterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium transition-colors duration-200',
              error ? 'text-red-700' : 'text-gray-700',
              isDisabled && 'text-gray-400'
            )}
          >
            {label}
            {isRequired && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative group">
          <textarea
            id={textareaId}
            ref={ref}
            className={baseClasses}
            style={{ 
              color: '#111827',
              caretColor: '#111827'
            }} // Ensure dark text and cursor color
            disabled={isDisabled}
            maxLength={maxLength}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            {...props}
          />

          {/* Focus ring for better accessibility */}
          <div className={cn(
            'absolute inset-0 rounded-lg ring-2 ring-transparent transition-all duration-200 pointer-events-none',
            isFocused && !error && 'ring-blue-500/20',
            isFocused && error && 'ring-red-500/20'
          )} />
        </div>

        {/* Helper text and character count */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          
          {showCharacterCount && maxLength && (
            <div className="ml-2 flex-shrink-0">
              <span className={cn(
                'text-xs',
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              )}>
                {characterCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Dropdown Option Interface
export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

// Dropdown Component
export interface DropdownProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    options, 
    placeholder = "Select an option...",
    value,
    onChange,
    disabled = false,
    required = false,
    variant = 'default',
    size = 'md',
    searchable = false,
    clearable = false,
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Find selected option
    useEffect(() => {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    }, [value, options]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
      if (!searchable || !searchTerm) return options;
      return options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }, [options, searchTerm]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchRef.current) {
        searchRef.current.focus();
      }
    }, [isOpen, searchable]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setSearchTerm('');
      }
    };

    const handleSelect = (option: DropdownOption) => {
      if (!option.disabled) {
        setSelectedOption(option);
        onChange?.(option.value);
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedOption(null);
      onChange?.('');
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'sm': return 'px-3 py-1.5 text-sm';
        case 'lg': return 'px-4 py-3 text-lg';
        default: return 'px-3 py-2 text-sm';
      }
    };

    const getVariantClasses = () => {
      switch (variant) {
        case 'filled':
          return 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500';
        case 'outline':
          return 'border-2 border-gray-300 focus:border-blue-500';
        default:
          return 'border border-gray-300 focus:border-blue-500';
      }
    };

    return (
      <div className="space-y-1" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative" ref={dropdownRef}>
          <div
            className={cn(
              'relative w-full text-left rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              getSizeClasses(),
              getVariantClasses(),
              disabled && 'bg-gray-100 cursor-not-allowed opacity-50',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          >
            <button
              type="button"
              onClick={handleToggle}
              disabled={disabled}
              className="w-full text-left focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  {leftIcon && (
                    <div className="flex-shrink-0 mr-2 text-gray-400">
                      {leftIcon}
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1">
                    {selectedOption ? (
                      <div className="flex items-center">
                        {selectedOption.icon && (
                          <div className="flex-shrink-0 mr-2">
                            {selectedOption.icon}
                          </div>
                        )}
                        <span className="block truncate text-gray-500">
                          {selectedOption.label}
                        </span>
                      </div>
                    ) : (
                      <span className="block truncate text-gray-200">
                        {placeholder}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center ml-2">
                  {rightIcon ? (
                    <div className="flex-shrink-0 text-gray-400">
                      {rightIcon}
                    </div>
                  ) : (
                    <svg
                      className={cn(
                        'flex-shrink-0 h-5 w-5 text-gray-400 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
            
            {clearable && selectedOption && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
              {searchable && (
                <div className="px-3 py-2 border-b border-gray-200">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option: DropdownOption) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={cn(
                      'relative w-full px-3 py-2 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                      option.value === value && 'bg-blue-50 text-blue-900'
                    )}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <div className="flex-shrink-0 mr-2">
                          {option.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="block truncate font-medium text-gray-900">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="block truncate text-sm text-gray-500">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

// Legacy Select Component (for backward compatibility)
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox Component
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center">
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
              error && 'border-red-300 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <label className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Card Component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white shadow rounded-lg', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-t border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Badge Component
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium';
    
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Alert Component
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', children, ...props }, ref) => {
    const variants = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      danger: 'bg-red-50 border-red-200 text-red-800',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-md border p-4', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

// Loading Spinner Component
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };

    return (
      <div
        ref={ref}
        className={cn('animate-spin rounded-full border-b-2 border-blue-600', sizes[size], className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

// Modal Component
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, children, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />
          <div
            ref={ref}
            className={cn(
              'relative bg-white rounded-lg shadow-xl max-w-md w-full',
              className
            )}
            {...props}
          >
            {title && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              </div>
            )}
            <div className="px-6 py-4">{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Tooltip Component
export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  children: React.ReactNode;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative group', className)}
        {...props}
      >
        {children}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {content}
        </div>
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

// Data Table Component
export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white shadow overflow-hidden sm:rounded-md', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';

// Data Table Row Component
export interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DataTableRow = React.forwardRef<HTMLDivElement, DataTableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-4 sm:px-6 border-b border-gray-200 last:border-b-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DataTableRow.displayName = 'DataTableRow';

// Empty State Component
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-center py-12', className)}
        {...props}
      >
        {icon && (
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            {icon}
          </div>
        )}
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {action && (
          <div className="mt-6">{action}</div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// TagInput Component
export { default as TagInput } from './TagInput';

// Theme Components
export { default as ThemeToggle } from './ThemeToggle';

// Landing Page Components
export { default as Hero } from './Hero';
export { default as HeroSection } from './HeroSection';
export { default as CategoryHighlights } from './CategoryHighlights';
export { default as BrandPressSection } from './BrandPressSection';
export { default as NewsletterSection } from './NewsletterSection';
export { default as Footer } from './Footer';

// Article Components
export { default as SuggestedArticles } from './SuggestedArticles';
export { default as SocialShare } from './SocialShare';

// Stats Card Component
export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, icon, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white overflow-hidden shadow rounded-lg', className)}
        {...props}
      >
        <div className="p-5">
          <div className="flex items-center">
            {icon && (
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <div className="h-6 w-6 text-white">
                    {icon}
                  </div>
                </div>
              </div>
            )}
            <div className={cn('w-0 flex-1', icon && 'ml-5')}>
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {value}
                </dd>
                {trend && (
                  <dd className={cn(
                    'text-sm',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.value}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';
