import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && <label className="text-xs font-semibold text-neutral-500">{label}</label>}
      <input
        className={`input ${error ? 'border-accent-danger focus:ring-rose-500/10 focus:border-accent-danger' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-accent-danger mt-0.5">{error}</span>}
    </div>
  );
}

