'use client';

import { useState } from 'react';
import { LandingPageContent } from '@/lib/gemini';

interface AIAssistantPanelProps {
  shopId: string;
  onGenerate: (content: LandingPageContent) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

type ToneOption = 'professionale' | 'amichevole' | 'urgente' | 'lusso';

const TONE_OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'professionale', label: 'Professionale', description: 'Tono autorevole e affidabile' },
  { value: 'amichevole', label: 'Amichevole', description: 'Tono colloquiale e accessibile' },
  { value: 'urgente', label: 'Urgente', description: 'Crea senso di urgenza e scarsità' },
  { value: 'lusso', label: 'Lusso', description: 'Elegante e sofisticato' },
];

const PROMPT_TEMPLATES = [
  {
    label: 'Prodotto Generico',
    template: 'Crea una landing page per [nome prodotto], un [categoria] che offre [beneficio principale]. Target: [pubblico target].',
  },
  {
    label: 'Abbigliamento',
    template: 'Crea una landing page per [nome capo], un capo di abbigliamento [stile] perfetto per [occasione]. Materiali di qualità, made in Italy.',
  },
  {
    label: 'Tecnologia',
    template: 'Crea una landing page per [nome prodotto], un dispositivo tecnologico innovativo che [funzione principale]. Ideale per [utente tipo].',
  },
  {
    label: 'Bellezza/Cosmesi',
    template: 'Crea una landing page per [nome prodotto], un prodotto di bellezza che [beneficio]. Ingredienti naturali, testato dermatologicamente.',
  },
  {
    label: 'Food/Bevande',
    template: 'Crea una landing page per [nome prodotto], un [tipo alimento] artigianale con [caratteristica distintiva]. Produzione italiana.',
  },
];

export default function AIAssistantPanel({
  shopId,
  onGenerate,
  isLoading,
  onLoadingChange,
}: AIAssistantPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<ToneOption>('professionale');
  const [includeReviews, setIncludeReviews] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Inserisci una descrizione del prodotto');
      return;
    }

    setError(null);
    onLoadingChange(true);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          prompt: prompt.trim(),
          options: {
            tone,
            includeReviews,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        onGenerate(result.content);
        setIsExpanded(false);
      } else {
        setError(result.error || 'Errore durante la generazione');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Errore di connessione. Riprova.');
    } finally {
      onLoadingChange(false);
    }
  };

  const applyTemplate = (template: string) => {
    setPrompt(template);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="font-semibold text-purple-900">Assistente AI</h3>
            <p className="text-sm text-purple-600">
              Genera automaticamente tutti i contenuti della landing page
            </p>
          </div>
        </div>
        <span className="text-purple-500 text-xl">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Rapidi
            </label>
            <div className="flex flex-wrap gap-2">
              {PROMPT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t.template)}
                  className="px-3 py-1 text-sm bg-white border border-purple-200 rounded-full hover:bg-purple-50 hover:border-purple-300"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrivi il tuo prodotto
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Es: Crea una landing page per un orologio sportivo da uomo, resistente all'acqua, stile moderno, target giovani professionisti..."
              className="w-full px-3 py-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tono
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTone(option.value)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      tone === option.value
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Include Reviews */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opzioni
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReviews}
                  onChange={(e) => setIncludeReviews(e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <span className="text-sm">Genera anche recensioni fittizie</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isLoading || !prompt.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generazione in corso...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ✨ Genera Contenuti Landing Page
              </span>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            I contenuti generati verranno inseriti nei campi del form. Potrai modificarli prima di salvare.
          </p>
        </div>
      )}
    </div>
  );
}
