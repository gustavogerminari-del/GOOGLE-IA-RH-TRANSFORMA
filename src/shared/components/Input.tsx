import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="space-y-1.5 text-xs">
      {label && (
        <label htmlFor={inputId} className="block font-bold text-[#0F172A]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && <div className="absolute left-3 text-[#475569] pointer-events-none">{leftIcon}</div>}
        <input
          id={inputId}
          className={`w-full bg-white border text-[#0F172A] placeholder-[#64748B] p-2.5 rounded-xl font-medium outline-none transition-all ${
            error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-rose-200' : 'border-[#CBD5E1] focus:border-[#1D4F7A]'
          } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {rightIcon && <div className="absolute right-3 text-[#475569] pointer-events-none">{rightIcon}</div>}
      </div>
      {error ? (
        <p className="text-[11px] text-[#DC2626] font-semibold bg-[#FFF1F2] border border-[#FCA5A5] p-1.5 rounded-lg">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#475569]">{helperText}</p>
      ) : null}
    </div>
  );
};
