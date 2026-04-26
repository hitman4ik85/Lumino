import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import { vocabularyService } from "../../../services/vocabularyService.js";
import { getDueItemsFromVocabulary, getVocabularyDueSyncDelay, preloadVocabularyCache, readVocabularyCache, writeVocabularyCache } from "../../../services/vocabularySnapshotCache.js";
import SearchIconAsset from "../../../assets/vocabulare/search.svg";
import DeleteIconAsset from "../../../assets/vocabulare/cart.svg";
import styles from "./VocabularyPage.module.css";
import { formatKyivDateTime, getKyivDayDifference } from "../../../utils/kyivDate.js";


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

function HeaderBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M19 12H7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M11 7L6 12L11 17" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
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

function getAllTranslationsText(item) {
  if (Array.isArray(item?.translations) && item.translations.length > 0) {
    const seen = new Set();

    return item.translations
      .map((translation) => String(translation || "").trim())
      .filter((translation) => {
        if (!translation) {
          return false;
        }

        const normalized = translation.toLowerCase();

        if (seen.has(normalized)) {
          return false;
        }

        seen.add(normalized);
        return true;
      })
      .join(", ");
  }

  return String(item?.translation || "").trim();
}

function getWordChipTitle(item) {
  const word = String(item?.word || "").trim();
  const translation = getPrimaryTranslation(item).trim();

  if (word && translation) {
    return `${word} (${translation})`;
  }

  return word || translation;
}

function getWordOnlyTitle(item) {
  const word = String(item?.word || "").trim();

  return word || getPrimaryTranslation(item).trim();
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

      return word || translation;
    })
    .filter(Boolean);
}

function wordMatchesSearch(item, normalizedSearch) {
  if (!normalizedSearch) {
    return true;
  }

  const searchValues = [item?.word, item?.translation];

  if (Array.isArray(item?.translations)) {
    searchValues.push(...item.translations);
  }

  return searchValues.some((value) => String(value || "")
    .trim()
    .toLowerCase()
    .includes(normalizedSearch));
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

  return formatKyivDateTime(value);
}

function getReviewBucket(item) {
  const nextReviewAt = item?.nextReviewAt || item?.NextReviewAt;

  if (!nextReviewAt) {
    return "later";
  }

  const diff = getKyivDayDifference(new Date(), nextReviewAt);

  if (diff <= 0) {
    return "today";
  }

  if (diff === 1) {
    return "tomorrow";
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

      if (!nextReviewAt) {
        return null;
      }

      const diff = getKyivDayDifference(new Date(), nextReviewAt);

      return diff >= 2 ? diff : null;
    })
    .filter((item) => item != null);

  if (values.length === 0) {
    return "Через N днів:";
  }

  return `Через ${Math.min(...values)} днів:`;
}

function areLevelChipMapsEqual(left, right) {
  const leftKeys = Object.keys(left || {});
  const rightKeys = Object.keys(right || {});

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => Boolean(left[key]) === Boolean(right[key]));
}

function getDueItemIdentity(item) {
  return [
    String(item?.id || ""),
    String(item?.vocabularyItemId || item?.VocabularyItemId || ""),
    String(item?.nextReviewAt || item?.NextReviewAt || ""),
  ].join(":");
}

function areDueItemsEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => getDueItemIdentity(item) === getDueItemIdentity(right[index]));
}

