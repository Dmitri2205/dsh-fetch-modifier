import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { apply } from '../src/server/index.ts';

interface FakeContext {
  routes: Map<string, any>;
  webServer: { register: (route: any) => () => void };
  llm: { listProviders: () => Array<{ id: string; name: string }>; listModels: (id: string) => Promise<Array<{ id: string; name: string }>> };
  logger: () => { debug: () => void; info: () => void; warn: () => void; error: () => void };
}

function createFakeContext(options: { extraProviders?: Array<{ id: string; name: string }> } = {}): FakeContext {
  const routes = new Map<string, any>();
  return {
    routes,
    webServer: {
      register(route: any) {
        const key = `${route.kind}:${route.path}`;
        if (routes.has(key)) throw new Error(`duplicate route ${key}`);
        routes.set(key, route);
        return () => { routes.delete(key); };
      },
    },
    llm: {
      listProviders: () => [{ id: 'llama', name: 'llama' }, ...(options.extraProviders ?? [])],
      listModels: async (id: string) => {
        if (id === 'llama') return [{ id: 'qwen-exec', name: 'Qwen Exec' }];
        throw new Error(`no adapter for ${id}`);
      },
    },
    logger: () => ({ debug() {}, info() {}, warn() {}, error() {} }),
  };
}

async function callRoute(
  route: any,
  { method = 'GET', headers = {}, body = '' }: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<{ status: number; body: string }> {
  const req = Readable.from(body.length > 0 ? [Buffer.from(body)] : []) as any;
  req.method = method;
  req.headers = headers;
  const chunks: Buffer[] = [];
  const res: any = {
    statusCode: 200,
    headers: {},
    writeHead(code: number, responseHeaders?: Record<string, string>) {
      this.statusCode = code;
      Object.assign(this.headers, responseHeaders ?? {});
      return this;
    },
    end(data?: unknown) {
      if (data !== undefined && data !== null) chunks.push(Buffer.from(data as string));
    },
  };
  await route.handler(req, res);
  return { status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') };
}

test('registers exact routes and disposes every one of them', () => {
  const ctx = createFakeContext();
  const dispose = apply(ctx as never);
  try {
    assert.deepEqual(
      [...ctx.routes.keys()].sort(),
      ['exact:/fetch-modifier/api/models', 'exact:/fetch-modifier/api/settings'],
    );
  } finally {
    dispose();
  }
  assert.equal(ctx.routes.size, 0);
});

test('settings route serves the settings shape on GET', async () => {
  const ctx = createFakeContext();
  const dispose = apply(ctx as never);
  try {
    const { status, body } = await callRoute(ctx.routes.get('exact:/fetch-modifier/api/settings'));
    assert.equal(status, 200);
    const parsed = JSON.parse(body);
    assert.ok(Array.isArray(parsed.samplingRules));
    assert.ok(Array.isArray(parsed.proxyRules));
  } finally {
    dispose();
  }
});

test('cross-origin settings POST is rejected before writing', async () => {
  const ctx = createFakeContext();
  const dispose = apply(ctx as never);
  try {
    const { status } = await callRoute(ctx.routes.get('exact:/fetch-modifier/api/settings'), {
      method: 'POST',
      headers: { origin: 'https://evil.example', host: '127.0.0.1:3080' },
      body: JSON.stringify({ samplingRules: [{ model: 'evil' }], proxyRules: [] }),
    });
    assert.equal(status, 403);
  } finally {
    dispose();
  }
});

test('settings route rejects unsupported methods', async () => {
  const ctx = createFakeContext();
  const dispose = apply(ctx as never);
  try {
    const { status } = await callRoute(ctx.routes.get('exact:/fetch-modifier/api/settings'), {
      method: 'DELETE',
    });
    assert.equal(status, 405);
  } finally {
    dispose();
  }
});

test('models route lists models from every provider', async () => {
  const ctx = createFakeContext();
  const dispose = apply(ctx as never);
  try {
    const { status, body } = await callRoute(ctx.routes.get('exact:/fetch-modifier/api/models'));
    assert.equal(status, 200);
    assert.deepEqual(JSON.parse(body).models, [
      { id: 'qwen-exec', name: 'Qwen Exec', provider: 'llama' },
    ]);
  } finally {
    dispose();
  }
});

test('models route still answers 200 when one provider fails', async () => {
  const ctx = createFakeContext({ extraProviders: [{ id: 'broken', name: 'broken' }] });
  const dispose = apply(ctx as never);
  try {
    const { status, body } = await callRoute(ctx.routes.get('exact:/fetch-modifier/api/models'));
    assert.equal(status, 200);
    assert.deepEqual(JSON.parse(body).models, [
      { id: 'qwen-exec', name: 'Qwen Exec', provider: 'llama' },
    ]);
  } finally {
    dispose();
  }
});

test('disposer restores the previous global fetch', () => {
  const ctx = createFakeContext();
  const before = globalThis.fetch;
  const dispose = apply(ctx as never);
  assert.notEqual(globalThis.fetch, before);
  dispose();
  assert.equal(globalThis.fetch, before);
});
