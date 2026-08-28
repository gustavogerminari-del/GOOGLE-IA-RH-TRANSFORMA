import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="space-y-1.5 text-xs">
      {label && (
        <label htmlFor={selectId} className="block font-bold text-[#0F172A]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white border text-[#0F172A] p-2.5 rounded-xl font-medium outline-none transition-all cursor-pointer ${
          error ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#1D4F7A]'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-[#0F172A] bg-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-[#DC2626] font-semibold bg-[#FFF1F2] border border-[#FCA5A5] p-1.5 rounded-lg">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#475569]">{helperText}</p>
      ) : null}
    </div>
  );
};
