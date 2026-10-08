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
export declare const MAX_DOCUMENTOS_POR_TURNO = 500;
/** Un documento del proyecto tal como viaja en un turno: una RUTA, no el archivo. */
export declare const DocumentoDelTurno: z.ZodObject<{
    nombre: z.ZodString;
    ruta: z.ZodString;
    ruta_texto: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    es_instruccion: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    ruta: string;
    ruta_texto?: string | null | undefined;
    es_instruccion?: boolean | null | undefined;
}, {
    nombre: string;
    ruta: string;
    ruta_texto?: string | null | undefined;
    es_instruccion?: boolean | null | undefined;
}>;
export type DocumentoDelTurno = z.infer<typeof DocumentoDelTurno>;
export declare const DocumentosDelTurno: z.ZodArray<z.ZodObject<{
    nombre: z.ZodString;
    ruta: z.ZodString;
    ruta_texto: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    es_instruccion: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    ruta: string;
    ruta_texto?: string | null | undefined;
    es_instruccion?: boolean | null | undefined;
}, {
    nombre: string;
    ruta: string;
    ruta_texto?: string | null | undefined;
    es_instruccion?: boolean | null | undefined;
}>, "many">;
export declare const SERVICIOS_QUE_REPORTAN: readonly ["panel", "bridge", "gateway", "homero", "deploy"];
export type ServicioQueReporta = (typeof SERVICIOS_QUE_REPORTAN)[number];
/** El cuerpo de `POST /interno/errores`. */
export declare const ReporteDeError: z.ZodObject<{
    servicio: z.ZodEnum<["panel", "bridge", "gateway", "homero", "deploy"]>;
    codigo: z.ZodString;
    mensaje: z.ZodString;
    /** Lo que mismo bug repetido comparte: ver `huellaDe`. */
    huella: z.ZodString;
    detalle: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    proyectoId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    usuarioId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    servicio: "panel" | "bridge" | "gateway" | "homero" | "deploy";
    codigo: string;
    mensaje: string;
    huella: string;
    detalle?: Record<string, unknown> | null | undefined;
    proyectoId?: string | null | undefined;
    usuarioId?: string | null | undefined;
}, {
    servicio: "panel" | "bridge" | "gateway" | "homero" | "deploy";
    codigo: string;
    mensaje: string;
    huella: string;
    detalle?: Record<string, unknown> | null | undefined;
    proyectoId?: string | null | undefined;
    usuarioId?: string | null | undefined;
}>;
export type ReporteDeError = z.infer<typeof ReporteDeError>;
/**
 * `servicio|codigo|distintivo`. El distintivo es lo que separa dos bugs con el
 * mismo codigo: los paths de una validacion, la primera linea de un stack.
 */
export declare function huellaDe(servicio: ServicioQueReporta, codigo: string, distintivo?: string): string;
/**
 * Lo que distingue un crash de otro: el mensaje y el primer frame, SIN numeros
 * de linea ni columna. Con ellos, cada deploy que mueve una linea abriria una
 * fila nueva para el mismo bug.
 */
export declare function distintivoDeError(err: unknown): string;
/** Los issues de zod como `campo:codigo`, para la huella y para el detalle. */
export declare function pathsDeZod(error: z.ZodError): string[];
export interface DestinoDeReportes {
    /** La URL del bridge, sin `/interno/errores`. */
    url: string;
    token: string;
    fetchImpl?: typeof fetch;
}
/**
 * Le avisa al bridge. NUNCA tira y nunca tarda mas de 3 s: un reporte que
 * falla no puede romper ni demorar lo que estaba fallando. Devuelve el id del
 * error cuando el bridge lo registro, para mostrarselo al usuario.
 */
export declare function reportarError(destino: DestinoDeReportes, reporte: ReporteDeError): Promise<number | undefined>;
/**
 * Reporta los crashes del proceso antes de morir. El comportamiento no cambia
 * —sale con 1, como sin el handler— pero queda rastro: el 2026-10-08 Homero se
 * cayo por un timeout del IMAP y solo se supo leyendo `docker logs`.
 */
export declare function reportarCrashes(servicio: ServicioQueReporta, reportar: (r: ReporteDeError) => Promise<unknown>, salir?: (codigo: number) => void): void;