export default function VocabularyContent() {
  const initialCacheRef = useRef(readVocabularyCache());
  const [loading, setLoading] = useState(initialCacheRef.current == null);
  const [saving, setSaving] = useState(false);
  const reviewSavingRef = useRef(false);
  const [items, setItems] = useState(initialCacheRef.current?.items || []);
  const [dueItems, setDueItems] = useState(initialCacheRef.current?.dueItems || []);
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearchValue, setAppliedSearchValue] = useState("");
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
  const [levelWideItemsMap, setLevelWideItemsMap] = useState({});
  const levelGridRefs = useRef({});
  const [reviewPlanItemId, setReviewPlanItemId] = useState(0);
  const [reviewPlanPeriod, setReviewPlanPeriod] = useState("today");
  const [reviewPlanDays, setReviewPlanDays] = useState("3");
  const [reviewPlanPage, setReviewPlanPage] = useState(0);
  const [reviewPlanPageSize, setReviewPlanPageSize] = useState(15);
  const reviewPlanWordsGridRef = useRef(null);
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
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth <= 700;
  });
  const [isTabletLayout, setIsTabletLayout] = useState(false);

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
    const normalizedSearch = appliedSearchValue.trim().toLowerCase();

    return items.filter((item) => wordMatchesSearch(item, normalizedSearch));
  }, [appliedSearchValue, items]);

  const sortedListItems = useMemo(() => {
    return filteredItems.slice().sort((a, b) => String(a?.word || "").localeCompare(String(b?.word || "")));
  }, [filteredItems]);

  const hasAppliedSearch = appliedSearchValue.trim().length > 0;

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

  const updateReviewPlanPageSize = useCallback(() => {
    if (!isMobileLayout || typeof window === "undefined") {
      setReviewPlanPageSize((prev) => (prev === 15 ? prev : 15));
      return;
    }

    const grid = reviewPlanWordsGridRef.current;

    if (!grid) {
      return;
    }

    const gridStyles = window.getComputedStyle(grid);
    const columnGap = Number.parseFloat(gridStyles.columnGap || "0") || 16;
    const minColumnWidth = 80;
    const computedColumns = gridStyles.gridTemplateColumns.split(" ").filter(Boolean);
    const columnsCount = Math.max(1, computedColumns.length || Math.floor((grid.clientWidth + columnGap) / (minColumnWidth + columnGap)));
    const nextPageSize = columnsCount * 3;

    setReviewPlanPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
  }, [isMobileLayout]);

  useEffect(() => {
    if (rightMode !== "reviewPlan") {
      return undefined;
    }

    updateReviewPlanPageSize();

    if (typeof window === "undefined") {
      return undefined;
    }

    window.addEventListener("resize", updateReviewPlanPageSize);

    return () => {
      window.removeEventListener("resize", updateReviewPlanPageSize);
    };
  }, [rightMode, reviewPlanItems.length, updateReviewPlanPageSize]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(reviewPlanItems.length / reviewPlanPageSize) - 1);

    setReviewPlanPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [reviewPlanItems.length, reviewPlanPageSize]);

  const setLevelGridRef = useCallback((level, node) => {
    if (node) {
      levelGridRefs.current[level] = node;
      return;
    }

    delete levelGridRefs.current[level];
  }, []);

  const updateLevelWideItems = useCallback(() => {
    if (activeFilter !== "level" || typeof window === "undefined") {
      return;
    }

    const nextMap = {};

    Object.values(levelGridRefs.current).forEach((grid) => {
      if (!grid) {
        return;
      }

      const gridStyles = window.getComputedStyle(grid);
      const columnGap = Number.parseFloat(gridStyles.columnGap || gridStyles.gap || "0") || 0;
      const singleColumnWidth = (grid.clientWidth - columnGap) / 2;

      if (singleColumnWidth <= 0) {
        return;
      }

      const buttons = Array.from(grid.querySelectorAll('[data-level-word-chip="true"]'));

      buttons.forEach((button) => {
        const itemId = Number(button.dataset.itemId || 0);

        if (!itemId) {
          return;
        }

        const textNode = button.querySelector('[data-level-word-text="true"]');
        const buttonStyles = window.getComputedStyle(button);
        const horizontalPadding = (Number.parseFloat(buttonStyles.paddingLeft || "0") || 0)
          + (Number.parseFloat(buttonStyles.paddingRight || "0") || 0)
          + (Number.parseFloat(buttonStyles.borderLeftWidth || "0") || 0)
          + (Number.parseFloat(buttonStyles.borderRightWidth || "0") || 0);
        const availableWidth = Math.max(0, singleColumnWidth - horizontalPadding);
        const textWidth = textNode ? textNode.scrollWidth : 0;

        nextMap[itemId] = textWidth > availableWidth;
      });
    });

    setLevelWideItemsMap((prev) => (areLevelChipMapsEqual(prev, nextMap) ? prev : nextMap));
  }, [activeFilter]);

  const reviewPlanPagedItems = useMemo(() => {
    const startIndex = reviewPlanPage * reviewPlanPageSize;

    return reviewPlanItems.slice(startIndex, startIndex + reviewPlanPageSize);
  }, [reviewPlanItems, reviewPlanPage, reviewPlanPageSize]);

  const reviewPlanHasMore = useMemo(() => {
    return (reviewPlanPage + 1) * reviewPlanPageSize < reviewPlanItems.length;
  }, [reviewPlanItems.length, reviewPlanPage, reviewPlanPageSize]);

  const reviewPlanHasPrevious = reviewPlanPage > 0;

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
    setAppliedSearchValue("");
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncLayout = () => {
      const width = window.innerWidth;

      setIsMobileLayout(width <= 700);
      setIsTabletLayout(false);
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);

    return () => {
      window.removeEventListener("resize", syncLayout);
    };
  }, []);

  useEffect(() => {
    if (activeFilter !== "level") {
      return undefined;
    }

    let frameId = 0;

    const handleMeasure = () => {
      if (typeof window === "undefined") {
        return;
      }

      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        updateLevelWideItems();
      });
    };

    handleMeasure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", handleMeasure);

      return () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleMeasure);
      };
    }

    const observer = new ResizeObserver(() => {
      handleMeasure();
    });

    Object.values(levelGridRefs.current).forEach((grid) => {
      if (grid) {
        observer.observe(grid);
      }
    });

    window.addEventListener("resize", handleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", handleMeasure);
    };
  }, [activeFilter, levelGroups, updateLevelWideItems]);

  const loadVocabulary = useCallback(async (keepPanel = false, showBlocking = true) => {
    if (showBlocking) {
      setLoading(true);
    }

    const res = await preloadVocabularyCache();

    if (!res.ok) {
      if (showBlocking) {
        setLoading(false);
      }

      setModal({ open: true, title: "Словник", message: buildErrorText(res, "Не вдалося завантажити словник") });
      return;
    }

    const nextItems = Array.isArray(res.data?.items) ? res.data.items : [];
    const nextDueItems = Array.isArray(res.data?.dueItems) ? res.data.dueItems : [];

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
    const syncDueItemsFromTime = () => {
      const nextDueItems = getDueItemsFromVocabulary(items);

      setDueItems((prev) => {
        if (areDueItemsEqual(prev, nextDueItems)) {
          return prev;
        }

        writeVocabularyCache(items, nextDueItems);
        return nextDueItems;
      });
    };

    syncDueItemsFromTime();

    const dueSyncDelay = getVocabularyDueSyncDelay(items);

    if (dueSyncDelay == null || typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const timeoutId = window.setTimeout(syncDueItemsFromTime, dueSyncDelay);

    const handleWindowFocus = () => {
      syncDueItemsFromTime();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncDueItemsFromTime();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dueItems, items]);

  useEffect(() => {
    if (activeFilter !== "review" && rightMode === "reviewPlan") {
      setRightMode("");
    }
  }, [activeFilter, rightMode]);


  const openWordDetails = useCallback(async (item, options = {}) => {
    if (!item?.vocabularyItemId) {
      return;
    }

    setSaving(true);
    setSelectedItemId(item.id);

    if (!options.keepSearchPanel) {
      setRightMode("word");
    }

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

    const res = await vocabularyService.addWord(payload);

    if (!res.ok) {
      setModal({ open: true, title: "Додавання", message: buildErrorText(res, "Не вдалося додати слово") });
      return;
    }

    setAddForm({ word: "", translation: "", partOfSpeech: "", transcription: "", definition: "", example: "", synonyms: "", idioms: "" });
    showModal("СЛОВО ДОДАНО");
    await loadVocabulary(true, false);
  }, [addForm, loadVocabulary, showModal]);

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
    setAppliedSearchValue("");

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

  const handleReviewPlanItemClick = useCallback((itemId) => {
    setReviewPlanItemId((prev) => prev === itemId ? 0 : itemId);
  }, []);

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

    const res = await vocabularyService.scheduleWord(reviewPlanItemId, payload);

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

    setReviewItem({
      ...queueItem,
      details: null,
      showTranslation: false,
      hintUsed: false,
    });
    setWordInUseOpen(false);
    setWordExampleIndex(0);

    reviewSavingRef.current = true;
    const detailsRes = await vocabularyService.getItemDetails(queueItem.vocabularyItemId);
    reviewSavingRef.current = false;

    if (!detailsRes.ok) {
      setReviewItem({
        ...queueItem,
        details: null,
        showTranslation: false,
        hintUsed: false,
      });
      setModal({ open: true, title: "Повторення", message: buildErrorText(detailsRes, "Не вдалося завантажити дані слова") });
      return;
    }

    setReviewItem({
      ...queueItem,
      details: detailsRes.data,
      showTranslation: false,
      hintUsed: false,
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
    if (!reviewItem?.id || reviewSavingRef.current) {
      return;
    }

    if (action === "flip") {
      setReviewItem((prev) => ({
        ...prev,
        showTranslation: !prev.showTranslation,
        hintUsed: prev?.hintUsed || !prev?.showTranslation,
      }));
      return;
    }

    reviewSavingRef.current = true;
    const reviewRes = await vocabularyService.reviewWord(reviewItem.id, {
      action,
      isCorrect: action === "correct",
      idempotencyKey: createReviewKey(),
    });

    if (!reviewRes.ok) {
      reviewSavingRef.current = false;
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
      reviewSavingRef.current = false;
      setReviewItem(null);
      setRightMode("reviewResult");
      loadVocabulary(true, false);
      return;
    }

    const nextQueueItem = reviewQueue[nextIndex];

    setReviewItem({
      ...nextQueueItem,
      details: null,
      showTranslation: false,
      hintUsed: false,
    });
    setWordInUseOpen(false);
    setWordExampleIndex(0);

    const detailsRes = await vocabularyService.getItemDetails(nextQueueItem.vocabularyItemId);
    reviewSavingRef.current = false;

    if (!detailsRes.ok) {
      setReviewItem({
        ...nextQueueItem,
        details: null,
        showTranslation: false,
        hintUsed: false,
      });
      setModal({ open: true, title: "Повторення", message: buildErrorText(detailsRes, "Не вдалося завантажити наступне слово") });
      return;
    }

    setReviewItem({
      ...nextQueueItem,
      details: detailsRes.data,
      showTranslation: false,
      hintUsed: false,
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
    setDeleteMode(false);
    setSelectedItemId(0);
    setSelectedItemDetails(null);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОШУКУ");
      return;
    }

    const foundItems = items.filter((item) => wordMatchesSearch(item, normalizedSearch));

    if (foundItems.length === 0) {
      showModal("НЕМАЄ СЛІВ ДЛЯ ПОШУКУ");
      return;
    }

    setAppliedSearchValue(searchValue.trim());
    setActiveFilter("list");
    setDeleteMode(false);
    setSelectedItemId(0);
    setSelectedItemDetails(null);
    setWordInUseOpen(false);
    setWordExampleIndex(0);
  }, [items, searchValue, showModal]);

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

  const isReviewSessionActive = rightMode === "reviewCard";

  const renderWordPanel = () => (
    <div className={`${styles.sidePanelInner} ${styles.wordSidebarInner}`}>
      <div className={styles.wordSidebarTitleWrap}>
        <div className={styles.wordModalTitleLine}>
          <div className={styles.sideTitleWord}>{selectedItemDetails?.word || "Слово"}</div>
          {getAllTranslationsText(selectedItemDetails) ? <div className={styles.wordModalTranslation}>({getAllTranslationsText(selectedItemDetails)})</div> : null}
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
          {getAllTranslationsText(selectedItemDetails) ? <div className={styles.wordInfoText}>{getAllTranslationsText(selectedItemDetails)}</div> : null}
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
            onChange={(e) => {
              setSearchValue(e.target.value);
              setAppliedSearchValue("");
            }}
            autoFocus
          />
        </div>

        <div className={styles.sideActionDivider} />

        <button type="button" className={styles.searchPanelButton} onClick={handleSearchSubmit}>ЗНАЙТИ</button>

        {isMobileLayout && hasAppliedSearch ? (
          <div className={styles.mobileSearchResultsBlock}>
            <div className={`${styles.mobileWordsGrid} ${styles.mobileSearchResultsGrid}`}>
              {sortedListItems.map((item) => (
                <div key={item.id} className={styles.mobileSearchResultWrap}>
                  {renderMobileWordChip(item, { onClick: (selectedItem) => openWordDetails(selectedItem, { keepSearchPanel: true }) })}
                  {selectedItemId === item.id && selectedItemDetails?.userVocabularyId === item.id ? (
                    <div className={styles.mobileSearchWordDetails}>
                      {renderWordPanel()}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
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
            const chipTitle = getWordOnlyTitle(item);

            return (
              <div key={item.id} className={styles.wordChipWrap}>
                <button type="button" className={styles.wordChip} onClick={() => openWordDetails(item)} title={chipTitle}>
                  <span className={styles.wordChipWord}>{item.word}</span>
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

  const handleLevelScrollToggle = (event) => {
    const grid = event.currentTarget.parentElement?.querySelector(`.${styles.levelColumnGrid}`);

    if (!grid) {
      return;
    }

    const maxScrollTop = Math.max(0, grid.scrollHeight - grid.clientHeight);

    if (grid.scrollTop >= maxScrollTop - 4) {
      grid.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    grid.scrollTo({ top: Math.min(maxScrollTop, grid.scrollTop + grid.clientHeight - 24), behavior: "smooth" });
  };

  const renderLevelColumn = (level, title, itemsForLevel) => (
    <div className={styles.levelColumn}>
      <div className={styles.levelColumnHeader}>
        <span>{title}</span>
        <button type="button" className={styles.levelColumnArrow} onClick={handleLevelScrollToggle} aria-label={`Прокрутити ${title}`}><ArrowIcon direction="right" /></button>
      </div>
      <div className={styles.levelColumnGrid} ref={(node) => setLevelGridRef(level, node)}>
        {itemsForLevel.map((item) => {
          const chipTitle = getWordOnlyTitle(item);
          const isWideItem = Boolean(levelWideItemsMap[item.id]);

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.wordChip} ${styles.levelWordChip} ${isWideItem ? styles.levelWordChipWide : ""}`}
              onClick={() => openWordDetails(item)}
              title={chipTitle}
              data-level-word-chip="true"
              data-item-id={item.id}
            >
              <span className={styles.wordChipWord} data-level-word-text="true">{item.word}</span>
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

        <div className={styles.reviewPlanWordsWrap}>
          <div className={styles.reviewPlanWordsGrid} ref={reviewPlanWordsGridRef}>
            {reviewPlanPagedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.reviewPlanWordButton} ${reviewPlanItemId === item.id ? styles.reviewPlanWordButtonActive : ""}`}
                onClick={() => handleReviewPlanItemClick(item.id)}
              >
                {item.word}
              </button>
            ))}
          </div>

          {reviewPlanItems.length > reviewPlanPageSize ? (
            <div className={styles.reviewPlanPageButtons}>
              <button type="button" className={styles.reviewPlanNextButton} onClick={() => setReviewPlanPage((prev) => prev + 1)} aria-label="Наступна сторінка слів" disabled={!reviewPlanHasMore}>
                <ArrowIcon direction="right" />
              </button>
              <button type="button" className={styles.reviewPlanNextButton} onClick={() => setReviewPlanPage((prev) => Math.max(0, prev - 1))} aria-label="Попередня сторінка слів" disabled={!reviewPlanHasPrevious}>
                <ArrowIcon direction="left" />
              </button>
            </div>
          ) : null}
        </div>
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
        <button
          type="button"
          className={`${styles.reviewDesignerActionButton} ${styles.reviewDesignerActionCorrect} ${reviewItem?.hintUsed ? styles.reviewDesignerActionButtonDisabled : ""}`}
          onClick={() => {
            if (reviewItem?.hintUsed) {
              return;
            }

            handleReviewAction("correct");
          }}
          aria-label="Знаю"
          disabled={reviewItem?.hintUsed}
        >
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

  const renderMobileHeader = (title, withBack = false) => (
    <div className={styles.mobileTopBar}>
      {withBack ? (
        <button type="button" className={styles.mobileBackButton} onClick={closeTransientState} aria-label="Назад"><HeaderBackIcon /></button>
      ) : (
        <span className={styles.mobileBackSpacer} aria-hidden="true" />
      )}

      <div className={styles.mobileTopBarTitle}>{title}</div>
      <span className={styles.mobileBackSpacer} aria-hidden="true" />
    </div>
  );

  const renderMobileWordChip = (item, options = {}) => {
    const translation = options.hideTranslation ? "" : getPrimaryTranslation(item);
    const chipTitle = options.hideTranslation ? getWordOnlyTitle(item) : getWordChipTitle(item);

    return (
      <div key={item.id} className={`${styles.mobileWordChipWrap} ${options.wrapClassName || ""}`}>
        <button
          type="button"
          className={`${styles.wordChip} ${styles.mobileWordChip} ${options.buttonClassName || ""}`}
          onClick={() => {
            if (deleteMode) {
              return;
            }

            if (typeof options.onClick === "function") {
              options.onClick(item);
              return;
            }

            openWordDetails(item);
          }}
          title={chipTitle}
        >
          <span className={`${styles.wordChipWord} ${styles.mobileWordChipWord}`}>{item.word}</span>
          {translation ? <span className={`${styles.wordChipTranslation} ${styles.mobileWordChipTranslation}`}>({translation})</span> : null}
        </button>

        {options.showDelete ? (
          <button
            type="button"
            className={`${styles.wordChipDeleteButton} ${styles.mobileWordChipDeleteButton}`}
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
            <span className={`${styles.wordChipDeleteInner} ${styles.mobileWordChipDeleteInner}`}>
              <span className={styles.wordChipDelete}>×</span>
            </span>
          </button>
        ) : null}
      </div>
    );
  };

  const renderMobileReviewGroup = (title, reviewItems) => (
    <div className={styles.mobileReviewGroup}>
      <div className={styles.mobileReviewGroupTitle}>{title}</div>
      {reviewItems.length > 0 ? (
        <div className={styles.mobileWordsGrid}>
          {reviewItems.map((item) => renderMobileWordChip(item, { hideTranslation: true }))}
        </div>
      ) : null}
    </div>
  );

  const renderMobileLevelColumn = (level, title, itemsForLevel) => (
    <div className={styles.mobileLevelColumn}>
      <div className={styles.mobileLevelColumnHeader}>
        <span>{title}</span>
        <button type="button" className={styles.mobileLevelColumnArrow} onClick={handleLevelScrollToggle} aria-label={`Прокрутити ${title}`}>
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className={styles.mobileLevelColumnGrid} ref={(node) => setLevelGridRef(level, node)}>
        {itemsForLevel.map((item) => renderMobileWordChip(item, {
          hideTranslation: true,
          buttonClassName: styles.mobileLevelWordChip,
          wrapClassName: styles.mobileLevelWordChipWrap,
        }))}
      </div>
    </div>
  );

  const renderMobileDictionaryScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Словник")}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobileDictionarySection}>
          <div className={styles.mobileDictionaryTitle}>МІЙ СЛОВНИК</div>

          <div className={styles.mobileDictionaryTabsRow}>
            <div className={styles.mobileDictionaryTabs}>
              <button type="button" className={`${styles.filterTab} ${styles.mobileFilterTab} ${activeFilter === "list" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("list")}>список</button>
              <span className={`${styles.filterDivider} ${styles.mobileFilterDivider}`} />
              <button type="button" className={`${styles.filterTab} ${styles.mobileFilterTab} ${activeFilter === "review" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("review")}>повторення</button>
              <span className={`${styles.filterDivider} ${styles.mobileFilterDivider}`} />
              <button type="button" className={`${styles.filterTab} ${styles.mobileFilterTab} ${activeFilter === "level" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("level")}>рівень</button>
            </div>

            <div className={styles.mobileHeaderIcons}>
              <button type="button" className={`${styles.iconButton} ${styles.mobileIconButton}`} onClick={handleOpenSearch} aria-label="Пошук">
                <img src={SearchIconAsset} alt="" className={styles.headerIconAsset} />
              </button>

              <button type="button" className={`${styles.iconButton} ${styles.mobileIconButton} ${deleteMode ? styles.iconButtonActive : ""}`} onClick={handleDeleteModeToggle} aria-label="Режим видалення">
                <img src={DeleteIconAsset} alt="" className={styles.headerIconAsset} />
              </button>
            </div>
          </div>

          <div className={styles.mobileBlueDivider} />

          {activeFilter === "list" ? (
            sortedListItems.length > 0 ? (
              <div className={styles.mobileDictionaryContentViewport}>
                <div className={styles.mobileWordsGrid}>
                  {sortedListItems.map((item) => renderMobileWordChip(item, { showDelete: deleteMode }))}
                </div>
              </div>
            ) : (
              <div className={styles.mobileEmptyState}>немає слів у словнику</div>
            )
          ) : null}

          {activeFilter === "review" ? (
            <div className={`${styles.mobileDictionaryContentViewport} ${styles.mobileReviewContentViewport}`}>
              <div className={styles.mobileReviewGroupsWrap}>
                {renderMobileReviewGroup("Сьогодні:", reviewGroups.today)}
                {renderMobileReviewGroup("Завтра:", reviewGroups.tomorrow)}
                {renderMobileReviewGroup(getReviewLaterLabel(reviewGroups.later), reviewGroups.later)}
              </div>
            </div>
          ) : null}

          {activeFilter === "level" ? (
            <div className={`${styles.mobileDictionaryContentViewport} ${styles.mobileLevelContentViewport}`}>
              <div className={styles.mobileLevelColumnsWrap}>
                {renderMobileLevelColumn(1, "Рівень 1", levelGroups[1])}
                {renderMobileLevelColumn(2, "Рівень 2", levelGroups[2])}
                {renderMobileLevelColumn(3, "Рівень 3", levelGroups[3])}
              </div>
            </div>
          ) : null}

          <div className={styles.mobileDividerActionRow}>
            <div className={styles.mobilePinkDivider} />
            {activeFilter !== "level" ? (
              <button type="button" className={styles.mobilePlusButton} onClick={activeFilter === "review" ? handleOpenReviewPlan : handleOpenAdd} aria-label={activeFilter === "review" ? "Додати слово до повторення" : "Додати слово"}>
                <PlusIcon />
              </button>
            ) : null}
          </div>

          <div className={styles.mobileGrammarHeader}>ГРАМАТИКА</div>
          <div className={styles.mobileBlueDivider} />

          <div className={styles.mobileGrammarButtonsColumn}>
            {GRAMMAR_TOPICS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.grammarTopicButton} ${styles.mobileGrammarTopicButton}`}
                onClick={() => handleOpenGrammar(item.key)}
              >
                <span>{item.title}</span>
                <span className={styles.grammarTopicArrow}><ArrowIcon direction="right" /></span>
              </button>
            ))}
          </div>

          <button type="button" className={`${styles.repeatButton} ${styles.mobileRepeatButton}`} onClick={handleOpenReview}>Повторити слова</button>
        </div>
      </div>
    </div>
  );

  const renderMobileWordScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Деталі слова", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobileWordHero}>
          <div className={styles.mobileWordTitleRow}>
            <div className={styles.mobileWordTitle}>{selectedItemDetails?.word || "Слово"}</div>
            {getAllTranslationsText(selectedItemDetails) ? <div className={styles.mobileWordTranslation}>({getAllTranslationsText(selectedItemDetails)})</div> : null}
          </div>
          {selectedItemDetails?.partOfSpeech ? <div className={styles.mobileWordPartOfSpeech}>{selectedItemDetails.partOfSpeech}</div> : null}
        </div>

        {selectedItemDetails?.definition ? (
          <div className={styles.mobileInfoBlock}>
            <div className={styles.mobileInfoLabel}>визначення</div>
            <div className={styles.mobileInfoText}>{selectedItemDetails.definition}</div>
          </div>
        ) : null}

        {selectedWordExamples.length > 0 ? (
          <div className={styles.mobileInfoBlock}>
            <div className={styles.mobileInfoHeaderRow}>
              <div className={styles.mobileInfoLabel}>приклад</div>
              {selectedWordExamples.length > 1 ? (
                <div className={styles.mobileInfoArrowRow}>
                  <button type="button" className={styles.mobileInfoArrowButton} onClick={() => setWordExampleIndex((prev) => prev > 0 ? prev - 1 : selectedWordExamples.length - 1)} aria-label="Попередній приклад">
                    <ArrowIcon direction="left" />
                  </button>
                  <button type="button" className={styles.mobileInfoArrowButton} onClick={() => setWordExampleIndex((prev) => prev < selectedWordExamples.length - 1 ? prev + 1 : 0)} aria-label="Наступний приклад">
                    <ArrowIcon direction="right" />
                  </button>
                </div>
              ) : null}
            </div>
            <div className={styles.mobileInfoTextItalic}>{currentSelectedWordExample}</div>
            {getAllTranslationsText(selectedItemDetails) ? <div className={styles.mobileInfoText}>{getAllTranslationsText(selectedItemDetails)}</div> : null}
          </div>
        ) : null}

        {selectedWordSynonyms.length > 0 ? (
          <div className={styles.mobileInfoBlock}>
            <div className={styles.mobileInfoLabel}>подібні слова/синоніми</div>
            <div className={styles.mobileInfoText}>{selectedWordSynonyms.join("\n")}</div>
          </div>
        ) : null}

        {selectedWordIdioms.length > 0 ? (
          <div className={styles.mobileInfoBlock}>
            <div className={styles.mobileInfoLabel}>стійкі вирази, які варто знати</div>
            <div className={styles.mobileInfoText}>{selectedWordIdioms.join("\n")}</div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderMobileGrammarScreen = () => {
    const isQuestionsNegations = selectedGrammar.key === "questions-negations";
    const mobileSections = (selectedGrammar.sharedSections || grammarCard.sections || []);

    return (
      <div className={styles.mobileShell}>
        {renderMobileHeader(selectedGrammar.title, true)}

        <div className={styles.mobileScrollArea}>
          {!isQuestionsNegations ? (
            <>
              <div className={styles.mobileGrammarCard}>
                <div className={styles.mobileGrammarCardHeader}>
                  <div>
                    <div className={styles.mobileGrammarCardTitle}>{grammarCard.heading}</div>
                    {grammarCard.subtitle ? <div className={styles.mobileGrammarCardSubtitle}>{grammarCard.subtitle}</div> : null}
                  </div>

                  <div className={styles.mobileGrammarArrows}>
                    <button
                      type="button"
                      className={styles.mobileGrammarArrowButton}
                      onClick={() => setGrammarIndex((prev) => (prev - 1 + selectedGrammar.cards.length) % selectedGrammar.cards.length)}
                      aria-label="Попередній слайд"
                    >
                      <ArrowIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      className={styles.mobileGrammarArrowButton}
                      onClick={() => setGrammarIndex((prev) => (prev + 1) % selectedGrammar.cards.length)}
                      aria-label="Наступний слайд"
                    >
                      <ArrowIcon direction="right" />
                    </button>
                  </div>
                </div>

                <div className={styles.mobileGrammarBody}>
                  {grammarCard.body.map((item) => {
                    const parts = item.split(":");

                    if (parts.length > 1) {
                      const label = `${parts[0]}:`;
                      const value = parts.slice(1).join(":").trim();

                      return (
                        <div key={item} className={styles.mobileGrammarLine}>
                          <span className={styles.mobileGrammarLineLabel}>{label}</span>{value ? ` ${value}` : ""}
                        </div>
                      );
                    }

                    return <div key={item} className={styles.mobileGrammarLine}>{item}</div>;
                  })}
                </div>
              </div>

              {grammarCard.example.length > 0 ? (
                <div className={styles.mobileGrammarExampleCard}>
                  <div className={styles.mobileGrammarExampleLabel}>{grammarCard.exampleLabel || "Приклад:"}</div>
                  <div className={styles.mobileGrammarExampleDivider} />
                  {grammarCard.example.map((item, index) => (
                    <div key={item} className={`${styles.mobileGrammarExampleLine} ${index % 2 === 0 ? styles.mobileGrammarExampleLineAccent : styles.mobileGrammarExampleLinePlain}`}>{item}</div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.mobileQuestionsBlocks}>
              {(mobileSections[0]?.items || []).map((item, index) => (
                <div key={`${item.title || index}`} className={styles.mobileQuestionBlock}>
                  <div className={styles.mobilePinkDivider} />
                  <div className={styles.mobileQuestionBlockTitle}>{item.title}</div>
                  {item.lines.map((line, lineIndex) => (
                    <div key={`${item.title}_${lineIndex}`} className={styles.mobileQuestionBlockLine}>{line}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={styles.mobileBlueDivider} />

          {!isQuestionsNegations ? (
            <div className={styles.mobileGrammarSections}>
              {mobileSections.map((section) => (
                <div key={section.title} className={styles.mobileGrammarSection}>
                  <div className={styles.mobileGrammarSectionTitle}>{section.title}</div>
                  {section.items.map((item, index, items) => (
                    <div key={`${section.title}_${index}`} className={styles.mobileGrammarSectionItemWrap}>
                      {typeof item === "string" ? (
                        <div className={styles.mobileGrammarSectionItem}>{item}</div>
                      ) : (
                        <>
                          <div className={styles.mobileGrammarSectionItemTitle}>{item.title}</div>
                          {item.lines.map((line, lineIndex) => (
                            <div key={`${item.title}_${lineIndex}`} className={styles.mobileGrammarSectionLine}>{line}</div>
                          ))}
                        </>
                      )}
                      {index < items.length - 1 ? <div className={styles.mobileGrammarSectionDivider} /> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMobileSearchScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Знайти слово", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobilePanelTitle}>Введіть слово для пошуку</div>
        <input
          className={styles.mobileSearchInput}
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setAppliedSearchValue("");
          }}
          autoFocus
        />
        <div className={styles.mobileBlueDivider} />
        <button type="button" className={styles.mobilePrimaryButton} onClick={handleSearchSubmit}>ЗНАЙТИ</button>
      </div>
    </div>
  );

  const renderMobileAddScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Додати слово", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobileAddGrid}>
          <div className={styles.mobileAddRow}>
            <label className={`${styles.mobileAddField} ${styles.mobileAddFieldHalf}`}>
              <span className={styles.mobileAddFieldLabel}>слово</span>
              <textarea className={`${styles.mobileAddFieldInput} ${styles.mobileAddFieldInputSmall}`} value={addForm.word} onChange={(event) => handleAddFormChange("word", event.target.value)} />
            </label>

            <label className={`${styles.mobileAddField} ${styles.mobileAddFieldHalf}`}>
              <span className={styles.mobileAddFieldLabel}>переклад</span>
              <textarea className={`${styles.mobileAddFieldInput} ${styles.mobileAddFieldInputSmall}`} value={addForm.translation} onChange={(event) => handleAddFormChange("translation", event.target.value)} />
            </label>
          </div>

          <div className={styles.mobileAddRowSingle}>
            <label className={`${styles.mobileAddField} ${styles.mobileAddFieldHalf}`}>
              <span className={styles.mobileAddFieldLabel}>частина мови</span>
              <textarea className={`${styles.mobileAddFieldInput} ${styles.mobileAddFieldInputSmall}`} value={addForm.partOfSpeech} onChange={(event) => handleAddFormChange("partOfSpeech", event.target.value)} />
            </label>
          </div>

          <label className={styles.mobileAddField}>
            <span className={styles.mobileAddFieldLabel}>визначення</span>
            <textarea className={styles.mobileAddFieldInput} value={addForm.definition} onChange={(event) => handleAddFormChange("definition", event.target.value)} />
          </label>
          <div className={styles.mobileAddOptionalNote}>*не обов’язково</div>

          <label className={styles.mobileAddField}>
            <span className={styles.mobileAddFieldLabel}>приклад</span>
            <textarea className={styles.mobileAddFieldInput} value={addForm.example} onChange={(event) => handleAddFormChange("example", event.target.value)} />
          </label>
          <div className={styles.mobileAddOptionalNote}>*не обов’язково</div>

          <label className={styles.mobileAddField}>
            <span className={styles.mobileAddFieldLabel}>подібні слова/синоніми</span>
            <textarea className={styles.mobileAddFieldInput} value={addForm.synonyms} onChange={(event) => handleAddFormChange("synonyms", event.target.value)} />
          </label>
          <div className={styles.mobileAddOptionalNote}>*не обов’язково</div>

          <label className={styles.mobileAddField}>
            <span className={styles.mobileAddFieldLabel}>стійкі вирази, які варто знати</span>
            <textarea className={styles.mobileAddFieldInput} value={addForm.idioms} onChange={(event) => handleAddFormChange("idioms", event.target.value)} />
          </label>
          <div className={styles.mobileAddOptionalNote}>*не обов’язково</div>
        </div>

        <div className={styles.mobileBlueDivider} />
        <button type="button" className={styles.mobilePrimaryButton} onClick={handleAddSubmit}>ДОБАВИТИ</button>
      </div>
    </div>
  );

  const renderMobileReviewPlanScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Додати слово для повторення", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobilePanelSectionTitle}>Список слів:</div>
        <div className={styles.mobilePinkDivider} />

        <div className={styles.mobileReviewPlanWordsWrap}>
          <div className={styles.mobileReviewPlanWordsGrid} ref={reviewPlanWordsGridRef}>
            {reviewPlanPagedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.mobileReviewPlanWordButton} ${reviewPlanItemId === item.id ? styles.mobileReviewPlanWordButtonActive : ""}`}
                onClick={() => handleReviewPlanItemClick(item.id)}
              >
                {item.word}
              </button>
            ))}
          </div>

          {reviewPlanItems.length > reviewPlanPageSize ? (
            <div className={styles.mobileReviewPlanPageButtons}>
              <button type="button" className={styles.mobileReviewPlanNextButton} onClick={() => setReviewPlanPage((prev) => prev + 1)} aria-label="Наступна сторінка слів" disabled={!reviewPlanHasMore}>
                <ArrowIcon direction="right" />
              </button>
              <button type="button" className={styles.mobileReviewPlanNextButton} onClick={() => setReviewPlanPage((prev) => Math.max(0, prev - 1))} aria-label="Попередня сторінка слів" disabled={!reviewPlanHasPrevious}>
                <ArrowIcon direction="left" />
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.mobilePanelSectionTitle}>Коли повторити:</div>
        <div className={styles.mobilePinkDivider} />

        <div className={styles.mobilePlanOptions}>
          <label className={styles.mobilePlanOptionLabel}>
            <span className={styles.mobilePlanOptionText}>Сьогодні</span>
            <input type="checkbox" className={styles.reviewPlanCheckboxInput} checked={reviewPlanPeriod === "today"} onChange={() => setReviewPlanPeriod("today")} />
            <span className={styles.mobilePlanCheckbox} aria-hidden="true" onClick={() => setReviewPlanPeriod("today")}>
              <span className={styles.mobilePlanCheckboxInner}>{reviewPlanPeriod === "today" ? <span className={styles.mobilePlanCheckboxMark}>✓</span> : null}</span>
            </span>
          </label>

          <label className={styles.mobilePlanOptionLabel}>
            <span className={styles.mobilePlanOptionText}>Завтра</span>
            <input type="checkbox" className={styles.reviewPlanCheckboxInput} checked={reviewPlanPeriod === "tomorrow"} onChange={() => setReviewPlanPeriod("tomorrow")} />
            <span className={styles.mobilePlanCheckbox} aria-hidden="true" onClick={() => setReviewPlanPeriod("tomorrow")}>
              <span className={styles.mobilePlanCheckboxInner}>{reviewPlanPeriod === "tomorrow" ? <span className={styles.mobilePlanCheckboxMark}>✓</span> : null}</span>
            </span>
          </label>

          <label className={`${styles.mobilePlanOptionLabel} ${styles.mobilePlanOptionLabelWide}`}>
            <span className={styles.mobilePlanOptionText}>Через N днів <span className={styles.mobilePlanOptionHint}>(ввести з клавіатури)</span></span>
            <div className={styles.mobilePlanDaysWrap}>
              <input type="number" min="2" className={styles.mobilePlanDaysInput} value={reviewPlanDays} onChange={(event) => { setReviewPlanPeriod("days"); setReviewPlanDays(event.target.value); }} />
              <input type="checkbox" className={styles.reviewPlanCheckboxInput} checked={reviewPlanPeriod === "days"} onChange={() => setReviewPlanPeriod("days")} />
              <span className={styles.mobilePlanCheckbox} aria-hidden="true" onClick={() => setReviewPlanPeriod("days")}>
                <span className={styles.mobilePlanCheckboxInner}>{reviewPlanPeriod === "days" ? <span className={styles.mobilePlanCheckboxMark}>✓</span> : null}</span>
              </span>
            </div>
          </label>
        </div>

        <div className={styles.mobileBlueDivider} />
        <button type="button" className={styles.mobilePrimaryButton} onClick={handleSubmitReviewPlan}>ДОБАВИТИ</button>
      </div>
    </div>
  );

  const renderMobileReviewResultScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Повторення слів", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobileReviewResultTopDivider} />

        <div className={styles.mobileReviewResultCardsWrap}>
          <div className={styles.mobileReviewResultCard}>
            <div className={styles.mobileReviewResultCardHead}>Знаю</div>
            <div className={styles.mobileReviewResultCardValue}>{reviewStats.known}</div>
          </div>

          <div className={styles.mobileReviewResultCard}>
            <div className={styles.mobileReviewResultCardHead}>Не знаю</div>
            <div className={styles.mobileReviewResultCardValue}>{reviewStats.unknown}</div>
          </div>

          <div className={styles.mobileReviewResultCard}>
            <div className={styles.mobileReviewResultCardHead}>Повторити</div>
            <div className={styles.mobileReviewResultCardValue}>{reviewStats.repeat}</div>
          </div>
        </div>

        <div className={styles.mobileBlueDivider} />
        <button type="button" className={styles.mobilePrimaryButton} onClick={handleRetryReview}>ПЕРЕПРОЙТИ</button>
      </div>
    </div>
  );

  const renderMobileReviewCardScreen = () => (
    <div className={styles.mobileShell}>
      {renderMobileHeader("Повторення слів", true)}

      <div className={styles.mobileScrollArea}>
        <div className={styles.mobileReviewProgressWrap}>
          <div className={styles.mobileReviewProgressBar}>
            <div className={styles.mobileReviewProgressFill} style={{ width: `${reviewQueue.length > 0 ? ((reviewIndex + 1) / reviewQueue.length) * 100 : 0}%` }} />
            <div className={styles.mobileReviewProgressText}>{reviewProgressCurrent}/{reviewQueue.length || 0}</div>
          </div>
        </div>

        <button type="button" className={`${styles.mobileReviewCardButton} ${reviewItem?.showTranslation ? styles.mobileReviewCardButtonFlipped : ""}`} onClick={() => handleReviewAction("flip")}> 
          <span className={`${styles.mobileReviewCardLayer} ${styles.mobileReviewCardLayerBack}`} />
          <span className={`${styles.mobileReviewCardLayer} ${styles.mobileReviewCardLayerMiddle}`} />
          <span className={styles.mobileReviewCardFlipWrap}>
            <span className={`${styles.mobileReviewCardFace} ${styles.mobileReviewCardFaceFront}`}>
              <span className={styles.mobileReviewCardFaceText}>{reviewItem?.word || "—"}</span>
            </span>
            <span className={`${styles.mobileReviewCardFace} ${styles.mobileReviewCardFaceBack}`}>
              <span className={styles.mobileReviewCardFaceText}>{getPrimaryTranslation(reviewItem) || "—"}</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          className={`${styles.mobileWordInUseButton} ${!reviewItem?.showTranslation ? styles.mobileWordInUseButtonDisabled : ""}`}
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
          <div className={styles.mobileWordInUseCard}>
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

        <div className={styles.mobileReviewActionsRow}>
          <button type="button" className={`${styles.mobileReviewActionButton} ${styles.mobileReviewActionButtonWrong}`} onClick={() => handleReviewAction("wrong")} aria-label="Не знаю">
            <ReviewWrongIcon />
          </button>
          <button
            type="button"
            className={`${styles.mobileReviewActionButton} ${styles.mobileReviewActionButtonCorrect} ${reviewItem?.hintUsed ? styles.mobileReviewActionButtonDisabled : ""}`}
            onClick={() => {
              if (reviewItem?.hintUsed) {
                return;
              }

              handleReviewAction("correct");
            }}
            aria-label="Знаю"
            disabled={reviewItem?.hintUsed}
          >
            <ReviewCorrectIcon />
          </button>
          <button type="button" className={`${styles.mobileReviewActionButton} ${styles.mobileReviewActionButtonSkip}`} onClick={() => handleReviewAction("skip")} aria-label="Далі">
            <ReviewSkipIcon />
          </button>
        </div>
      </div>
    </div>
  );

  const renderMobileLayout = () => {
    if (rightMode === "word" && selectedItemDetails) {
      return renderTabletPanel("Деталі слова", renderWordPanel(), `${styles.tabletPanelBodyWord} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "grammar") {
      return renderTabletPanel(selectedGrammar.title, renderGrammarPanel(), `${styles.tabletPanelBodyGrammar} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "search") {
      return renderTabletPanel("Знайти слово", renderSearchPanel(), `${styles.tabletPanelBodySearch} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "add") {
      return renderTabletPanel("Додати слово", renderAddPanel(), `${styles.tabletPanelBodyAdd} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "reviewPlan") {
      return renderTabletPanel("Додати слово для повторення", renderReviewPlanPanel(), `${styles.tabletPanelBodyReviewPlan} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "reviewCard") {
      return renderTabletPanel("Повторення слів", renderReviewCardPanel(), `${styles.tabletPanelBodyReviewCard} ${styles.mobileSidebarPanelBody}`);
    }

    if (rightMode === "reviewResult") {
      return renderTabletPanel("Повторення слів", renderReviewResultPanel(), `${styles.tabletPanelBodyReviewResult} ${styles.mobileSidebarPanelBody}`);
    }

    return renderMobileDictionaryScreen();
  };

  const messageModalNode = typeof document !== "undefined" ? document.getElementById("lumino-home-stage") : null;
  const messageModal = modal.open ? (
    <div className={styles.messageModalOverlay}>
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

  const renderDictionaryColumn = () => (
    <section className={`${styles.dictionaryColumn} ${isReviewSessionActive ? styles.dictionaryColumnLocked : ""}`}>
      <div className={styles.dictionaryTopLine} />

      <div className={styles.dictionaryHeader}>
        <div className={styles.dictionaryTitle}>МІЙ СЛОВНИК</div>

        <div className={`${styles.dictionaryTabs} ${isReviewSessionActive ? styles.dictionaryTabsLocked : ""}`}>
          <button type="button" className={`${styles.filterTab} ${activeFilter === "list" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("list")}>список</button>
          <span className={styles.filterDivider} />
          <button type="button" className={`${styles.filterTab} ${activeFilter === "review" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("review")}>повторення</button>
          <span className={styles.filterDivider} />
          <button type="button" className={`${styles.filterTab} ${activeFilter === "level" ? styles.filterTabActive : ""}`} onClick={() => handleFilterChange("level")}>рівень</button>
        </div>

        <div className={`${styles.headerIcons} ${isReviewSessionActive ? styles.headerIconsLocked : ""}`}>
          <button type="button" className={styles.iconButton} onClick={handleOpenSearch} aria-label="Пошук">
            <img src={SearchIconAsset} alt="" className={styles.headerIconAsset} />
          </button>

          <button type="button" className={`${styles.iconButton} ${deleteMode ? styles.iconButtonActive : ""}`} onClick={handleDeleteModeToggle} aria-label="Режим видалення">
            <img src={DeleteIconAsset} alt="" className={styles.headerIconAsset} />
          </button>
        </div>
      </div>

      <div className={styles.dictionaryBottomLine} />

      <div className={`${styles.wordsArea} ${isReviewSessionActive ? styles.wordsAreaLocked : ""}`}>
        {activeFilter === "list" ? (
          sortedListItems.length > 0 ? (
            <div className={styles.wordGrid}>
              {sortedListItems.map((item) => {
                const active = selectedItemId === item.id;
                const translation = getPrimaryTranslation(item);
                const chipTitle = getWordChipTitle(item);

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
                      title={chipTitle}
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
            {renderLevelColumn(1, "Рівень 1", levelGroups[1])}
            {renderLevelColumn(2, "Рівень 2", levelGroups[2])}
            {renderLevelColumn(3, "Рівень 3", levelGroups[3])}
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

      <div className={`${styles.grammarButtonsColumn} ${isReviewSessionActive ? styles.grammarButtonsColumnLocked : ""}`}>
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

      <button type="button" className={`${styles.repeatButton} ${isReviewSessionActive ? styles.repeatButtonLocked : ""}`} onClick={handleOpenReview} disabled={isReviewSessionActive}>Повторити слова</button>
      {isReviewSessionActive ? <div className={styles.dictionaryReviewOverlay} aria-hidden="true" /> : null}
    </section>
  );

  const renderTabletPanel = (title, content, className = "") => (
    <div className={styles.tabletShell}>
      <div className={styles.tabletTopBar}>
        <button type="button" className={styles.tabletBackButton} onClick={closeTransientState} aria-label="Назад">
          <HeaderBackIcon />
        </button>

        <div className={styles.tabletTopBarTitle}>{title}</div>
        <span className={styles.tabletBackSpacer} aria-hidden="true" />
      </div>

      <div className={styles.tabletScrollArea}>
        <div className={`${styles.tabletPanelBody} ${className}`}>{content}</div>
      </div>
    </div>
  );

  const renderTabletLayout = () => {
    if (rightMode === "word" && selectedItemDetails) {
      return renderTabletPanel("Деталі слова", renderWordPanel(), styles.tabletPanelBodyWord);
    }

    if (rightMode === "grammar") {
      return renderTabletPanel(selectedGrammar.title, renderGrammarPanel(), styles.tabletPanelBodyGrammar);
    }

    if (rightMode === "search") {
      return renderTabletPanel("Знайти слово", renderSearchPanel(), styles.tabletPanelBodySearch);
    }

    if (rightMode === "add") {
      return renderTabletPanel("Додати слово", renderAddPanel(), styles.tabletPanelBodyAdd);
    }

    if (rightMode === "reviewPlan") {
      return renderTabletPanel("Додати слово для повторення", renderReviewPlanPanel(), styles.tabletPanelBodyReviewPlan);
    }

    if (rightMode === "reviewCard") {
      return renderTabletPanel("Повторення слів", renderReviewCardPanel(), styles.tabletPanelBodyReviewCard);
    }

    if (rightMode === "reviewResult") {
      return renderTabletPanel("Повторення слів", renderReviewResultPanel(), styles.tabletPanelBodyReviewResult);
    }

    return <div className={`${styles.embeddedContent} ${styles.tabletContent}`}>{renderDictionaryColumn()}</div>;
  };

  const renderDesktopLayout = () => (
    <div className={styles.embeddedContent}>
      {renderDictionaryColumn()}

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
            <div className={styles.wordModalOverlay}>
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
  );

  return (
    <div className={styles.embeddedViewport}>
      <GlassLoading open={loading || saving} text={loading ? "Завантажуємо словник..." : "Оновлюємо словник..."} stageTargetId="lumino-home-stage" />
      {messageModalNode && messageModal ? createPortal(messageModal, messageModalNode) : messageModal}
      {isMobileLayout ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
}
