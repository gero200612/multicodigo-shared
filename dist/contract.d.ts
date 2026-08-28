import { z } from 'zod';
/**
 * El identificador de un slot de agente.
 *
 * Era `z.enum(['c1','c2'])`. Dejo de ser una lista cerrada porque el pool se
 * declara en el compose y en el entorno, no en el codigo: sumar un agente no
 * puede ser un cambio en el paquete compartido.
 *
 * Se valida la FORMA, no la existencia. Que el slot exista lo contesta
 * `loadAgentUrls` en el gateway, que descubre los `AGENT_<ID>_URL` del entorno.
 *
 * El regex no es cosmetico. Al abrir el enum se pierde una garantia que daba el
 * compilador, y esto la repone: el gateway construye `claude/${agent}/` para la
 * rama y hace `agentUrls[agent]`, asi que un string libre aca seria inyeccion de
 * path. Ancla a los dos extremos (`^`/`$`) para que no entren saltos de linea
 * ni espacios al final, prohibe el cero a la izquierda y el slot cero para que
 * no haya dos strings distintos que signifiquen el mismo slot, y se queda en dos
 * digitos porque el limite real es la RAM del host, no el nombre.
 */
export declare const AgentId: z.ZodString;
export type AgentId = z.infer<typeof AgentId>;
export declare const PromptRequest: z.ZodObject<{
    jobId: z.ZodString;
    agent: z.ZodString;
    project: z.ZodString;
    prompt: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    agent: string;
    project: string;
    prompt: string;
    sessionId?: string | undefined;
}, {
    jobId: string;
    agent: string;
    project: string;
    prompt: string;
    sessionId?: string | undefined;
}>;
export type PromptRequest = z.infer<typeof PromptRequest>;
export declare const PromptResponse: z.ZodObject<{
    jobId: z.ZodString;
    sessionId: z.ZodString;
    text: z.ZodString;
    turns: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    sessionId: string;
    text: string;
    turns: number;
}, {
    jobId: string;
    sessionId: string;
    text: string;
    turns: number;
}>;
export type PromptResponse = z.infer<typeof PromptResponse>;
export declare const AgentErrorCode: z.ZodEnum<["unauthorized", "unknown_agent", "unknown_project", "agent_unavailable", "agent_timeout", "auth_expired", "internal", "approval_timeout", "forbidden_branch", "git_failed", "run_failed", "run_timeout", "unknown_task", "worktree_dirty"]>;
export type AgentErrorCode = z.infer<typeof AgentErrorCode>;
export declare const AgentError: z.ZodObject<{
    code: z.ZodEnum<["unauthorized", "unknown_agent", "unknown_project", "agent_unavailable", "agent_timeout", "auth_expired", "internal", "approval_timeout", "forbidden_branch", "git_failed", "run_failed", "run_timeout", "unknown_task", "worktree_dirty"]>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: "unauthorized" | "unknown_agent" | "unknown_project" | "agent_unavailable" | "agent_timeout" | "auth_expired" | "internal" | "approval_timeout" | "forbidden_branch" | "git_failed" | "run_failed" | "run_timeout" | "unknown_task" | "worktree_dirty";
    message: string;
}, {
    code: "unauthorized" | "unknown_agent" | "unknown_project" | "agent_unavailable" | "agent_timeout" | "auth_expired" | "internal" | "approval_timeout" | "forbidden_branch" | "git_failed" | "run_failed" | "run_timeout" | "unknown_task" | "worktree_dirty";
    message: string;
}>;
export type AgentError = z.infer<typeof AgentError>;
/**
 * Una aprobacion pendiente, tal como la ve el bridge.
 *
 * `summary` es prosa que escribe el hijo, no el input crudo de la herramienta:
 * a Telegram no viaja codigo, ni siquiera el que se esta por escribir. `tool`
 * viaja igual porque el bridge lo usa para elegir el icono y el verbo, y
 * porque un nombre de herramienta no es codigo.
 */
