import React, { forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const FormField = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helperText,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const sizeClasses = {
    sm: {
      input: 'px-3 py-2 text-sm',
      label: 'text-sm',
      helper: 'text-xs'
    },
    md: {
      input: 'px-4 py-2.5 text-sm',
      label: 'text-sm',
      helper: 'text-sm'
    },
    lg: {
      input: 'px-4 py-3 text-base',
      label: 'text-base',
      helper: 'text-sm'
    }
  };

  const variantClasses = {
    default: {
      input: 'border-gray-300 bg-white text-gray-900',
      focus: 'focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
    },
    filled: {
      input: 'border-transparent bg-gray-50 text-gray-900',
      focus: 'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
    },
    outlined: {
      input: 'border-2 border-gray-300 bg-transparent text-gray-900',
      focus: 'focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
    }
  };

  const getInputClasses = () => {
    const baseClasses = [
      'block w-full rounded-lg transition-all duration-200',
      'placeholder-gray-500',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'read-only:bg-gray-50',
      sizeClasses[size].input,
      variantClasses[variant].input
    ];

    if (error) {
      baseClasses.push(variantClasses[variant].error);
    } else if (success) {
      baseClasses.push(variantClasses[variant].success);
    } else if (isFocused) {
      baseClasses.push(variantClasses[variant].focus);
    }

    if (leftIcon) {
      baseClasses.push('pl-10');
    }
    if (rightIcon || showPasswordToggle) {
      baseClasses.push('pr-10');
    }

    return [...baseClasses, inputClassName].join(' ');
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const renderInput = () => {
    const inputProps = {
      ref,
      id: name,
      name,
      type: showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type,
      placeholder,
      value,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      required,
      disabled,
      readOnly,
      autoComplete,
      className: getInputClasses(),
      'aria-describedby': `${name}-helper ${name}-error`,
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={props.rows || 3}
            className={`${getInputClasses()} resize-none`}
          />
        );

      case 'select':
        return (
          <select {...inputProps}>
            {props.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return <input {...inputProps} />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={`block font-medium text-gray-700 dark:text-gray-300 ${sizeClasses[size].label} ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Right Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          
          {rightIcon && !showPasswordToggle && (
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          )}

          {/* Status Icons */}
          {error && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {success && !error && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>

      {/* Helper Text */}
      {helperText && (
        <p
          id={`${name}-helper`}
          className={`text-gray-500 dark:text-gray-400 ${sizeClasses[size].helper}`}
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id={`${name}-error`}
          className={`text-red-600 dark:text-red-400 ${sizeClasses[size].helper} flex items-center`}
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Success Message */}
      {success && !error && (
        <p
          className={`text-green-600 dark:text-green-400 ${sizeClasses[size].helper} flex items-center`}
        >
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

// Specialized form field components
export const TextField = (props) => <FormField type="text" {...props} />;
export const EmailField = (props) => <FormField type="email" {...props} />;
export const PasswordField = (props) => <FormField type="password" showPasswordToggle {...props} />;
export const NumberField = (props) => <FormField type="number" {...props} />;
export const TelField = (props) => <FormField type="tel" {...props} />;
export const UrlField = (props) => <FormField type="url" {...props} />;
export const DateField = (props) => <FormField type="date" {...props} />;
export const TimeField = (props) => <FormField type="time" {...props} />;
export const DateTimeField = (props) => <FormField type="datetime-local" {...props} />;
export const TextAreaField = (props) => <FormField type="textarea" {...props} />;
export const SelectField = (props) => <FormField type="select" {...props} />;
export const CheckboxField = (props) => <FormField type="checkbox" {...props} />;
export const RadioField = (props) => <FormField type="radio" {...props} />;
export const FileField = (props) => <FormField type="file" {...props} />;

// Form field group for related fields
export const FormFieldGroup = ({ 
  children, 
  title, 
  description, 
  className = '',
  required = false 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form field row for horizontal layout
export const FormFieldRow = ({ 
  children, 
  className = '',
  gap = 'gap-4'
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gap} ${className}`}>
      {children}
    </div>
  );
};

export default FormField;