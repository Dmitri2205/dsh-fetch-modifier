import React, { useState, useEffect } from 'react';

export function SamplingSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState('');
  const [params, setParams] = useState('{}');
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/fetch-modifier/api/settings').then(r => r.json()),
      fetch('/fetch-modifier/api/models').then(r => r.json()).catch(() => ({ models: [] }))
    ]).then(([s, m]) => {
      setSettings(s);
      setModels(m.models?.map((x: any) => x.id) || []);
    }).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      const p = JSON.parse(params);
      const newSettings = { ...settings, samplingRules: [...(settings?.samplingRules || []), { model, params: p }] };
      await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
      setSettings(newSettings); setModel(''); setParams('{}'); setError('');
    } catch (e) { setError('Ошибка JSON'); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3>Параметры семплирования</h3>
      <label>Модель:
        <select value={model} onChange={e => setModel(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">Выберите модель</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label>Параметры (JSON):
        <textarea value={params} onChange={e => setParams(e.target.value)} rows={4} style={{ width: '100%', marginTop: 4, fontFamily: 'monospace' }} />
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={save} disabled={!model || !params.trim()} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>Добавить правило</button>
      <ul>{settings?.samplingRules?.map((r: any, i: number) => <li key={i}><b>{r.model}</b>: {JSON.stringify(r.params)}</li>)}</ul>
    </div>
  );
}
