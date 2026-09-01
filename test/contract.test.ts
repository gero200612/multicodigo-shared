import { describe, it, expect } from 'vitest';
import { AgentId, PromptRequest, PromptResponse } from '../src/index.js';

describe('AgentId', () => {
  // Dejo de ser un enum cerrado: el pool de slots se configura en el compose y
  // en el entorno, no en el codigo. Se valida la FORMA. Que un slot exista es
  // otra pregunta, y la contesta el registry del gateway.
  it('acepta cualquier slot con forma valida', () => {
    for (const id of ['c1', 'c2', 'c3', 'c9', 'c10', 'c42', 'c99']) {
      expect(AgentId.parse(id)).toBe(id);
    }
  });

  // El regex no es cosmetico: el gateway construye `claude/${agent}/` para la
  // rama y hace `agentUrls[agent]`. Un string libre ahi es inyeccion de path,
  // que es justo la garantia que el enum daba gratis y hay que reponer.
  it('rechaza formas que romperian el path o la rama', () => {
    for (const malo of [
      '',
      'c0', // no hay slot cero
      'c01', // cero a la izquierda: dos strings para el mismo slot
      'c100', // fuera del rango de dos digitos
      'c1/x',
      '../c1',
      'c1/../c2',
      'c-1',
      'C1', // mayuscula: otro string para el mismo slot
      'c1 ',
      'c1\n',
      'gateway',
      'c1;rm',
    ]) {
      expect(() => AgentId.parse(malo), `deberia rechazar ${JSON.stringify(malo)}`).toThrow();
    }
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

import {
  ApprovalRequest,
  ApprovalDecision,
  PendingApprovalsResponse,
  GitCommitRequest,
  GitPushRequest,
  GitResult,
  AgentErrorCode,
} from '../src/contract.js';

describe('ApprovalRequest', () => {
  const base = {
    approvalId: '11111111-1111-4111-8111-111111111111',
    jobId: '22222222-2222-4222-8222-222222222222',
    agent: 'c1',
    tool: 'Write',
    summary: 'Voy a escribir el archivo de lotes.',
    createdAt: '2026-08-25T12:00:00.000Z',
    expiresAt: '2026-08-25T12:15:00.000Z',
  };

  it('acepta una solicitud completa', () => {
    expect(ApprovalRequest.parse(base).tool).toBe('Write');
  });

  it('rechaza un approvalId que no es uuid', () => {
    expect(ApprovalRequest.safeParse({ ...base, approvalId: 'abc' }).success).toBe(false);
  });

  it('rechaza un resumen vacio: sin resumen no hay nada que aprobar', () => {
    expect(ApprovalRequest.safeParse({ ...base, summary: '' }).success).toBe(false);
  });

  it('rechaza un agente con forma invalida', () => {
    expect(ApprovalRequest.safeParse({ ...base, agent: 'c1/../c2' }).success).toBe(false);
  });
});

describe('ApprovalDecision', () => {
  it('acepta allow sin feedback', () => {
    expect(ApprovalDecision.parse({ decision: 'allow' }).decision).toBe('allow');
  });

  it('acepta deny con feedback', () => {
    const d = ApprovalDecision.parse({ decision: 'deny', feedback: 'usa el otro modulo' });
    expect(d.feedback).toBe('usa el otro modulo');
  });

  it('rechaza una decision que no es allow ni deny', () => {
    expect(ApprovalDecision.safeParse({ decision: 'quizas' }).success).toBe(false);
  });
});

describe('PendingApprovalsResponse', () => {
  it('acepta una lista vacia', () => {
    expect(PendingApprovalsResponse.parse({ pending: [] }).pending).toEqual([]);
  });
});

describe('GitPushRequest', () => {
  it('acepta un push a una branch del agente', () => {
    const r = GitPushRequest.parse({
      agent: 'c1', project: 'demo', repo: 'demo', branch: 'claude/c1/lotes',
    });
    expect(r.branch).toBe('claude/c1/lotes');
  });

  it('rechaza una branch vacia', () => {
    expect(
      GitPushRequest.safeParse({ agent: 'c1', project: 'demo', repo: 'demo', branch: '' }).success,
    ).toBe(false);
  });
});

describe('GitCommitRequest', () => {
  it('rechaza un mensaje de commit vacio', () => {
    expect(
      GitCommitRequest.safeParse({ agent: 'c1', project: 'demo', repo: 'demo', message: '' })
        .success,
    ).toBe(false);
  });

  it('rechaza un commit sin repo', () => {
    expect(
      GitCommitRequest.safeParse({ agent: 'c1', project: 'multicodigo', message: 'x' }).success,
    ).toBe(false);
  });

  it('rechaza un repo con barra, que se escaparia del directorio', () => {
    expect(
      GitCommitRequest.safeParse({
        agent: 'c1', project: 'multicodigo', repo: '../otro', message: 'x',
      }).success,
    ).toBe(false);
  });

  it('acepta un nombre de repo normal', () => {
    expect(
      GitCommitRequest.safeParse({
        agent: 'c1', project: 'multicodigo', repo: 'multicodigo-front', message: 'x',
      }).success,
    ).toBe(true);
  });
});

describe('GitResult', () => {
  it('acepta un resultado con salida', () => {
    expect(GitResult.parse({ ok: true, output: '1 file changed' }).ok).toBe(true);
  });
});

describe('AgentErrorCode', () => {
  it('incluye los codigos nuevos del plan 2', () => {
    for (const code of ['approval_timeout', 'forbidden_branch', 'git_failed']) {
      expect(AgentErrorCode.safeParse(code).success).toBe(true);
    }
  });
});

import { RunRequest, RunResponse } from '../src/contract.js';

describe('RunRequest', () => {
  const base = { agent: 'c1', project: 'demo', repo: 'demo', tarea: 'test' };

  it('acepta un pedido de tarea', () => {
    expect(RunRequest.parse(base).tarea).toBe('test');
  });

  // El agente manda un NOMBRE, no un comando. Sin argumentos: el comando
  // completo lo decide config/projects.json.
  it('rechaza un campo de argumentos: el agente no compone comandos', () => {
    const r = RunRequest.safeParse({ ...base, args: ['--force'] });
    expect(r.success && 'args' in r.data).toBe(false);
  });

  it('rechaza una tarea vacia', () => {
    expect(RunRequest.safeParse({ ...base, tarea: '' }).success).toBe(false);
  });

  it('rechaza un agente con forma invalida', () => {
    expect(RunRequest.safeParse({ ...base, agent: 'c1/../c2' }).success).toBe(false);
  });
});

describe('RunResponse', () => {
  it('acepta un resultado exitoso con salida', () => {
    const r = RunResponse.parse({ ok: true, output: '12 tests passed', exitCode: 0 });
    expect(r.ok).toBe(true);
  });

  it('acepta un fallo con su codigo de salida', () => {
    expect(RunResponse.parse({ ok: false, output: '1 failed', exitCode: 1 }).exitCode).toBe(1);
  });

  it('marca cuando la salida se trunco', () => {
    const r = RunResponse.parse({ ok: true, output: 'x', exitCode: 0, truncado: true });
    expect(r.truncado).toBe(true);
  });
});

describe('AgentErrorCode — plan 3', () => {
  it('incluye los codigos del runner y del worktree', () => {
    for (const code of ['run_failed', 'run_timeout', 'unknown_task', 'worktree_dirty']) {
      expect(AgentErrorCode.safeParse(code).success).toBe(true);
    }
  });
});

describe('PromptRequest con repos', () => {
  const base = {
    jobId: '00000000-0000-4000-8000-000000000001',
    agent: 'c1',
    project: 'multicodigo',
    prompt: 'hola',
  };

  // El gateway cae a su catalogo local (projects.json) cuando no vienen: es lo
  // que mantiene vivo a `demo`, que no esta en Supabase.
  it('acepta un pedido sin repos', () => {
    expect(PromptRequest.safeParse(base).success).toBe(true);
  });

  it('acepta la lista de repos del proyecto', () => {
    const r = PromptRequest.safeParse({
      ...base,
      repos: [{ nombre: 'multicodigo-front', github_repo: 'gero200612/multicodigo-front' }],
    });
    expect(r.success).toBe(true);
  });

  it('rechaza un nombre de repo que se escaparia del directorio', () => {
    const r = PromptRequest.safeParse({
      ...base,
      repos: [{ nombre: '../otro', github_repo: 'gero200612/otro' }],
    });
    expect(r.success).toBe(false);
  });

  // Una URL entera admite `ssh://...@host/-oProxyCommand=...`, que git
  // interpreta como opciones. Por eso se guarda y valida la forma corta.
  it('rechaza un github_repo que no es owner/name', () => {
    const r = PromptRequest.safeParse({
      ...base,
      repos: [{ nombre: 'x', github_repo: 'https://github.com/a/b' }],
    });
    expect(r.success).toBe(false);
  });
});
