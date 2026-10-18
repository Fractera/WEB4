// СЛОВА ПРЕЗЕНТАЦИИ «КАК ЭТО РАБОТАЕТ» (Паспорт). Слово владельца 2026-10-18, коротко (полностью — `/code` `current-steps.md`, запись
// «535»): простым языком, нумерованные списки в три уровня, не больше 1000 слов; начать с того, что это полностью Web4-ready стартер,
// который нативно соединяет обычные (Web2) сервисы с блокчейн-архитектурой Lagrix и приносит заказы со всего мира; около половины — о
// работе в обычной сети (генератор сайтов и приложений, в разы меньше работы модели, быстрее голосом, элементы и устойчивая архитектура);
// карточкой — «панель открывать не обязательно: подключите Telegram и скажите, что сделать»; дома или на выделенном сервере.
// Числа о деньгах — по журналу Lagrix одним чтением (запись 51, шаг 534). `en` основа, `ru` перевод.

export type PresentationPart = { title: string; items: string[] }
export type PresentationSection = { title: string; parts: PresentationPart[] }
export type PresentationWords = { intro: string; card: { title: string; text: string; action: string }; sections: PresentationSection[] }

const UI: Record<'en' | 'ru', PresentationWords> = {
  en: {
    intro:
      'Fractera is a starter that is 100% Web4-ready. From it, a node grows on your computer: a set of elements, each one a separate site or app with its own AI agent. Any real service built for the ordinary web joins the Lagrix network natively — without rewriting — and starts receiving orders from people and agents all over the world.',
    card: {
      title: 'The main thing: you do not have to open this panel',
      text:
        'The menu on the left holds a lot of settings, and you do not have to use any of them. You can never open this panel at all. All you need is to connect your Telegram and tell it what you want to build. You can stay on your phone the whole time and create large, powerful projects that are open to anyone by a link.',
      action: 'Connect Telegram',
    },
    sections: [
      {
        title: '1. Ready for Web4 from the first minute',
        parts: [
          {
            title: '1.1 What «Web4-ready» means',
            items: [
              'Every element is born able to introduce itself to the network: it has an agent card in the open A2A standard, a passport and a place for a wallet.',
              'Nothing has to be rewritten: an ordinary site, shop or service stays what it is, and its agent appears in the Lagrix network next to it.',
              'Any existing web service — bookings, delivery, a CRM, a course — is wrapped into an element and gets its way out into the network.',
            ],
          },
          {
            title: '1.2 How Lagrix brings orders',
            items: [
              'Lagrix is an open discovery network: agents of people and companies look for a provider for any job, in any country.',
              'Your agent answers, agrees on the price and does the work; the payment waits in an escrow contract and arrives in the node wallet.',
              'Every paid deal leaves a review — an honest reputation that cannot be bought, and it is what makes your service known.',
            ],
          },
          {
            title: '1.3 What it costs',
            items: [
              'Connecting an agent and announcing what it can do is free.',
              'The network takes a fee only from a paid deal: 5%. With an element received over F2F, 4% goes to the super-nodes and 1% to the element\'s author; with your own element, all 5% goes to the super-nodes.',
              'A search costs the customer $0.01, a message through a super-node $0.001.',
            ],
          },
        ],
      },
      {
        title: '2. The ordinary web: a generator of sites and apps',
        parts: [
          {
            title: '2.1 What you can build',
            items: [
              'A landing page, a blog, a shop, a personal account, a company\'s internal system, an app with a database and sign-in.',
              'The site is open by a link at once: a temporary Cloudflare address on the first start, later your own domain.',
              'Pages are static and visible to search engines; a copy of the site answers even when your computer is off.',
            ],
          },
          {
            title: '2.2 Why it takes many times less work from the model',
            items: [
              'The project is split into elements: an agent reads only its own element and its instruction, not the whole code.',
              'The basics are already built and shared: sign-in, data, design, blocks, settings and ready-made solutions — the agent connects them instead of writing them again.',
              'Elements agree with each other through an API (i2i), without extra requests to the model.',
            ],
          },
          {
            title: '2.3 Why development is faster',
            items: [
              'A task can be spoken: click a block in the preview, say what to change, and the task goes to that element\'s agent.',
              'Every change is first built in a preview, and you accept it with one button; the live version never breaks.',
              'Every element is kept in its own GitHub repository, so history and rollback are always at hand.',
            ],
          },
          {
            title: '2.4 How something simple grows into something complex',
            items: [
              'A new element is born from the template in a minute, with its own address, agent and instruction.',
              'Elements work together: the site takes payments through one element, bookings through another, messages through a third.',
              'The stable architecture keeps order: dozens of elements do not turn into tangled code, because each has its own borders.',
            ],
          },
        ],
      },
      {
        title: '3. At home or on a dedicated server',
        parts: [
          {
            title: '3.1 A home server',
            items: [
              'The node is made to live at home: it is installed on your computer with one sentence to an agent and runs without an administrator.',
              'You pay nothing for hosting, and the data stays with you.',
              'When the computer is off, visitors see the saved copy of the site.',
            ],
          },
          {
            title: '3.2 Medium and large business',
            items: [
              'When the load grows, the same project moves to a dedicated server.',
              'The same code moves: the elements live in your GitHub repositories and are set up on the server the same way as at home.',
              'Agents, sites and the link with Lagrix keep working without being rebuilt.',
            ],
          },
        ],
      },
    ],
  },
  ru: {
    intro:
      'Fractera — стартер, на 100 % готовый к Web4. Из него на вашем компьютере вырастает узел: набор элементов, и каждый — отдельный сайт или приложение со своим ИИ-агентом. Любой реально существующий сервис, созданный для обычной сети, нативно — без переписывания — входит в сеть Lagrix и начинает получать заказы от людей и агентов со всего мира.',
    card: {
      title: 'Главное: открывать эту панель не обязательно',
      text:
        'В левом меню много настроек, и пользоваться ими не обязательно. Эту панель можно вообще никогда не открывать. Достаточно подключить ваш Telegram и рассказать ему, что вы хотите сделать. Можно всё время оставаться на телефоне и создавать огромные мощные проекты, которые доступны любому по ссылке.',
      action: 'Подключить Telegram',
    },
    sections: [
      {
        title: '1. Готов к Web4 с первой минуты',
        parts: [
          {
            title: '1.1 Что значит «готов к Web4»',
            items: [
              'Каждый элемент с рождения умеет представиться сети: у него есть визитка агента по открытому стандарту A2A, паспорт и место для кошелька.',
              'Ничего не нужно переписывать: обычный сайт, магазин или сервис остаётся собой, а рядом в сети Lagrix появляется его агент.',
              'Любой существующий веб-сервис — запись к мастеру, доставка, CRM, курс — заворачивается в элемент и получает выход в сеть.',
            ],
          },
          {
            title: '1.2 Как Lagrix приносит заказы',
            items: [
              'Lagrix — открытая сеть обнаружения: агенты людей и компаний ищут исполнителя для любого дела в любой стране.',
              'Ваш агент отвечает, договаривается о цене и делает работу; оплата ждёт в контракте эскроу и приходит на кошелёк узла.',
              'Каждая оплаченная сделка оставляет отзыв — честную репутацию, которую нельзя купить, и именно она делает ваш сервис известным.',
            ],
          },
          {
            title: '1.3 Сколько это стоит',
            items: [
              'Подключить агента и рассказать, что он умеет, — бесплатно.',
              'Сеть берёт комиссию только с оплаченной сделки — 5 %. С элементом, полученным по F2F, 4 % идут супер-узлам и 1 % — автору элемента; со своим элементом все 5 % идут супер-узлам.',
              'Поиск стоит заказчику $0,01, сообщение через супер-узел — $0,001.',
            ],
          },
        ],
      },
      {
        title: '2. Обычный интернет: генератор сайтов и приложений',
        parts: [
          {
            title: '2.1 Что можно построить',
            items: [
              'Лендинг, блог, магазин, личный кабинет, внутреннюю систему компании, приложение с базой данных и входом.',
              'Сайт сразу доступен по ссылке: при первом запуске — временный адрес Cloudflare, потом — ваш домен.',
              'Страницы статические и видны поисковикам; копия сайта отвечает, даже когда компьютер выключен.',
            ],
          },
          {
            title: '2.2 Почему модели нужно в разы меньше работы',
            items: [
              'Проект разделён на элементы: агент читает только свой элемент и его инструкцию, а не весь код целиком.',
              'Основа уже построена и общая для всех: вход, данные, дизайн, блоки, настройки, готовые решения — агент подключает их, а не пишет заново.',
              'Элементы договариваются между собой через API (i2i), без лишних запросов к модели.',
            ],
          },
          {
            title: '2.3 Почему разработка идёт быстрее',
            items: [
              'Задачу можно сказать голосом: нажмите на блок в предпросмотре, надиктуйте, что поменять, — и задача уходит агенту этого элемента.',
              'Каждая правка сначала собирается в предпросмотре, и вы принимаете её одной кнопкой; живая версия не ломается.',
              'Каждый элемент хранится в своём репозитории GitHub, поэтому история и откат всегда под рукой.',
            ],
          },
          {
            title: '2.4 Как простое вырастает в сложное',
            items: [
              'Новый элемент рождается из шаблона за минуту — со своим адресом, агентом и инструкцией.',
              'Элементы работают вместе: сайт берёт оплату через один элемент, запись — через другой, сообщения — через третий.',
              'Устойчивая архитектура держит порядок: десятки элементов не превращаются в запутанный код, потому что у каждого свои границы.',
            ],
          },
        ],
      },
      {
        title: '3. Дома или на выделенном сервере',
        parts: [
          {
            title: '3.1 Домашний сервер',
            items: [
              'Узел задуман домашним: он ставится на ваш компьютер одной фразой агенту и работает без администратора.',
              'За хостинг вы не платите, а данные остаются у вас.',
              'Когда компьютер выключен, посетители видят сохранённую копию сайта.',
            ],
          },
          {
            title: '3.2 Средний и крупный бизнес',
            items: [
              'Когда нагрузка растёт, тот же проект переносится на выделенный сервер.',
              'Переезжает тот же код: элементы лежат в ваших репозиториях GitHub и разворачиваются на сервере так же, как дома.',
              'Агенты, сайты и связь с Lagrix продолжают работать без переделки.',
            ],
          },
        ],
      },
    ],
  },
}

export function presentationWords(lang: string): PresentationWords {
  return lang === 'ru' ? UI.ru : UI.en
}
