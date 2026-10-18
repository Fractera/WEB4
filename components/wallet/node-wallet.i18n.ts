// СЛОВА КОШЕЛЬКА УЗЛА (478-3; 530-1 вынесены из `sections/blocks/node-passport.server.tsx`). Кошелёк один на узел (документ Lagrix 19)
// и настраивается из четырёх мест — главная «Паспорта», «Паспорт → Главный кошелёк», «Настройки → Платежи → Web3» главного агента и
// каждого элемента; слова у всех одни. `en` основа, `ru` перевод.

export type NodeWalletWords = {
  title: string
  lead: string
  connected: string
  placeholder: string
  connect: string
  disconnect: string
  badAddress: string
  failed: string
  loading: string
  beforeTitle: string
  before: string[]
  afterTitle: string
  after: string[]
}

const UI: Record<"en" | "ru", NodeWalletWords> = {
  en: {
    title: "Node wallet",
    lead: "The wallet is the node's key and account in one: it is created free in any Ethereum wallet app, with no sign-up anywhere, and its address is the node's name in the network. Every payment of the node's elements goes through it and is recorded for the element and agent that earned it.",
    connected: "Connected:",
    placeholder: "Wallet address, 0x…",
    connect: "Connect",
    disconnect: "Disconnect",
    badAddress: "This is not a wallet address: it starts with 0x and has 40 more characters, 0–9 and a–f.",
    failed: "The node did not save the wallet. Try again.",
    loading: "Asking the node about its wallet…",
    beforeTitle: "Without a wallet",
    before: [
      "The node works on your computer, but it is not in the Lagrix network: its agents cannot be found and do not search through super-nodes.",
      "A wallet costs nothing: any Ethereum wallet app creates one in a minute, and there is no one to register with.",
      "The network's open announcements can be read without a wallet, for free.",
    ],
    afterTitle: "With a wallet",
    after: [
      "The node is in the network: the wallet's address is its name, and its announcements are signed with it.",
      "A search costs $0.01 per result list from a USDC balance in the contract — one price for everyone.",
      "Deals in USDC are protected by escrow; reviews from paid deals build the reputation of each element of the node.",
      "The node pays the network's stamps itself — in ether or in USDC through a third-party paymaster.",
    ],
  },
  ru: {
    title: "Кошелёк узла",
    lead: "Кошелёк — ключ узла и его счёт в одном: создаётся бесплатно в любом приложении-кошельке Ethereum, ни у кого регистрироваться не нужно, а его адрес и есть имя узла в сети. Через него идут все платежи элементов узла, и каждый записан за тем элементом и агентом, который его заработал.",
    connected: "Подключён:",
    placeholder: "Адрес кошелька, 0x…",
    connect: "Подключить",
    disconnect: "Отключить",
    badAddress: "Это не адрес кошелька: он начинается с 0x, и за ним идут ещё 40 знаков — цифры 0–9 и буквы a–f.",
    failed: "Узел не сохранил кошелёк. Попробуйте ещё раз.",
    loading: "Спрашиваю узел о его кошельке…",
    beforeTitle: "Без кошелька",
    before: [
      "Узел работает на вашем компьютере, но в сети Lagrix его нет: его агентов нельзя найти, и сами они не ищут через супер-узлы.",
      "Кошелёк ничего не стоит: любое приложение-кошелёк Ethereum создаёт его за минуту, и ни у кого регистрироваться не нужно.",
      "Открытые объявления сети можно читать и без кошелька — бесплатно.",
    ],
    afterTitle: "С кошельком",
    after: [
      "Узел есть в сети: адрес кошелька — его имя, и объявления подписаны им.",
      "Поиск стоит $0,01 за выдачу из баланса USDC в контракте — одна цена для всех.",
      "Сделки в USDC защищены эскроу; отзывы по оплаченным сделкам складываются в репутацию каждого элемента узла.",
      "Марки сети узел платит сам — эфиром или в USDC через сторонний Paymaster.",
    ],
  },
}

export function nodeWalletUi(lang: string): NodeWalletWords {
  return lang === "ru" ? UI.ru : UI.en
}
