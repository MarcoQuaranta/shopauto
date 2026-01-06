'use client';

import { useState, useEffect } from 'react';
import { VariantOption, VariantCombination } from '@/types/shopify';
import { generateVariantsWithDefaults, validateVariantOptions, formatVariantTitle } from '@/lib/variants';

interface VariantBuilderProps {
  options: VariantOption[];
  combinations: VariantCombination[];
  onOptionsChange: (options: VariantOption[]) => void;
  onCombinationsChange: (combinations: VariantCombination[]) => void;
  defaultPrice?: string;
  defaultCompareAtPrice?: string;
}

export default function VariantBuilder({
  options,
  combinations,
  onOptionsChange,
  onCombinationsChange,
  defaultPrice = '0.00',
  defaultCompareAtPrice,
}: VariantBuilderProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState('');

  // Regenerate combinations when options change
  useEffect(() => {
    if (options.length > 0) {
      const validation = validateVariantOptions(options);
      if (!validation.valid) {
        setValidationError(validation.error || null);
        return;
      }
      setValidationError(null);

      const newCombinations = generateVariantsWithDefaults(
        options,
        defaultPrice,
        defaultCompareAtPrice
      );

      // Preserve existing prices/SKUs if variant exists
      const mergedCombinations = newCombinations.map(newCombo => {
        const existingCombo = combinations.find(
          c => formatVariantTitle(c.options) === formatVariantTitle(newCombo.options)
        );
        if (existingCombo) {
          return {
            ...newCombo,
            id: existingCombo.id,
            price: existingCombo.price,
            compareAtPrice: existingCombo.compareAtPrice,
            sku: existingCombo.sku,
            inventoryQuantity: existingCombo.inventoryQuantity,
          };
        }
        return newCombo;
      });

      onCombinationsChange(mergedCombinations);
    } else {
      onCombinationsChange([]);
    }
  }, [options]);

  const addOption = () => {
    if (!newOptionName.trim()) return;
    if (options.length >= 3) {
      setValidationError('Shopify permette massimo 3 opzioni');
      return;
    }

    const newOption: VariantOption = {
      name: newOptionName.trim(),
      values: [],
    };

    onOptionsChange([...options, newOption]);
    setNewOptionName('');
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onOptionsChange(newOptions);
  };

  const addValueToOption = (optionIndex: number) => {
    const value = newValueInputs[optionIndex]?.trim();
    if (!value) return;

    const newOptions = [...options];
    if (!newOptions[optionIndex].values.includes(value)) {
      newOptions[optionIndex].values.push(value);
      onOptionsChange(newOptions);
    }

    setNewValueInputs({ ...newValueInputs, [optionIndex]: '' });
  };

  const removeValueFromOption = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.splice(valueIndex, 1);
    onOptionsChange(newOptions);
  };

  const updateCombination = (
    comboIndex: number,
    field: keyof VariantCombination,
    value: string
  ) => {
    const newCombinations = [...combinations];
    (newCombinations[comboIndex] as any)[field] = value;
    onCombinationsChange(newCombinations);
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    const newCombinations = combinations.map(combo => ({
      ...combo,
      price: bulkPrice,
    }));
    onCombinationsChange(newCombinations);
    setBulkPrice('');
  };

  const applyBulkCompareAtPrice = () => {
    if (!bulkCompareAtPrice) return;
    const newCombinations = combinations.map(combo => ({
      ...combo,
      compareAtPrice: bulkCompareAtPrice,
    }));
    onCombinationsChange(newCombinations);
    setBulkCompareAtPrice('');
  };

  return (
    <div className="space-y-6">
      {/* Options Section */}
      <div>
        <h4 className="font-semibold mb-3">Opzioni Prodotto</h4>
        <p className="text-sm text-gray-600 mb-4">
          Aggiungi fino a 3 opzioni (es. Taglia, Colore, Materiale) con i relativi valori.
        </p>

        {/* Existing Options */}
        {options.map((option, optionIndex) => (
          <div key={optionIndex} className="mb-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{option.name}</span>
              <button
                type="button"
                onClick={() => removeOption(optionIndex)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Rimuovi opzione
              </button>
            </div>

            {/* Values */}
            <div className="flex flex-wrap gap-2 mb-3">
              {option.values.map((value, valueIndex) => (
                <span
                  key={valueIndex}
                  className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValueFromOption(optionIndex, valueIndex)}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add Value Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newValueInputs[optionIndex] || ''}
                onChange={(e) =>
                  setNewValueInputs({ ...newValueInputs, [optionIndex]: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValueToOption(optionIndex);
                  }
                }}
                placeholder={`Aggiungi valore per ${option.name}...`}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => addValueToOption(optionIndex)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
              >
                Aggiungi
              </button>
            </div>
          </div>
        ))}

        {/* Add New Option */}
        {options.length < 3 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOption();
                }
              }}
              placeholder="Nome nuova opzione (es. Taglia, Colore)..."
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={addOption}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              + Aggiungi Opzione
            </button>
          </div>
        )}

        {validationError && (
          <p className="mt-2 text-red-500 text-sm">{validationError}</p>
        )}
      </div>

      {/* Combinations Section */}
      {combinations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">
              Varianti Generate ({combinations.length})
            </h4>
          </div>

          {/* Bulk Edit */}
          <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Prezzo"
                className="w-24 px-2 py-1 border rounded text-sm"
                step="0.01"
              />
              <button
                type="button"
                onClick={applyBulkPrice}
                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              >
                Applica a tutte
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={bulkCompareAtPrice}
                onChange={(e) => setBulkCompareAtPrice(e.target.value)}
                placeholder="Prezzo confronto"
                className="w-24 px-2 py-1 border rounded text-sm"
                step="0.01"
              />
              <button
                type="button"
                onClick={applyBulkCompareAtPrice}
                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              >
                Applica a tutte
              </button>
            </div>
          </div>

          {/* Combinations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">Variante</th>
                  <th className="px-3 py-2 text-left">Prezzo (€)</th>
                  <th className="px-3 py-2 text-left">Prezzo Confronto (€)</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combo, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2 font-medium">
                      {formatVariantTitle(combo.options)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={combo.price}
                        onChange={(e) => updateCombination(index, 'price', e.target.value)}
                        className="w-24 px-2 py-1 border rounded"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={combo.compareAtPrice || ''}
                        onChange={(e) =>
                          updateCombination(index, 'compareAtPrice', e.target.value)
                        }
                        className="w-24 px-2 py-1 border rounded"
                        step="0.01"
                        placeholder="Opzionale"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={combo.sku || ''}
                        onChange={(e) => updateCombination(index, 'sku', e.target.value)}
                        className="w-32 px-2 py-1 border rounded"
                        placeholder="SKU"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {options.length === 0 && (
        <p className="text-gray-500 text-sm italic">
          Nessuna variante. Aggiungi opzioni per creare varianti del prodotto.
        </p>
      )}
    </div>
  );
}
