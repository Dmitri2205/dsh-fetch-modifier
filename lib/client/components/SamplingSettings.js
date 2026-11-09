import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function SamplingSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [model, setModel] = useState('');
    const [params, setParams] = useState('{}');
    const [models, setModels] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        Promise.all([
            fetch('/fetch-modifier/api/settings').then(r => r.json()),
            fetch('/fetch-modifier/api/models').then(r => r.json()).catch(() => ({ models: [] }))
        ]).then(([s, m]) => {
            setSettings(s);
            setModels(m.models?.map((x) => x.id) || []);
        }).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
    }, []);
    const save = async () => {
        try {
            const p = JSON.parse(params);
            const newSettings = { ...settings, samplingRules: [...(settings?.samplingRules || []), { model, params: p }] };
            await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
            setSettings(newSettings);
            setModel('');
            setParams('{}');
            setError('');
        }
        catch (e) {
            setError('Ошибка JSON');
        }
    };
    if (loading)
        return _jsx("div", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
    return (_jsxs("div", { style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx("h3", { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0441\u0435\u043C\u043F\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }), _jsxs("label", { children: ["\u041C\u043E\u0434\u0435\u043B\u044C:", _jsxs("select", { value: model, onChange: e => setModel(e.target.value), style: { marginLeft: 8 }, children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C" }), models.map(m => _jsx("option", { value: m, children: m }, m))] })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B (JSON):", _jsx("textarea", { value: params, onChange: e => setParams(e.target.value), rows: 4, style: { width: '100%', marginTop: 4, fontFamily: 'monospace' } })] }), error && _jsx("div", { style: { color: 'red' }, children: error }), _jsx("button", { onClick: save, disabled: !model || !params.trim(), style: { padding: '8px 16px', alignSelf: 'flex-start' }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E" }), _jsx("ul", { children: settings?.samplingRules?.map((r, i) => _jsxs("li", { children: [_jsx("b", { children: r.model }), ": ", JSON.stringify(r.params)] }, i)) })] }));
}
//# sourceMappingURL=SamplingSettings.js.map