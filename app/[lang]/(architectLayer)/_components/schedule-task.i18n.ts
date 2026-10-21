import type { ScheduleTaskWords } from "./schedule-task.client"

// 558: слова «Настроек» двух разделов с расписанием (en и ru; остальные языки — английский).
const BACKUP: Record<string, ScheduleTaskWords> = {
  en: {
    title: "How to back up",
    hint: "Say or type what to copy, how often and where to: «every night copy the whole database to my storage on Backblaze», «every 5 minutes copy only the orders table».",
    placeholder: "What to copy, how often, where to keep the copies…",
    comment: "«Add to development» opens the terminal of this element with your words as the task: the agent builds the copying service and puts its schedule into «Cron events».",
    button: "Add to development",
    taskLead: "Build process: build the backup of this element as the person describes below. The copying service is code (build process: commit, «Preview & Deploy»); its schedule is a record in data/cron.json outside git (working process) and shows up in «Backup → Cron events»; outside services it needs go to «Backup → Tools» (OWN-SERVICE-PROPS/SUBSCRIPTIONS.json, keys only by variable name). Skill: backup-schedule. No personal data in git. The person's words:",
  },
  ru: {
    title: "Как делать резервную копию",
    hint: "Скажите или напишите, что копировать, как часто и куда: «каждую ночь копируй всю базу в моё хранилище на Backblaze», «каждые 5 минут копируй только таблицу заказов».",
    placeholder: "Что копировать, как часто, где хранить копии…",
    comment: "«Добавить в разработку» открывает терминал этого элемента с вашими словами как задачей: агент строит службу копирования и ставит её расписание в «Крон события».",
    button: "Добавить в разработку",
    taskLead: "Build process: построй резервное копирование этого элемента так, как описывает человек ниже. Служба копирования — код (строительный процесс: коммит, «Предпросмотр и развёртывание»); её расписание — запись в data/cron.json вне git (рабочий процесс), она видна в «Резервное копирование → Крон события»; внешние сервисы, которые ей нужны, — в «Резервное копирование → Инструменты» (OWN-SERVICE-PROPS/SUBSCRIPTIONS.json, ключи — только именем переменной). Навык: backup-schedule. Личных данных в git нет. Слова человека:",
  },
}

const AUTOMATION: Record<string, ScheduleTaskWords> = {
  en: {
    title: "What to automate",
    hint: "Say or type which agent or application to run, when, and what decides it: «every morning check the news on my topic; if there is a fitting one, give the blog agent a task to write a post».",
    placeholder: "Which agent to run, on what schedule, on what condition…",
    comment: "«Add to development» opens the main agent's terminal with your words as the task: it builds the scenario and puts its schedule into «Cron events».",
    button: "Add to development",
    taskLead: "Build process: build the automation the person describes below. The scenario is code; its schedule is a record in data/node/main-agent-cron.json outside git and shows up in «Automated management → Cron events»; the work itself goes to the element that does it as a task (npm run task), not done by you. Outside services — in «Automated management → Tools». No personal data in git. The person's words:",
  },
  ru: {
    title: "Что автоматизировать",
    hint: "Скажите или напишите, какого агента или приложение запускать, когда и по какому условию: «каждое утро проверяй новости по моей теме; если нашлась подходящая — дай агенту блога задачу написать пост».",
    placeholder: "Какого агента запускать, по какому расписанию, при каком условии…",
    comment: "«Добавить в разработку» открывает терминал главного агента с вашими словами как задачей: он строит сценарий и ставит его расписание в «Крон события».",
    button: "Добавить в разработку",
    taskLead: "Build process: построй автоматизацию, которую описывает человек ниже. Сценарий — код; его расписание — запись в data/node/main-agent-cron.json вне git, она видна в «Автоматизированное управление → Крон события»; саму работу получает задачей элемент, который её делает (npm run task), а не ты. Внешние сервисы — в «Автоматизированное управление → Инструменты». Личных данных в git нет. Слова человека:",
  },
}

export const backupTaskWords = (lang: string): ScheduleTaskWords => BACKUP[lang] ?? BACKUP.en
export const automationTaskWords = (lang: string): ScheduleTaskWords => AUTOMATION[lang] ?? AUTOMATION.en
