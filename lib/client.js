window.__ModuleLoader__.load({
  id: 'dsh-fetch-modifier',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
    (function(module, exports, require) {
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/components/SamplingSettings.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function SamplingSettings() {
  const [settings, setSettings] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [model, setModel] = (0, import_react.useState)("");
  const [params, setParams] = (0, import_react.useState)('{\n  "top_p": 0.8,\n  "top_k": 20,\n  "temperature": 0.7,\n  "presence_penalty": 1.5,\n  "repeat_penalty": 1.0\n}');
  const [models, setModels] = (0, import_react.useState)([]);
  const [error, setError] = (0, import_react.useState)("");
  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/fetch-modifier/api/settings").then((r) => r.json()),
      fetch("/fetch-modifier/api/models").then((r) => r.json()).catch(() => ({ models: [] }))
    ]).then(([s, m]) => {
      setSettings(s);
      setModels(m.models?.map((x) => x.id) || []);
    }).catch(() => setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438")).finally(() => setLoading(false));
  };
  (0, import_react.useEffect)(() => {
    load();
  }, []);
  const save = async (newSettings) => {
    try {
      await fetch("/fetch-modifier/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSettings) });
      setSettings(newSettings);
      return true;
    } catch (e) {
      setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F");
      return false;
    }
  };
  const addRule = async () => {
    try {
      const p = JSON.parse(params);
      const newSettings = { ...settings, samplingRules: [...settings?.samplingRules || [], { model, params: p, enabled: true }] };
      if (await save(newSettings)) {
        setModel("");
        setError("");
      }
    } catch (e) {
      setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432 JSON");
    }
  };
  const removeRule = (index) => {
    const newSettings = { ...settings, samplingRules: settings.samplingRules.filter((_, i) => i !== index) };
    save(newSettings);
  };
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16, display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0441\u0435\u043C\u043F\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      "\u041C\u043E\u0434\u0435\u043B\u044C:",
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: model, onChange: (e) => setModel(e.target.value), style: { marginLeft: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C" }),
        models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: m, children: m }, m))
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B (JSON):",
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: params, onChange: (e) => setParams(e.target.value), rows: 6, style: { width: "100%", marginTop: 4, fontFamily: "monospace" } })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "red" }, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: addRule, disabled: !model || !params.trim(), style: { padding: "8px 16px", alignSelf: "flex-start" }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { listStyle: "none", padding: 0 }, children: settings?.samplingRules?.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { style: { display: "flex", justifyContent: "space-between", border: "1px solid #444", padding: 8, marginTop: 8, borderRadius: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: r.model }),
        ": ",
        JSON.stringify(r.params)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removeRule(i), style: { color: "red", background: "transparent", border: "none", cursor: "pointer" }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })
    ] }, i)) })
  ] });
}

// src/client/components/ProxyRules.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function ProxyRules() {
  const [settings, setSettings] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [pattern, setPattern] = (0, import_react2.useState)("");
  const [proxyUrl, setProxyUrl] = (0, import_react2.useState)("http://127.0.0.1:7890");
  const [error, setError] = (0, import_react2.useState)("");
  const load = () => {
    setLoading(true);
    fetch("/fetch-modifier/api/settings").then((r) => r.json()).then(setSettings).catch(() => setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438")).finally(() => setLoading(false));
  };
  (0, import_react2.useEffect)(() => {
    load();
  }, []);
  const save = async (newSettings) => {
    try {
      await fetch("/fetch-modifier/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSettings) });
      setSettings(newSettings);
    } catch (e) {
      setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F");
    }
  };
  const addRule = async () => {
    if (!pattern || !proxyUrl) {
      setError("\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0432\u0441\u0435 \u043F\u043E\u043B\u044F");
      return;
    }
    const newSettings = { ...settings, proxyRules: [...settings?.proxyRules || [], { id: Math.random().toString(36).slice(2), pattern, proxyUrl, enabled: true }] };
    await save(newSettings);
    setPattern("");
    setError("");
  };
  const removeRule = (id) => {
    const newSettings = { ...settings, proxyRules: settings.proxyRules.filter((r) => r.id !== id) };
    save(newSettings);
  };
  const toggleRule = (id) => {
    const newSettings = { ...settings, proxyRules: settings.proxyRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r) };
    save(newSettings);
  };
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { padding: 16, display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u0440\u043E\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
      "\u041F\u0430\u0442\u0442\u0435\u0440\u043D: ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { value: pattern, onChange: (e) => setPattern(e.target.value), placeholder: "notion.com", style: { marginLeft: 8 } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
      "\u041F\u0440\u043E\u043A\u0441\u0438: ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { value: proxyUrl, onChange: (e) => setProxyUrl(e.target.value), placeholder: "http://127.0.0.1:7890", style: { marginLeft: 8 } })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "red" }, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: addRule, style: { padding: "8px 16px", alignSelf: "flex-start" }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u043E" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { style: { listStyle: "none", padding: 0 }, children: settings?.proxyRules?.map((r) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { style: { display: "flex", justifyContent: "space-between", border: "1px solid #444", padding: 8, marginTop: 8, borderRadius: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { opacity: r.enabled ? 1 : 0.5 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: r.pattern }),
        " \u2192 ",
        r.proxyUrl
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => toggleRule(r.id), style: { marginRight: 8 }, children: r.enabled ? "\u0412\u044B\u043A\u043B" : "\u0412\u043A\u043B" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => removeRule(r.id), style: { color: "red", background: "transparent", border: "none", cursor: "pointer" }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })
      ] })
    ] }, r.id)) })
  ] });
}

// src/client/index.tsx
var inject = ["slots"];
function apply(ctx) {
  try {
    ctx.slots.inject("settings.section", () => {
      ctx.slots.register({
        name: "settings.section",
        id: "fetch-modifier-sampling",
        order: 1,
        label: () => "Sampling Parameters"
      }, SamplingSettings);
    });
  } catch (e) {
    console.error("[fetch-modifier] sampling slot error:", e);
  }
  try {
    ctx.slots.inject("settings.section", () => {
      ctx.slots.register({
        name: "settings.section",
        id: "fetch-modifier-proxy",
        order: 2,
        label: () => "Proxy Rules"
      }, ProxyRules);
    });
  } catch (e) {
    console.error("[fetch-modifier] proxy slot error:", e);
  }
}
    })(module, exports, require);
    return module.exports;
  }
});
