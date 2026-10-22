// Слова страницы «Строительство → Проектирование продукта → Реверс-инжиниринг» (шаг 539-3). Тексты прошли навык `humanizer`
// (закон 536). Утверждения о законах — по первоисточникам, прочитанным в шаге 538 (разбор REA в федеральных отчётах); о REA — по
// его документации и замерам 539-2 (Windows: разбор JS работает, отчёт больше 100 МБ, установка около минуты и ~150 МБ).

import type { ReverseEngineeringWords } from "@/components/element-docs/reverse-engineering.client"

const DICT: Record<"en" | "ru", ReverseEngineeringWords> = {
  en: {
    aboutTitle: "More about reverse engineering",
    sections: [
      {
        id: "what",
        title: "What it is",
        paragraphs: [
          "Reverse engineering means studying a finished product whose source code you do not have. Say you like the search with suggestions or the booking form on someone else's site. The element's agent works out how that feature is built, explains it in plain words and shows what each conclusion rests on. Then it writes the same feature in your element with its own code.",
          "For this the node uses REA (Reverse Engineer Anything), an open program under the MIT license. It is installed once into the node's core, and every element uses that one copy.",
        ],
      },
      {
        id: "when",
        title: "When you need it and when you don't",
        paragraphs: [
          "You need it when there is no source: you are looking at someone else's site or app and want to understand how one feature works.",
          "Moving your own project from another Next.js or another framework needs no reverse engineering. You have the source, and the element's agent reads it directly, which is faster and more accurate. Give the agent the path to the project folder or a link to the repository.",
        ],
      },
      {
        id: "law",
        title: "What is allowed and what is not",
        paragraphs: [
          "The law protects a program's code, texts and images. It does not protect the ideas and principles the program is built on. So you may study how someone else's feature works and write your own on the same idea: the EU Software Directive 2009/24 (articles 1(2) and 5(3)) and article 1280 of the Russian Civil Code allow this to anyone who uses the program lawfully.",
        ],
        list: {
          lead: "You may not:",
          items: [
            "copy someone else's code, texts, images or design;",
            "get around sign-in, paywalls, bot protection or any other technical protection;",
            "run someone else's programs on your computer to study them.",
          ],
        },
      },
      {
        id: "terms",
        title: "The site's own rules",
        paragraphs: [
          "Some sites forbid automated collection in their terms of use. Read them before you ask for an analysis: you choose the target and you answer for that choice. This page is not legal advice.",
        ],
      },
      {
        id: "ask",
        title: "How to ask the agent",
        paragraphs: [
          "Open the element's terminal or write to its bot in Telegram. Name the site and the feature, for example: «Find out how the search with suggestions works on example.com and build the same one here».",
          "The agent asks what matters to you, downloads the site's public files and studies them. Its report says what it saw, what each conclusion rests on and what the analysis could not show. Then it proposes how to build the feature with its own code and starts after your «yes».",
          "If REA is not installed yet, the agent asks you to press «Install into the core» on this page.",
        ],
      },
      {
        id: "browser",
        title: "Watching a live page in the browser",
        paragraphs: [
          "The code a site sends to the browser is studied without any extra programs. The agent downloads the files and reads them without running anything.",
          "To see the page at work (which requests go to the server, what changes after a click), REA connects to a Chrome browser that you start yourself in debugging mode. The agent gives you the command. Use a separate Chrome profile that is not signed in to your accounts, and close the browser when the analysis is done.",
        ],
      },
      {
        id: "limits",
        title: "Limits",
        paragraphs: [],
        list: {
          lead: "What REA does not do on this node:",
          items: [
            "Desktop and phone programs (exe, apk and the like) need Ghidra, Hopper or IDA. The node has none of them, and the agent does not analyse such files.",
            "Recovering readable code from minified JavaScript is verified by REA only on Linux. On Windows and macOS the agent works with the structure: modules, the links between them and the request addresses.",
            "A REA report can be larger than 100 MB. The agent reads its summary and its list of limitations.",
            "REA is not connected to agents as a permanent tool. The agent starts it for one analysis and the program exits, so it takes no memory the rest of the time.",
          ],
        },
      },
    ],
    tool: {
      title: "REA in the node's core",
      lead: "The analysis program is installed once for the whole node, and every element uses it.",
      loading: "Checking whether REA is installed…",
      loadFailed: "Could not read REA's state. Reload the page.",
      installed: "Installed, version {version}",
      installedNote: "The element's agent starts it by itself when you ask it to study someone else's site or app.",
      where: "Location",
      notInstalled: "Not installed yet.",
      install: "Install into the core",
      installNote: "Takes about a minute and about 150 MB of disk. Installed once for the whole node.",
      starting: "Starting the install…",
      running: "Installing. It usually takes about a minute.",
      check: "Check",
      nodeOld: "REA needs Node.js 22.19 or newer, and this computer has {version}. Update Node.js and restart the node.",
      failed: "The last install failed ({error}). Try again.",
      retry: "Install again",
      errors: {
        "temporary-address": "Not available on the temporary address. Open the control panel on this computer or on your own domain.",
        network: "No answer from the node. Reload the page.",
      },
    },
    reports: {
      title: "Reports of analyses",
      lead: "Every analysis the node ran with its reverse engineering element. The element is off between tasks; the reports stay in the node.",
      loading: "Reading the reports…",
      failed: "Could not read the reports right now. Reload the page.",
      empty: "No analysis yet. Ask the node's main agent how a site, an app or a package is built.",
      target: "Target",
      open: "Reading the report…",
      openFailed: "Could not read this report.",
    },
  },
  ru: {
    aboutTitle: "Подробнее о реверс-инжиниринге",
    sections: [
      {
        id: "what",
        title: "Что это такое",
        paragraphs: [
          "Реверс-инжиниринг — это разбор готового продукта, исходного кода которого у вас нет. Допустим, на чужом сайте вам понравился поиск с подсказками или форма записи. Агент элемента выясняет, как устроена эта функция, объясняет это простыми словами и показывает, на чём основан каждый вывод. Потом он пишет такую же функцию в вашем элементе своим кодом.",
          "Для разбора узел использует REA (Reverse Engineer Anything), открытую программу под лицензией MIT. Её ставят один раз в ядро узла, и все элементы пользуются этой копией.",
        ],
      },
      {
        id: "when",
        title: "Когда он нужен, а когда нет",
        paragraphs: [
          "Он нужен, когда исходника нет: перед вами чужой сайт или приложение, и вы хотите понять, как сделана конкретная функция.",
          "Свой проект с другого Next.js или другого фреймворка переносится без реверс-инжиниринга. Исходник у вас есть, агент элемента читает его напрямую, и так быстрее и точнее. Дайте агенту путь к папке проекта или ссылку на репозиторий.",
        ],
      },
      {
        id: "law",
        title: "Что можно и чего нельзя",
        paragraphs: [
          "Закон охраняет код, тексты и картинки программы. Идеи и принципы, на которых она построена, он не охраняет. Поэтому изучить, как работает чужая функция, и написать свою по той же идее можно. Тому, кто законно пользуется программой, это разрешают директива ЕС 2009/24 (статьи 1(2) и 5(3)) и статья 1280 Гражданского кодекса РФ.",
        ],
        list: {
          lead: "Нельзя:",
          items: [
            "копировать чужой код, тексты, картинки и оформление;",
            "обходить вход в аккаунт, платный доступ, защиту от ботов и другие технические меры защиты;",
            "запускать чужие программы на своём компьютере ради разбора.",
          ],
        },
      },
      {
        id: "terms",
        title: "Правила самого сайта",
        paragraphs: [
          "Некоторые сайты запрещают автоматический сбор данных в своих условиях использования. Прочитайте их, прежде чем просить разбор: цель выбираете вы, и отвечаете за этот выбор тоже вы. Эта страница не заменяет консультацию юриста.",
        ],
      },
      {
        id: "ask",
        title: "Как попросить агента",
        paragraphs: [
          "Откройте терминал элемента или напишите его боту в Telegram. Назовите сайт и функцию, например: «Разбери, как на example.com устроен поиск с подсказками, и сделай такой же у нас».",
          "Агент уточнит, что для вас важно, скачает публичные файлы сайта и разберёт их. В отчёте он напишет, что увидел, на чём основан каждый вывод и чего разбор не показывает. Затем предложит, как построить функцию своим кодом, и начнёт работу после вашего «да».",
          "Если REA ещё не установлен, агент попросит нажать на этой странице «Установить в ядро».",
        ],
      },
      {
        id: "browser",
        title: "Как посмотреть страницу в работе",
        paragraphs: [
          "Код, который сайт отдаёт браузеру, агент разбирает без дополнительных программ. Он скачивает файлы и читает их, ничего не запуская.",
          "Чтобы увидеть страницу в работе (какие запросы уходят на сервер, что меняется после нажатия), REA подключается к браузеру Chrome, который вы сами запустили в режиме отладки. Команду запуска подскажет агент. Возьмите для этого отдельный профиль Chrome, в котором вы не входили в свои аккаунты, и закройте браузер после разбора.",
        ],
      },
      {
        id: "limits",
        title: "Ограничения",
        paragraphs: [],
        list: {
          lead: "Чего REA на этом узле не делает:",
          items: [
            "Программы для компьютера и телефона (exe, apk и другие) разбираются через Ghidra, Hopper или IDA. На узле их нет, и такие файлы агент не разбирает.",
            "Восстановление читаемого кода из сжатого JavaScript в REA проверено только на Linux. На Windows и macOS агент работает со структурой: модули, связи между ними и адреса запросов.",
            "Отчёт REA может весить больше 100 МБ. Агент читает из него сводку и список ограничений.",
            "REA не подключается к агентам как постоянный инструмент. Агент запускает его на один разбор, программа завершается и в остальное время память не занимает.",
          ],
        },
      },
    ],
    tool: {
      title: "REA в ядре узла",
      lead: "Программа для разбора ставится один раз на весь узел, и ею пользуются все элементы.",
      loading: "Проверяю, установлен ли REA…",
      loadFailed: "Не удалось узнать состояние REA. Обновите страницу.",
      installed: "Установлен, версия {version}",
      installedNote: "Агент элемента запускает его сам, когда вы просите разобрать чужой сайт или приложение.",
      where: "Где лежит",
      notInstalled: "Пока не установлен.",
      install: "Установить в ядро",
      installNote: "Займёт около минуты и примерно 150 МБ на диске. Ставится один раз на весь узел.",
      starting: "Запускаю установку…",
      running: "Идёт установка. Обычно это около минуты.",
      check: "Проверить",
      nodeOld: "REA нужен Node.js 22.19 или новее, а на этом компьютере {version}. Обновите Node.js и перезапустите узел.",
      failed: "Последняя установка не удалась ({error}). Попробуйте ещё раз.",
      retry: "Установить ещё раз",
      errors: {
        "temporary-address": "На временном адресе это недоступно. Откройте пульт на этом компьютере или на своём домене.",
        network: "Узел не ответил. Обновите страницу.",
      },
    },
    reports: {
      title: "Отчёты разбора",
      lead: "Каждый разбор, который узел провёл элементом реверс-инжиниринга. Между задачами элемент выключен, отчёты остаются в узле.",
      loading: "Читаю отчёты…",
      failed: "Не удалось прочитать отчёты. Обновите страницу.",
      empty: "Разборов пока нет. Спросите главного агента узла, как устроен сайт, приложение или пакет.",
      target: "Цель",
      open: "Читаю отчёт…",
      openFailed: "Не удалось прочитать этот отчёт.",
    },
  },
}

export function reverseEngineeringUi(lang: string): ReverseEngineeringWords {
  return lang === "ru" ? DICT.ru : DICT.en
}
