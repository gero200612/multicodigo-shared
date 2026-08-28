/**
 * Reemplaza cada bloque de codigo cercado por una nota en prosa.
 * Es la ultima linea de defensa: el system prompt ya le pide al agente no
 * pegar codigo, pero si lo pega igual, esto lo saca antes de Telegram.
 */
export declare function sanitizeForTelegram(text: string): string;
