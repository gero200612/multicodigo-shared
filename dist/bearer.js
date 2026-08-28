import { timingSafeEqual } from 'node:crypto';
/**
 * Compara un header `Authorization: Bearer <token>` contra el esperado.
 *
 * Vivia en el gateway. Se movio a shared cuando el servicio de login —que es el
 * unico escritor de /srv/creds— tambien lo necesito: una segunda copia de una
 * comparacion timing-safe es una copia que alguien va a "simplificar" a `===`.
 */
export function isTokenValid(header, expected) {
    if (!header?.startsWith('Bearer '))
        return false;
    const given = Buffer.from(header.slice('Bearer '.length));
    const want = Buffer.from(expected);
    // timingSafeEqual tira si los largos difieren; comparar largos primero filtra
    // el caso trivial y no revela nada mas que el largo, que no es secreto.
    if (given.length !== want.length)
        return false;
    return timingSafeEqual(given, want);
}
//# sourceMappingURL=bearer.js.map