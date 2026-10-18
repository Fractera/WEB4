// СЛОВА «НАСТРОЙКИ → ПЛАТЕЖИ» (530-1): Web2 — ключи Stripe, Web3 — кошелёк узла. Одни у элемента и у главного агента.
// `en` основа, `ru` перевод.

export type StripeWords = {
  title: string
  lead: string
  restartNote: string
  secretLabel: string
  secretHint: string
  publishableLabel: string
  publishableHint: string
  webhookLabel: string
  webhookHint: string
  isSet: string
  notSet: string
  mode: Record<"test" | "live", string>
  save: string
  saving: string
  saved: string
  failed: string
  errors: Record<string, string>
  loading: string
  loadFailed: string
  howTitle: string
  how: string[]
}

export type PaymentsWords = { stripe: StripeWords; web3ElementNote: string; web3CoreNote: string; notBorn: string }

const UI: Record<"en" | "ru", PaymentsWords> = {
  en: {
    stripe: {
      title: "Stripe keys",
      lead: "Card payments on the site go to your own Stripe account. The keys stay on this computer; the page shows only which of them are set.",
      restartNote: "The site reads the keys when it starts: a new key works after the next start or deploy.",
      secretLabel: "Secret key",
      secretHint: "sk_test_… or sk_live_… (a restricted key rk_… works too). Checked with Stripe before it is saved.",
      publishableLabel: "Publishable key",
      publishableHint: "pk_test_… or pk_live_… — the same mode as the secret key.",
      webhookLabel: "Webhook signing secret",
      webhookHint: "whsec_… — Stripe shows it when you add an endpoint in Developers → Webhooks.",
      isSet: "set",
      notSet: "not set",
      mode: { test: "Test mode: no real money moves.", live: "Live mode: real payments." },
      save: "Save keys",
      saving: "Checking with Stripe…",
      saved: "Saved. Fields stay empty: the values never come back to the page.",
      failed: "Not saved:",
      errors: {
        empty: "fill in at least one key",
        "bad-secret": "the secret key must start with sk_test_, sk_live_, rk_test_ or rk_live_",
        "bad-publishable": "the publishable key must start with pk_test_ or pk_live_",
        "bad-webhook": "the webhook secret must start with whsec_",
        "mode-mismatch": "the secret and publishable keys are from different modes (test and live)",
        "key-rejected": "Stripe rejected the secret key",
        "probe-failed": "Stripe did not answer — try again in a minute",
        "unknown-target": "the element is not born yet",
        "temporary-address": "keys are entered only on this computer or on your own domain, not through a temporary address",
      },
      loading: "Asking which keys are set…",
      loadFailed: "Could not read the keys' state.",
      howTitle: "Where to get the keys",
      how: [
        "Open dashboard.stripe.com → Developers → API keys: the publishable key and the secret key are there; start with Test mode.",
        "For payment events add an endpoint in Developers → Webhooks with the address your site will give for it, and copy its signing secret.",
        "Accepting payments is code of the site: ask the element's agent to build checkout with these keys.",
      ],
    },
    web3ElementNote: "One wallet serves the whole node (Lagrix document 19): this element has no wallet of its own, and every payment it earns is recorded for it.",
    web3CoreNote: "The same wallet is set in «Passport → Main wallet»: one wallet for the node and all its elements.",
    notBorn: "The element is not born yet: it has no folder to keep keys in.",
  },
  ru: {
    stripe: {
      title: "Ключи Stripe",
      lead: "Оплата картой на сайте поступает на ваш собственный аккаунт Stripe. Ключи остаются на этом компьютере; страница показывает только, какие из них заданы.",
      restartNote: "Сайт читает ключи при запуске: новый ключ начнёт действовать после следующего запуска или развёртывания.",
      secretLabel: "Секретный ключ",
      secretHint: "sk_test_… или sk_live_… (подойдёт и ограниченный ключ rk_…). До сохранения проверяется у Stripe.",
      publishableLabel: "Публикуемый ключ",
      publishableHint: "pk_test_… или pk_live_… — того же режима, что и секретный.",
      webhookLabel: "Секрет подписи вебхука",
      webhookHint: "whsec_… — Stripe показывает его, когда вы добавляете адрес в Developers → Webhooks.",
      isSet: "задан",
      notSet: "не задан",
      mode: { test: "Тестовый режим: настоящие деньги не движутся.", live: "Рабочий режим: настоящие платежи." },
      save: "Сохранить ключи",
      saving: "Проверяю у Stripe…",
      saved: "Сохранено. Поля остаются пустыми: значения на страницу не возвращаются никогда.",
      failed: "Не сохранено:",
      errors: {
        empty: "заполните хотя бы один ключ",
        "bad-secret": "секретный ключ начинается с sk_test_, sk_live_, rk_test_ или rk_live_",
        "bad-publishable": "публикуемый ключ начинается с pk_test_ или pk_live_",
        "bad-webhook": "секрет вебхука начинается с whsec_",
        "mode-mismatch": "секретный и публикуемый ключи из разных режимов (test и live)",
        "key-rejected": "Stripe отверг секретный ключ",
        "probe-failed": "Stripe не ответил — попробуйте через минуту",
        "unknown-target": "элемент ещё не родился",
        "temporary-address": "ключи вводятся только на этом компьютере или на вашем домене, не через временный адрес",
      },
      loading: "Спрашиваю, какие ключи заданы…",
      loadFailed: "Не удалось прочитать состояние ключей.",
      howTitle: "Где взять ключи",
      how: [
        "Откройте dashboard.stripe.com → Developers → API keys: там публикуемый и секретный ключи; начните с режима Test.",
        "Для событий оплаты добавьте адрес в Developers → Webhooks — тот, что для этого даст ваш сайт, — и скопируйте его секрет подписи.",
        "Приём оплаты — код сайта: попросите агента элемента построить оплату с этими ключами.",
      ],
    },
    web3ElementNote: "Кошелёк один на весь узел (документ Lagrix 19): своего у элемента нет, а каждый заработанный им платёж записывается за ним.",
    web3CoreNote: "Тот же кошелёк настраивается в «Паспорт → Главный кошелёк»: один на узел и все его элементы.",
    notBorn: "Элемент ещё не родился: у него нет папки, где хранить ключи.",
  },
}

export function paymentsUi(lang: string): PaymentsWords {
  return lang === "ru" ? UI.ru : UI.en
}
