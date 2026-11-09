import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  applySamplingToBody,
  classifyLlmRequest,
  createFetchInterceptor,
  findProxyRule,
  findSamplingRule,
  mergeSamplingParams,
  normalizeSettings,
  type Settings,
} from '../src/server/intercept.ts';

function baseSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    samplingRules: [
      {
        model: 'qwen-exec',
        params: {
          top_p: 0.8,
          top_k: 20,
          temperature: 0.7,
          presence_penalty: 1.5,
          repeat_penalty: 1,
        },
      },
    ],
    proxyRules: [],
    ...overrides,
  };
}

type RecordedCall = { input: RequestInfo | URL; init: RequestInit | undefined };

function recordingFetch(): { calls: RecordedCall[]; fetch: typeof fetch } {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response('ok', { status: 200 });
  }) as typeof fetch;
  return { calls, fetch: fetchImpl };
}

function interceptor(settings: Settings, deps: Partial<Parameters<typeof createFetchInterceptor>[0]> = {}) {
  return createFetchInterceptor({
    loadSettings: () => settings,
    getAgent: () => {
      throw new Error('unexpected proxy use');
    },
    baseFetch: recordingFetch().fetch,
    ...deps,
  });
}

test('classifies OpenAI-compatible chat completions URLs', () => {
  assert.equal(classifyLlmRequest('https://api.openai.com/v1/chat/completions'), 'openai');
  assert.equal(classifyLlmRequest('http://localhost:8090/v1/chat/completions?stream=true'), 'openai');
});

test('classifies Anthropic-compatible messages URLs', () => {
  assert.equal(classifyLlmRequest('https://api.deepseek.com/messages'), 'anthropic');
  assert.equal(classifyLlmRequest('https://api.deepseek.com/anthropic/v1/messages'), 'anthropic');
});

test('ignores unrelated URLs', () => {
  assert.equal(classifyLlmRequest('https://mcp.notion.com/mcp'), 'none');
  assert.equal(classifyLlmRequest('https://example.com/v1/chat/completions-extra'), 'none');
  assert.equal(classifyLlmRequest('not a url'), 'none');
});

test('blank proxy patterns never capture traffic', () => {
  const rules = [{ pattern: '   ', proxyUrl: 'http://127.0.0.1:7890', enabled: true }];
  assert.equal(findProxyRule(rules, 'https://example.com/anything'), undefined);
});

test('disabled proxy rules are skipped and first enabled match wins', () => {
  const rules = [
    { pattern: 'notion.com', proxyUrl: 'http://p1', enabled: false },
    { pattern: 'notion.com', proxyUrl: 'http://p2', enabled: true },
    { pattern: 'notion.com', proxyUrl: 'http://p3', enabled: true },
  ];
  assert.equal(findProxyRule(rules, 'https://mcp.notion.com/mcp')?.proxyUrl, 'http://p2');
});

test('blank sampling model never matches', () => {
  assert.equal(findSamplingRule([{ model: '', params: { top_p: 0.1 } }], 'qwen-exec'), undefined);
});

test('disabled sampling rules are skipped', () => {
  const rules = [{ model: 'qwen-exec', enabled: false, params: { top_p: 0.1 } }];
  assert.equal(findSamplingRule(rules, 'qwen-exec'), undefined);
});

test('empty settings leave the request untouched', async () => {
  const original = JSON.stringify({ model: 'qwen-exec', messages: [] });
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = interceptor({ samplingRules: [], proxyRules: [] }, { baseFetch });
  await intercept('https://api.example.com/v1/chat/completions', { method: 'POST', body: original });
  assert.equal(calls[0].init?.body, original);
  assert.equal((calls[0].init as { dispatcher?: unknown } | undefined)?.dispatcher, undefined);
});

test('marks the request as Anthropic before applying sampling', () => {
  const applied = applySamplingToBody(
    JSON.stringify({ model: 'qwen-exec', messages: [] }),
    baseSettings().samplingRules,
    'anthropic',
  );
  assert.ok(applied);
  const body = JSON.parse(applied.body);
  assert.equal(body.top_p, 0.8);
  assert.equal(body.presence_penalty, undefined);
});

