import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', // 'primary', 'secondary', 'ghost'
  fullWidth = false, 
  disabled = false, 
  onClick, 
  className = '', 
  type = 'button',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'btn-full-width' : '';

  const combinedClasses = [baseClass, variantClass, widthClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
