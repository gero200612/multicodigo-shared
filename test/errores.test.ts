import { describe, expect, it, vi } from 'vitest';
import {
  distintivoDeError,
  DocumentosDelTurno,
  huellaDe,
  MAX_DOCUMENTOS_POR_TURNO,
  pathsDeZod,
  reportarError,
  type ReporteDeError,
} from '../src/errores.js';

const reporte: ReporteDeError = { servicio: 'bridge', codigo: 'x', mensaje: 'algo', huella: 'bridge|x|' };

describe('DocumentosDelTurno', () => {
  const doc = (i: number) => ({ nombre: `d-${i}.pdf`, ruta: `p/d-${i}.pdf` });

  it('acepta mas de 50 y hasta el tope', () => {
    expect(DocumentosDelTurno.safeParse(Array.from({ length: MAX_DOCUMENTOS_POR_TURNO }, (_, i) => doc(i))).success).toBe(true);
    expect(DocumentosDelTurno.safeParse(Array.from({ length: MAX_DOCUMENTOS_POR_TURNO + 1 }, (_, i) => doc(i))).success).toBe(false);
  });

  it('acepta los vacios en null, como los manda el panel', () => {
    expect(DocumentosDelTurno.safeParse([{ ...doc(1), ruta_texto: null, es_instruccion: null }]).success).toBe(true);
  });

  it('rechaza un nombre con barras', () => {
    expect(DocumentosDelTurno.safeParse([{ nombre: '../x', ruta: 'p/x' }]).success).toBe(false);
  });

  it('pathsDeZod nombra el campo y el motivo', () => {
    const r = DocumentosDelTurno.safeParse(Array.from({ length: 501 }, (_, i) => doc(i)));
    expect(r.success).toBe(false);
    if (!r.success) expect(pathsDeZod(r.error)).toEqual(['(raiz):too_big']);
  });
});

describe('huella', () => {
  it('es servicio|codigo|distintivo', () => {
    expect(huellaDe('gateway', 'internal', 'documentos:too_big')).toBe('gateway|internal|documentos:too_big');
  });

  it('el mismo error en otra linea da el mismo distintivo', () => {
    const a = new Error('read ETIMEDOUT 123');
    a.stack = 'Error: read ETIMEDOUT 123\n    at leer (file:///app/dist/bandeja.js:10:5)';
    const b = new Error('read ETIMEDOUT 456');
    b.stack = 'Error: read ETIMEDOUT 456\n    at leer (file:///app/dist/bandeja.js:99:12)';
    expect(distintivoDeError(a)).toBe(distintivoDeError(b));
    expect(distintivoDeError(a)).toContain('leer');
  });
});

describe('reportarError', () => {
  it('devuelve el id que registro el bridge', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 42 }), { status: 200 }));
    expect(await reportarError({ url: 'http://bridge:3000/', token: 't', fetchImpl: fetchImpl as unknown as typeof fetch }, reporte)).toBe(42);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://bridge:3000/interno/errores');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer t');
  });

  it('con el bridge caido no tira', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(reportarError({ url: 'http://b', token: 't', fetchImpl: fetchImpl as unknown as typeof fetch }, reporte)).resolves.toBeUndefined();
    err.mockRestore();
  });
});
