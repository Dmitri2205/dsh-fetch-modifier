export interface SamplingRule {
    model: string;
    params: Record<string, unknown>;
}
export interface ProxyRule {
    id: string;
    pattern: string;
    proxyUrl: string;
    enabled: boolean;
}
export interface FetchModifierSettings {
    samplingRules: SamplingRule[];
    proxyRules: ProxyRule[];
}
export interface ListModelsResponse {
    models: Array<{
        id: string;
        name: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map