// СЛОВА РАЗДЕЛА «СУПЕР УЗЕЛ» (530-3) — по документам Lagrix 05 §5.6, 06, 09, 14, 15, 17.9, 18.4, 19, записям 32 и 45. `en` основа, `ru` перевод.

export type SuperNodeWords = {
  whatTitle: string
  what: string[]
  needTitle: string
  need: string[]
  status: { none: string; submitted: string; approved: string }
  statusNote: { submitted: string; approved: string }
  apply: string
  withdraw: string
  busy: string
  noWallet: string
  walletLink: string
  checkLink: string
  failed: string
  errors: Record<string, string>
  loading: string
  loadFailed: string
  machine: {
    title: string
    lead: string
    head: [string, string, string, string]
    rows: { cpus: string; aes: string; ram: string; disk: string; free: string; bandwidth: string; ipv4: string; ipv6: string }
    ok: string
    short: string
    notMeasured: string
    verdictOk: string
    verdictShort: string
    homeNote: string
  }
  warnings: { title: string; none: string; deadline: string }
  payouts: {
    head: [string, string, string, string, string]
    kinds: Record<"pool" | "search" | "delivery" | "official-vote" | "violation-reward", string>
    empty: string
    whatTitle: string
    what: string[]
  }
  settings: {
    countryLabel: string
    countryHint: string
    coverageLabel: string
    coverageHint: string
    regionalLabel: string
    regionalHint: string
    listsLabel: string
    listsHint: string
    defaultTitle: string
    defaults: string[]
    defaultNote: string
    save: string
    saved: string
    declarationNote: string
  }
}

