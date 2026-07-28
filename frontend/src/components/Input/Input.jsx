import React from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required,
  name,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label className="input-label" htmlFor={name}>
          {label} {required && <span style={{ color: 'var(--danger-red)' }}>*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`input-field ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      {error && (
        <div className="input-error-msg">
          <span>⚠️</span> {error}
        </div>
      )}
      {!error && helperText && (
        <div className="input-helper-msg">
          {helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
