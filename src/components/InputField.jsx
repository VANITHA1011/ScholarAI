import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  icon: Icon,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full py-2.5 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${isPassword ? 'pr-11' : 'pr-4'} text-sm bg-white/40 dark:bg-slate-950/40 border ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 dark:border-slate-700/60 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
          } rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all backdrop-blur-sm`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500 font-medium animate-fade-in">{error}</p>}
    </div>
  );
};
