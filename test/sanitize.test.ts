import { describe, it, expect } from 'vitest';
import { sanitizeForTelegram } from '../src/sanitize.js';

describe('sanitizeForTelegram', () => {
  it('deja pasar prosa sin cambios', () => {
    expect(sanitizeForTelegram('El servicio de stock valida los lotes.')).toBe(
      'El servicio de stock valida los lotes.',
    );
  });

  it('colapsa un bloque de codigo contando sus lineas', () => {
    const input = 'Mira esto:\n```ts\nconst a = 1;\nconst b = 2;\n```\nY listo.';
    expect(sanitizeForTelegram(input)).toBe(
      'Mira esto:\n«codigo omitido — 2 lineas»\nY listo.',
    );
  });

  it('colapsa un bloque sin etiqueta de lenguaje', () => {
    expect(sanitizeForTelegram('```\nfoo\n```')).toBe('«codigo omitido — 1 linea»');
  });

  it('usa singular con una sola linea', () => {
    expect(sanitizeForTelegram('```js\nx\n```')).toContain('1 linea»');
  });

  it('colapsa varios bloques por separado', () => {
    const input = '```\na\n```\ntexto\n```\nb\nc\n```';
    expect(sanitizeForTelegram(input)).toBe(
      '«codigo omitido — 1 linea»\ntexto\n«codigo omitido — 2 lineas»',
    );
  });

  it('colapsa un bloque sin cerrar hasta el final', () => {
    expect(sanitizeForTelegram('texto\n```py\nimport os\nprint(1)')).toBe(
      'texto\n«codigo omitido — 2 lineas»',
    );
  });

  it('preserva codigo inline de un solo backtick', () => {
    const input = 'Toca `src/stock/lote.ts` en la linea 44.';
    expect(sanitizeForTelegram(input)).toBe(input);
  });

  it('ignora bloques vacios', () => {
    expect(sanitizeForTelegram('```\n```')).toBe('«codigo omitido — 0 lineas»');
  });
});