const UI: Record<"en" | "ru", SuperNodeWords> = {
  en: {
    whatTitle: "What a super-node is",
    what: [
      "A super-node is a permanent server of the Lagrix network. It keeps the discovery index of the kinds of services it holds, builds search results, keeps the index of receipts and reviews and helps agents connect; payment itself is settled by the escrow contract.",
      "A place is not bought and has no number. When a place opens, nodes whose elements work as providers apply — one application per node wallet. Nodes whose paid work over 12 months lies between 0.75 and 1.25 of the network median are in the window, and the contract puts them in a random order.",
      "The first in the order gets an invitation and 48 hours to deploy the server, catch up the announcements of its kinds and pass the check by agents of the network. Then the place is registered in the contract and the super-node becomes active.",
      "Income: an equal share of each period's fee pool among the super-nodes that passed the quality minimum, $0.01 for every result list it builds and $0.001 for every message it delivers — all in USDC. Each super-node serves about a year and leaves by rotation once its successor is included.",
      "Downtime is not a violation: a switched-off super-node only loses income, and after 30 days unavailable it leaves without a mark. A proven violation — dropped packets, falsified results, forged tables — puts a permanent mark on the node's wallet and closes super-node places to it for good.",
    ],
    needTitle: "What is needed",
    need: [
      "Elements of this node that work as providers and paid work through the network in the window around the median.",
      "The node's main wallet: the application comes from it.",
      "A clean record: no «proven violation» mark on the wallet.",
      "A dedicated server of the Tier-2 profile: 8 vCPU with AES-NI, 16 GB RAM, 500 GB NVMe, 1 Gbit/s unmetered, a static IPv4 and an IPv6 /64.",
    ],
    status: {
      none: "No application yet.",
      submitted: "The application is submitted and waits for approval.",
      approved: "The application is approved and waits for integration.",
    },
    statusNote: {
      submitted: "Until the node is connected to the Lagrix network the application is kept on this node; the contract takes it when a place opens.",
      approved: "You have 48 hours to deploy the server, catch up the announcements and pass the check by agents of the network.",
    },
    apply: "Apply for a place",
    withdraw: "Withdraw the application",
    busy: "Saving…",
    noWallet: "The application comes from the node's wallet, and the node has none yet.",
    walletLink: "Connect the main wallet",
    checkLink: "Check this computer",
    failed: "Not saved:",
    errors: {
      "no-wallet": "connect the node's main wallet first",
      "bad-country": "the country is two letters of ISO 3166-1, for example DE",
      "bad-tag": "tags are lower-case Latin letters, digits and hyphens, up to 200",
      overlap: "the same tag cannot be both accepted and forbidden",
      "bad-list": "lists are links starting with https://, up to 20",
      "temporary-address": "this is changed only on this computer or on your own domain",
    },
    loading: "Asking the node…",
    loadFailed: "The node did not answer.",
    machine: {
      title: "This computer and the Tier-2 profile",
      lead: "Lagrix checks super-nodes by the service they give; the Tier-2 profile is the starting point for a server that passes those checks.",
      head: ["Parameter", "Tier-2", "This computer", "Lagrix"],
      rows: { cpus: "CPU cores", aes: "AES-NI", ram: "Memory", disk: "Disk", free: "Free on disk", bandwidth: "Bandwidth", ipv4: "Static IPv4", ipv6: "IPv6 /64" },
      ok: "satisfies",
      short: "falls short",
      notMeasured: "not measured here",
      verdictOk: "The measured parameters satisfy the Tier-2 profile.",
      verdictShort: "Lagrix is not satisfied: {list}.",
      homeNote: "This is the computer the node runs on. A super-node needs a dedicated server; bandwidth and addresses are checked by the network's agents once it runs.",
    },
    warnings: {
      title: "Warnings from Lagrix",
      none: "No warnings. If the network's checks find that capacity falls short, a warning comes to the operator's point of contact and appears here; if capacity is not added in time, the super-node leaves early, without a mark.",
      deadline: "add capacity by {date}",
    },
    payouts: {
      head: ["Date", "Period", "What for", "Amount, USDC", "Note"],
      kinds: {
        pool: "Share of the period's fee pool",
        search: "Search fee",
        delivery: "Delivery fee",
        "official-vote": "Vote on an «Official» mark",
        "violation-reward": "Proof of a violation",
      },
      empty: "No payouts yet: the network's contracts pay a super-node that holds a place.",
      whatTitle: "What payouts are for",
      what: [
        "Share of the period's fee pool: the network's fee (up to 5% of each deal's network part) is pooled for the period and divided equally among the super-nodes that passed the quality minimum.",
        "Search fee: $0.01 for every result list this super-node built.",
        "Delivery fee: $0.001 for every message it delivered; both come as vouchers with a growing sum, redeemed once a period.",
        "Vote on an «Official» mark: the $100 application fee is divided equally among the nine panel members who voted.",
        "Proof of a violation: whoever proves another super-node's violation receives a reward from the fees.",
      ],
    },
    settings: {
      countryLabel: "Operator's country (ISO 3166-1, two letters)",
      countryHint: "The super-node applies the laws of this country as regional restrictions; the country is published in its declaration with a point of contact.",
      coverageLabel: "Coverage — kinds of services (tags) you accept into the index",
      coverageHint: "Beyond the kinds the super-node must hold. One tag per line, for example legal-advice.",
      regionalLabel: "Regional restrictions — tags you do not take into the index",
      regionalHint: "What the law of your country forbids. Other super-nodes still show them. One tag per line.",
      listsLabel: "Open restriction lists you apply",
      listsHint: "Signed lists of tags anyone can publish; links starting with https://, one per line.",
      defaultTitle: "Prohibited by default for every super-node",
      defaults: [
        "sexual exploitation of children",
        "trafficking in persons",
        "terrorism and its financing",
        "weapons of mass destruction",
        "violence for hire",
        "stolen data and access",
        "malicious software",
      ],
      defaultNote: "This list is fixed in the protocol version: a super-node that shows such announcements fails the quality minimum.",
      save: "Save settings",
      saved: "Saved on the node.",
      declarationNote: "When the super-node runs, these settings are published as the declaration of its relay (NIP-11); until then the node keeps them here.",
    },
  },
  ru: {
    whatTitle: "Что такое супер-узел",
    what: [
      "Супер-узел — постоянный сервер сети Lagrix. Он держит индекс обнаружения тех видов услуг, за которые отвечает, строит выдачу, хранит индекс чеков и отзывов и помогает агентам соединиться; сам платёж рассчитывает контракт условного депонирования.",
      "Место не покупается и не имеет номера. Когда место открывается, заявки подают узлы, чьи элементы работают исполнителями, — одна заявка на кошелёк узла. Узлы, чья оплаченная работа за 12 месяцев лежит между 0,75 и 1,25 медианы сети, попадают в окно, и контракт ставит их в случайный порядок.",
      "Первый в порядке получает приглашение и 48 часов, чтобы развернуть сервер, догнать объявления своих видов услуг и пройти проверку агентами сети. Затем место записывается в контракт, и супер-узел становится активным.",
      "Доход: равная доля котла каждого периода среди супер-узлов, прошедших минимум качества, $0,01 за каждую построенную выдачу и $0,001 за каждое доставленное сообщение — всё в USDC. Каждый супер-узел служит около года и уходит по ротации, когда его преемник включён.",
      "Простой — не нарушение: выключенный супер-узел только теряет доход, а после 30 дней недоступности уходит без отметки. Доказанное нарушение — сброс пакетов, подделка выдачи, подделка таблиц — ставит постоянную отметку на кошелёк узла и навсегда закрывает ему места супер-узлов.",
    ],
    needTitle: "Что нужно",
    need: [
      "Элементы этого узла, работающие исполнителями, и оплаченная через сеть работа в окне вокруг медианы.",
      "Главный кошелёк узла: заявка подаётся от него.",
      "Чистая запись: на кошельке нет отметки «доказанное нарушение».",
      "Отдельный сервер профиля Tier-2: 8 vCPU с AES-NI, 16 ГБ ОЗУ, 500 ГБ NVMe, 1 Гбит/с без лимита, статический IPv4 и IPv6 /64.",
    ],
    status: {
      none: "Заявки пока нет.",
      submitted: "Заявка подана и ожидает одобрения.",
      approved: "Заявка одобрена и ожидает интеграции.",
    },
    statusNote: {
      submitted: "Пока узел не подключён к сети Lagrix, заявка хранится на этом узле; контракт примет её, когда откроется место.",
      approved: "У вас 48 часов, чтобы развернуть сервер, догнать объявления и пройти проверку агентами сети.",
    },
    apply: "Подать заявку на место",
    withdraw: "Отозвать заявку",
    busy: "Сохраняю…",
    noWallet: "Заявка подаётся от кошелька узла, а у узла его пока нет.",
    walletLink: "Подключить главный кошелёк",
    checkLink: "Проверить этот компьютер",
    failed: "Не сохранено:",
    errors: {
      "no-wallet": "сначала подключите главный кошелёк узла",
      "bad-country": "страна — две буквы ISO 3166-1, например DE",
      "bad-tag": "теги — строчные латинские буквы, цифры и дефис, не больше 200",
      overlap: "один и тот же тег не может быть и принят, и запрещён",
      "bad-list": "списки — ссылки, начинающиеся с https://, не больше 20",
      "temporary-address": "это меняется только на этом компьютере или на вашем домене",
    },
    loading: "Спрашиваю узел…",
    loadFailed: "Узел не ответил.",
    machine: {
      title: "Этот компьютер и профиль Tier-2",
      lead: "Lagrix проверяет супер-узлы по тому, как они обслуживают сеть; профиль Tier-2 — отправная точка для сервера, который эти проверки проходит.",
      head: ["Параметр", "Tier-2", "Этот компьютер", "Lagrix"],
      rows: { cpus: "Ядра процессора", aes: "AES-NI", ram: "Память", disk: "Диск", free: "Свободно на диске", bandwidth: "Канал", ipv4: "Статический IPv4", ipv6: "IPv6 /64" },
      ok: "удовлетворяет",
      short: "не удовлетворяет",
      notMeasured: "здесь не измеряется",
      verdictOk: "Измеренные параметры удовлетворяют профилю Tier-2.",
      verdictShort: "Lagrix не удовлетворён: {list}.",
      homeNote: "Это компьютер, на котором работает узел. Супер-узлу нужен отдельный сервер; канал и адреса проверяют агенты сети, когда он работает.",
    },
    warnings: {
      title: "Предупреждения Lagrix",
      none: "Предупреждений нет. Если проверки сети покажут, что мощности не хватает, предупреждение придёт в точку связи оператора и появится здесь; не добавите мощности вовремя — супер-узел уйдёт досрочно, без отметки.",
      deadline: "добавить мощности до {date}",
    },
    payouts: {
      head: ["Дата", "Период", "За что", "Сумма, USDC", "Примечание"],
      kinds: {
        pool: "Доля котла периода",
        search: "Плата за выдачу",
        delivery: "Плата за доставку",
        "official-vote": "Голос о метке «Официальный»",
        "violation-reward": "Доказательство нарушения",
      },
      empty: "Выплат пока нет: их начисляют контракты сети супер-узлу, который держит место.",
      whatTitle: "За что начисляются выплаты",
      what: [
        "Доля котла периода: комиссия сети (не больше 5 % сетевой части каждой сделки) собирается за период и делится поровну между супер-узлами, прошедшими минимум качества.",
        "Плата за выдачу: $0,01 за каждую выдачу, которую построил этот супер-узел.",
        "Плата за доставку: $0,001 за каждое доставленное сообщение; обе приходят ваучерами с нарастающей суммой и гасятся раз в период.",
        "Голос о метке «Официальный»: плата за заявку $100 делится поровну между проголосовавшими из девяти членов панели.",
        "Доказательство нарушения: доказавший нарушение другого супер-узла получает награду из комиссий.",
      ],
    },
    settings: {
      countryLabel: "Страна оператора (ISO 3166-1, две буквы)",
      countryHint: "Законы этой страны супер-узел применяет как региональные ограничения; страна публикуется в его декларации вместе с точкой связи.",
      coverageLabel: "Покрытие — виды услуг (теги), которые вы принимаете в индекс",
      coverageHint: "Сверх тех видов, за которые супер-узел отвечает обязательно. Один тег в строке, например legal-advice.",
      regionalLabel: "Региональные запреты — теги, которые вы в индекс не берёте",
      regionalHint: "То, что запрещает закон вашей страны. Другие супер-узлы их всё равно покажут. Один тег в строке.",
      listsLabel: "Открытые списки ограничений, которые вы применяете",
      listsHint: "Подписанные списки тегов, которые может опубликовать любой; ссылки https://, по одной в строке.",
      defaultTitle: "Запрещено по умолчанию для всех супер-узлов",
      defaults: [
        "сексуальная эксплуатация детей",
        "торговля людьми",
        "терроризм и его финансирование",
        "оружие массового поражения",
        "насилие по найму",
        "украденные данные и доступы",
        "вредоносные программы",
      ],
      defaultNote: "Этот список зафиксирован в версии протокола: супер-узел, показывающий такие объявления, не проходит минимум качества.",
      save: "Сохранить настройки",
      saved: "Сохранено на узле.",
      declarationNote: "Когда супер-узел работает, эти настройки публикуются декларацией его реле (NIP-11); до тех пор узел хранит их здесь.",
    },
  },
}

export function superNodeUi(lang: string): SuperNodeWords {
  return lang === "ru" ? UI.ru : UI.en
}
