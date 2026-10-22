// Слова страницы «Строительство → Проектирование продукта → Реверс-инжиниринг» (шаг 539-3; переписаны 556-9). Владелец 2026-10-23:
// «вместо трёх простых строк ты пишешь колбасу текста», «это шесть слов которые ты должен написать: – первая: добавьте адрес сайта
// чтобы начать разбор. – Добавьте страницы которые нужны после авторизации или загрузите скриншот. – – Добавить ещё страницы».
// Строки карточек — его слова; подробности — только под «?». Задача главному агенту — не для страницы, её видно в окне терминала.

import type { ReverseEngineeringWords } from "@/components/element-docs/reverse-engineering.client"

const DICT: Record<"en" | "ru", ReverseEngineeringWords> = {
  en: {
    site: {
      title: "Site address",
      lead: "Add the site address to start the study.",
      placeholder: "tinylaunch.com",
      help: "The agent walks the open pages itself and writes down the sections, scenarios and rules. You can also give an SDK: a link to npm, PyPI or GitHub.",
    },
    page: {
      title: "Page {n}",
      lead: "Add a page you need after signing in, or upload a screenshot.",
      addressPlaceholder: "Page address, if there is one",
      notePlaceholder: "What matters on this page",
      upload: "Upload a screenshot",
      uploading: "Uploading…",
      uploadFailed: "The screenshot did not upload. Try again.",
      removeShot: "Remove the screenshot",
      remove: "Remove the page",
      help: "The agent can't see pages behind a sign-in, so a screenshot stands in for them. If it needs to sign in, it will ask you in the terminal.",
      voiceKey: "Voice needs an OpenAI key",
    },
    addPage: "Add another page",
    start: "Start reverse engineering",
    helpLabel: "Help",
    task: "Study {target} for the product quiz of element {item}. For a site, describe the sections, scenarios, entities and rules; for an SDK, the modules, public functions, API calls and authorization. If you need to sign in to the site, ask me.",
    taskPages: "Pages to keep in mind:",
    taskPage: "Page {n}: {address}",
    taskNoAddress: "no address",
    taskShots: "Screenshots: {links}",
    drawer: { title: "The node's main agent", collapse: "Collapse" },
    reports: {
      title: "Finished studies",
      loading: "Loading…",
      failed: "Could not load the studies. Reload the page.",
      empty: "Nothing yet.",
      open: "Opening the report…",
      openFailed: "Could not open the report.",
      kinds: { website: "Site", "npm-sdk": "SDK", "python-package": "Python", dotnet: ".NET", android: "Android", wasm: "WASM", native: "Library", other: "Study" },
    },
    tool: {
      title: "Studies need the REA program",
      install: "Install",
      installNote: "About a minute and 150 MB of disk.",
      starting: "Starting…",
      running: "Installing, usually about a minute.",
      check: "Check",
      nodeOld: "REA needs Node.js 22.19 or newer, and this computer has {version}. Update Node.js and restart the node.",
      failed: "The install failed ({error}).",
      retry: "Install again",
    },
  },
  ru: {
    site: {
      title: "Адрес сайта",
      lead: "Добавьте адрес сайта, чтобы начать разбор.",
      placeholder: "tinylaunch.com",
      help: "Агент сам пройдёт по открытым страницам и опишет разделы, сценарии и правила. Можно указать и SDK: ссылку на npm, PyPI или GitHub.",
    },
    page: {
      title: "Страница {n}",
      lead: "Добавьте страницу, которая нужна после авторизации, или загрузите скриншот.",
      addressPlaceholder: "Адрес страницы, если есть",
      notePlaceholder: "Что на этой странице важно",
      upload: "Загрузить скриншот",
      uploading: "Загружаю…",
      uploadFailed: "Скриншот не загрузился. Попробуйте ещё раз.",
      removeShot: "Убрать скриншот",
      remove: "Убрать страницу",
      help: "Страницы после входа агент сам не видит, их заменяет скриншот. Если ему понадобится войти, он спросит вас в терминале.",
      voiceKey: "Для голоса нужен ключ OpenAI",
    },
    addPage: "Добавить ещё страницу",
    start: "Начать реверс-инжиниринг",
    helpLabel: "Подсказка",
    task: "Разбери {target} для продуктового квиза элемента {item}. Если это сайт, опиши разделы, сценарии, сущности и правила; если SDK, опиши модули, публичные функции, вызовы API и авторизацию. Если понадобится войти на сайт, спроси меня.",
    taskPages: "Страницы, которые нужно учесть:",
    taskPage: "Страница {n}: {address}",
    taskNoAddress: "адрес не указан",
    taskShots: "Скриншоты: {links}",
    drawer: { title: "Главный агент узла", collapse: "Свернуть" },
    reports: {
      title: "Готовые разборы",
      loading: "Загружаю…",
      failed: "Не удалось загрузить разборы. Обновите страницу.",
      empty: "Пока пусто.",
      open: "Открываю отчёт…",
      openFailed: "Не удалось открыть отчёт.",
      kinds: { website: "Сайт", "npm-sdk": "SDK", "python-package": "Python", dotnet: ".NET", android: "Android", wasm: "WASM", native: "Библиотека", other: "Разбор" },
    },
    tool: {
      title: "Для разбора нужна программа REA",
      install: "Установить",
      installNote: "Около минуты и 150 МБ на диске.",
      starting: "Запускаю…",
      running: "Устанавливаю, обычно около минуты.",
      check: "Проверить",
      nodeOld: "REA нужен Node.js 22.19 или новее, а на этом компьютере {version}. Обновите Node.js и перезапустите узел.",
      failed: "Установка не удалась ({error}).",
      retry: "Установить ещё раз",
    },
  },
}

export function reverseEngineeringUi(lang: string): ReverseEngineeringWords {
  return lang === "ru" ? DICT.ru : DICT.en
}
