import { describe, expect, it } from 'vitest';
import { esAvisoDeLimite, horaDeReset } from '../src/limite.js';

describe('esAvisoDeLimite', () => {
  it('reconoce el cartel que se colo en produccion', () => {
    // La fila real: jobs, 2026-09-02T01:14:13Z, c2/sincro, status=done. Se
    // guardo como una respuesta valida, llego al chat en ingles, y no hubo
    // relevo. Es el caso que motivo todo este modulo.
    expect(esAvisoDeLimite("You're out of extra usage · resets 1:30am (UTC)")).toBe(true);
  });

  it('sigue reconociendo las redacciones que ya conocia', () => {
    for (const t of [
      "You've hit your limit · resets 10:50pm (UTC)",
      'You have hit your usage limit',
      'Claude usage limit reached',
      "You've reached your limit",
    ]) {
      expect(esAvisoDeLimite(t), t).toBe(true);
    }
  });

  it('reconoce por la FORMA una redaccion que nadie escribio todavia', () => {
    // El punto de la regla estructural: que la proxima variante no necesite un
    // deploy. Esta frase no esta en ninguna lista.
    expect(esAvisoDeLimite('Your weekly allowance is spent · resets 9:00am (UTC)')).toBe(true);
  });

  it('NO confunde una respuesta de trabajo que habla de limites', () => {
    // El falso positivo es el error caro: cambia de slot cuando el agente
    // estaba contestando bien. El agente programa, y esto es prosa normal.
    for (const t of [
      'Agregue un rate limit al endpoint de login, en src/api/login.ts:44.',
      'El limite de 20 MB esta declarado en dos lugares y explico por que.',
      'Revise el codigo: no encontre nada que resetea el contador de usage.',
    ]) {
      expect(esAvisoDeLimite(t), t).toBe(false);
    }
  });

  it('NO toma por cartel una respuesta larga que lo cita', () => {
    // Misma forma, pero es un informe. El largo es lo que los separa.
    const largo =
      'Estuve mirando el historial de turnos y encontre esto: ' +
      'la respuesta que quedo guardada era "You are out of extra usage · resets 1:30am (UTC)", ' +
      'o sea que el aviso de Anthropic se guardo como si fuera una respuesta del modelo. ' +
      'Lo que hay que arreglar esta en el agente, en la funcion que reconoce el cartel, ' +
      'porque esa redaccion no estaba en su lista de frases conocidas.';
    expect(largo.length).toBeGreaterThan(200);
    expect(esAvisoDeLimite(largo)).toBe(false);
  });

  it('ignora mayusculas y espacios de los bordes', () => {
    expect(esAvisoDeLimite('  YOU\'VE HIT YOUR LIMIT  ')).toBe(true);
  });
});

describe('horaDeReset', () => {
  it('saca la hora del cartel', () => {
    expect(horaDeReset("You're out of extra usage · resets 1:30am (UTC)")).toBe('1:30am (UTC)');
  });

  it('devuelve undefined cuando el aviso no la trae', () => {
    expect(horaDeReset('Claude usage limit reached')).toBeUndefined();
  });
});
