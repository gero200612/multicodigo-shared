import { describe, it, expect } from 'vitest';
import { AgentId, PromptRequest, PromptResponse } from '../src/index.js';

describe('AgentId', () => {
  it('acepta los agentes conocidos', () => {
    expect(AgentId.parse('c1')).toBe('c1');
    expect(AgentId.parse('c2')).toBe('c2');
  });

  it('rechaza un agente desconocido', () => {
    expect(() => AgentId.parse('c9')).toThrow();
  });
});

describe('PromptRequest', () => {
  const valid = {
    jobId: '00000000-0000-4000-8000-000000000001',
    agent: 'c1',
    project: 'sincroresto',
    prompt: 'que hace el servicio de stock',
  };

  it('acepta un request sin sessionId', () => {
    expect(PromptRequest.parse(valid).sessionId).toBeUndefined();
  });

  it('rechaza un prompt vacio', () => {
    expect(() => PromptRequest.parse({ ...valid, prompt: '' })).toThrow();
  });

  it('rechaza un jobId que no es uuid', () => {
    expect(() => PromptRequest.parse({ ...valid, jobId: 'abc' })).toThrow();
  });
});

describe('PromptResponse', () => {
  it('exige sessionId y text', () => {
    expect(() =>
      PromptResponse.parse({ jobId: '00000000-0000-4000-8000-000000000001', text: 'ok' }),
    ).toThrow();
  });
});