test('OpenAI bodies keep the penalty parameters', () => {
  const merged = mergeSamplingParams('openai', { presence_penalty: 1.5, repeat_penalty: 1 });
  assert.deepEqual(merged, { presence_penalty: 1.5, repeat_penalty: 1 });
});

test('sampling rules can never overwrite request structure', () => {
  const merged = mergeSamplingParams('openai', { model: 'evil', messages: [], top_p: 0.5 });
  assert.deepEqual(merged, { top_p: 0.5 });
});

test('normalizeSettings survives malformed input', () => {
  assert.deepEqual(normalizeSettings(null), { samplingRules: [], proxyRules: [] });
  const normalized = normalizeSettings({
    samplingRules: [{ model: 42 }, { model: 'x', params: 'nope' }, 'junk'],
    proxyRules: [{ pattern: 'a.com', proxyUrl: 'http://p' }],
  });
  assert.equal(normalized.samplingRules.length, 2);
  assert.deepEqual(normalized.samplingRules[0].params, {});
  assert.equal(normalized.proxyRules[0].enabled, true);
});

test('rewrites a JSON string body for a matching model', async () => {
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = interceptor(baseSettings(), { baseFetch });
  await intercept('https://api.example.com/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ model: 'qwen-exec', messages: [] }),
  });
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.top_p, 0.8);
  assert.equal(body.top_k, 20);
  assert.deepEqual(body.messages, []);
});

test('rewrites a Request body even when the caller passes no init', async () => {
  // Regression: the inspector calls the next fetch as `fetch(new Request(...))`,
  // dropping the second argument, so the body exists only on the Request.
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = interceptor(baseSettings(), { baseFetch });
  const request = new Request('https://api.example.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'qwen-exec', messages: [] }),
  });
  await intercept(request);
  assert.ok(calls[0].input instanceof Request);
  const rebuilt = calls[0].input as Request;
  const body = JSON.parse(await rebuilt.text());
  assert.equal(body.top_p, 0.8);
  assert.equal(rebuilt.headers.get('content-length'), null);
});

test('leaves non-matching models untouched', async () => {
  const original = JSON.stringify({ model: 'qwen-orchestrator', messages: [] });
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = interceptor(baseSettings(), { baseFetch });
  await intercept('https://api.example.com/v1/chat/completions', { method: 'POST', body: original });
  assert.equal(calls[0].init?.body, original);
});

test('leaves invalid JSON untouched', async () => {
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = interceptor(baseSettings(), { baseFetch });
  await intercept('https://api.example.com/v1/chat/completions', { method: 'POST', body: 'not json' });
  assert.equal(calls[0].init?.body, 'not json');
});

test('attaches a dispatcher for a matching proxy rule', async () => {
  const sentinel = { dispatch: () => { throw new Error('sentinel'); } };
  const agentUrls: string[] = [];
  const { calls, fetch: baseFetch } = recordingFetch();
  const intercept = createFetchInterceptor({
    loadSettings: () => baseSettings({
      proxyRules: [{ pattern: 'mcp.notion.com', proxyUrl: 'http://127.0.0.1:7890', enabled: true }],
    }),
    getAgent: (proxyUrl) => {
      agentUrls.push(proxyUrl);
      return sentinel as never;
    },
    baseFetch,
  });
  await intercept('https://mcp.notion.com/mcp', { method: 'POST', body: '{}' });
  assert.deepEqual(agentUrls, ['http://127.0.0.1:7890']);
  assert.equal((calls[0].init as { dispatcher?: unknown }).dispatcher, sentinel);
});

test('the modified body reaches a real HTTP server through a Request input', async () => {
  const bodies: string[] = [];
  const server = createServer((req, res) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      bodies.push(data);
      res.end('ok');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  try {
    const intercept = interceptor(baseSettings(), { baseFetch: globalThis.fetch });
    const request = new Request(`http://127.0.0.1:${address.port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'qwen-exec', messages: [] }),
    });
    await intercept(request);
    assert.equal(bodies.length, 1);
    assert.equal(JSON.parse(bodies[0]).top_p, 0.8);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
