/**
 * Reemplaza cada bloque de codigo cercado por una nota en prosa.
 * Es la ultima linea de defensa: el system prompt ya le pide al agente no
 * pegar codigo, pero si lo pega igual, esto lo saca antes de Telegram.
 */
export function sanitizeForTelegram(text) {
    const lines = text.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeBlockLines = [];
    for (const line of lines) {
        // Check if this line is a fence by looking at the trimmed content (allows indented fences)
        // but we preserve the original line in output to maintain indentation structure
        const trimmedLine = line.trim();
        const isFence = trimmedLine.startsWith('```') && !trimmedLine.slice(3).includes('```');
        if (isFence) {
            if (inCodeBlock) {
                // Closing fence
                const n = codeBlockLines.length;
                const unidad = n === 1 ? 'linea' : 'lineas';
                result.push(`«codigo omitido — ${n} ${unidad}»`);
                inCodeBlock = false;
                codeBlockLines = [];
            }
            else {
                // Opening fence
                inCodeBlock = true;
            }
        }
        else if (inCodeBlock) {
            codeBlockLines.push(line);
        }
        else {
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
//# sourceMappingURL=sanitize.js.map