export declare const ApprovalRequest: z.ZodObject<{
    approvalId: z.ZodString;
    jobId: z.ZodString;
    agent: z.ZodString;
    tool: z.ZodString;
    summary: z.ZodString;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    agent: string;
    approvalId: string;
    tool: string;
    summary: string;
    createdAt: string;
    expiresAt: string;
}, {
    jobId: string;
    agent: string;
    approvalId: string;
    tool: string;
    summary: string;
    createdAt: string;
    expiresAt: string;
}>;
export type ApprovalRequest = z.infer<typeof ApprovalRequest>;
/**
 * La decision del usuario.
 *
 * `feedback` es lo que separa "Rechazar" de "Rechazar y explicar": con
 * feedback, el turno sigue y Claude incorpora el motivo; sin feedback, el
 * turno se corta. Ver `toPermissionResult` en el hijo.
 */
export declare const ApprovalDecision: z.ZodObject<{
    decision: z.ZodEnum<["allow", "deny"]>;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "allow" | "deny";
    feedback?: string | undefined;
}, {
    decision: "allow" | "deny";
    feedback?: string | undefined;
}>;
export type ApprovalDecision = z.infer<typeof ApprovalDecision>;
export declare const PendingApprovalsResponse: z.ZodObject<{
    pending: z.ZodArray<z.ZodObject<{
        approvalId: z.ZodString;
        jobId: z.ZodString;
        agent: z.ZodString;
        tool: z.ZodString;
        summary: z.ZodString;
        createdAt: z.ZodString;
        expiresAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        jobId: string;
        agent: string;
        approvalId: string;
        tool: string;
        summary: string;
        createdAt: string;
        expiresAt: string;
    }, {
        jobId: string;
        agent: string;
        approvalId: string;
        tool: string;
        summary: string;
        createdAt: string;
        expiresAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    pending: {
        jobId: string;
        agent: string;
        approvalId: string;
        tool: string;
        summary: string;
        createdAt: string;
        expiresAt: string;
    }[];
}, {
    pending: {
        jobId: string;
        agent: string;
        approvalId: string;
        tool: string;
        summary: string;
        createdAt: string;
        expiresAt: string;
    }[];
}>;
export type PendingApprovalsResponse = z.infer<typeof PendingApprovalsResponse>;
export declare const GitCommitRequest: z.ZodObject<{
    agent: z.ZodString;
    project: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    agent: string;
    project: string;
}, {
    message: string;
    agent: string;
    project: string;
}>;
export type GitCommitRequest = z.infer<typeof GitCommitRequest>;
export declare const GitPushRequest: z.ZodObject<{
    agent: z.ZodString;
    project: z.ZodString;
    branch: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agent: string;
    project: string;
    branch: string;
}, {
    agent: string;
    project: string;
    branch: string;
}>;
export type GitPushRequest = z.infer<typeof GitPushRequest>;
export declare const GitResult: z.ZodObject<{
    ok: z.ZodBoolean;
    output: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    output: string;
}, {
    ok: boolean;
    output: string;
}>;
export type GitResult = z.infer<typeof GitResult>;
/**
 * Pedido de ejecucion.
 *
 * `tarea` es un NOMBRE, no un comando, y no hay campo de argumentos a
 * proposito: el comando completo vive en `config/projects.json` y el agente no
 * puede componer nada. `.strict()` hace que un `args` de mas sea un rechazo y
 * no un campo ignorado en silencio.
 */
export declare const RunRequest: z.ZodObject<{
    agent: z.ZodString;
    project: z.ZodString;
    tarea: z.ZodString;
}, "strict", z.ZodTypeAny, {
    agent: string;
    project: string;
    tarea: string;
}, {
    agent: string;
    project: string;
    tarea: string;
}>;
export type RunRequest = z.infer<typeof RunRequest>;
export declare const RunResponse: z.ZodObject<{
    ok: z.ZodBoolean;
    output: z.ZodString;
    exitCode: z.ZodNumber;
    /** true si `output` no es la salida completa. */
    truncado: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    output: string;
    exitCode: number;
    truncado?: boolean | undefined;
}, {
    ok: boolean;
    output: string;
    exitCode: number;
    truncado?: boolean | undefined;
}>;
export type RunResponse = z.infer<typeof RunResponse>;
