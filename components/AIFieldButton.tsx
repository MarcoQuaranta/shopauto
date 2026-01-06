'use client';

import { useState, useRef, useEffect } from 'react';
import { FieldAction } from '@/lib/gemini';

interface AIFieldButtonProps {
  fieldName: string;
  fieldLabel: string;
  currentValue?: string;
  productContext: string;
  onValueGenerated: (value: string) => void;
  shopId: string;
  disabled?: boolean;
}

const ACTIONS: { value: FieldAction; label: string; icon: string }[] = [
  { value: 'generate', label: 'Genera', icon: '✨' },
  { value: 'improve', label: 'Migliora', icon: '📝' },
  { value: 'shorten', label: 'Accorcia', icon: '✂️' },
  { value: 'expand', label: 'Espandi', icon: '📖' },
];

export default function AIFieldButton({
  fieldName,
  fieldLabel,
  currentValue,
  productContext,
  onValueGenerated,
  shopId,
  disabled = false,
}: AIFieldButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (action: FieldAction) => {
    // Don't allow improve/shorten/expand without current value
    if ((action === 'improve' || action === 'shorten' || action === 'expand') && !currentValue?.trim()) {
      setError('Inserisci prima un valore da modificare');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(false);

    try {
      const response = await fetch('/api/gemini/assist-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          fieldName,
          fieldLabel,
          productContext,
          currentValue,
          action,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onValueGenerated(result.value);
      } else {
        setError(result.error || 'Errore');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('AI assist error:', err);
      setError('Errore di connessione');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter actions based on whether there's a current value
  const availableActions = currentValue?.trim()
    ? ACTIONS
    : ACTIONS.filter((a) => a.value === 'generate');

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`p-1.5 rounded-lg transition-all ${
          disabled || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700'
        }`}
        title="Assistente AI"
      >
        {isLoading ? (
          <span className="w-4 h-4 block border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {availableActions.map((action) => (
            <button
              key={action.value}
              type="button"
              onClick={() => handleAction(action.value)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error Tooltip */}
      {error && (
        <div className="absolute right-0 mt-1 w-48 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 z-50">
          {error}
        </div>
      )}
    </div>
  );
}
