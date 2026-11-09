import React, { useState, useEffect } from 'react';

export function ProxyRules() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pattern, setPattern] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/fetch-modifier/api/settings').then(r => r.json()).then(setSettings).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!pattern || !proxyUrl) { setError('Заполните все поля'); return; }
    const newSettings = { ...settings, proxyRules: [...(settings?.proxyRules || []), { id: Math.random().toString(36).slice(2), pattern, proxyUrl, enabled: true }] };
    await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
    setSettings(newSettings); setPattern(''); setProxyUrl(''); setError('');
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3>Правила проксирования</h3>
      <label>Паттерн: <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="notion.com" style={{ marginLeft: 8 }} /></label>
      <label>Прокси: <input value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} placeholder="http://127.0.0.1:7890" style={{ marginLeft: 8 }} /></label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={save} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>Добавить правило</button>
      <ul>{settings?.proxyRules?.map((r: any) => <li key={r.id}><b>{r.pattern}</b> → {r.proxyUrl} ({r.enabled ? 'Вкл' : 'Выкл'})</li>)}</ul>
    </div>
  );
}
