'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { isValidCPF, isValidPhone } from '@/lib/validation/cpf';

interface TextInputProps {
  type?: 'text' | 'textarea' | 'email' | 'phone' | 'cpf' | 'date' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  onSubmit?: () => void; // Called on Enter key
}

// Format helpers
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function TextInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  min,
  max,
  onSubmit,
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Validate on blur
  const validateField = useCallback((val: string) => {
    if (!val) { setValidationError(''); return; }

    if (type === 'cpf') {
      const digits = val.replace(/\D/g, '');
      if (digits.length === 11 && !isValidCPF(val)) {
        setValidationError('CPF inválido. Verifique os números.');
        return;
      }
    }

    if (type === 'phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length >= 10 && !isValidPhone(val)) {
        setValidationError('Telefone inválido. Verifique o DDD e número.');
        return;
      }
      if (digits.length > 0 && digits.length < 10) {
        setValidationError('Telefone incompleto. Digite DDD + número.');
        return;
      }
    }

    setValidationError('');
  }, [type]);

  // Auto-expand textarea
  const adjustHeight = useCallback(() => {
    if (type === 'textarea' && inputRef.current) {
      const el = inputRef.current as HTMLTextAreaElement;
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
    }
  }, [type]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Focus glow animation
  useEffect(() => {
    if (!wrapperRef.current) return;

    if (isFocused) {
      gsap.to(wrapperRef.current, {
        borderColor: 'rgba(245, 158, 11, 0.4)',
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)',
        duration: 0.4,
        ease: 'deyaSmooth',
      });
    } else {
      gsap.to(wrapperRef.current, {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
        duration: 0.3,
        ease: 'deyaSmooth',
      });
    }
  }, [isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let val = e.target.value;

    if (type === 'phone') {
      val = formatPhone(val);
    } else if (type === 'cpf') {
      val = formatCPF(val);
    } else if (type === 'number') {
      // Allow only digits and decimal
      val = val.replace(/[^0-9.,]/g, '');
      const num = parseFloat(val.replace(',', '.'));
      if (min !== undefined && num < min) return;
      if (max !== undefined && num > max) return;
    }

    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const inputClasses = `
    w-full bg-transparent text-foreground text-base sm:text-lg
    placeholder:text-muted-foreground/60
    focus:outline-none resize-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const htmlType = type === 'email' ? 'email' : type === 'date' ? 'date' : type === 'number' ? 'text' : 'text';
  const inputMode =
    type === 'phone' || type === 'cpf' ? 'numeric' :
    type === 'number' ? 'decimal' :
    type === 'email' ? 'email' :
    'text';

  return (
    <div
      ref={wrapperRef}
      className="border-2 border-white/[0.08] rounded-xl px-4 py-3.5 transition-colors"
    >
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); validateField(value); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={3}
          className={inputClasses}
          style={{ minHeight: 80 }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={htmlType}
          inputMode={inputMode}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); validateField(value); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          className={inputClasses}
          style={{ height: 48 }}
        />
      )}
      {validationError && (
        <p className="text-xs text-red-400 mt-2">{validationError}</p>
      )}
    </div>
  );
}
