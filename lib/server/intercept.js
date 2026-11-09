/**
 * Pure request-interception logic for `dsh-fetch-modifier`.
 *
 * The functions here never touch globals, so both the host plugin and the
 * tests can drive them directly. Keeping the decisions pure is what makes the
 * "did the body actually change?" question answerable without a live server.
 *
 * @module dsh-fetch-modifier/intercept
 */
/** True for a plain object (not null, not an array). */
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Fresh empty settings; never share a module-level object between callers. */
export function emptySettings() {
    return { samplingRules: [], proxyRules: [] };
}
/**
 * Coerce arbitrary parsed JSON into the settings shape the interceptor trusts.
 * Unknown fields are preserved so the UI does not lose them on a round-trip.
 */
export function normalizeSettings(value) {
    const record = isRecord(value) ? value : {};
    const samplingRules = Array.isArray(record.samplingRules)
        ? record.samplingRules.filter(isRecord).map((rule) => ({
            ...rule,
            model: typeof rule.model === 'string' ? rule.model : '',
            enabled: rule.enabled !== false,
            params: isRecord(rule.params) ? { ...rule.params } : {},
        }))
        : [];
    const proxyRules = Array.isArray(record.proxyRules)
        ? record.proxyRules.filter(isRecord).map((rule) => ({
            ...rule,
            pattern: typeof rule.pattern === 'string' ? rule.pattern : '',
            proxyUrl: typeof rule.proxyUrl === 'string' ? rule.proxyUrl : '',
            enabled: rule.enabled !== false,
        }))
        : [];
    return { samplingRules, proxyRules };
}
/** `fetch` input as a URL string, without assuming which overload the caller used. */
export function toUrlString(input) {
    if (typeof input === 'string')
        return input;
    if (input instanceof URL)
        return input.href;
    if (typeof Request !== 'undefined' && input instanceof Request)
        return input.url;
    return String(input);
}
/** Pathname of an absolute or relative URL, or `undefined` when unparseable. */
export function pathnameOf(url) {
    try {
        return new URL(url, 'http://localhost').pathname;
    }
    catch {
        return undefined;
    }
}
/**
 * Which request family an outgoing URL belongs to.
 *
 * OpenAI-compatible routes end in `/chat/completions`; Anthropic-compatible
 * routes (which is what the DeepSeek provider speaks) end in `/messages`.
 * The DeepSeek adapter posts to `.../messages`, so matching only
 * `/chat/completions` would never fire for the default provider.
 */
export function classifyLlmRequest(url) {
    const pathname = pathnameOf(url);
    if (pathname === undefined)
        return 'none';
    if (pathname.endsWith('/chat/completions'))
        return 'openai';
    if (pathname === '/messages' || pathname.endsWith('/messages'))
        return 'anthropic';
    return 'none';
}
/**
 * First enabled proxy rule whose pattern is a non-blank substring of `url`.
 * A blank pattern matches every URL with `String#includes`, so blank rules are
 * skipped instead of swallowing all traffic.
 */
export function findProxyRule(rules, url) {
    for (const rule of rules ?? []) {
        if (!isRecord(rule) || rule.enabled === false)
            continue;
        const pattern = typeof rule.pattern === 'string' ? rule.pattern.trim() : '';
        const proxyUrl = typeof rule.proxyUrl === 'string' ? rule.proxyUrl.trim() : '';
        if (pattern.length === 0 || proxyUrl.length === 0)
            continue;
        if (url.includes(pattern))
            return rule;
    }
    return undefined;
}
/**
 * First enabled sampling rule whose non-blank model substring is contained in
 * `model`. A blank rule model would otherwise match every request.
 */
export function findSamplingRule(rules, model) {
    for (const rule of rules ?? []) {
        if (!isRecord(rule) || rule.enabled === false)
            continue;
        const needle = typeof rule.model === 'string' ? rule.model.trim() : '';
        if (needle.length === 0)
            continue;
        if (model.includes(needle))
            return rule;
    }
    return undefined;
}
/** Keys a sampling rule must never overwrite: they define the request itself. */
const STRUCTURAL_KEYS = new Set([
    'model',
    'messages',
    'input',
    'stream',
    'tools',
    'tool_choice',
    'functions',
    'function_call',
    'prompt',
    'system',
    'thinking',
    'output_config',
    '__proto__',
    'constructor',
    'prototype',
]);
/** Anthropic Messages accepts only these sampling fields; unknown ones are a 400. */
const ANTHROPIC_SAMPLING_KEYS = new Set([
    'temperature',
    'top_p',
    'top_k',
    'max_tokens',
    'stop_sequences',
    'metadata',
]);
/**
 * Filter a rule's parameters down to what the wire protocol accepts.
 *
 * OpenAI-compatible servers take the usual `top_p`/`top_k`/penalty set;
 * Anthropic-compatible servers reject unknown top-level fields, so only the
 * documented sampling fields survive there.
 */
