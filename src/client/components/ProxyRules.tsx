import React, { useState, useEffect } from 'react';

export function ProxyRules() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pattern, setPattern] = useState('');
  const [proxyUrl, setProxyUrl] = useState('http://127.0.0.1:7890');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/fetch-modifier/api/settings').then(r => r.json()).then(setSettings).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (newSettings: any) => {
    try {
      await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
      setSettings(newSettings);
    } catch (e) { setError('Ошибка сохранения'); }
  };

  const addRule = async () => {
    if (!pattern || !proxyUrl) { setError('Заполните все поля'); return; }
    const newSettings = { ...settings, proxyRules: [...(settings?.proxyRules || []), { id: Math.random().toString(36).slice(2), pattern, proxyUrl, enabled: true }] };
    await save(newSettings);
    setPattern(''); setError('');
  };

  const removeRule = (id: string) => {
    const newSettings = { ...settings, proxyRules: settings.proxyRules.filter((r: any) => r.id !== id) };
    save(newSettings);
  };

  const toggleRule = (id: string) => {
    const newSettings = { ...settings, proxyRules: settings.proxyRules.map((r: any) => r.id === id ? { ...r, enabled: !r.enabled } : r) };
    save(newSettings);
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3>Правила проксирования</h3>
      <label>Паттерн: <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="notion.com" style={{ marginLeft: 8 }} /></label>
      <label>Прокси: <input value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} placeholder="http://127.0.0.1:7890" style={{ marginLeft: 8 }} /></label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={addRule} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>Добавить правило</button>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {settings?.proxyRules?.map((r: any) => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #444', padding: 8, marginTop: 8, borderRadius: 4 }}>
            <div style={{ opacity: r.enabled ? 1 : 0.5 }}><b>{r.pattern}</b> → {r.proxyUrl}</div>
            <div>
              <button onClick={() => toggleRule(r.id)} style={{ marginRight: 8 }}>{r.enabled ? 'Выкл' : 'Вкл'}</button>
              <button onClick={() => removeRule(r.id)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Удалить</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
