import type { FetchModifierSettings } from "../types";
export declare function useSettings(): {
    settings: FetchModifierSettings | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    saveSettings: (newSettings: FetchModifierSettings) => Promise<boolean>;
};
//# sourceMappingURL=useSettings.d.ts.map