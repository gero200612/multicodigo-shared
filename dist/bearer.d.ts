/**
 * Compara un header `Authorization: Bearer <token>` contra el esperado.
 *
 * Vivia en el gateway. Se movio a shared cuando el servicio de login —que es el
 * unico escritor de /srv/creds— tambien lo necesito: una segunda copia de una
 * comparacion timing-safe es una copia que alguien va a "simplificar" a `===`.
 */
export declare function isTokenValid(header: string | undefined, expected: string): boolean;
