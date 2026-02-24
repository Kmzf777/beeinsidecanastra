'use client';

import { useEffect, useRef, useState } from 'react';

export interface AliquotaPreviewProduct {
  name: string;
  price: number; // valorUnitario
}

interface AliquotaInputProps {
  value: string;
  onChange: (value: string) => void;
  previewProduct: AliquotaPreviewProduct | null;
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function parseAliquota(raw: string): number | null {
  const n = parseFloat(raw.replace(',', '.'));
  if (isNaN(n)) return null;
  return n;
}

export function AliquotaInput({ value, onChange, previewProduct }: AliquotaInputProps) {
  const [preview, setPreview] = useState<{ imposto: number; liquido: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = parseAliquota(value);
  const isValid = parsed !== null && parsed >= 0 && parsed <= 100;
  const showError = value !== '' && !isValid;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (isValid && previewProduct) {
        const price = previewProduct.price;
        const imposto = Math.round(price * (parsed! / 100) * 100) / 100;
        const liquido = Math.round((price - imposto) * 100) / 100;
        setPreview({ imposto, liquido });
      } else {
        setPreview(null);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, isValid, parsed, previewProduct]);

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="aliquota-input"
          className="block text-sm font-medium text-zinc-700"
        >
          Alíquota de Imposto (%)
        </label>
        <p className="mt-0.5 text-xs text-zinc-400">Ex: 6 para Simples Nacional 6%</p>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            id="aliquota-input"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.01}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            aria-describedby={showError ? 'aliquota-error' : undefined}
            aria-invalid={showError}
            className={[
              'w-40 rounded-lg border px-3 py-2 text-sm text-zinc-900 outline-none',
              'focus:ring-2 focus:ring-amber-400',
              showError
                ? 'border-red-400 bg-red-50 focus:ring-red-300'
                : 'border-zinc-300 bg-white',
            ].join(' ')}
          />
          <span className="text-sm text-zinc-500">%</span>
        </div>

        {showError && (
          <p
            id="aliquota-error"
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            A alíquota deve ser entre 0% e 100%
          </p>
        )}
      </div>

      {previewProduct && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Preview de impacto
          </p>
          {preview ? (
            <p className="mt-1 text-sm text-zinc-700" data-testid="preview-text">
              <span className="font-medium">{previewProduct.name}</span>
              {' — '}Preço {formatBRL(previewProduct.price)}
              {' → '}Imposto {formatBRL(preview.imposto)}
              {' → '}Preço líquido {formatBRL(preview.liquido)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400" data-testid="preview-placeholder">
              Digite uma alíquota válida para ver o preview.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
