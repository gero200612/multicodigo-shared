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
export const AgentId = z.string().regex(/^c[1-9][0-9]?$/, 'slot invalido');
/**
 * El nombre de un repo dentro de un proyecto.
 *
 * Lista blanca de FORMA y no lista negra de nombres, por la misma razon que
 * `isBranchAllowed`: este valor arma una ruta en disco, asi que `..`, la barra
 * y cualquier metacaracter caen todos por el mismo lado, junto con el nombre
 * raro que nadie penso.
 */
export const NombreDeRepo = z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9._-]+$/, 'nombre de repo invalido')
    .refine((n) => n !== '.' && n !== '..', { message: 'nombre de repo invalido' });
/**
 * Un repo tal como se lo pasan al gateway en el turno.
 *
 * El gateway no habla con Supabase: todo lo que necesita saber llega en el
 * pedido. `github_repo` esta para poder clonar el espejo la primera vez, y se
 * valida la FORMA `owner/name` en vez de una URL entera porque una URL admite
 * `ssh://...@host/-oProxyCommand=...`, que git interpreta como opciones.
 */
export const RepoDelPedido = z.object({
    nombre: NombreDeRepo,
    github_repo: z
        .string()
        .regex(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/, 'github_repo tiene que ser owner/name'),
});
export const PromptRequest = z.object({
    jobId: z.string().uuid(),
    agent: AgentId,
    project: z.string().min(1),
    prompt: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    /**
     * Los repos del proyecto. Opcional: sin esto el gateway usa su catalogo
     * local, que es lo que mantiene vivo a `demo` fuera de Supabase.
     */
    repos: z.array(RepoDelPedido).max(20).optional(),
});
export const PromptResponse = z.object({
    jobId: z.string().uuid(),
    sessionId: z.string().min(1),
    text: z.string(),
    turns: z.number().int().nonnegative(),
});
export const AgentErrorCode = z.enum([
    'unauthorized',
    'unknown_agent',
    'unknown_project',
    'agent_unavailable',
    'agent_timeout',
    'auth_expired',
    'internal',
    // Plan 2
    'approval_timeout',
    'forbidden_branch',
    'git_failed',
    // Plan 3
    'run_failed',
    'run_timeout',
    'unknown_task',
    'worktree_dirty',
]);
export const AgentError = z.object({
    code: AgentErrorCode,
    message: z.string(),
});
/**
 * Una aprobacion pendiente, tal como la ve el bridge.
 *
 * `summary` es prosa que escribe el hijo, no el input crudo de la herramienta:
 * a Telegram no viaja codigo, ni siquiera el que se esta por escribir. `tool`
 * viaja igual porque el bridge lo usa para elegir el icono y el verbo, y
 * porque un nombre de herramienta no es codigo.
 */
export const ApprovalRequest = z.object({
    approvalId: z.string().uuid(),
    jobId: z.string().uuid(),
    agent: AgentId,
    tool: z.string().min(1),
    summary: z.string().min(1),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
});
/**
 * La decision del usuario.
 *
 * `feedback` es lo que separa "Rechazar" de "Rechazar y explicar": con
 * feedback, el turno sigue y Claude incorpora el motivo; sin feedback, el
 * turno se corta. Ver `toPermissionResult` en el hijo.
 */
export const ApprovalDecision = z.object({
    decision: z.enum(['allow', 'deny']),
    feedback: z.string().min(1).optional(),
});
export const PendingApprovalsResponse = z.object({
    pending: z.array(ApprovalRequest),
});
export const GitCommitRequest = z.object({
    agent: AgentId,
    project: z.string().min(1),
    repo: NombreDeRepo,
    message: z.string().min(1),
});
export const GitPushRequest = z.object({
    agent: AgentId,
    project: z.string().min(1),
    repo: NombreDeRepo,
    branch: z.string().min(1),
});
export const GitResult = z.object({
    ok: z.boolean(),
    output: z.string(),
});
/**
 * Pedido de ejecucion.
 *
 * `tarea` es un NOMBRE, no un comando, y no hay campo de argumentos a
 * proposito: el comando completo vive en `config/projects.json` y el agente no
 * puede componer nada. `.strict()` hace que un `args` de mas sea un rechazo y
 * no un campo ignorado en silencio.
 */
export const RunRequest = z
    .object({
    agent: AgentId,
    project: z.string().min(1),
    repo: NombreDeRepo,
    tarea: z.string().min(1),
})
    .strict();
export const RunResponse = z.object({
    ok: z.boolean(),
    output: z.string(),
    exitCode: z.number().int(),
    /** true si `output` no es la salida completa. */
    truncado: z.boolean().optional(),
});
//# sourceMappingURL=contract.js.map