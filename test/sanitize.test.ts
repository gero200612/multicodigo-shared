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

  it('no trata triple backtick inline como fence (repro del bug de anclaje)', () => {
    const input = 'Antes ```x``` despues\n```\ny\n```';
    const output = sanitizeForTelegram(input);
    // La línea 'y' no debe escapar sin colapsar — debe estar dentro del marcador
    expect(output).not.toContain('\ny\n');
    // Debe haber exactamente una línea de código colapsada (la real con 'y')
    expect(output).toContain('«codigo omitido — 1 linea»');
    // El texto inline ``` no debe tratarse como cerca
    expect(output).toContain('Antes ```x``` despues');
  });

  it('preserva triple backtick inline seguido de prosa (sin cerrar)', () => {
    const input = '```x``` despues';
    expect(sanitizeForTelegram(input)).toBe(input);
  });

  it('maneja CRLF correctamente en countLines', () => {
    const input = '```\r\nfoo\r\nbar\r\n```';
    const output = sanitizeForTelegram(input);
    expect(output).toContain('2 lineas»');
  });

  it('colapsa bloques con fences indentadas (en listas)', () => {
    const input = '1. Item\n  ```\n  code\n  ```\n2. Next';
    const output = sanitizeForTelegram(input);
    // No code line should appear
    expect(output).not.toContain('code');
    // Should have exactly one collapsed marker
    expect((output.match(/«codigo omitido/g) || []).length).toBe(1);
    // Should preserve list structure
    expect(output).toContain('1. Item');
    expect(output).toContain('2. Next');
  });

  it('colapsa bloques con ambas fences indentadas (anidadas)', () => {
    const input = '  ```\n  nested code line 1\n  nested code line 2\n  ```';
    const output = sanitizeForTelegram(input);
    // No code line should appear
    expect(output).not.toContain('nested code');
    // Should have collapsed marker
    expect(output).toContain('«codigo omitido — 2 lineas»');
  });
});