export function mergeSamplingParams(style, params) {
    if (style === 'none' || !isRecord(params))
        return {};
    const merged = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || typeof value === 'function' || typeof value === 'symbol')
            continue;
        if (STRUCTURAL_KEYS.has(key))
            continue;
        if (style === 'anthropic' && !ANTHROPIC_SAMPLING_KEYS.has(key))
            continue;
        merged[key] = value;
    }
    return merged;
}
/**
 * Rewrite a JSON request body when its model matches a sampling rule.
 * Returns `undefined` when there is nothing to change (invalid JSON, no model,
 * no matching rule, or no applicable parameter).
 */
export function applySamplingToBody(bodyText, rules, style) {
    if (style === 'none')
        return undefined;
    let parsed;
    try {
        parsed = JSON.parse(bodyText);
    }
    catch {
        return undefined;
    }
    if (!isRecord(parsed))
        return undefined;
    const model = parsed.model;
    if (typeof model !== 'string' || model.length === 0)
        return undefined;
    const rule = findSamplingRule(rules, model);
    if (rule === undefined)
        return undefined;
    const merged = mergeSamplingParams(style, rule.params);
    if (Object.keys(merged).length === 0)
        return undefined;
    return { body: JSON.stringify({ ...parsed, ...merged }), model, rule };
}
/** Merge `init` headers over the ones carried by a `Request`. */
function mergedHeaders(base, extra) {
    const headers = new Headers(base);
    if (extra !== undefined)
        new Headers(extra).forEach((value, key) => { headers.set(key, value); });
    return headers;
}
/** True when the input is a `Request` (as opposed to a URL or string). */
export function isRequest(input) {
    return typeof Request !== 'undefined' && input instanceof Request;
}
/**
 * Build the replacement `globalThis.fetch`.
 *
 * Two situations must both be handled because other host plugins wrap fetch:
 * a plain `(url, init)` call carries the body in `init.body`, while a wrapper
 * such as the inspector calls the next fetch as `fetch(new Request(...))` with
 * no second argument. In the second case the body lives only on the `Request`,
 * so it is read from a clone and the request is rebuilt with the patched body.
 */
export function createFetchInterceptor(deps) {
    return async function interceptedFetch(input, init) {
        let settings;
        try {
            settings = deps.loadSettings();
        }
        catch {
            settings = emptySettings();
        }
        const url = toUrlString(input);
        const proxyRule = findProxyRule(settings.proxyRules, url);
        let dispatcher;
        if (proxyRule !== undefined) {
            try {
                dispatcher = deps.getAgent(proxyRule.proxyUrl);
            }
            catch (error) {
                deps.debug?.('proxy agent creation failed', error);
            }
        }
        const style = classifyLlmRequest(url);
        let bodyText;
        if (style !== 'none') {
            if (typeof init?.body === 'string') {
                bodyText = init.body;
            }
            else if (isRequest(input)) {
                try {
                    bodyText = await input.clone().text();
                }
                catch (error) {
                    deps.debug?.('request body unavailable', error);
                }
            }
        }
        let nextInput = input;
        let nextInit = init;
        if (bodyText !== undefined && style !== 'none') {
            const applied = applySamplingToBody(bodyText, settings.samplingRules, style);
            if (applied !== undefined) {
                deps.debug?.('applied sampling rule', applied.model, applied.rule.model);
                if (isRequest(input)) {
                    try {
                        const headers = mergedHeaders(input.headers, init?.headers);
                        // The new body may differ in length; undici recomputes the header.
                        headers.delete('content-length');
                        nextInput = new Request(input, { ...init, body: applied.body, headers });
                        nextInit = undefined;
                    }
                    catch (error) {
                        deps.debug?.('request rebuild failed', error);
                    }
                }
                else {
                    nextInit = { ...(init ?? {}), body: applied.body };
                }
            }
        }
        if (dispatcher !== undefined) {
            nextInit = { ...(nextInit ?? {}), dispatcher };
        }
        return deps.baseFetch(nextInput, nextInit);
    };
}
//# sourceMappingURL=intercept.js.map