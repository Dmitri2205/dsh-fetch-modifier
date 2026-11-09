import { useState, useEffect, useCallback } from "react";
const API_BASE = "/fetch-modifier/api";
export function useSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_BASE}/settings`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setSettings(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setLoading(false);
        }
    }, []);
    const saveSettings = useCallback(async (newSettings) => {
        try {
            setError(null);
            const res = await fetch(`${API_BASE}/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            setSettings(newSettings);
            return true;
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            return false;
        }
    }, []);
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);
    return { settings, loading, error, reload: loadSettings, saveSettings };
}
//# sourceMappingURL=useSettings.js.map