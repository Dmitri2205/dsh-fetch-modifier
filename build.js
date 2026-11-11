import { execSync } from 'node:child_process';
import fs from 'node:fs';

console.log('[1/2] Сборка сервера...');
execSync('npx tsc', { stdio: 'inherit' });

console.log('[2/2] Сборка клиента с оберткой...');
execSync('npx esbuild src/client/index.tsx --bundle --format=cjs --platform=browser --external:react --external:@deepseek-ai/* --outfile=lib/client.cjs', { stdio: 'inherit' });

const raw = fs.readFileSync('lib/client.cjs', 'utf8');
const wrapped = `window.__ModuleLoader__.load({
  id: 'dsh-fetch-modifier',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
    (function(module, exports, require) {
${raw}
    })(module, exports, require);
    return module.exports;
  }
});`;
fs.writeFileSync('lib/client.js', wrapped);
fs.unlinkSync('lib/client.cjs');
console.log('✅ Готово, создан lib/client.js с оберткой');
