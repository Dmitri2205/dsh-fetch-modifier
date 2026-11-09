"use strict";
var React = require("react");
/* ------------------------------------------------------------------ */
/*  SamplingSettings — настройки правил семплирования                  */
/* ------------------------------------------------------------------ */
function SamplingSettings() {
    var _a = React.useState(null), settings = _a[0], setSettings = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];
    function load() {
        setLoading(true);
        fetch("/fetch-modifier/api/settings")
            .then(function (r) { return r.json(); })
            .then(function (d) { setSettings(d); })
            .catch(function (e) { console.error("[fetch-modifier] load error:", e); })
            .finally(function () { setLoading(false); });
    }
    React.useEffect(function () { load(); }, []);
    function save(newSettings) {
        setLoading(true);
        fetch("/fetch-modifier/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSettings)
        })
            .then(function (r) { return r.json(); })
            .then(function () { load(); })
            .catch(function (e) { console.error("[fetch-modifier] save error:", e); })
            .finally(function () { setLoading(false); });
    }
    if (loading)
        return React.createElement("div", null, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
    var rules = (settings && settings.samplingRules) || [];
    function addRule() {
        var r = { model: "", enabled: true, params: { top_p: 1, top_k: 0, temperature: 1, presence_penalty: 0, frequency_penalty: 0, repeat_penalty: 1 } };
        save(Object.assign(Object.assign({}, settings), { samplingRules: rules.concat([r]) }));
    }
    function updateRule(i, field, value) {
        var updated = rules.map(function (r, idx) {
            if (idx !== i)
                return r;
            if (field === "model")
                return Object.assign(Object.assign({}, r), { model: value });
            if (field === "enabled")
                return Object.assign(Object.assign({}, r), { enabled: value });
            if (field === "params")
                return Object.assign(Object.assign({}, r), { params: value });
            return r;
        });
        save(Object.assign(Object.assign({}, settings), { samplingRules: updated }));
    }
    function removeRule(i) {
        save(Object.assign(Object.assign({}, settings), { samplingRules: rules.filter(function (_, idx) { return idx !== i; }) }));
    }
    return React.createElement("div", { style: { padding: "16px" } }, React.createElement("h3", null, "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u0441\u0435\u043C\u043F\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F"), React.createElement("button", { onClick: addRule, style: { marginBottom: "12px" } }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E"), rules.map(function (rule, i) {
        return React.createElement("div", { key: i, style: { border: "1px solid #ccc", padding: "12px", marginBottom: "8px", borderRadius: "4px" } }, React.createElement("div", null, React.createElement("label", null, "\u041C\u043E\u0434\u0435\u043B\u044C: "), React.createElement("input", { value: rule.model, onChange: function (e) { updateRule(i, "model", e.target.value); }, style: { width: "200px", marginRight: "8px" } }), React.createElement("label", null, React.createElement("input", { type: "checkbox", checked: rule.enabled, onChange: function (e) { updateRule(i, "enabled", e.target.checked); } }), "\u0412\u043A\u043B"), React.createElement("button", { onClick: function () { removeRule(i); }, style: { marginLeft: "8px", color: "red" } }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C")), React.createElement("div", null, React.createElement("label", null, "top_p: "), React.createElement("input", { type: "number", step: "0.1", value: rule.params.top_p, onChange: function (e) { updateRule(i, "params", Object.assign(Object.assign({}, rule.params), { top_p: parseFloat(e.target.value) || 0 })); }, style: { width: "60px", marginRight: "8px" } }), React.createElement("label", null, "top_k: "), React.createElement("input", { type: "number", step: "1", value: rule.params.top_k, onChange: function (e) { updateRule(i, "params", Object.assign(Object.assign({}, rule.params), { top_k: parseInt(e.target.value) || 0 })); }, style: { width: "60px", marginRight: "8px" } }), React.createElement("label", null, "temp: "), React.createElement("input", { type: "number", step: "0.1", value: rule.params.temperature, onChange: function (e) { updateRule(i, "params", Object.assign(Object.assign({}, rule.params), { temperature: parseFloat(e.target.value) || 0 })); }, style: { width: "60px", marginRight: "8px" } })));
    }));
}
/* ------------------------------------------------------------------ */
/*  ProxyRules — настройки прокси-правил                               */
/* ------------------------------------------------------------------ */
function ProxyRules() {
    var _a = React.useState(null), settings = _a[0], setSettings = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];
    function load() {
        setLoading(true);
        fetch("/fetch-modifier/api/settings")
            .then(function (r) { return r.json(); })
            .then(function (d) { setSettings(d); })
            .catch(function (e) { console.error("[fetch-modifier] load error:", e); })
            .finally(function () { setLoading(false); });
    }
    React.useEffect(function () { load(); }, []);
    function save(newSettings) {
        setLoading(true);
        fetch("/fetch-modifier/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSettings)
        })
            .then(function (r) { return r.json(); })
            .then(function () { load(); })
            .catch(function (e) { console.error("[fetch-modifier] save error:", e); })
            .finally(function () { setLoading(false); });
    }
    if (loading)
        return React.createElement("div", null, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
    var rules = (settings && settings.proxyRules) || [];
    function addRule() {
        var r = { pattern: "", proxyUrl: "", enabled: true };
        save(Object.assign(Object.assign({}, settings), { proxyRules: rules.concat([r]) }));
    }
    function updateRule(i, field, value) {
        var updated = rules.map(function (r, idx) {
            if (idx !== i)
                return r;
            var copy = Object.assign({}, r);
            copy[field] = value;
            return copy;
        });
        save(Object.assign(Object.assign({}, settings), { proxyRules: updated }));
    }
    function removeRule(i) {
        save(Object.assign(Object.assign({}, settings), { proxyRules: rules.filter(function (_, idx) { return idx !== i; }) }));
    }
    return React.createElement("div", { style: { padding: "16px" } }, React.createElement("h3", null, "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u0440\u043E\u043A\u0438"), React.createElement("button", { onClick: addRule, style: { marginBottom: "12px" } }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E"), rules.map(function (rule, i) {
        return React.createElement("div", { key: i, style: { border: "1px solid #ccc", padding: "12px", marginBottom: "8px", borderRadius: "4px" } }, React.createElement("div", null, React.createElement("label", null, "\u041F\u0430\u0442\u0442\u0435\u0440\u043D: "), React.createElement("input", { value: rule.pattern, onChange: function (e) { updateRule(i, "pattern", e.target.value); }, style: { width: "250px", marginRight: "8px" } }), React.createElement("label", null, "\u041F\u0440\u043E\u043A\u0438: "), React.createElement("input", { value: rule.proxyUrl, onChange: function (e) { updateRule(i, "proxyUrl", e.target.value); }, style: { width: "200px", marginRight: "8px" } }), React.createElement("label", null, React.createElement("input", { type: "checkbox", checked: rule.enabled, onChange: function (e) { updateRule(i, "enabled", e.target.checked); } }), "\u0412\u043A\u043B"), React.createElement("button", { onClick: function () { removeRule(i); }, style: { marginLeft: "8px", color: "red" } }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C")));
    }));
}
/* ------------------------------------------------------------------ */
/*  CJS factory — обёртка для window.__ModuleLoader__.load            */
/* ------------------------------------------------------------------ */
module.exports = function (require) {
    return {
        inject: ["slots"],
        apply: function (ctx) {
            try {
                ctx.slots.inject('settings.section', function () {
                    ctx.slots.register({
                        name: 'settings.section',
                        id: 'fetch-modifier-sampling',
                        order: 1,
                        label: function () { return 'Sampling Parameters'; }
                    }, SamplingSettings);
                });
            }
            catch (e) {
                console.error('[fetch-modifier] register sampling section failed', e);
            }
            try {
                ctx.slots.inject('settings.section', function () {
                    ctx.slots.register({
                        name: 'settings.section',
                        id: 'fetch-modifier-proxy',
                        order: 2,
                        label: function () { return 'Proxy Rules'; }
                    }, ProxyRules);
                });
            }
            catch (e) {
                console.error('[fetch-modifier] register proxy section failed', e);
            }
        }
    };
};
//# sourceMappingURL=index.js.map