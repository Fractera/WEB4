// Слова страницы «Строительство → Проектирование продукта → Продуктовый квиз» (шаг 536-1). Сам квиз — на языке элемента по
// умолчанию (решение владельца 2026-10-18: «only default lang»); здесь только слова вокруг него.

import type { ProductQuizWords } from "@/components/element-docs/product-quiz.client"
import type { BlockTaskUi } from "@/_tools/block-task/types/block-task"
import { blockTaskUi } from "@/_tools/block-task/types/block-task.i18n"

const DICT: Record<"en" | "ru", ProductQuizWords> = {
  en: {
    loading: "Reading the product quiz…",
    failed: "Could not read the quiz right now. Reload the page.",
    instructionTitle: "Want to add or change something?",
    instructionText:
      "Open the element's agent and say «let's continue the product quiz», or name the number of the item you want to change. The agent asks what you mean, shows what the change touches and edits the quiz only after your «yes».",
    terminal: "Open the terminal",
    telegram: "Write to the bot in Telegram",
    counters: "Confirmed {confirmed} of {total} · open questions {questions}",
    language: "written in the element's default language ({lang})",
    vision: "Vision",
    actors: "Who uses it",
    openQuestions: "Open questions",
    notNow: "Not now",
    slices: "Slices",
    stages: "Stages of development",
    stageWorks: "Works on its own",
    stageReady: "Done when",
    decisions: "The owner's decisions",
    draft: "draft",
    confirmed: "confirmed {date}",
    kinds: { scenario: "Scenario", rule: "Rule", entity: "Entity" },
    acceptance: "Done when",
    dependsOn: "Depends on",
    builtBefore: "Built before the quiz: {where}",
    problems: "The quiz has errors for the agent to fix:",
    emptyTitle: "No product quiz yet",
    emptyText:
      "A product described before its code needs far less rebuilding later. It takes about fifteen minutes of conversation: who uses the element, what each of them does, which rules hold. After that every new wish first shows what it touches.",
    start: "Start deep planning",
    legend: { done: "done", "in-progress": "in progress", planned: "planned", none: "no steps yet" },
    work: {
      done: "Done",
      "in-progress": "In progress: step {step}",
      planned: "Planned: step {step}",
      none: "No steps yet",
    },
    stepState: { planned: "planned", "in-progress": "in progress", done: "done" },
    stepsTitle: "Development steps of this item",
    noSteps: "No step of the element serves this item yet.",
    commit: "commit {commit}",
    ask: "Discuss with the agent",
    askItem: "Product quiz, item {id} «{title}». Ask me what I mean, show what the change touches, and edit the quiz only after my «yes».",
    askVision: "Product quiz, the vision. Ask me what I mean, show what the change touches, and edit the quiz only after my «yes».",
    askQuestion: "Product quiz, open question {id} «{text}». Here is my answer; show what it changes in the quiz.",
    askContinue: "Product quiz: let's continue developing it.",
    askStart: "Product quiz: let's start deep planning of this element.",
    remoteNote:
      "The terminal opens only on this computer. From here, write to the element's bot in Telegram: the window copies a ready phrase with the item number.",
    telegramPhrase: "Phrase for Telegram",
    sendRemote: "Copy for Telegram",
    copied: "Copied. Paste it into the chat with the element's bot.",
    copyFailed: "Could not copy. Select the text in the window and copy it by hand.",
  },
  ru: {
    loading: "Читаю продуктовый квиз…",
    failed: "Не удалось прочитать квиз. Перезагрузите страницу.",
    instructionTitle: "Хотите что-то добавить или изменить?",
    instructionText:
      "Откройте агента элемента и скажите «продолжим продуктовый квиз» или назовите номер пункта, который хотите изменить. Агент уточнит, что вы имели в виду, покажет, что затронет изменение, и поправит квиз только после вашего «да».",
    terminal: "Открыть терминал",
    telegram: "Написать боту в Telegram",
    counters: "Подтверждено {confirmed} из {total} · открытых вопросов {questions}",
    language: "написан на языке элемента по умолчанию ({lang})",
    vision: "Замысел",
    actors: "Кто пользуется",
    openQuestions: "Открытые вопросы",
    notNow: "Не сейчас",
    slices: "Срезы",
    stages: "Этапы разработки",
    stageWorks: "Работает само",
    stageReady: "Готово, когда",
    decisions: "Решения владельца",
    draft: "черновик",
    confirmed: "подтверждён {date}",
    kinds: { scenario: "Сценарий", rule: "Правило", entity: "Сущность" },
    acceptance: "Готово, когда",
    dependsOn: "Зависит от",
    builtBefore: "Построено до квиза: {where}",
    problems: "В квизе есть ошибки, их должен исправить агент:",
    emptyTitle: "Продуктового квиза пока нет",
    emptyText:
      "Продукт, описанный до кода, потом почти не приходится переделывать. Нужно минут пятнадцать разговора: кто пользуется элементом, что делает каждый и какие правила действуют. После этого каждое новое пожелание сначала показывает, что оно затронет.",
    start: "Начать глубокое планирование",
    legend: { done: "завершено", "in-progress": "в работе", planned: "запланировано", none: "шагов ещё нет" },
    work: {
      done: "Завершено",
      "in-progress": "В работе: шаг {step}",
      planned: "Запланировано: шаг {step}",
      none: "Шагов ещё нет",
    },
    stepState: { planned: "запланирован", "in-progress": "в работе", done: "завершён" },
    stepsTitle: "Шаги разработки этого пункта",
    noSteps: "Ни один шаг элемента пока не служит этому пункту.",
    commit: "коммит {commit}",
    ask: "Обсудить с агентом",
    askItem: "Продуктовый квиз, пункт {id} «{title}». Уточни, что я имею в виду, покажи, что затронет изменение, и поправь квиз только после моего «да».",
    askVision: "Продуктовый квиз, замысел. Уточни, что я имею в виду, покажи, что затронет изменение, и поправь квиз только после моего «да».",
    askQuestion: "Продуктовый квиз, открытый вопрос {id} «{text}». Вот мой ответ; покажи, что он меняет в квизе.",
    askContinue: "Продуктовый квиз: продолжим его развитие.",
    askStart: "Продуктовый квиз: начнём глубокое планирование этого элемента.",
    remoteNote:
      "Терминал открывается только на этом компьютере. Отсюда пишите боту элемента в Telegram: окно скопирует готовую фразу с номером пункта.",
    telegramPhrase: "Фраза для Telegram",
    sendRemote: "Скопировать для Telegram",
    copied: "Скопировано. Вставьте текст в чат с ботом элемента.",
    copyFailed: "Не удалось скопировать. Выделите текст в окне и скопируйте его вручную.",
  },
}

