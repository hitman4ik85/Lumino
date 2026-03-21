import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import { vocabularyService } from "../../../services/vocabularyService.js";
import { authStorage } from "../../../services/authStorage.js";
import SearchIconAsset from "../../../assets/vocabulare/search.svg";
import DeleteIconAsset from "../../../assets/vocabulare/cart.svg";
import styles from "./VocabularyPage.module.css";


function getVocabularyCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-vocabulary-cache:${userKey}`;
}

function readVocabularyCache() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = getVocabularyCacheKey();

    if (!key) {
      return null;
    }

    const raw = window.sessionStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      dueItems: Array.isArray(parsed?.dueItems) ? parsed.dueItems : [],
    };
  } catch {
    return null;
  }
}

function writeVocabularyCache(items, dueItems) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getVocabularyCacheKey();

    if (!key) {
      return;
    }

    window.sessionStorage.setItem(key, JSON.stringify({
      items: Array.isArray(items) ? items : [],
      dueItems: Array.isArray(dueItems) ? dueItems : [],
    }));
  } catch {
    // ignore cache errors
  }
}

const GRAMMAR_TOPICS = [
  {
    key: "tenses",
    title: "Часи",
    panelTitle: "ЧАСИ",
    sharedSections: [
      {
        title: "ШВИДКІ ПІДКАЗКИ ДО ЧАСІВ",
        items: [
          {
            title: "Present Simple:",
            lines: ["always, usually, often, every day", "звички, факти, регулярні дії"],
          },
          {
            title: "Present Continuous:",
            lines: ["now, right now, at the moment", "дія відбувається саме зараз"],
          },
          {
            title: "Past Simple:",
            lines: ["yesterday, last week, ago", "завершена дія в минулому"],
          },
          {
            title: "Future: Will / Going to:",
            lines: ["will — рішення в моменті", "going to — план або намір"],
          },
        ],
      },
    ],
    cards: [
      {
        heading: "PRESENT SIMPLE",
        subtitle: "звички, факти, розклад",
        body: [
          "Форма:",
          "I/you/we/they work",
          "he/she/it works",
          "Коли: завжди, регулярно, правда\nжиття",
          "Маркери: always, usually, often, every\nday, on Mondays",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I work on Monday",
          "Я працюю в понеділок",
          "She likes coffee",
          "Вона любить каву",
        ],
      },
      {
        heading: "PRESENT CONTINUOUS",
        subtitle: "те, що відбувається зараз",
        body: [
          "Форма: am/is/are + V-ing",
          "Коли: просто зараз, тимчасово",
          "Маркери: now, at the moment",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I am working now",
          "Я працюю зараз",
          "They are watching a film",
          "Вони дивляться фільм",
        ],
        exampleContrastLabel: "Контраст:",
        exampleContrast: [
          "I work here (постійно)",
          "I am working here today\n(сьогодні, тимчасово)",
        ],
      },
      {
        heading: "PAST SIMPLE",
        subtitle: "завершене в минулому",
        body: [
          "Форма: V2 / -ed",
          "Коли: факт, що вже закінчився",
          "Маркери: yesterday, last week, in 2023,\nago",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I worked yesterday",
          "Я працювала вчора",
          "We met last year",
          "Ми зустрілися торік",
        ],
      },
      {
        heading: "FUTURE: WILL",
        subtitle: "рішення в моменті, обіцянка",
        body: [
          "Форма: will + V",
          "Коли: вирішив щойно; обіцяю;\nдумаю, що буде",
          "Маркери: I think, probably, now",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I will help you",
          "Я допоможу",
          "It will rain",
          "Думаю, піде дощ",
        ],
      },
      {
        heading: "FUTURE: GOING TO",
        subtitle: "план, намір, очевидний результат",
        body: [
          "Форма: am/is/are + going to + V",
          "Коли: вже вирішив; видно за\nситуацією",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I am going to study tonight",
          "Я збираюся вчитися сьогодні ввечері",
          "Look at the clouds. It’s going to rain",
          "Зараз піде дощ",
        ],
      },
    ],
  },
  {
    key: "questions-negations",
    title: "Питання і заперечення",
    panelTitle: `ПИТАННЯ
ТА
ЗАПЕРЕЧЕННЯ`,
    sharedSections: [
      {
        title: "ПИТАННЯ ТА ЗАПЕРЕЧЕННЯ",
        items: [
          {
            title: "Present Simple:",
            lines: [
              "Do/Does + підмет + V?",
              "Do you work here? / She doesn’t work here",
              "Короткі відповіді: Yes, I do. / No, I don’t.",
              "Yes, she does. / No, she doesn’t.",
            ],
          },
          {
            title: "Past Simple:",
            lines: [
              "Did + підмет + V?",
              "Did you work yesterday? / I didn’t work",
              "Короткі відповіді: Yes, I did. / No, I didn’t.",
              "Yes, he did. / No, he didn’t.",
            ],
          },
          {
            title: "Present Continuous:",
            lines: [
              "Am/Is/Are + підмет + V-ing?",
              "Are you working now? / I’m not working",
              "Короткі відповіді: Yes, I am. / No, I’m not.",
              "Yes, they are. / No, they aren’t.",
            ],
          },
          {
            title: "Future: Will:",
            lines: [
              "Will + підмет + V?",
              "Will you help me? / He won’t be late",
              "Короткі відповіді: Yes, I will. / No, I won’t.",
              "Yes, they will. / No, they won’t.",
            ],
          },
          {
            title: "Future: Going to:",
            lines: [
              "Am/Is/Are + підмет + going to + V?",
              "Are you going to cook tonight? / We aren’t going to move",
              "Короткі відповіді: Yes, I am. / No, I’m not.",
              "Yes, she is. / No, she isn’t.",
            ],
          },
        ],
      },
    ],
    cards: [
      {
        heading: "",
        subtitle: "",
        body: [],
        example: [],
      },
    ],
  },
  {
    key: "modal-verbs",
    title: "Модальні дієслова",
    panelTitle: `МОДАЛЬНІ
ДІЄСЛОВА`,
    cards: [
      {
        heading: "CAN / COULD",
        subtitle: "вміння, можливість, прохання",
        body: [
          "Форма:",
          "can/could + VI",
          "I can swim",
          "Could you help me?",
          "Після modal — без to",
        ],
        exampleLabel: "Приклад:",
        example: [
          "She can speak English",
          "Вона може говорити англійською",
          "Could you open the window?",
          "Відкрийте, будь ласка, вікно",
        ],
        sections: [
          {
            title: "ГОТОВІ КОНСТРУКЦІЇ",
            items: [
              {
                title: "Can / Could:",
                lines: ["Can you help me?", "Could you repeat, please?"],
              },
              {
                title: "Must / Have to:",
                lines: ["I must finish this today", "We have to leave now"],
              },
              {
                title: "Should / Might:",
                lines: ["You should rest more", "It might rain later"],
              },
            ],
          },
        ],
      },
      {
        heading: "SHOULD / MUST",
        subtitle: "порада, обов’язок",
        body: [
          "Форма:",
          "should/must + V1",
          "You should sleep more",
          "We must leave now",
          "Have to — зовнішня необхідність",
        ],
        exampleLabel: "Приклад:",
        example: [
          "You should drink water",
          "Тобі варто пити воду",
          "I have to work today",
          "Мені треба працювати сьогодні",
        ],
        sections: [
          {
            title: "ГОТОВІ КОНСТРУКЦІЇ",
            items: [
              {
                title: "Should:",
                lines: ["You should call her", "You shouldn’t worry"],
              },
              {
                title: "Must / Have to:",
                lines: ["I must study", "She has to go now"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "articles",
    title: "Артиклі a/an/the",
    panelTitle: `АРТИКЛІ
A/AN/THE`,
    cards: [
      {
        heading: "A / AN",
        subtitle: "один з багатьох, вперше",
        body: [
          "Коли:",
          "a book, a car",
          "an apple, an hour",
          "вперше згадуємо предмет",
          "один з багатьох",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I saw a dog in the park",
          "Я побачив собаку в парку",
          "She ate an apple",
          "Вона з’їла яблуко",
        ],
        sections: [
          {
            title: "ПОШИРЕНІ ВИПАДКИ",
            items: [
              {
                title: "Без артикля:",
                lines: ["go to school, have breakfast", "play football, watch TV"],
              },
              {
                title: "A / An:",
                lines: ["a university, an umbrella", "a useful book, an honest man"],
              },
              {
                title: "The:",
                lines: ["the same, the first, the best", "the cinema near my house"],
              },
            ],
          },
        ],
      },
      {
        heading: "THE",
        subtitle: "конкретний, вже відомий",
        body: [
          "Коли:",
          "the sun, the moon",
          "the book on the table",
          "єдиний або вже зрозумілий предмет",
        ],
        exampleLabel: "Приклад:",
        example: [
          "Please close the door",
          "Будь ласка, закрий двері",
          "The movie was great",
          "Фільм був чудовий",
        ],
        sections: [
          {
            title: "ПОШИРЕНІ ВИПАДКИ",
            items: [
              {
                title: "The:",
                lines: ["the first, the best, the same", "the cinema near my house"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "prepositions",
    title: "Прийменники часу і місця",
    panelTitle: `ПРИЙМЕННИКИ
