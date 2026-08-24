const FENCED_BLOCK = /```[^\n]*\n?([\s\S]*?)(?:```|$)/g;

function countLines(body: string): number {
  const trimmed = body.replace(/\n+$/, '');
  if (trimmed === '') return 0;
  return trimmed.split('\n').length;
}

/**
 * Reemplaza cada bloque de codigo cercado por una nota en prosa.
 * Es la ultima linea de defensa: el system prompt ya le pide al agente no
 * pegar codigo, pero si lo pega igual, esto lo saca antes de Telegram.
 */
export function sanitizeForTelegram(text: string): string {
  return text.replace(FENCED_BLOCK, (_match, body: string) => {
    const n = countLines(body);
    const unidad = n === 1 ? 'linea' : 'lineas';
    return `«codigo omitido — ${n} ${unidad}»`;
  });
}