// 536-3: the window of a quiz task — the block-task tool in its note mode with these words (as `rejectTaskUi` does for a preview).
const QUIZ_TASK: Record<"en" | "ru", Partial<BlockTaskUi>> = {
  en: {
    title: "What should the agent do with this?",
    description: "The element's terminal opens with this task ready to send to its agent. Before it changes the quiz, the agent asks what you mean.",
    block: "Task for the agent",
    details: "What you want",
    detailsPlaceholder: "Add, change, remove or ask, in your own words…",
    send: "Open the terminal",
    cancel: "Cancel",
  },
  ru: {
    title: "Что сделать агенту с этим?",
    description: "Откроется терминал элемента, и эта задача уже будет готова к отправке его агенту. Прежде чем менять квиз, агент уточнит, что вы имели в виду.",
    block: "Задача агенту",
    details: "Что вы хотите",
    detailsPlaceholder: "Добавить, изменить, убрать или спросить — своими словами…",
    send: "Открыть терминал",
    cancel: "Отмена",
  },
}

export function quizTaskUi(lang: string): BlockTaskUi {
  return { ...blockTaskUi(lang), ...(lang === "ru" ? QUIZ_TASK.ru : QUIZ_TASK.en) }
}

export function productQuizUi(lang: string): ProductQuizWords {
  return lang === "ru" ? DICT.ru : DICT.en
}