ЧАСУ
І МІСЦЯ`,
    cards: [
      {
        heading: "IN / ON / AT (TIME)",
        subtitle: "час",
        body: [
          "Коли:",
          "in July / in 2025 / in the morning",
          "on Monday / on my birthday",
          "at 5 o’clock / at night",
          "від більшого проміжку до точного часу",
        ],
        exampleLabel: "Приклад:",
        example: [
          "I was born in May",
          "Я народився у травні",
          "We meet at 7",
          "Ми зустрічаємось о сьомій",
        ],
        sections: [
          {
            title: "ШВИДКІ ПІДКАЗКИ",
            items: [
              {
                title: "Time:",
                lines: ["in the evening / on Friday / at noon", "in summer / on the weekend / at midnight"],
              },
              {
                title: "Place:",
                lines: ["in the bag / on the shelf", "under the table / near the window"],
              },
              {
                title: "Напрямок:",
                lines: ["to school / from home", "into the room / onto the roof"],
              },
            ],
          },
        ],
      },
      {
        heading: "IN / ON / AT (PLACE)",
        subtitle: "місце",
        body: [
          "Коли:",
          "in the room / in the bag",
          "on the table / on the wall",
          "at home / at school / at the station",
        ],
        exampleLabel: "Приклад:",
        example: [
          "The keys are on the shelf",
          "Ключі на полиці",
          "She is at work",
          "Вона на роботі",
        ],
        sections: [
          {
            title: "ШВИДКІ ПІДКАЗКИ",
            items: [
              {
                title: "Place:",
                lines: ["in the box / on the desk / at the door", "under the bed / near the window"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "comparison",
    title: "Порівняння прикметників",
    panelTitle: `ПОРІВНЯННЯ
ПРИКМЕТНИКІВ`,
    cards: [
      {
        heading: "COMPARATIVE",
        subtitle: "вищий ступінь",
        body: [
          "Форма:",
          "small → smaller",
          "big → bigger",
          "beautiful → more beautiful",
          "порівняння двох предметів",
        ],
        exampleLabel: "Приклад:",
        example: [
          "My bag is bigger than yours",
          "Моя сумка більша за твою",
          "This task is easier",
          "Це завдання легше",
        ],
        sections: [
          {
            title: "ВИНЯТКИ",
            items: [
              {
                title: "Good / Bad:",
                lines: ["good → better → the best", "bad → worse → the worst"],
              },
              {
                title: "Far:",
                lines: ["far → farther/further", "the farthest / the furthest"],
              },
              {
                title: "Порівняння:",
                lines: ["as tall as / not as tall as", "more interesting than"],
              },
            ],
          },
        ],
      },
      {
        heading: "SUPERLATIVE",
        subtitle: "найвищий ступінь",
        body: [
          "Форма:",
          "small → the smallest",
          "big → the biggest",
          "beautiful → the most beautiful",
          "коли порівнюємо 3+ предмети",
        ],
        exampleLabel: "Приклад:",
        example: [
          "This is the best day",
          "Це найкращий день",
          "She is the most careful student",
          "Вона найуважніша студентка",
        ],
        sections: [
          {
            title: "ВИНЯТКИ",
            items: [
              {
                title: "Good / Bad:",
                lines: ["good → the best", "bad → the worst"],
              },
            ],
          },
        ],
      },
    ],
  },
];

function PlusIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="1" width="4" height="20" rx="1" fill="#26415E" />
      <rect x="1" y="9" width="20" height="4" rx="1" fill="#26415E" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 16.8V20H7.2L17.45 9.75L14.25 6.55L4 16.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12.95 7.85L16.15 11.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13.35 5.95L15.15 4.15C15.55 3.75 16.2 3.75 16.6 4.15L19.85 7.4C20.25 7.8 20.25 8.45 19.85 8.85L18.05 10.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronDownIcon({ opened = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={opened ? "M5 14.5L12 7.5L19 14.5" : "M5 9.5L12 16.5L19 9.5"} stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon({ direction = "right" }) {
  return (
    <svg viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={direction === "left" ? "M10 2L2 10L10 18" : "M2 2L10 10L2 18"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LampIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="14" cy="10" r="8" fill="#A5C7EA" />
      <path d="M9.8 18H18.2L17 22H11L9.8 18Z" fill="#26415E" />
      <path d="M11.6 22.8H16.4" stroke="#26415E" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 4.3C17.2 4.3 19.7 6.8 19.7 10" stroke="#26415E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


function ReviewCloseIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 8L24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 8L8 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ReviewWrongIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 9L23 23" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M23 9L9 23" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function ReviewCorrectIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 17L13.8 23L25 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReviewSkipIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24.5 8.5V23.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M9.5 8.8L22 16L9.5 23.2V8.8Z" fill="currentColor" />
    </svg>
  );
}

function getDueItemsFromVocabulary(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const now = Date.now();

  return items.filter((item) => {
    const nextReviewAt = item?.nextReviewAt || item?.NextReviewAt;

    if (!nextReviewAt) {
      return false;
    }

    const dateValue = new Date(nextReviewAt).getTime();

    if (Number.isNaN(dateValue)) {
      return false;
    }

    return dateValue <= now;
  });
}

function buildErrorText(res, fallback) {
  return String(res?.data?.detail || res?.data?.message || res?.error || fallback || "Сталася помилка");
}

function createReviewKey() {
  return `review_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getPrimaryTranslation(item) {
  if (Array.isArray(item?.translations) && item.translations.length > 0) {
    return item.translations[0];
  }

  return item?.translation || "";
}

function formatWordList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item) {
        return "";
      }

      const word = String(item.word || "").trim();
      const translation = getPrimaryTranslation(item).trim();

      if (word && translation) {
        return `${word} – ${translation}`;
      }

      return word || translation;
    })
    .filter(Boolean);
}

