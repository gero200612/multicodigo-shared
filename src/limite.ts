/**
 * El cartel de "te quedaste sin tokens", tal como lo escribe Anthropic.
 *
 * ## Por que vive en el paquete compartido
 *
 * Esto empezo dentro del agente, que es donde se detecta primero. El 2026-09-02
 * un turno de c2 se cerro con `status=done` y esta respuesta:
 *
 *   "You're out of extra usage · resets 1:30am (UTC)"
 *
 * El agente no la reconocio —era una redaccion que no estaba en su lista— asi
 * que la devolvio como una respuesta valida. El bridge la guardo, se la mando
 * al usuario en ingles, y sobre todo NO relevo: el relevo cuelga del codigo
 * `usage_limit`, que nunca se genero.
 *
 * La leccion no es "faltaba una frase". Es que habia UN solo lugar donde el
 * aviso se podia reconocer, y si ese fallaba nadie mas miraba. Por eso ahora
 * vive aca: el agente lo usa para no devolver el cartel como respuesta, y el
 * bridge lo usa como red antes de dar una respuesta por buena. Dos capas que
 * comparten la definicion, en vez de dos copias que se van separando.
 */

/**
 * `true` si el texto es el cartel del limite y no una respuesta de trabajo.
 *
 * La distincion importa y es lo que hace dificil a esta funcion: el agente
 * PROGRAMA, asi que "agregue un rate limit al endpoint" es una respuesta buena
 * de todos los dias. Un falso positivo cambia de slot cuando el agente estaba
 * contestando bien, y eso es peor que no detectar el cartel.
 *
 * Por eso ninguna palabra suelta alcanza. Se reconoce de dos formas:
 *
 *  1. Por frase, anclada al PRINCIPIO. El cartel es todo lo que Anthropic
 *     devuelve; una respuesta que lo mencione lo hace en medio de otra cosa.
 *  2. Por FORMA: una linea corta que termina en `· resets <hora>`. Ese
 *     separador con `resets` no aparece en una respuesta de trabajo, y es lo
 *     que hace que la sexta redaccion tambien caiga sin tener que agregarla.
 */
export function esAvisoDeLimite(texto: string): boolean {
  const t = texto.toLowerCase().trim();

  const porFrase =
    /^you'?ve hit your (usage )?limit/.test(t) ||
    /^you have hit your (usage )?limit/.test(t) ||
    /^claude usage limit reached/.test(t) ||
    /^you'?ve reached your (usage )?limit/.test(t) ||
    // La que faltaba, vista en produccion. El saldo extra es otra bolsa que la
    // ventana de uso, y se agota con su propio cartel.
    /^you'?re out of (extra )?usage/.test(t) ||
    /^you have run out of (extra )?usage/.test(t);

  // El tope de largo es lo que separa "el cartel" de "una respuesta que
  // casualmente lo cita". El cartel es una linea.
  const porForma = t.length <= LARGO_DEL_CARTEL && /[·\-—]\s*resets\s+\d/.test(t);

  return porFrase || porForma;
}

/** Un cartel es una linea; una respuesta del agente, no. */
const LARGO_DEL_CARTEL = 200;

/**
 * Cuando vuelve la cuenta, tal como lo dice el cartel.
 *
 * Devuelve el texto crudo ("1:30am (UTC)") y no una fecha: el cartel dice la
 * hora y NO el dia, asi que armar un `Date` obliga a adivinar si es hoy o
 * mañana. Adivinar mal muestra "vuelve ayer", que es peor que mostrar la hora
 * tal como llego — con su `(UTC)` incluido, que al menos dice de que zona es.
 */
export function horaDeReset(texto: string): string | undefined {
  const m = /resets\s+([^\n·]{1,40})/i.exec(texto);
  return m?.[1]?.trim() || undefined;
}
