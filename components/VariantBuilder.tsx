'use client';

import { useState, useEffect, useRef } from 'react';
import { VariantOption, VariantCombination, ProductImage } from '@/types/shopify';
import { generateVariantsWithDefaults, validateVariantOptions, formatVariantTitle } from '@/lib/variants';

interface VariantBuilderProps {
  options: VariantOption[];
  combinations: VariantCombination[];
  onOptionsChange: (options: VariantOption[]) => void;
  onCombinationsChange: (combinations: VariantCombination[]) => void;
  defaultPrice?: string;
  defaultCompareAtPrice?: string;
  availableImages?: ProductImage[];
}

// Map: optionValue -> { imageId, imageUrl }
type ValueImageMap = Record<string, { imageId: string; imageUrl: string }>;

export default function VariantBuilder({
  options,
  combinations,
  onOptionsChange,
  onCombinationsChange,
  defaultPrice = '0.00',
  defaultCompareAtPrice,
  availableImages = [],
}: VariantBuilderProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState('');

  // Image assignment: which option to use for images
  const [imageOptionIndex, setImageOptionIndex] = useState<number | null>(null);
  const [valueImages, setValueImages] = useState<ValueImageMap>({});
  const [openImageSelector, setOpenImageSelector] = useState<string | null>(null);
  const imageSelectorRef = useRef<HTMLDivElement>(null);

  // Close image selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageSelectorRef.current && !imageSelectorRef.current.contains(event.target as Node)) {
        setOpenImageSelector(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setImageOptionIndex(null);
      setValueImages({});
    }
  }, [options]);

  // Apply images to combinations when valueImages or imageOptionIndex changes
  useEffect(() => {
    if (combinations.length === 0 || imageOptionIndex === null) return;

    const selectedOption = options[imageOptionIndex];
    if (!selectedOption) return;

    const updatedCombinations = combinations.map(combo => {
      const optionValue = combo.options[selectedOption.name];
      const imageData = valueImages[optionValue];

      if (imageData?.imageUrl) {
        return {
          ...combo,
          imageId: imageData.imageId || imageData.imageUrl, // Use URL as fallback ID
          imageUrl: imageData.imageUrl,
        };
      }
      return {
        ...combo,
        imageId: undefined,
        imageUrl: undefined,
      };
    });

    // Only update if changed
    const hasChanges = updatedCombinations.some((combo, i) =>
      combo.imageUrl !== combinations[i]?.imageUrl
    );

    if (hasChanges) {
      onCombinationsChange(updatedCombinations);
    }
  }, [valueImages, imageOptionIndex]);

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

    // Reset image option if removed
    if (imageOptionIndex === index) {
      setImageOptionIndex(null);
      setValueImages({});
    } else if (imageOptionIndex !== null && imageOptionIndex > index) {
      setImageOptionIndex(imageOptionIndex - 1);
    }
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
    const removedValue = newOptions[optionIndex].values[valueIndex];

    // Remove associated image if this is the image option
    if (imageOptionIndex === optionIndex && valueImages[removedValue]) {
      const newValueImages = { ...valueImages };
      delete newValueImages[removedValue];
      setValueImages(newValueImages);
    }

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

  const setImageForValue = (value: string, imageId: string, imageUrl: string) => {
    if (imageId) {
      setValueImages(prev => ({
        ...prev,
        [value]: { imageId, imageUrl }
      }));
    } else {
      setValueImages(prev => {
        const newMap = { ...prev };
        delete newMap[value];
        return newMap;
      });
    }
    setOpenImageSelector(null);
  };

  const selectedImageOption = imageOptionIndex !== null ? options[imageOptionIndex] : null;

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

          {/* Image Assignment Section */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-3">Assegna Immagini per Opzione</h5>

            {/* Option Selector */}
            <div className="mb-4">
              <label className="block text-sm text-blue-700 mb-2">
                Seleziona l'opzione per le immagini:
              </label>
              <select
                value={imageOptionIndex ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setImageOptionIndex(val === '' ? null : parseInt(val));
                  setValueImages({});
                  setOpenImageSelector(null);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Nessuna (non assegnare immagini)</option>
                {options.map((opt, index) => (
                  <option key={index} value={index}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Image Assignment */}
            {selectedImageOption && selectedImageOption.values.length > 0 && (
              <div>
                <label className="block text-sm text-blue-700 mb-2">
                  Assegna immagine a ogni valore di "{selectedImageOption.name}":
                </label>
                <div className="space-y-2">
                  {selectedImageOption.values.map((value) => {
                    const valueImage = valueImages[value];

                    return (
                      <div
                        key={value}
                        className="flex items-center gap-3 p-2 bg-white rounded border"
                      >
                        <span className="font-medium text-sm min-w-[80px]">{value}</span>

                        <div className="relative" ref={openImageSelector === value ? imageSelectorRef : undefined}>
                          <button
                            type="button"
                            onClick={() => setOpenImageSelector(openImageSelector === value ? null : value)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                              valueImage
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {valueImage ? (
                              <>
                                <img src={valueImage.imageUrl} alt="" className="w-6 h-6 object-cover rounded" />
                                <span>Cambia</span>
                              </>
                            ) : (
                              <>📷 Scegli</>
                            )}
                          </button>

                          {/* Image Dropdown */}
                          {openImageSelector === value && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[280px]">
                              {availableImages.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                                  {/* Remove image option */}
                                  <button
                                    type="button"
                                    onClick={() => setImageForValue(value, '', '')}
                                    className={`w-14 h-14 border-2 rounded flex items-center justify-center ${
                                      !valueImage ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    title="Rimuovi immagine"
                                  >
                                    <span className="text-gray-400 text-lg">✕</span>
                                  </button>

                                  {availableImages.map((img, imgIndex) => {
                                    // Use id if available, otherwise use url as identifier
                                    const imgIdentifier = img.id || img.url || '';
                                    const isSelected = valueImage?.imageId === imgIdentifier || valueImage?.imageUrl === img.url;

                                    return (
                                      <button
                                        key={imgIdentifier || imgIndex}
                                        type="button"
                                        onClick={() => setImageForValue(value, imgIdentifier, img.url || '')}
                                        className={`w-14 h-14 border-2 rounded overflow-hidden ${
                                          isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <img
                                          src={img.url}
                                          alt={`Img ${imgIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 p-2 text-center">
                                  Carica prima delle immagini nella galleria prodotto
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Success indicator */}
                        {valueImage && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            ✓ Immagine selezionata
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Combinations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">Variante</th>
                  <th className="px-3 py-2 text-left">Img</th>
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
                      {combo.imageUrl ? (
                        <img
                          src={combo.imageUrl}
                          alt=""
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
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
