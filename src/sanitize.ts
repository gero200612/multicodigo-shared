/**
 * Reemplaza cada bloque de codigo cercado por una nota en prosa.
 * Es la ultima linea de defensa: el system prompt ya le pide al agente no
 * pegar codigo, pero si lo pega igual, esto lo saca antes de Telegram.
 */
export function sanitizeForTelegram(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (const line of lines) {
    // A fence is a line starting with ``` with no backticks in the rest (prevents matching inline pairs)
    const isFence = line.startsWith('```') && !line.slice(3).includes('```');

    if (isFence) {
      if (inCodeBlock) {
        // Closing fence
        const n = codeBlockLines.length;
        const unidad = n === 1 ? 'linea' : 'lineas';
        result.push(`«codigo omitido — ${n} ${unidad}»`);
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        // Opening fence
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      codeBlockLines.push(line);
    } else {
      result.push(line);
    }
  }

  if (inCodeBlock) {
    // Unclosed fence - output the collapsed block
    const n = codeBlockLines.length;
    const unidad = n === 1 ? 'linea' : 'lineas';
    result.push(`«codigo omitido — ${n} ${unidad}»`);
  }

  return result.join('\n');
}
