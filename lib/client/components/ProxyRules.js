import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function ProxyRules() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pattern, setPattern] = useState('');
    const [proxyUrl, setProxyUrl] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        fetch('/fetch-modifier/api/settings').then(r => r.json()).then(setSettings).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
    }, []);
    const save = async () => {
        if (!pattern || !proxyUrl) {
            setError('Заполните все поля');
            return;
        }
        const newSettings = { ...settings, proxyRules: [...(settings?.proxyRules || []), { id: Math.random().toString(36).slice(2), pattern, proxyUrl, enabled: true }] };
        await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
        setSettings(newSettings);
        setPattern('');
        setProxyUrl('');
        setError('');
    };
    if (loading)
        return _jsx("div", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
    return (_jsxs("div", { style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx("h3", { children: "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u0440\u043E\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }), _jsxs("label", { children: ["\u041F\u0430\u0442\u0442\u0435\u0440\u043D: ", _jsx("input", { value: pattern, onChange: e => setPattern(e.target.value), placeholder: "notion.com", style: { marginLeft: 8 } })] }), _jsxs("label", { children: ["\u041F\u0440\u043E\u043A\u0441\u0438: ", _jsx("input", { value: proxyUrl, onChange: e => setProxyUrl(e.target.value), placeholder: "http://127.0.0.1:7890", style: { marginLeft: 8 } })] }), error && _jsx("div", { style: { color: 'red' }, children: error }), _jsx("button", { onClick: save, style: { padding: '8px 16px', alignSelf: 'flex-start' }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E" }), _jsx("ul", { children: settings?.proxyRules?.map((r) => _jsxs("li", { children: [_jsx("b", { children: r.pattern }), " \u2192 ", r.proxyUrl, " (", r.enabled ? 'Вкл' : 'Выкл', ")"] }, r.id)) })] }));
}
//# sourceMappingURL=ProxyRules.js.map