import { z } from 'zod';
/**
 * El registro de errores: lo que cada servicio le manda al bridge cuando algo
 * falla, y los topes del turno que antes vivian repetidos en el bridge y en el
 * gateway (y por eso se desincronizaron: ver
 * `multicodigo-back/docs/superpowers/specs/2026-10-08-registro-de-errores-design.md`).
 */
/**
 * Documentos por turno. Eran 50 en el bridge y 50 en el gateway, cada uno por
 * su lado, y un proyecto con mas no podia mandar ni un ticket: las capturas del
 * analisis funcional se guardan como documentos y se juntan rapido.
 */
export const MAX_DOCUMENTOS_POR_TURNO = 500;
/** Un documento del proyecto tal como viaja en un turno: una RUTA, no el archivo. */
export const DocumentoDelTurno = z.object({
    nombre: z.string().regex(/^[A-Za-z0-9._-]+$/).max(200),
    ruta: z.string().min(1).max(500),
    // El panel (C#) manda los vacios como `null`: nullish y no optional.
    ruta_texto: z.string().min(1).max(500).nullish(),
    es_instruccion: z.boolean().nullish(),
});
export const DocumentosDelTurno = z.array(DocumentoDelTurno).max(MAX_DOCUMENTOS_POR_TURNO);
export const SERVICIOS_QUE_REPORTAN = ['panel', 'bridge', 'gateway', 'homero', 'deploy'];
/** El cuerpo de `POST /interno/errores`. */
export const ReporteDeError = z.object({
    servicio: z.enum(SERVICIOS_QUE_REPORTAN),
    codigo: z.string().min(1).max(100),
    mensaje: z.string().min(1).max(500),
    /** Lo que mismo bug repetido comparte: ver `huellaDe`. */
    huella: z.string().min(1).max(500),
    detalle: z.record(z.unknown()).nullish(),
    proyectoId: z.string().uuid().nullish(),
    usuarioId: z.string().uuid().nullish(),
});
/**
 * `servicio|codigo|distintivo`. El distintivo es lo que separa dos bugs con el
 * mismo codigo: los paths de una validacion, la primera linea de un stack.
 */
export function huellaDe(servicio, codigo, distintivo = '') {
    return `${servicio}|${codigo}|${distintivo}`.slice(0, 500);
}
/**
 * Lo que distingue un crash de otro: el mensaje y el primer frame, SIN numeros
 * de linea ni columna. Con ellos, cada deploy que mueve una linea abriria una
 * fila nueva para el mismo bug.
 */
export function distintivoDeError(err) {
    if (!(err instanceof Error))
        return String(err).slice(0, 200);
    const frame = (err.stack ?? '').split('\n').find((l) => l.trim().startsWith('at ')) ?? '';
    const sinLineas = frame.trim().replace(/:\d+:\d+\)?$/, '').replace(/\(?file:\/\/\S*\/(?=[^/]+$)/, '');
    return `${err.name}: ${err.message.replace(/\d+/g, 'N')}`.slice(0, 200) + (sinLineas ? ` @ ${sinLineas}` : '');
}
/** Los issues de zod como `campo:codigo`, para la huella y para el detalle. */
export function pathsDeZod(error) {
    return error.issues.map((i) => `${i.path.join('.') || '(raiz)'}:${i.code}`);
}
/**
 * Le avisa al bridge. NUNCA tira y nunca tarda mas de 3 s: un reporte que
 * falla no puede romper ni demorar lo que estaba fallando. Devuelve el id del
 * error cuando el bridge lo registro, para mostrarselo al usuario.
 */
export async function reportarError(destino, reporte) {
    try {
        const r = await (destino.fetchImpl ?? fetch)(`${destino.url.replace(/\/$/, '')}/interno/errores`, {
            method: 'POST',
            signal: AbortSignal.timeout(3_000),
            headers: { 'content-type': 'application/json', authorization: `Bearer ${destino.token}` },
            body: JSON.stringify(reporte),
        });
        if (!r.ok) {
            console.error(`[errores] el bridge no registro el error (${r.status})`);
            return undefined;
        }
        const cuerpo = (await r.json());
        return typeof cuerpo.id === 'number' ? cuerpo.id : undefined;
    }
    catch (err) {
        console.error('[errores] no se pudo reportar:', err instanceof Error ? err.message : err);
        return undefined;
    }
}
/**
 * Reporta los crashes del proceso antes de morir. El comportamiento no cambia
 * —sale con 1, como sin el handler— pero queda rastro: el 2026-10-08 Homero se
 * cayo por un timeout del IMAP y solo se supo leyendo `docker logs`.
 */
export function reportarCrashes(servicio, reportar, salir = (c) => process.exit(c)) {
    const alMorir = (origen) => (err) => {
        console.error(`[${servicio}] ${origen}:`, err);
        const mensaje = err instanceof Error ? err.message : String(err);
        void Promise.resolve(reportar({
            servicio,
            codigo: 'crash',
            mensaje: `El proceso se cayó: ${mensaje}`.slice(0, 500),
            huella: huellaDe(servicio, 'crash', distintivoDeError(err)),
            detalle: { origen, stack: err instanceof Error ? (err.stack ?? '').slice(0, 8_000) : String(err) },
        }))
            .catch(() => undefined)
            .finally(() => salir(1));
    };
    process.on('uncaughtException', alMorir('uncaughtException'));
    process.on('unhandledRejection', alMorir('unhandledRejection'));
}
//# sourceMappingURL=errores.js.map