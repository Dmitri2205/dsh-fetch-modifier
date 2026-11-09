/**
 * Pure request-interception logic for `dsh-fetch-modifier`.
 *
 * The functions here never touch globals, so both the host plugin and the
 * tests can drive them directly. Keeping the decisions pure is what makes the
 * "did the body actually change?" question answerable without a live server.
 *
 * @module dsh-fetch-modifier/intercept
 */
import type { Dispatcher } from 'undici';
/** One sampling rule: model substring → request-body parameters. */
export interface SamplingRule {
    model: string;
    enabled?: boolean;
    params?: Record<string, unknown>;
    [key: string]: unknown;
}
/** One proxy rule: URL substring → undici proxy URL. */
export interface ProxyRule {
    id?: string;
    pattern: string;
    proxyUrl: string;
    enabled?: boolean;
    [key: string]: unknown;
}
/** Persisted settings shape (`~/.dsh/fetch-modifier.json`). */
export interface Settings {
    samplingRules: SamplingRule[];
    proxyRules: ProxyRule[];
}
/** Request families whose bodies carry sampling parameters. */
export type InterceptStyle = 'openai' | 'anthropic' | 'none';
/** A body the interceptor decided to rewrite. */
export interface AppliedSampling {
    body: string;
    model: string;
    rule: SamplingRule;
}
/** Dependencies of {@link createFetchInterceptor}; injectable for tests. */
export interface FetchInterceptorDeps {
    loadSettings: () => Settings;
    getAgent: (proxyUrl: string) => Dispatcher;
    baseFetch: typeof fetch;
    debug?: (message: string, ...args: unknown[]) => void;
}
/** True for a plain object (not null, not an array). */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
/** Fresh empty settings; never share a module-level object between callers. */
export declare function emptySettings(): Settings;
/**
 * Coerce arbitrary parsed JSON into the settings shape the interceptor trusts.
 * Unknown fields are preserved so the UI does not lose them on a round-trip.
 */
export declare function normalizeSettings(value: unknown): Settings;
/** `fetch` input as a URL string, without assuming which overload the caller used. */
export declare function toUrlString(input: unknown): string;
/** Pathname of an absolute or relative URL, or `undefined` when unparseable. */
export declare function pathnameOf(url: string): string | undefined;
/**
 * Which request family an outgoing URL belongs to.
 *
 * OpenAI-compatible routes end in `/chat/completions`; Anthropic-compatible
 * routes (which is what the DeepSeek provider speaks) end in `/messages`.
 * The DeepSeek adapter posts to `.../messages`, so matching only
 * `/chat/completions` would never fire for the default provider.
 */
export declare function classifyLlmRequest(url: string): InterceptStyle;
/**
 * First enabled proxy rule whose pattern is a non-blank substring of `url`.
 * A blank pattern matches every URL with `String#includes`, so blank rules are
 * skipped instead of swallowing all traffic.
 */
export declare function findProxyRule(rules: readonly ProxyRule[] | undefined, url: string): ProxyRule | undefined;
/**
 * First enabled sampling rule whose non-blank model substring is contained in
 * `model`. A blank rule model would otherwise match every request.
 */
export declare function findSamplingRule(rules: readonly SamplingRule[] | undefined, model: string): SamplingRule | undefined;
/**
 * Filter a rule's parameters down to what the wire protocol accepts.
 *
 * OpenAI-compatible servers take the usual `top_p`/`top_k`/penalty set;
 * Anthropic-compatible servers reject unknown top-level fields, so only the
 * documented sampling fields survive there.
 */
export declare function mergeSamplingParams(style: InterceptStyle, params: Record<string, unknown> | undefined): Record<string, unknown>;
/**
 * Rewrite a JSON request body when its model matches a sampling rule.
 * Returns `undefined` when there is nothing to change (invalid JSON, no model,
 * no matching rule, or no applicable parameter).
 */
export declare function applySamplingToBody(bodyText: string, rules: readonly SamplingRule[] | undefined, style: InterceptStyle): AppliedSampling | undefined;
/** True when the input is a `Request` (as opposed to a URL or string). */
export declare function isRequest(input: unknown): input is Request;
/**
 * Build the replacement `globalThis.fetch`.
 *
 * Two situations must both be handled because other host plugins wrap fetch:
 * a plain `(url, init)` call carries the body in `init.body`, while a wrapper
 * such as the inspector calls the next fetch as `fetch(new Request(...))` with
 * no second argument. In the second case the body lives only on the `Request`,
 * so it is read from a clone and the request is rebuilt with the patched body.
 */
export declare function createFetchInterceptor(deps: FetchInterceptorDeps): typeof fetch;
//# sourceMappingURL=intercept.d.ts.map