function splitMultiValue(value, separator = ",") {
  return String(value || "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRelativeDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hour}:${minute}`;
}

function getStartOfLocalDay(dateValue) {
  const date = new Date(dateValue);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getReviewBucket(item) {
  const nextReviewAt = item?.nextReviewAt || item?.NextReviewAt;

  if (!nextReviewAt) {
    return "later";
  }

  const date = new Date(nextReviewAt);

  if (Number.isNaN(date.getTime())) {
    return "later";
  }

  const today = getStartOfLocalDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const itemDay = getStartOfLocalDay(date);

  if (itemDay.getTime() <= today.getTime()) {
    return "today";
  }

  if (itemDay.getTime() === tomorrow.getTime()) {
    return "tomorrow";
  }

  if (itemDay.getTime() >= dayAfterTomorrow.getTime()) {
    return "later";
  }

  return "later";
}

function getReviewLevel(item) {
  const reviewCount = Number(item?.reviewCount || 0);

  if (reviewCount >= 4) {
    return 1;
  }

  if (reviewCount >= 2) {
    return 2;
  }

  return 3;
}

function getReviewLaterLabel(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Через N днів:";
  }

  const values = items
    .map((item) => {
      const nextReviewAt = item?.nextReviewAt || item?.NextReviewAt;
      const date = new Date(nextReviewAt);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      const today = getStartOfLocalDay(new Date());
      const itemDay = getStartOfLocalDay(date);
      const diff = Math.round((itemDay.getTime() - today.getTime()) / 86400000);

      return diff >= 2 ? diff : null;
    })
    .filter((item) => item != null);

  if (values.length === 0) {
    return "Через N днів:";
  }

  return `Через ${Math.min(...values)} днів:`;
}

export default function VocabularyContent() {
  const initialCacheRef = useRef(readVocabularyCache());
  const [loading, setLoading] = useState(initialCacheRef.current == null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState(initialCacheRef.current?.items || []);
  const [dueItems, setDueItems] = useState(initialCacheRef.current?.dueItems || []);
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("list");
  const [deleteMode, setDeleteMode] = useState(false);
  const [rightMode, setRightMode] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(0);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [selectedGrammarKey, setSelectedGrammarKey] = useState("");
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [wordInUseOpen, setWordInUseOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", secondaryText: "", onSecondary: null, onPrimary: null });
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewStats, setReviewStats] = useState({ known: 0, unknown: 0, repeat: 0 });
  const [reviewSessionWords, setReviewSessionWords] = useState([]);
  const [wordExampleIndex, setWordExampleIndex] = useState(0);
  const [reviewPlanItemId, setReviewPlanItemId] = useState(0);
  const [reviewPlanPeriod, setReviewPlanPeriod] = useState("today");
  const [reviewPlanDays, setReviewPlanDays] = useState("3");
  const [reviewPlanPage, setReviewPlanPage] = useState(0);
  const [addForm, setAddForm] = useState({
    word: "",
    translation: "",
    partOfSpeech: "",
    transcription: "",
    definition: "",
    example: "",
    synonyms: "",
    idioms: "",
  });
  const [editForm, setEditForm] = useState({
    word: "",
    translation: "",
    partOfSpeech: "",
    transcription: "",
    definition: "",
    example: "",
    synonyms: "",
    idioms: "",
  });

  const selectedGrammar = useMemo(() => GRAMMAR_TOPICS.find((item) => item.key === selectedGrammarKey) || GRAMMAR_TOPICS[0], [selectedGrammarKey]);
  const grammarCard = selectedGrammar.cards[grammarIndex] || selectedGrammar.cards[0];
  const dueIds = useMemo(() => new Set(dueItems.map((item) => item.id)), [dueItems]);
  const dueReviewItems = useMemo(() => {
    return dueItems.slice().sort((a, b) => {
      const aTime = new Date(a?.nextReviewAt || a?.NextReviewAt || 0).getTime();
      const bTime = new Date(b?.nextReviewAt || b?.NextReviewAt || 0).getTime();

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return String(a?.word || "").localeCompare(String(b?.word || ""));
    });
  }, [dueItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items.filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      const translationsText = Array.isArray(item.translations) ? item.translations.join(" ") : "";
      const exampleText = item.example || "";

      return [item.word, item.translation, translationsText, exampleText]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [items, searchValue]);

  const reviewGroups = useMemo(() => {
    const groups = {
      today: [],
      tomorrow: [],
      later: [],
    };

    filteredItems.forEach((item) => {
      groups[getReviewBucket(item)].push(item);
    });

    return groups;
  }, [filteredItems]);

  const levelGroups = useMemo(() => {
    const groups = {
      1: [],
      2: [],
      3: [],
    };

    filteredItems.forEach((item) => {
      groups[getReviewLevel(item)].push(item);
    });

    return groups;
  }, [filteredItems]);

  const reviewPlanItems = useMemo(() => {
    return filteredItems.slice().sort((a, b) => String(a.word || "").localeCompare(String(b.word || "")));
  }, [filteredItems]);

  const reviewPlanPagedItems = useMemo(() => {
    const startIndex = reviewPlanPage * 15;

    return reviewPlanItems.slice(startIndex, startIndex + 15);
  }, [reviewPlanItems, reviewPlanPage]);

  const reviewPlanHasMore = useMemo(() => {
    return (reviewPlanPage + 1) * 15 < reviewPlanItems.length;
  }, [reviewPlanItems.length, reviewPlanPage]);

  const selectedReviewPlanItem = useMemo(() => {
    return items.find((item) => item.id === reviewPlanItemId) || null;
  }, [items, reviewPlanItemId]);



  const showModal = useCallback((message, options = {}) => {
    setModal({
      open: true,
      title: options.title || "",
      message,
      secondaryText: options.secondaryText || "",
      onSecondary: options.onSecondary || null,
      onPrimary: options.onPrimary || null,
    });
  }, []);

  const closeTransientState = useCallback(() => {
    setSearchValue("");
    setDeleteMode(false);
    setSelectedItemId(0);
    setSelectedItemDetails(null);
    setReviewItem(null);
    setReviewQueue([]);
    setReviewIndex(0);
    setReviewStats({ known: 0, unknown: 0, repeat: 0 });
    setReviewSessionWords([]);
    setWordInUseOpen(false);
    setWordExampleIndex(0);
    setReviewPlanItemId(0);
    setReviewPlanPeriod("today");
    setReviewPlanDays("3");
    setReviewPlanPage(0);
    setRightMode("");
    setModal((prev) => (prev.open ? { open: false, title: "", message: "", secondaryText: "", onSecondary: null, onPrimary: null } : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeTransientState();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeTransientState]);

  const loadVocabulary = useCallback(async (keepPanel = false, showBlocking = true) => {
    if (showBlocking) {
      setLoading(true);
    }

    const [itemsRes, dueItemsRes] = await Promise.all([
      vocabularyService.getMyVocabulary(),
      typeof vocabularyService.getDueVocabulary === "function"
        ? vocabularyService.getDueVocabulary()
        : Promise.resolve({ ok: false, data: [] }),
    ]);

    if (!itemsRes.ok) {
      if (showBlocking) {
        setLoading(false);
      }

      setModal({ open: true, title: "Словник", message: buildErrorText(itemsRes, "Не вдалося завантажити словник") });
      return;
    }

    const nextItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
    const nextDueItems = dueItemsRes.ok
      ? (Array.isArray(dueItemsRes.data) ? dueItemsRes.data : [])
      : getDueItemsFromVocabulary(nextItems);

    setItems(nextItems);
    setDueItems(nextDueItems);
    writeVocabularyCache(nextItems, nextDueItems);

    if (!keepPanel && nextItems.length === 0) {
      setRightMode("");
      setSelectedItemId(0);
      setSelectedItemDetails(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const hasCache = initialCacheRef.current != null;
    loadVocabulary(false, !hasCache);
  }, [loadVocabulary]);


  useEffect(() => {
    if (activeFilter !== "review" && rightMode === "reviewPlan") {
      setRightMode("");
    }
  }, [activeFilter, rightMode]);


  const openWordDetails = useCallback(async (item) => {
    if (!item?.vocabularyItemId) {
      return;
    }

    setSaving(true);
    setSelectedItemId(item.id);
    setRightMode("word");
    setWordInUseOpen(true);
    setWordExampleIndex(0);

    const res = await vocabularyService.getItemDetails(item.vocabularyItemId);

    if (!res.ok) {
      setSaving(false);
      setModal({ open: true, title: "Слово", message: buildErrorText(res, "Не вдалося завантажити слово") });
      return;
    }

    setSelectedItemDetails({
      ...res.data,
      userVocabularyId: item.id,
      addedAt: item.addedAt,
      nextReviewAt: item.nextReviewAt,
      reviewCount: item.reviewCount,
      example: item.example,
    });
    setSaving(false);
  }, []);

  const handleOpenGrammar = useCallback((key) => {
    setSelectedGrammarKey(key);
    setGrammarIndex(0);
    setRightMode("grammar");
    setSelectedItemId(0);
    setSelectedItemDetails(null);
  }, []);

  const handleSearchAction = useCallback(() => {
    if (searchValue.trim() && filteredItems.length === 0) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОШУКУ");
    }
  }, [filteredItems.length, searchValue]);

  const handleOpenAdd = useCallback(() => {
    setRightMode("add");
    setSelectedItemId(0);
    setSelectedItemDetails(null);
  }, []);

  const handleDeleteModeToggle = useCallback(() => {
    if (items.length === 0) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ВИДАЛЕННЯ");
      return;
    }

    setDeleteMode((prev) => !prev);
  }, [items.length]);

  const handleDeleteWord = useCallback(async (item) => {
    setSaving(true);
    const res = await vocabularyService.deleteWord(item.id);

    if (!res.ok) {
      setSaving(false);
      setModal({ open: true, title: "Видалення", message: buildErrorText(res, "Не вдалося видалити слово") });
      return;
    }

    if (selectedItemId === item.id) {
      setSelectedItemId(0);
      setSelectedItemDetails(null);
      setRightMode("");
    }

    setSaving(false);
    loadVocabulary(true);
  }, [loadVocabulary, selectedItemId]);

  const handleAddFormChange = useCallback((field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEditFormChange = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleStartEdit = useCallback(() => {
    if (!selectedItemDetails) {
      return;
    }

    setEditForm({
      word: selectedItemDetails.word || "",
      translation: Array.isArray(selectedItemDetails.translations) ? selectedItemDetails.translations.join(", ") : (selectedItemDetails.translation || ""),
      partOfSpeech: selectedItemDetails.partOfSpeech || "",
      transcription: selectedItemDetails.transcription || "",
      definition: selectedItemDetails.definition || "",
      example: Array.isArray(selectedItemDetails.examples) ? selectedItemDetails.examples.join("\n") : "",
      synonyms: Array.isArray(selectedItemDetails.synonyms) ? selectedItemDetails.synonyms.map((item) => item.word).filter(Boolean).join(", ") : "",
      idioms: Array.isArray(selectedItemDetails.idioms) ? selectedItemDetails.idioms.map((item) => item.word).filter(Boolean).join("\n") : "",
    });
    setRightMode("edit");
  }, [selectedItemDetails]);

  useEffect(() => {
    const normalizedWord = addForm.word.trim();

    if (rightMode !== "add") {
      return undefined;
    }

    if (normalizedWord.length === 0) {
      setAddForm((prev) => ({
        ...prev,
        translation: "",
        partOfSpeech: "",
        transcription: "",
        definition: "",
        example: "",
        synonyms: "",
        idioms: "",
      }));
      return undefined;
    }

    if (normalizedWord.length < 2) {
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      const res = await vocabularyService.lookupWord(normalizedWord);

      if (res.status === 204 || !res.ok || !res.data) {
        return;
      }

      setAddForm((prev) => {
        if (prev.word.trim().toLowerCase() !== normalizedWord.toLowerCase()) {
          return prev;
        }

        return {
          ...prev,
          translation: Array.isArray(res.data.translations) ? res.data.translations.join(", ") : (res.data.translation || prev.translation),
          partOfSpeech: res.data.partOfSpeech || prev.partOfSpeech,
          transcription: res.data.transcription || prev.transcription,
          definition: res.data.definition || prev.definition,
          example: Array.isArray(res.data.examples) ? res.data.examples.join("\n") : prev.example,
          synonyms: Array.isArray(res.data.synonyms) ? res.data.synonyms.map((item) => item.word).filter(Boolean).join(", ") : prev.synonyms,
          idioms: Array.isArray(res.data.idioms) ? res.data.idioms.map((item) => item.word).filter(Boolean).join("\n") : prev.idioms,
        };
      });
    }, 400);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [addForm.word, rightMode]);

  const handleAddSubmit = useCallback(async () => {
    if (!addForm.word.trim() || !addForm.translation.trim()) {
      showModal("ВВЕДІТЬ СЛОВО ТА ПЕРЕКЛАД");
      return;
    }

    const translations = splitMultiValue(addForm.translation, ",");
    const examples = addForm.example
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      word: addForm.word.trim(),
      translation: translations[0] || "",
      translations: translations.slice(1),
      partOfSpeech: addForm.partOfSpeech.trim() || null,
      transcription: addForm.transcription.trim() || null,
      definition: addForm.definition.trim() || null,
      example: examples[0] || null,
      examples,
      synonyms: splitMultiValue(addForm.synonyms, ","),
      idioms: addForm.idioms
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    setSaving(true);
    const res = await vocabularyService.addWord(payload);

    if (!res.ok) {
      setSaving(false);
      setModal({ open: true, title: "Додавання", message: buildErrorText(res, "Не вдалося додати слово") });
      return;
    }

    setSaving(false);
    setAddForm({ word: "", translation: "", partOfSpeech: "", transcription: "", definition: "", example: "", synonyms: "", idioms: "" });
    showModal("СЛОВО ДОДАНО");
    loadVocabulary(true);
  }, [addForm, loadVocabulary]);

  const handleEditSubmit = useCallback(async () => {
    if (!selectedItemDetails?.userVocabularyId || !editForm.word.trim() || !editForm.translation.trim()) {
      showModal("ВВЕДІТЬ СЛОВО ТА ПЕРЕКЛАД");
      return;
    }

    const translations = splitMultiValue(editForm.translation, ",");
    const examples = editForm.example.split("\n").map((item) => item.trim()).filter(Boolean);

    setSaving(true);
    const res = await vocabularyService.updateWord(selectedItemDetails.userVocabularyId, {
      word: editForm.word.trim(),
      translation: translations[0] || "",
      translations: translations.slice(1),
      partOfSpeech: editForm.partOfSpeech.trim() || null,
      transcription: editForm.transcription.trim() || null,
      definition: editForm.definition.trim() || null,
      example: examples[0] || null,
      examples,
      synonyms: splitMultiValue(editForm.synonyms, ","),
      idioms: editForm.idioms.split("\n").map((item) => item.trim()).filter(Boolean),
    });

    if (!res.ok) {
      setSaving(false);
      setModal({ open: true, title: "Редагування", message: buildErrorText(res, "Не вдалося зберегти слово") });
      return;
    }

    const detailsRes = await vocabularyService.getItemDetails(selectedItemDetails.id);
    setSaving(false);

    if (detailsRes.ok) {
      setSelectedItemDetails((prev) => ({ ...detailsRes.data, userVocabularyId: prev?.userVocabularyId, addedAt: prev?.addedAt, nextReviewAt: prev?.nextReviewAt, reviewCount: prev?.reviewCount }));
    }

    await loadVocabulary(true);
    setRightMode("word");
  }, [editForm, loadVocabulary, selectedItemDetails, showModal]);

  const handleFilterChange = useCallback((nextFilter) => {
    setActiveFilter(nextFilter);
    setDeleteMode(false);
    setSearchValue("");

    if (nextFilter !== "review" && rightMode === "reviewPlan") {
      setRightMode("");
      setReviewPlanItemId(0);
    }
  }, [rightMode]);

  const handleOpenReviewPlan = useCallback(() => {
    if (items.length === 0) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОВТОРЕННЯ");
      return;
    }

    setActiveFilter("review");
    setRightMode("reviewPlan");
    setReviewPlanPage(0);

    if (reviewPlanItemId === 0 && items[0]?.id) {
      setReviewPlanItemId(items[0].id);
    }
  }, [items, reviewPlanItemId, showModal]);

  const handleSubmitReviewPlan = useCallback(async () => {
    if (!reviewPlanItemId) {
      showModal("ОБЕРІТЬ СЛОВО ЗІ СПИСКУ");
      return;
    }

    const payload = {
      period: reviewPlanPeriod,
    };

    if (reviewPlanPeriod === "days") {
      const daysValue = Number(reviewPlanDays);

      if (!Number.isInteger(daysValue) || daysValue < 2) {
        showModal("ВВЕДІТЬ КІЛЬКІСТЬ ДНІВ ВІД 2");
        return;
      }

      payload.days = daysValue;
    }

    setSaving(true);
    const res = await vocabularyService.scheduleWord(reviewPlanItemId, payload);
    setSaving(false);

    if (!res.ok) {
      setModal({ open: true, title: "Повторення", message: buildErrorText(res, "Не вдалося додати слово до повторення") });
      return;
    }

    await loadVocabulary(true, false);
    setRightMode("");
    setReviewPlanItemId(0);
    setReviewPlanPeriod("today");
    setReviewPlanDays("3");
  }, [loadVocabulary, reviewPlanDays, reviewPlanItemId, reviewPlanPeriod, showModal]);

  const openReviewQueueItem = useCallback(async (queueItem) => {
    if (!queueItem?.vocabularyItemId) {
      setReviewItem(null);
      return;
    }

    setSaving(true);
    const detailsRes = await vocabularyService.getItemDetails(queueItem.vocabularyItemId);
    setSaving(false);

    if (!detailsRes.ok) {
      setReviewItem({
        ...queueItem,
        details: null,
        showTranslation: false,
      });
      setModal({ open: true, title: "Повторення", message: buildErrorText(detailsRes, "Не вдалося завантажити дані слова") });
      return;
    }

    setReviewItem({
      ...queueItem,
      details: detailsRes.data,
      showTranslation: false,
    });
    setWordInUseOpen(false);
    setWordExampleIndex(0);
  }, []);

  const handleOpenReview = useCallback(async () => {
    if (dueReviewItems.length === 0) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОВТОРЕННЯ");
      return;
    }

    setReviewQueue(dueReviewItems);
    setReviewSessionWords(dueReviewItems);
    setReviewIndex(0);
    setReviewStats({ known: 0, unknown: 0, repeat: 0 });
    setRightMode("reviewCard");
    await openReviewQueueItem(dueReviewItems[0]);
  }, [dueReviewItems, openReviewQueueItem, showModal]);

  const handleReviewAction = useCallback(async (action) => {
    if (!reviewItem?.id) {
      return;
    }

    if (action === "flip") {
      setReviewItem((prev) => ({ ...prev, showTranslation: !prev.showTranslation }));
      return;
    }

    setSaving(true);
    const reviewRes = await vocabularyService.reviewWord(reviewItem.id, {
      action,
      isCorrect: action === "correct",
      idempotencyKey: createReviewKey(),
    });

    if (!reviewRes.ok) {
      setSaving(false);
      setModal({ open: true, title: "Повторення", message: buildErrorText(reviewRes, "Не вдалося зберегти результат") });
      return;
    }

    const nextStats = {
      known: reviewStats.known + (action === "correct" ? 1 : 0),
      unknown: reviewStats.unknown + (action === "wrong" ? 1 : 0),
      repeat: reviewStats.repeat + (action === "skip" ? 1 : 0),
    };
    const nextIndex = reviewIndex + 1;

    setReviewStats(nextStats);
    setReviewIndex(nextIndex);

    if (nextIndex >= reviewQueue.length) {
      setSaving(false);
      setReviewItem(null);
      setRightMode("reviewResult");
      loadVocabulary(true, false);
      return;
    }

    const nextQueueItem = reviewQueue[nextIndex];
    const detailsRes = await vocabularyService.getItemDetails(nextQueueItem.vocabularyItemId);
    setSaving(false);

    if (!detailsRes.ok) {
      setReviewItem({
        ...nextQueueItem,
        details: null,
        showTranslation: false,
      });
      setModal({ open: true, title: "Повторення", message: buildErrorText(detailsRes, "Не вдалося завантажити наступне слово") });
      return;
    }

    setReviewItem({
      ...nextQueueItem,
      details: detailsRes.data,
      showTranslation: false,
    });
    setWordInUseOpen(false);
    setWordExampleIndex(0);
    loadVocabulary(true, false);
  }, [loadVocabulary, reviewIndex, reviewItem, reviewQueue, reviewStats]);

  const handleRetryReview = useCallback(async () => {
    if (reviewSessionWords.length > 0) {
      setReviewQueue(reviewSessionWords);
      setReviewIndex(0);
      setReviewStats({ known: 0, unknown: 0, repeat: 0 });
      setRightMode("reviewCard");
      await openReviewQueueItem(reviewSessionWords[0]);
      return;
    }

    await loadVocabulary(true, false);

    const dueRes = typeof vocabularyService.getDueVocabulary === "function"
      ? await vocabularyService.getDueVocabulary()
      : { ok: false, data: [] };
    const nextDueReviewItems = (dueRes.ok ? dueRes.data : dueReviewItems) || [];

    if (nextDueReviewItems.length > 0) {
      const sortedDueReviewItems = nextDueReviewItems.slice().sort((a, b) => {
        const aTime = new Date(a?.nextReviewAt || a?.NextReviewAt || 0).getTime();
        const bTime = new Date(b?.nextReviewAt || b?.NextReviewAt || 0).getTime();

        if (aTime !== bTime) {
          return aTime - bTime;
        }

        return String(a?.word || "").localeCompare(String(b?.word || ""));
      });

      setDueItems(sortedDueReviewItems);
      writeVocabularyCache(items, sortedDueReviewItems);
      setReviewQueue(sortedDueReviewItems);
      setReviewSessionWords(sortedDueReviewItems);
      setReviewIndex(0);
      setReviewStats({ known: 0, unknown: 0, repeat: 0 });
      setRightMode("reviewCard");
      await openReviewQueueItem(sortedDueReviewItems[0]);
      return;
    }

    showModal("НЕМАЄ СЛІВ ДЛЯ ПОВТОРЕННЯ");
  }, [dueReviewItems, items, loadVocabulary, openReviewQueueItem, reviewSessionWords, showModal]);

  const handleOpenSearch = useCallback(() => {
    setRightMode("search");
    setSelectedItemId(0);
    setSelectedItemDetails(null);
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОШУКУ");
      return;
    }

    const foundItem = items.find((item) => {
      const translationsText = Array.isArray(item.translations) ? item.translations.join(" ") : "";
      const exampleText = item.example || "";

      return [item.word, item.translation, translationsText, exampleText]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    if (!foundItem) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОШУКУ");
      return;
    }

    await openWordDetails(foundItem);
  }, [items, openWordDetails, searchValue, showModal]);

  const selectedWordExamples = useMemo(() => {
    if (!selectedItemDetails) {
      return [];
    }

    if (Array.isArray(selectedItemDetails.examples) && selectedItemDetails.examples.length > 0) {
      return selectedItemDetails.examples;
    }

    if (selectedItemDetails.example) {
      return [selectedItemDetails.example];
    }

    return [];
  }, [selectedItemDetails]);

  const currentSelectedWordExample = selectedWordExamples[wordExampleIndex] || "";
  const selectedWordSynonyms = useMemo(() => formatWordList(selectedItemDetails?.synonyms), [selectedItemDetails]);
  const selectedWordIdioms = useMemo(() => formatWordList(selectedItemDetails?.idioms), [selectedItemDetails]);

  const renderWordPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.wordSidebarInner}`}>
      <div className={styles.wordSidebarTitleWrap}>
        <div className={styles.wordModalTitleLine}>
          <div className={styles.sideTitleWord}>{selectedItemDetails?.word || "Слово"}</div>
          {getPrimaryTranslation(selectedItemDetails) ? <div className={styles.wordModalTranslation}>({getPrimaryTranslation(selectedItemDetails)})</div> : null}
        </div>

        {selectedItemDetails?.partOfSpeech ? <div className={styles.wordMetaItalic}>{selectedItemDetails.partOfSpeech}</div> : null}
        {selectedItemDetails?.transcription ? <div className={styles.wordModalTranscription}>{selectedItemDetails.transcription}</div> : null}
      </div>

      {selectedItemDetails?.definition ? (
        <div className={styles.wordInfoBlock}>
          <div className={styles.wordInfoLabelTop}>визначення</div>
          <div className={styles.wordInfoText}>{selectedItemDetails.definition}</div>
        </div>
      ) : null}

      {selectedWordExamples.length > 0 ? (
        <div className={styles.wordInfoBlock}>
          <div className={styles.wordExampleHeader}>
            <div className={styles.wordInfoLabelTop}>приклад</div>
            {selectedWordExamples.length > 1 ? (
              <div className={styles.wordExampleArrows}>
                <button type="button" className={styles.grammarArrowButton} onClick={() => setWordExampleIndex((prev) => prev > 0 ? prev - 1 : selectedWordExamples.length - 1)}>
                  <ArrowIcon direction="left" />
                </button>
                <button type="button" className={styles.grammarArrowButton} onClick={() => setWordExampleIndex((prev) => prev < selectedWordExamples.length - 1 ? prev + 1 : 0)}>
                  <ArrowIcon direction="right" />
                </button>
              </div>
            ) : null}
          </div>
          <div className={styles.wordInfoTextItalic}>{currentSelectedWordExample}</div>
          {getPrimaryTranslation(selectedItemDetails) ? <div className={styles.wordInfoText}>{getPrimaryTranslation(selectedItemDetails)}</div> : null}
        </div>
      ) : null}

      {selectedWordSynonyms.length > 0 ? (
        <div className={styles.wordInfoBlock}>
          <div className={styles.wordInfoLabelTop}>подібні слова/синоніми</div>
          <div className={styles.wordInfoText}>{selectedWordSynonyms.join("\n")}</div>
        </div>
      ) : null}

      {selectedWordIdioms.length > 0 ? (
        <div className={styles.wordInfoBlock}>
          <div className={styles.wordInfoLabelTop}>стійкі вирази, які варто знати</div>
          <div className={styles.wordInfoText}>{selectedWordIdioms.join("\n")}</div>
        </div>
      ) : null}
    </div>
  );

  const renderGrammarBodyLine = (item) => {
    const parts = item.split(":");

    if (parts.length > 1) {
      const label = `${parts[0]}:`;
      const value = parts.slice(1).join(":").trim();

      return (
        <div key={item} className={styles.grammarLine}>
          <span className={styles.grammarLineLabel}>{label}</span>{value ? ` ${value}` : ""}
        </div>
      );
    }

    return (
      <div key={item} className={styles.grammarLine}>
        {item}
      </div>
    );
  };

  const renderGrammarSectionItem = (item, index, items) => {
    if (typeof item === "string") {
      return (
        <div key={index} className={styles.grammarSectionItemWrap}>
          <div className={styles.grammarSectionItem}>{item}</div>
        </div>
      );
    }

    return (
      <div key={`${item.title}_${index}`} className={styles.grammarSectionItemWrap}>
        <div className={styles.grammarSectionItemTitle}>{item.title}</div>
        {item.lines.map((line, lineIndex) => (
          <div key={`${item.title}_${lineIndex}`} className={styles.grammarSectionItemLine}>{line}</div>
        ))}
        {index < items.length - 1 ? <div className={styles.grammarSectionDivider} /> : null}
      </div>
    );
  };

  const renderGrammarPanel = () => {
    const isQuestionsNegations = selectedGrammar.key === "questions-negations";

    return (
      <div className={`${styles.sidePanelInner} ${styles.grammarPanelInner}`}>
        <div className={styles.grammarPanelTitle}>{selectedGrammar.panelTitle || selectedGrammar.title.toUpperCase()}</div>

        {!isQuestionsNegations ? (
          <>
            <div className={styles.grammarInfoWrap}>
              <div className={styles.grammarCard}>
                <div className={styles.grammarCardHeader}>
                  <div>
                    <div className={styles.sideTitle}>{grammarCard.heading}</div>
                    {grammarCard.subtitle ? <div className={styles.grammarSubtitle}>{grammarCard.subtitle}</div> : null}
                  </div>

                  <div className={styles.grammarArrows}>
                    <button
                      type="button"
                      className={styles.grammarArrowButton}
                      onClick={() => setGrammarIndex((prev) => (prev - 1 + selectedGrammar.cards.length) % selectedGrammar.cards.length)}
                      aria-label="Попередній слайд"
                    >
                      <ArrowIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      className={styles.grammarArrowButton}
                      onClick={() => setGrammarIndex((prev) => (prev + 1) % selectedGrammar.cards.length)}
                      aria-label="Наступний слайд"
                    >
                      <ArrowIcon direction="right" />
                    </button>
                  </div>
                </div>

                <div className={styles.grammarBody}>
                  {grammarCard.body.map(renderGrammarBodyLine)}
                </div>
              </div>

              {grammarCard.example.length > 0 ? (
                <div className={`${styles.grammarExampleCard} ${grammarCard.exampleContrast?.length ? styles.grammarExampleCardWide : ""}`}>
                  <div className={styles.grammarExampleColumn}>
                    <div className={styles.grammarExampleLabel}>{grammarCard.exampleLabel || "Приклад:"}</div>
                    <div className={styles.grammarExampleDivider} />
                    {grammarCard.example.map((item, index) => (
                      <div key={item} className={`${styles.grammarExampleLine} ${index % 2 === 0 ? styles.grammarExampleLineAccent : styles.grammarExampleLinePlain}`}>{item}</div>
                    ))}
                  </div>

                  {grammarCard.exampleContrast?.length ? (
                    <>
                      <div className={styles.grammarExampleVerticalDivider} />
                      <div className={styles.grammarExampleColumn}>
                        <div className={styles.grammarExampleLabel}>{grammarCard.exampleContrastLabel}</div>
                        <div className={`${styles.grammarExampleDivider} ${styles.grammarExampleDividerWide}`} />
                        {grammarCard.exampleContrast.map((item) => (
                          <div key={item} className={`${styles.grammarExampleLine} ${styles.grammarExampleLineAccent}`}>{item}</div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.grammarBottomDivider} />
          </>
        ) : (
          <div className={`${styles.grammarBottomDivider} ${styles.grammarBottomDividerQuestions}`} />
        )}

        <div className={`${styles.grammarSections} ${isQuestionsNegations ? styles.grammarSectionsQuestions : ""}`}>
          {(selectedGrammar.sharedSections || grammarCard.sections)?.map((section) => (
            <div key={section.title} className={styles.grammarSection}>
              <div className={styles.grammarSectionTitle}>{section.title}</div>
              {section.items.map((item, index, items) => renderGrammarSectionItem(item, index, items))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSearchPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.searchPanelInner}`}>
      <div className={styles.searchPanelBody}>
        <div className={styles.searchPanelInputBlock}>
          <div className={styles.searchPanelTitle}>Введіть слово для пошуку</div>

          <input
            className={styles.searchPanelInput}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.sideActionDivider} />

        <button type="button" className={styles.searchPanelButton} onClick={handleSearchSubmit}>ЗНАЙТИ</button>
      </div>
    </div>
  );

  const renderAddPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.addPanelInner}`}>
      <div className={styles.addFormLayout}>
        <div className={styles.addRowTop}>
          <label className={`${styles.addField} ${styles.addFieldSmallWide}`}>
            <span className={styles.addFieldLabel}>слово</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={addForm.word} onChange={(e) => handleAddFormChange("word", e.target.value)} />
          </label>

          <label className={`${styles.addField} ${styles.addFieldSmallWide}`}>
            <span className={styles.addFieldLabel}>переклад</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={addForm.translation} onChange={(e) => handleAddFormChange("translation", e.target.value)} />
          </label>
        </div>

        <div className={styles.addRowSecond}>
          <label className={`${styles.addField} ${styles.addFieldSingle}`}>
            <span className={styles.addFieldLabel}>частина мови</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={addForm.partOfSpeech} onChange={(e) => handleAddFormChange("partOfSpeech", e.target.value)} />
          </label>

          <label className={`${styles.addField} ${styles.addFieldSingle}`}>
            <span className={styles.addFieldLabel}>транскрипція</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={addForm.transcription} onChange={(e) => handleAddFormChange("transcription", e.target.value)} />
          </label>
        </div>

        <div className={styles.addLargeFields}>
          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>визначення</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={addForm.definition} onChange={(e) => handleAddFormChange("definition", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>приклад</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={addForm.example} onChange={(e) => handleAddFormChange("example", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>подібні слова/синоніми</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={addForm.synonyms} onChange={(e) => handleAddFormChange("synonyms", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>стійкі вирази, які варто знати</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={addForm.idioms} onChange={(e) => handleAddFormChange("idioms", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>
        </div>

        <div className={styles.addPanelDivider} />

        <button type="button" className={styles.addSubmitButton} onClick={handleAddSubmit}>ДОБАВИТИ</button>
      </div>
    </div>
  );

  const renderEditPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.addPanelInner}`}>
      <button type="button" className={`${styles.sideCloseButton} ${styles.addCloseButton}`} onClick={closeTransientState} aria-label="Закрити">
        <CloseIcon />
      </button>

      <div className={styles.addFormLayout}>
        <div className={styles.addRowTop}>
          <label className={`${styles.addField} ${styles.addFieldSmallWide}`}>
            <span className={styles.addFieldLabel}>слово</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={editForm.word} onChange={(e) => handleEditFormChange("word", e.target.value)} />
          </label>

          <label className={`${styles.addField} ${styles.addFieldSmallWide}`}>
            <span className={styles.addFieldLabel}>переклад</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={editForm.translation} onChange={(e) => handleEditFormChange("translation", e.target.value)} />
          </label>
        </div>

        <div className={styles.addRowSecond}>
          <label className={`${styles.addField} ${styles.addFieldSingle}`}>
            <span className={styles.addFieldLabel}>частина мови</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={editForm.partOfSpeech} onChange={(e) => handleEditFormChange("partOfSpeech", e.target.value)} />
          </label>

          <label className={`${styles.addField} ${styles.addFieldSingle}`}>
            <span className={styles.addFieldLabel}>транскрипція</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaLarge}`} value={editForm.transcription} onChange={(e) => handleEditFormChange("transcription", e.target.value)} />
          </label>
        </div>

        <div className={styles.addLargeFields}>
          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>визначення</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={editForm.definition} onChange={(e) => handleEditFormChange("definition", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>приклад</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={editForm.example} onChange={(e) => handleEditFormChange("example", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>подібні слова/синоніми</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={editForm.synonyms} onChange={(e) => handleEditFormChange("synonyms", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>

          <label className={`${styles.addField} ${styles.addFieldWideAuto}`}>
            <span className={styles.addFieldLabel}>стійкі вирази, які варто знати</span>
            <textarea className={`${styles.addFieldInput} ${styles.addFieldTextareaMulti}`} value={editForm.idioms} onChange={(e) => handleEditFormChange("idioms", e.target.value)} />
          </label>
          <div className={styles.addOptionalNote}>*не обов’язково</div>
        </div>

        <div className={styles.addPanelDivider} />

        <button type="button" className={styles.addSubmitButton} onClick={handleEditSubmit}>ЗБЕРЕГТИ ЗМІНИ</button>
      </div>
    </div>
  );

  const renderReviewGroup = (title, reviewItems) => (
    <div className={styles.reviewGroup}>
      <div className={styles.reviewGroupTitle}>{title}</div>
      {reviewItems.length > 0 ? (
        <div className={styles.wordGrid}>
          {reviewItems.map((item) => {
            const translation = getPrimaryTranslation(item);

            return (
              <div key={item.id} className={styles.wordChipWrap}>
                <button type="button" className={styles.wordChip} onClick={() => openWordDetails(item)}>
                  <span className={styles.wordChipWord}>{item.word}</span>
                  {translation ? <span className={styles.wordChipTranslation}>({translation})</span> : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.reviewGroupEmpty}>немає слів</div>
      )}
    </div>
  );

  const renderLevelColumn = (title, itemsForLevel) => (
    <div className={styles.levelColumn}>
      <div className={styles.levelColumnHeader}>
        <span>{title}</span>
        <span className={styles.levelColumnArrow}><ArrowIcon direction="right" /></span>
      </div>
      <div className={styles.levelColumnGrid}>
        {itemsForLevel.map((item) => {
          const translation = getPrimaryTranslation(item);

          return (
            <button key={item.id} type="button" className={styles.wordChip} onClick={() => openWordDetails(item)}>
              <span className={styles.wordChipWord}>{item.word}</span>
              {translation ? <span className={styles.wordChipTranslation}>({translation})</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderReviewPlanPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.reviewPlanPanelInner}`}>
      <div className={styles.reviewPlanSection}>
        <div className={styles.reviewPlanTitle}>Список слів:</div>
        <div className={styles.reviewPlanTitleLine} />

        <div className={styles.reviewPlanWordsGrid}>
          {reviewPlanPagedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.reviewPlanWordButton} ${reviewPlanItemId === item.id ? styles.reviewPlanWordButtonActive : ""}`}
              onClick={() => setReviewPlanItemId(item.id)}
            >
              {item.word}
            </button>
          ))}
        </div>

        {reviewPlanHasMore ? (
          <button type="button" className={styles.reviewPlanNextButton} onClick={() => setReviewPlanPage((prev) => prev + 1)} aria-label="Наступна сторінка слів">
            <ArrowIcon direction="right" />
          </button>
        ) : null}
      </div>

      <div className={styles.reviewPlanSection}>
        <div className={styles.reviewPlanTitle}>Коли повторити:</div>
        <div className={styles.reviewPlanTitleLine} />

        <div className={styles.reviewPlanOptionRow}>
          <label className={styles.reviewPlanOptionLabel}>
            <span className={styles.reviewPlanOptionText}>Сьогодні</span>
            <input
              type="checkbox"
              className={styles.reviewPlanCheckboxInput}
              checked={reviewPlanPeriod === "today"}
              onChange={() => setReviewPlanPeriod("today")}
            />
            <span className={styles.reviewPlanCheckboxVisual} aria-hidden="true" onClick={() => setReviewPlanPeriod("today")}>
              <span className={styles.reviewPlanCheckboxInner}>
                {reviewPlanPeriod === "today" ? <span className={styles.reviewPlanCheckboxMark}>✓</span> : null}
              </span>
            </span>
          </label>

          <label className={styles.reviewPlanOptionLabel}>
            <span className={styles.reviewPlanOptionText}>Завтра</span>
            <input
              type="checkbox"
              className={styles.reviewPlanCheckboxInput}
              checked={reviewPlanPeriod === "tomorrow"}
              onChange={() => setReviewPlanPeriod("tomorrow")}
            />
            <span className={styles.reviewPlanCheckboxVisual} aria-hidden="true" onClick={() => setReviewPlanPeriod("tomorrow")}>
              <span className={styles.reviewPlanCheckboxInner}>
                {reviewPlanPeriod === "tomorrow" ? <span className={styles.reviewPlanCheckboxMark}>✓</span> : null}
              </span>
            </span>
          </label>
        </div>

        <label className={`${styles.reviewPlanOptionLabel} ${styles.reviewPlanOptionLabelWide}`}>
          <span className={styles.reviewPlanOptionText}>Через N днів</span>
          <div className={styles.reviewPlanDaysWrap}>
            <input type="number" min="2" className={styles.reviewPlanDaysInput} value={reviewPlanDays} onChange={(event) => { setReviewPlanPeriod("days"); setReviewPlanDays(event.target.value); }} />
            <input
              type="checkbox"
              className={styles.reviewPlanCheckboxInput}
              checked={reviewPlanPeriod === "days"}
              onChange={() => setReviewPlanPeriod("days")}
            />
            <span className={styles.reviewPlanCheckboxVisual} aria-hidden="true" onClick={() => setReviewPlanPeriod("days")}>
              <span className={styles.reviewPlanCheckboxInner}>
                {reviewPlanPeriod === "days" ? <span className={styles.reviewPlanCheckboxMark}>✓</span> : null}
              </span>
            </span>
          </div>
        </label>
      </div>

      <div className={styles.reviewPlanBottomDivider} />

      <button type="button" className={styles.addSubmitButton} onClick={handleSubmitReviewPlan}>ДОБАВИТИ</button>
    </div>
  );

  const renderReviewStartPanel = () => null;

  const reviewProgressCurrent = reviewQueue.length === 0
    ? 0
    : Math.min(reviewIndex + 1, reviewQueue.length);

  const renderReviewResultPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.reviewResultPanel}`}>
      <div className={styles.reviewResultDividerTop} />

      <div className={styles.reviewResultCardsWrap}>
        <div className={styles.reviewResultStatCard}>
          <div className={styles.reviewResultStatHead}>Знаю</div>
          <div className={styles.reviewResultStatValue}>{reviewStats.known}</div>
        </div>
        <div className={styles.reviewResultStatCard}>
          <div className={styles.reviewResultStatHead}>Не знаю</div>
          <div className={styles.reviewResultStatValue}>{reviewStats.unknown}</div>
        </div>
        <div className={styles.reviewResultStatCard}>
          <div className={styles.reviewResultStatHead}>Повторити</div>
          <div className={styles.reviewResultStatValue}>{reviewStats.repeat}</div>
        </div>
      </div>

      <div className={styles.reviewResultDividerBottom} />

      <button type="button" className={styles.primaryButton} onClick={handleRetryReview}>ПЕРЕПРОЙТИ</button>
    </div>
  );

  const renderReviewCardPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.reviewDesignerPanel}`}>
      <div className={styles.reviewDesignerTitle}>Повторення слів</div>

      <div className={styles.reviewProgressWrap}>
        <div className={styles.reviewProgressBar}>
          <div
            className={styles.reviewProgressFill}
            style={{ width: `${reviewQueue.length > 0 ? ((reviewIndex + 1) / reviewQueue.length) * 100 : 0}%` }}
          />
        </div>
        <div className={styles.reviewProgressText}>{reviewProgressCurrent}/{reviewQueue.length || 0}</div>
      </div>

      <button type="button" className={`${styles.reviewCardStackButton} ${reviewItem?.showTranslation ? styles.reviewCardStackButtonFlipped : ""}`} onClick={() => handleReviewAction("flip")}>
        <span className={`${styles.reviewCardLayer} ${styles.reviewCardLayerBack}`} />
        <span className={`${styles.reviewCardLayer} ${styles.reviewCardLayerMiddle}`} />
        <span className={styles.reviewCardFlipWrap}>
          <span className={`${styles.reviewCardFace} ${styles.reviewCardFaceFront}`}>
            <span className={styles.reviewCardFaceText}>{reviewItem?.word || "—"}</span>
          </span>
          <span className={`${styles.reviewCardFace} ${styles.reviewCardFaceBack}`}>
            <span className={styles.reviewCardFaceText}>{getPrimaryTranslation(reviewItem) || "—"}</span>
          </span>
        </span>
      </button>

      <button
        type="button"
        className={`${styles.wordInUseButton} ${!reviewItem?.showTranslation ? styles.wordInUseButtonDisabled : ""}`}
        onClick={() => {
          if (!reviewItem?.showTranslation) {
            return;
          }

          setWordInUseOpen((prev) => !prev);
        }}
        disabled={!reviewItem?.showTranslation}
      >
        <span className={styles.wordInUseLeft}><LampIcon /> Word in use</span>
        <span className={styles.wordInUseArrow}><ChevronDownIcon opened={wordInUseOpen} /></span>
      </button>

      {wordInUseOpen ? (
        <div className={styles.wordInUseCard}>
          {reviewItem?.details?.examples?.length ? (
            <>
              <div className={styles.wordInUseExample}>{reviewItem.details.examples[wordExampleIndex] || reviewItem.details.examples[0]}</div>
              <div className={styles.wordInUseTranslation}>{getPrimaryTranslation(reviewItem.details)}</div>
            </>
          ) : (
            <div className={styles.wordInUseEmpty}>Прикладів поки що немає</div>
          )}
        </div>
      ) : null}

      <div className={styles.reviewActionsDesigner}>
        <button type="button" className={`${styles.reviewDesignerActionButton} ${styles.reviewDesignerActionWrong}`} onClick={() => handleReviewAction("wrong")} aria-label="Не знаю">
          <ReviewWrongIcon />
        </button>
        <button type="button" className={`${styles.reviewDesignerActionButton} ${styles.reviewDesignerActionCorrect}`} onClick={() => handleReviewAction("correct")} aria-label="Знаю">
          <ReviewCorrectIcon />
        </button>
        <button type="button" className={`${styles.reviewDesignerActionButton} ${styles.reviewDesignerActionSkip}`} onClick={() => handleReviewAction("skip")} aria-label="Далі">
          <ReviewSkipIcon />
        </button>
      </div>
    </div>
  );

  const closeMessageModal = () => {
    setModal({ open: false, title: "", message: "", secondaryText: "", onSecondary: null, onPrimary: null });
  };

  const messageModalNode = typeof document !== "undefined" ? document.getElementById("lumino-home-stage") : null;
  const messageModal = modal.open ? (
    <div className={styles.messageModalOverlay} onClick={closeMessageModal}>
      <div className={styles.messageModalCard} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.messageModalClose} onClick={closeMessageModal} aria-label="Закрити">
          <CloseIcon />
        </button>

        <div className={styles.messageModalInner}>
          <div
            className={styles.messageModalText}
            style={modal.message === "Впевнені, що хочете видалити це слово?" ? { textTransform: "none" } : undefined}
          >
            {modal.message}
          </div>
        </div>

        {modal.secondaryText ? (
          <div className={styles.messageModalActions}>
            <button
              type="button"
              className={`${styles.messageModalActionButton} ${styles.messageModalActionButtonLight}`}
              onClick={modal.onSecondary || closeMessageModal}
            >
              {modal.secondaryText}
            </button>

            <button
              type="button"
              className={`${styles.messageModalActionButton} ${styles.messageModalActionButtonDark}`}
              onClick={modal.onPrimary || closeMessageModal}
            >
              НІ
            </button>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.embeddedViewport}>
      <GlassLoading open={loading || saving} text={loading ? "Завантажуємо словник..." : "Оновлюємо словник..."} stageTargetId="lumino-home-stage" />
      {messageModalNode && messageModal ? createPortal(messageModal, messageModalNode) : messageModal}

      <div className={styles.embeddedContent}>
        <section className={styles.dictionaryColumn}>
          <div className={styles.dictionaryTopLine} />

          <div className={styles.dictionaryHeader}>
            <div className={styles.dictionaryTitle}>МІЙ СЛОВНИК</div>

            <div className={styles.dictionaryTabs}>
              <button type="button" className={`${styles.filterTab} ${activeFilter === "list" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("list")}>список</button>
              <span className={styles.filterDivider} />
              <button type="button" className={`${styles.filterTab} ${activeFilter === "review" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("review")}>повторення</button>
              <span className={styles.filterDivider} />
              <button type="button" className={`${styles.filterTab} ${activeFilter === "level" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("level")}>рівень</button>
            </div>

            <div className={styles.headerIcons}>
              <button type="button" className={styles.iconButton} onClick={handleOpenSearch} aria-label="Пошук">
                <img src={SearchIconAsset} alt="" className={styles.headerIconAsset} />
              </button>

              <button type="button" className={`${styles.iconButton} ${deleteMode ? styles.iconButtonActive : ""}`} onClick={handleDeleteModeToggle} aria-label="Режим видалення">
                <img src={DeleteIconAsset} alt="" className={styles.headerIconAsset} />
              </button>
            </div>
          </div>

          <div className={styles.dictionaryBottomLine} />

          <div className={styles.wordsArea}>
            {activeFilter === "list" ? (
              filteredItems.length > 0 ? (
                <div className={styles.wordGrid}>
                  {filteredItems.map((item) => {
                    const active = selectedItemId === item.id;
                    const translation = getPrimaryTranslation(item);

                    return (
                      <div key={item.id} className={styles.wordChipWrap}>
                        <button
                          type="button"
                          className={`${styles.wordChip} ${active ? styles.wordChipActive : ""}`}
                          onClick={() => {
                            if (deleteMode) {
                              return;
                            }

                            openWordDetails(item);
                          }}
                        >
                          <span className={styles.wordChipWord}>{item.word}</span>
                          {translation ? <span className={styles.wordChipTranslation}>({translation})</span> : null}
                        </button>

                        {deleteMode ? (
                          <button
                            type="button"
                            className={styles.wordChipDeleteButton}
                            aria-label={`Видалити слово ${item.word}`}
                            onClick={() => {
                              showModal("Впевнені, що хочете видалити це слово?", {
                                secondaryText: "ТАК",
                                onSecondary: () => {
                                  setModal({ open: false, title: "", message: "", secondaryText: "", onSecondary: null, onPrimary: null });
                                  handleDeleteWord(item);
                                },
                                onPrimary: () => setModal({ open: false, title: "", message: "", secondaryText: "", onSecondary: null, onPrimary: null }),
                              });
                            }}
                          >
                            <span className={styles.wordChipDeleteInner}>
                              <span className={styles.wordChipDelete}>×</span>
                            </span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>немає слів у словнику</div>
              )
            ) : null}

            {activeFilter === "review" ? (
              <div className={styles.reviewGroupsWrap}>
                {renderReviewGroup("Сьогодні:", reviewGroups.today)}
                {renderReviewGroup("Завтра:", reviewGroups.tomorrow)}
                {renderReviewGroup(getReviewLaterLabel(reviewGroups.later), reviewGroups.later)}
              </div>
            ) : null}

            {activeFilter === "level" ? (
              <div className={styles.levelColumnsWrap}>
                {renderLevelColumn("Рівень 1", levelGroups[1])}
                {renderLevelColumn("Рівень 2", levelGroups[2])}
                {renderLevelColumn("Рівень 3", levelGroups[3])}
              </div>
            ) : null}
          </div>

          {activeFilter !== "level" ? (
            <button type="button" className={styles.floatingAddButton} onClick={activeFilter === "review" ? handleOpenReviewPlan : handleOpenAdd} aria-label={activeFilter === "review" ? "Додати слово до повторення" : "Додати слово"}>
              <PlusIcon />
            </button>
          ) : null}

          <div className={styles.dictionaryAddLine} />

          <div className={styles.grammarHeader}>ГРАМАТИКА</div>
          <div className={styles.grammarTopLine} />

          <div className={styles.grammarButtonsColumn}>
            {GRAMMAR_TOPICS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.grammarTopicButton} ${rightMode === "grammar" && selectedGrammarKey === item.key ? styles.grammarTopicButtonActive : ""}`}
                onClick={() => handleOpenGrammar(item.key)}
              >
                <span>{item.title}</span>
                <span className={styles.grammarTopicArrow}><ArrowIcon direction="right" /></span>
              </button>
            ))}
          </div>

          <button type="button" className={styles.repeatButton} onClick={handleOpenReview}>Повторити слова</button>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.sideDivider} />
          {["grammar", "word", "search", "add", "reviewPlan", "reviewCard", "reviewResult"].includes(rightMode) ? (
            <button type="button" className={`${styles.sideCloseButton} ${styles.sidePanelSharedCloseButton}`} onClick={closeTransientState} aria-label="Закрити">
              <CloseIcon />
            </button>
          ) : null}
          <div className={`${styles.sidePanelContent} ${rightMode === "grammar" ? styles.sidePanelContentGrammar : ""} ${rightMode === "word" ? styles.sidePanelContentWord : ""} ${rightMode === "search" ? styles.sidePanelContentSearch : ""} ${rightMode === "add" ? styles.sidePanelContentAdd : ""}`}>
            {rightMode === "grammar" ? renderGrammarPanel() : null}
            {rightMode === "word" && selectedItemDetails ? renderWordPanel() : null}
            {rightMode === "search" ? renderSearchPanel() : null}
            {rightMode === "add" ? renderAddPanel() : null}
            {rightMode === "reviewStart" ? renderReviewStartPanel() : null}
            {rightMode === "reviewCard" ? renderReviewCardPanel() : null}
            {rightMode === "reviewResult" ? renderReviewResultPanel() : null}
            {rightMode === "reviewPlan" ? renderReviewPlanPanel() : null}
          </div>
        </aside>

        {(() => {
          const modalStageNode = typeof document !== "undefined" ? document.getElementById("lumino-home-stage") : null;

          if (rightMode === "edit" && selectedItemDetails) {
            const editModal = (
              <div className={styles.wordModalOverlay} onClick={closeTransientState}>
                <div className={`${styles.wordModalContent} ${styles.wordModalContentEdit}`} onClick={(e) => e.stopPropagation()}>
                  {renderEditPanel()}
                </div>
              </div>
            );

            return modalStageNode ? createPortal(editModal, modalStageNode) : editModal;
          }

          return null;
        })()}
      </div>
    </div>
  );
}
