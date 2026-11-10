import React, { useState, useEffect } from 'react';

export function SamplingSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState('');
  const [params, setParams] = useState('{\n  "top_p": 0.8,\n  "top_k": 20,\n  "temperature": 0.7,\n  "presence_penalty": 1.5,\n  "repeat_penalty": 1.0\n}');
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/fetch-modifier/api/settings').then(r => r.json()),
      fetch('/fetch-modifier/api/models').then(r => r.json()).catch(() => ({ models: [] }))
    ]).then(([s, m]) => {
      setSettings(s);
      setModels(m.models?.map((x: any) => x.id) || []);
    }).catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (newSettings: any) => {
    try {
      await fetch('/fetch-modifier/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
      setSettings(newSettings);
      return true;
    } catch (e) {
      setError('Ошибка сохранения');
      return false;
    }
  };

  const addRule = async () => {
    try {
      const p = JSON.parse(params);
      const newSettings = { ...settings, samplingRules: [...(settings?.samplingRules || []), { model, params: p, enabled: true }] };
      if (await save(newSettings)) { setModel(''); setError(''); }
    } catch (e) { setError('Ошибка в JSON'); }
  };

  const removeRule = (index: number) => {
    const newSettings = { ...settings, samplingRules: settings.samplingRules.filter((_: any, i: number) => i !== index) };
    save(newSettings);
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
        <textarea value={params} onChange={e => setParams(e.target.value)} rows={6} style={{ width: '100%', marginTop: 4, fontFamily: 'monospace' }} />
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={addRule} disabled={!model || !params.trim()} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>Добавить правило</button>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {settings?.samplingRules?.map((r: any, i: number) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #444', padding: 8, marginTop: 8, borderRadius: 4 }}>
            <div><b>{r.model}</b>: {JSON.stringify(r.params)}</div>
            <button onClick={() => removeRule(i)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
