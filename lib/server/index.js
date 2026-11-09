import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { ProxyAgent } from 'undici';
import { createFetchInterceptor, emptySettings, normalizeSettings, } from "./intercept.js";
export const name = 'fetch-modifier';
export const inject = ['webServer', 'llm'];
const SETTINGS_FILE = join(homedir(), '.dsh', 'fetch-modifier.json');
const MAX_SETTINGS_BODY_BYTES = 64 * 1024;
const DEBUG = process.env.DSH_FETCH_MODIFIER_DEBUG === '1';
/** Read settings from disk. Malformed or missing files fall back to empty settings. */
function loadSettings() {
    try {
        if (!existsSync(SETTINGS_FILE))
            return emptySettings();
        return normalizeSettings(JSON.parse(readFileSync(SETTINGS_FILE, 'utf8')));
    }
    catch {
        return emptySettings();
    }
}
/**
 * Persist settings atomically: a sibling temp file written with `0600` is
 * renamed over the target, so a crash never leaves a half-written JSON file.
 */
function saveSettings(value) {
    const settings = normalizeSettings(value);
    mkdirSync(dirname(SETTINGS_FILE), { recursive: true });
    const temp = join(dirname(SETTINGS_FILE), `.fetch-modifier-${process.pid}-${randomBytes(6).toString('hex')}.tmp`);
    writeFileSync(temp, JSON.stringify(settings, null, 2), { mode: 0o600 });
    renameSync(temp, SETTINGS_FILE);
    return settings;
}
/** A browser POST must come from this host; non-browser clients omit Origin. */
function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (typeof origin !== 'string' || origin.length === 0)
        return true;
    const host = req.headers.host;
    if (typeof host !== 'string' || host.length === 0)
        return false;
    try {
        return new URL(origin).host === host;
    }
    catch {
        return false;
    }
}
/** Read a JSON request body, rejecting anything larger than the settings cap. */
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_SETTINGS_BODY_BYTES) {
                reject(new Error('payload-too-large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            }
            catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
function sendJson(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}
export function apply(ctx) {
    const debug = (...args) => {
        if (!DEBUG)
            return;
        try {
            ctx.logger('fetch-modifier').debug(...args);
        }
        catch {
            // Logging must never break request interception.
        }
    };
    // Both routes are exact: a prefix route would also answer arbitrary
    // sub-paths such as `/fetch-modifier/api/settings/anything`.
    const disposeSettings = ctx.webServer.register({
        kind: 'exact',
        path: '/fetch-modifier/api/settings',
        handler: (req, res) => {
            if (req.method === 'GET') {
                sendJson(res, 200, loadSettings());
                return;
            }
            if (req.method !== 'POST') {
                res.writeHead(405);
                res.end('Method Not Allowed');
                return;
            }
            if (!isSameOrigin(req)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }
            readJsonBody(req).then((value) => {
                try {
                    saveSettings(value);
                    sendJson(res, 200, { ok: true });
                }
                catch (error) {
                    debug('saving settings failed', error);
                    res.writeHead(500);
                    res.end('Cannot save settings');
                }
            }, (error) => {
                if (error instanceof Error && error.message === 'payload-too-large') {
                    res.writeHead(413);
                    res.end('Payload Too Large');
                    return;
                }
                res.writeHead(400);
                res.end('Invalid JSON');
            });
        },
    });
    const disposeModels = ctx.webServer.register({
        kind: 'exact',
        path: '/fetch-modifier/api/models',
        handler: async (req, res) => {
            if (req.method !== 'GET') {
                res.writeHead(405);
                res.end('Method Not Allowed');
                return;
            }
            try {
                const providers = typeof ctx.llm?.listProviders === 'function'
                    ? ctx.llm.listProviders()
                    : [];
                const models = [];
                for (const provider of providers) {
                    try {
                        const list = await ctx.llm.listModels(provider.id);
                        for (const model of list) {
                            models.push({ id: model.id, name: model.name || model.id, provider: provider.id });
                        }
                    }
                    catch (error) {
                        // A provider without credentials or an unloaded adapter is not fatal:
                        // the settings UI can still offer the models of every other provider.
                        debug('listing models failed for provider', provider.id, error);
                    }
                }
                sendJson(res, 200, { models });
            }
            catch (error) {
                debug('listing providers failed', error);
                res.writeHead(500);
                res.end('Error listing models');
            }
        },
    });
    // Reuse one ProxyAgent per proxy URL instead of leaking a new agent per request.
    const agents = new Map();
    const getAgent = (proxyUrl) => {
        const existing = agents.get(proxyUrl);
        if (existing !== undefined)
            return existing;
        const agent = new ProxyAgent(proxyUrl);
        agents.set(proxyUrl, agent);
        return agent;
    };
    const originalFetch = globalThis.fetch;
    const patchedFetch = createFetchInterceptor({
        loadSettings,
        getAgent,
        baseFetch: originalFetch,
        debug,
    });
    globalThis.fetch = patchedFetch;
    // Returning a disposer from `apply` is honored by cordis (startup disposes it),
    // so HMR/patch reload does not accumulate duplicate routes or fetch wrappers.
    return () => {
        // Only undo our own patch: another plugin may have wrapped fetch after us.
        if (globalThis.fetch === patchedFetch)
            globalThis.fetch = originalFetch;
        try {
            disposeSettings();
        }
        catch (error) {
            debug('disposing settings route failed', error);
        }
        try {
            disposeModels();
        }
        catch (error) {
            debug('disposing models route failed', error);
        }
        for (const agent of agents.values()) {
            try {
                void agent.close();
            }
            catch (error) {
                debug('closing proxy agent failed', error);
            }
        }
        agents.clear();
    };
}
//# sourceMappingURL=index.js.map