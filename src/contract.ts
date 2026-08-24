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
]);
export type AgentErrorCode = z.infer<typeof AgentErrorCode>;

export const AgentError = z.object({
  code: AgentErrorCode,
  message: z.string(),
});
export type AgentError = z.infer<typeof AgentError>;
