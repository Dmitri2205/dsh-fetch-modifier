# dsh-fetch-modifier

Нативный плагин для DeepSeek Harness, который перехватывает и модифицирует исходящие HTTP-запросы.

## Возможности

- **Модификация параметров семплирования** для OpenAI-совместимых (`/chat/completions`) и Anthropic-совместимых (`/messages`, так говорит провайдер `deepseek`) запросов
- **Проксирование запросов** по паттернам URL через `undici.ProxyAgent`
- **Управление настройками** через UI в разделе Settings
- **Список моделей** из всех зарегистрированных LLM-провайдеров через `GET /fetch-modifier/api/models`

## Как устроен перехват

Плагин подменяет `globalThis.fetch` в `apply()`. Подмена корректно работает в обоих
случаях, которые встречаются в host-процессе:

- обычный вызов `fetch(url, init)` — тело запроса берётся из `init.body`;
- вызов `fetch(new Request(...))` без второго аргумента — так делают другие плагины
  (например, inspector, который оборачивает `fetch` поверх нашего). Тело читается из
  `Request.clone().text()`, после чего `Request` пересобирается с изменённым телом.

Правила:

- паттерн прокси и модель правила — подстроки; пустые паттерны игнорируются (иначе
  `''` совпадал бы с любым URL), правила с `enabled: false` пропускаются;
- для `/messages` применяются только поля, которые принимает Anthropic Messages API
  (`temperature`, `top_p`, `top_k`, `max_tokens`, `stop_sequences`, `metadata`);
  иначе сервер вернул бы 400 на неизвестное поле;
- структурные поля запроса (`model`, `messages`, `stream`, `tools`, `thinking` и т.п.)
  правилом перезаписать нельзя;
- `ProxyAgent` кешируется по URL прокси и закрывается при выгрузке плагина.

Отладка: `DSH_FETCH_MODIFIER_DEBUG=1` включает debug-логи через `ctx.logger('fetch-modifier')`.

## Настройки

Настройки хранятся в `~/.dsh/fetch-modifier.json` и пишутся атомарно
(временный файл с правами `0600` + `rename`). `POST` принимается только с того же
origin (заголовок `Origin` сверяется с `Host`), тело ограничено 64 КиБ.

### Параметры семплирования

Позволяют добавлять/изменять параметры (`temperature`, `top_p` и т.д.) для моделей,
чьё имя содержит указанную подстроку.

### Правила проксирования

Позволяют перенаправлять запросы, URL которых содержит указанную подстроку, через
указанный прокси.

## Установка

```bash
dsh plugin add dsh-fetch-modifier
```

Плагин автоматически подключается через `cordis.patch.yml`.

## Структура

```
dsh-fetch-modifier/
├── package.json
├── cordis.patch.yml
├── README.md
├── tsconfig.json
├── src/
│   ├── server/
│   │   ├── index.ts        # Host: маршруты HTTP API, прокси-агенты, подмена fetch
│   │   └── intercept.ts    # Чистая логика перехвата (тестируется без глобалов)
│   └── client/
│       └── index.tsx       # Client: slots injection, UI
├── test/
│   ├── intercept.test.ts   # Юнит- и интеграционные тесты перехвата
│   └── plugin.test.ts      # Маршруты, origin-проверка, dispose
└── lib/                    # Скомпилированный код
    ├── server/
    │   ├── index.js
    │   └── intercept.js
    └── client.cjs
```

## Тесты

```bash
npm test
```

Тесты используют `node:test` и type stripping Node.js — отдельные зависимости не нужны.
