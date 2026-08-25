import { z } from 'zod';

export const AgentId = z.enum(['c1', 'c2']);
export type AgentId = z.infer<typeof AgentId>;

export const PromptRequest = z.object({
  jobId: z.string().uuid(),
  agent: AgentId,
  project: z.string().min(1),
  prompt: z.string().min(1),
  sessionId: z.string().min(1).optional(),
});
export type PromptRequest = z.infer<typeof PromptRequest>;

export const PromptResponse = z.object({
  jobId: z.string().uuid(),
  sessionId: z.string().min(1),
  text: z.string(),
  turns: z.number().int().nonnegative(),
});
export type PromptResponse = z.infer<typeof PromptResponse>;

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
]);
export type AgentErrorCode = z.infer<typeof AgentErrorCode>;

export const AgentError = z.object({
  code: AgentErrorCode,
  message: z.string(),
});
export type AgentError = z.infer<typeof AgentError>;


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
export type ApprovalRequest = z.infer<typeof ApprovalRequest>;

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
export type ApprovalDecision = z.infer<typeof ApprovalDecision>;

export const PendingApprovalsResponse = z.object({
  pending: z.array(ApprovalRequest),
});
export type PendingApprovalsResponse = z.infer<typeof PendingApprovalsResponse>;

export const GitCommitRequest = z.object({
  agent: AgentId,
  project: z.string().min(1),
  message: z.string().min(1),
});
export type GitCommitRequest = z.infer<typeof GitCommitRequest>;

export const GitPushRequest = z.object({
  agent: AgentId,
  project: z.string().min(1),
  branch: z.string().min(1),
});
export type GitPushRequest = z.infer<typeof GitPushRequest>;

export const GitResult = z.object({
  ok: z.boolean(),
  output: z.string(),
});
export type GitResult = z.infer<typeof GitResult>;
