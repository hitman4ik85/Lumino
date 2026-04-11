import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { lessonsService } from "../../../services/lessonsService.js";
import { lessonService } from "../../../services/lessonService.js";
import { userService } from "../../../services/userService.js";
import { achievementsService } from "../../../services/achievementsService.js";
import { demoLessonService } from "../../../services/demoLessonService.js";
import { getCachedLessonPack, preloadLessonPack } from "../../../services/lessonPackCache.js";
import { PATHS } from "../../../routes/paths.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import styles from "./LessonPage.module.css";
import { useStageScale } from "../../../hooks/useStageScale.js";

import BgLeft from "../../../assets/lesson/backgrounds/bg3-left_lesson.webp";
import BgRight from "../../../assets/lesson/backgrounds/bg3-right_lesson.webp";
import Mascot from "../../../assets/mascot/mascot3.svg";
import SentenceMascot from "../../../assets/mascot/mascot10.svg";
import InputMascot from "../../../assets/mascot/mascot9.svg";
import StarOne from "../../../assets/mascot/Star_1.svg";
import StarTwo from "../../../assets/mascot/Star_2.svg";
import StarThree from "../../../assets/mascot/Star_3.svg";
import EnergyIcon from "../../../assets/home/header/energy.svg";
import CrystalIcon from "../../../assets/home/header/crystal.svg";
import EnergySmallIcon from "../../../assets/home/shared/energy-small.svg";

function getMediaRoots() {
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "/api").trim();
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const apiRoot = /^https?:\/\//i.test(apiBase)
    ? apiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "")
    : browserOrigin;
  const apiBasePath = apiBase
    ? apiBase.startsWith("/") || /^https?:\/\//i.test(apiBase)
      ? apiBase.replace(/\/$/, "")
      : `/${apiBase.replace(/^\/+/, "").replace(/\/$/, "")}`
    : "";

  return {
    browserOrigin,
    apiRoot,
    apiBasePath,
  };
}

function resolveMediaUrl(value) {
  const candidates = buildMediaUrlCandidates(value);
  return candidates[0] || "";
}

function isProxyFriendlyMediaPath(pathname) {
  return pathname.startsWith("/uploads/") || pathname.startsWith("/avatars/");
}

function extractPublicMediaPath(value) {
  const normalized = String(value || "").trim().replace(/\\/g, "/").toLowerCase();
  const original = String(value || "").trim().replace(/\\/g, "/");
  const markers = ["/uploads/lessons/", "uploads/lessons/", "/uploads/", "uploads/", "/avatars/", "avatars/"];

  for (const marker of markers) {
    const markerIndex = normalized.indexOf(marker);

    if (markerIndex < 0) {
      continue;
    }

    const path = original.slice(markerIndex);
    return path.startsWith("/") ? path : `/${path.replace(/^\/+/, "")}`;
  }

  return "";
}

function normalizeLessonMediaValue(value) {
  const src = String(value || "").trim();

  if (!src) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  return extractPublicMediaPath(src) || src.replace(/\\/g, "/");
}

function buildMediaUrlCandidates(value) {
  const src = normalizeLessonMediaValue(value);

  if (!src) {
    return [];
  }

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return [src];
  }

  const { browserOrigin, apiRoot, apiBasePath } = getMediaRoots();
  const candidates = [];

  if (/^(https?:)?\/\//i.test(src)) {
    try {
      const parsed = new URL(src, browserOrigin || undefined);
      const pathname = `${parsed.pathname || ""}${parsed.search || ""}${parsed.hash || ""}`;

      if (pathname && isProxyFriendlyMediaPath(parsed.pathname || "")) {
        candidates.push(pathname);

        if (browserOrigin) {
          candidates.push(`${browserOrigin}${pathname}`);
        }
      }
    } catch {
      // ignore invalid absolute media url and keep original candidate below
    }

    candidates.push(src);
    return candidates.filter((item, index, array) => item && array.indexOf(item) === index);
  }

  const normalized = src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;

  candidates.push(normalized);

  if (apiRoot) {
    candidates.push(`${apiRoot}${normalized}`);
  }

  if (apiBasePath) {
    candidates.push(`${apiBasePath}${normalized}`);
  }

  if (browserOrigin) {
    candidates.push(`${browserOrigin}${normalized}`);

    if (apiBasePath.startsWith("/")) {
      candidates.push(`${browserOrigin}${apiBasePath}${normalized}`);
    }
  }

  if (apiBasePath.startsWith("/")) {
    candidates.push(`${apiBasePath}${normalized}`);
  }

  return candidates.filter((item, index, array) => item && array.indexOf(item) === index);
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeApostrophes(value) {
  return String(value || "").replace(/[’‘ʼ＇']/g, "'");
}

function normalizeText(value) {
  return normalizeApostrophes(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function makeIdempotencyKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDeterministicShuffle(items, seedSource) {
  const result = [...items];
  let seed = Array.from(String(seedSource || "match-seed")).reduce(
    (acc, char, index) => acc + char.charCodeAt(0) * (index + 1),
    0
  );

  for (let i = result.length - 1; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const randomIndex = seed % (i + 1);
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function formatMatchCorrectAnswer(exercise) {
  const pairs = parseJson(exercise?.data, []);

  if (!Array.isArray(pairs) || !pairs.length) {
    return "";
  }

  return pairs.map((item) => `${item.left} ↔ ${item.right}`).join(", ");
}

function parseMatchSelections(answer, pairs) {
  const pairItems = Array.isArray(pairs)
    ? pairs.map((item, index) => ({
      leftIndex: index,
      rightIndex: index,
      left: String(item?.left || ""),
      right: String(item?.right || ""),
    }))
    : [];

  if (!pairItems.length) {
    return [];
  }

  const parsed = parseJson(answer, null);

  if (!parsed) {
    return [];
  }

  const selectionsByLeftIndex = {};
  const usedRightIndexes = new Set();

  const assignSelection = (leftIndex, rightIndex, rightValue) => {
    if (!Number.isInteger(leftIndex) || leftIndex < 0 || leftIndex >= pairItems.length) {
      return;
    }

    const pairItem = pairItems[leftIndex];

    if (!pairItem) {
      return;
    }

    const previousSelection = selectionsByLeftIndex[leftIndex];

    if (previousSelection && Number.isInteger(previousSelection.rightIndex) && previousSelection.rightIndex >= 0) {
      usedRightIndexes.delete(previousSelection.rightIndex);
    }

    if (!Number.isInteger(rightIndex) || rightIndex < 0 || rightIndex >= pairItems.length) {
      selectionsByLeftIndex[leftIndex] = {
        leftIndex,
        rightIndex: -1,
        left: pairItem.left,
        right: String(rightValue || ""),
      };
      return;
    }

    usedRightIndexes.add(rightIndex);

    selectionsByLeftIndex[leftIndex] = {
      leftIndex,
      rightIndex,
      left: pairItem.left,
      right: pairItems[rightIndex]?.right || String(rightValue || ""),
    };
  };

  const resolveRightIndex = (rightIndexValue, rightValue) => {
    const parsedRightIndex = Number(rightIndexValue);

    if (
      Number.isInteger(parsedRightIndex)
      && parsedRightIndex >= 0
      && parsedRightIndex < pairItems.length
      && !usedRightIndexes.has(parsedRightIndex)
    ) {
      return parsedRightIndex;
    }

    const normalizedRight = normalizeText(rightValue);

    if (!normalizedRight) {
      return -1;
    }

    return pairItems.findIndex((item) => !usedRightIndexes.has(item.rightIndex) && normalizeText(item.right) === normalizedRight);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      let leftIndex = Number(item?.leftIndex);

      if (!Number.isInteger(leftIndex) || leftIndex < 0 || leftIndex >= pairItems.length) {
        const normalizedLeft = normalizeText(item?.left);

        leftIndex = pairItems.findIndex((pairItem, index) => {
          return !Object.prototype.hasOwnProperty.call(selectionsByLeftIndex, index)
            && normalizeText(pairItem.left) === normalizedLeft;
        });
      }

      if (leftIndex < 0) {
        return;
      }

      assignSelection(leftIndex, resolveRightIndex(item?.rightIndex, item?.right), item?.right);
    });
  } else if (typeof parsed === "object") {
    Object.entries(parsed).forEach(([left, right]) => {
      const normalizedLeft = normalizeText(left);
      const leftIndex = pairItems.findIndex((pairItem, index) => {
        return !Object.prototype.hasOwnProperty.call(selectionsByLeftIndex, index)
          && normalizeText(pairItem.left) === normalizedLeft;
      });

      if (leftIndex < 0) {
        return;
      }

      assignSelection(leftIndex, resolveRightIndex(-1, right), right);
    });
  }

  return Object.values(selectionsByLeftIndex).sort((a, b) => a.leftIndex - b.leftIndex);
}

function buildMatchAnswerValue(selections) {
  return JSON.stringify(
    (Array.isArray(selections) ? selections : [])
      .filter((item) => Number.isInteger(item?.leftIndex) && item.leftIndex >= 0)
      .sort((a, b) => a.leftIndex - b.leftIndex)
      .map((item) => ({
        leftIndex: item.leftIndex,
        rightIndex: Number.isInteger(item?.rightIndex) ? item.rightIndex : -1,
        left: String(item?.left || ""),
        right: String(item?.right || ""),
      }))
  );
}

function buildMatchSubmitPairs(answer, pairs) {
  return parseMatchSelections(answer, pairs).map((item) => ({
    leftIndex: item.leftIndex,
    rightIndex: Number.isInteger(item?.rightIndex) ? item.rightIndex : -1,
    left: item.left,
    right: item.right,
  }));
}

function evaluateMatchSelections(pairs, selections) {
  const safePairs = Array.isArray(pairs) ? pairs : [];
  const safeSelections = Array.isArray(selections) ? selections : [];
  const resultByLeftIndex = {};

  if (!safePairs.length) {
    return {
      isCorrect: false,
      resultByLeftIndex,
    };
  }

  const pairGroups = safePairs.reduce((acc, item, index) => {
    const normalizedLeft = normalizeText(item?.left);

    if (!normalizedLeft) {
      resultByLeftIndex[index] = false;
      return acc;
    }

    if (!acc[normalizedLeft]) {
      acc[normalizedLeft] = {
        rightsCount: {},
        indexes: [],
      };
    }

    const normalizedRight = normalizeText(item?.right);

    if (normalizedRight) {
      acc[normalizedLeft].rightsCount[normalizedRight] = (acc[normalizedLeft].rightsCount[normalizedRight] || 0) + 1;
    }

    acc[normalizedLeft].indexes.push(index);
    return acc;
  }, {});

  const selectionsByLeftIndex = safeSelections.reduce((acc, item) => {
    if (Number.isInteger(item?.leftIndex) && item.leftIndex >= 0) {
      acc[item.leftIndex] = item;
    }

    return acc;
  }, {});

  Object.values(pairGroups).forEach((group) => {
    const remainingRights = { ...group.rightsCount };

    group.indexes.forEach((leftIndex) => {
      const normalizedRight = normalizeText(selectionsByLeftIndex[leftIndex]?.right);

      if (normalizedRight && (remainingRights[normalizedRight] || 0) > 0) {
        resultByLeftIndex[leftIndex] = true;
        remainingRights[normalizedRight] -= 1;
        return;
      }

      resultByLeftIndex[leftIndex] = false;
    });
  });

  const allAssigned = safePairs.every((_, index) => {
    return Number.isInteger(selectionsByLeftIndex[index]?.rightIndex) && selectionsByLeftIndex[index].rightIndex >= 0;
  });

  return {
    isCorrect: allAssigned && safePairs.every((_, index) => resultByLeftIndex[index] === true),
    resultByLeftIndex,
  };
}

function isCorrectAnswer(exercise, answer) {
  if (!exercise) {
    return false;
  }

  if (exercise.type === "MultipleChoice") {
    return normalizeText(answer) === normalizeText(exercise.correctAnswer);
  }

  if (exercise.type === "Input") {
    return normalizeText(answer) === normalizeText(exercise.correctAnswer);
  }

  if (exercise.type === "Match") {
    const correct = parseJson(exercise.data, []);
    const pairs = Array.isArray(correct) ? correct : [];
    const selections = parseMatchSelections(answer, pairs);

    return evaluateMatchSelections(pairs, selections).isCorrect;
  }

  return false;
}

function normalizeExercise(raw) {
  const rawImageUrl = normalizeLessonMediaValue(String(raw?.imageUrl || raw?.ImageUrl || "").trim());

  return {
    id: Number(raw?.id || 0),
    order: Number(raw?.order || 0),
    type: String(raw?.type || ""),
    question: String(raw?.question || ""),
    data: raw?.data || "",
    rawImageUrl,
    imageUrl: resolveMediaUrl(rawImageUrl),
    correctAnswer: raw?.correctAnswer || raw?.CorrectAnswer || "",
  };
}

function getMultipleChoiceOptions(exercise) {
  const parsed = parseJson(exercise?.data, []);
  return Array.isArray(parsed) ? parsed : [];
}

function isSentenceMultipleChoice(exercise) {
  const question = String(exercise?.question || "").trim();
  return /_{3,}/.test(question);
}

function getExerciseTitle(exercise) {
  if (!exercise) {
    return "";
  }

  if (exercise.type === "MultipleChoice") {
    return isSentenceMultipleChoice(exercise) ? "Виберіть правильне пропущене слово" : "Виберіть правильний переклад";
  }

  if (exercise.type === "Input") {
    return "Введіть правильну відповідь";
  }

  if (exercise.type === "Match") {
    return "Поєднайте правильні варіанти";
  }

  return "Виконайте вправу";
}

function getExerciseSubtitle(exercise) {
  if (!exercise) {
    return "";
  }

  if (exercise.type === "MultipleChoice") {
    return "1 правильна відповідь";
  }

  if (exercise.type === "Match") {
    return "Оберіть відповідні пари";
  }

  return "";
}

function getInputAnswerTranslation(exercise) {
  const parsed = parseJson(exercise?.data, null);

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  if (parsed && typeof parsed === "object") {
    return String(
      parsed.translation ||
      parsed.translate ||
      parsed.ua ||
      parsed.uk ||
      parsed.ukrainian ||
      parsed.meaning ||
      parsed.prompt ||
      ""
    ).trim();
  }

  return "";
}

function buildInputSlots(answer) {
  return Array.from(String(answer || "").trim());
}

function TypingText({ text, className, animationKey, startDelay = 1040, stepDelay = 24 }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    const content = String(text || "");
    setVisibleText("");

    if (!content) {
      return undefined;
    }

    let cancelled = false;
    let startTimer = null;
    let typingTimer = null;
    let index = 0;

    startTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }

      typingTimer = setInterval(() => {
        index += 1;
        setVisibleText(content.slice(0, index));

        if (index >= content.length) {
          clearInterval(typingTimer);
        }
      }, stepDelay);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearInterval(typingTimer);
    };
  }, [animationKey, startDelay, stepDelay, text]);

  return <div className={className}>{visibleText}</div>;
}

function StableTypingText({ text, className, animationKey, startDelay = 1040, stepDelay = 24 }) {
  const [visibleText, setVisibleText] = useState("");
  const content = String(text || "");

  useEffect(() => {
    setVisibleText("");

    if (!content) {
      return undefined;
    }

    let cancelled = false;
    let startTimer = null;
    let typingTimer = null;
    let index = 0;

    startTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }

      typingTimer = setInterval(() => {
        index += 1;
        setVisibleText(content.slice(0, index));

        if (index >= content.length) {
          clearInterval(typingTimer);
        }
      }, stepDelay);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearInterval(typingTimer);
    };
  }, [animationKey, content, startDelay, stepDelay]);

  return (
    <div className={className}>
      <div className={styles.stableTypingTextSizer} aria-hidden="true">{content || " "}</div>
      <div className={styles.stableTypingTextLayer}>{visibleText}</div>
    </div>
  );
}

function BubbleTypingText({ lines, className, animationKey, startDelay = 1040, stepDelay = 24 }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const normalizedLines = useMemo(
    () => (Array.isArray(lines) ? lines : []).map((line, index) => ({
      key: line?.key || `${index}`,
      as: line?.as === "strong" ? "strong" : "span",
      className: line?.className || undefined,
      text: String(line?.text || ""),
    })),
    [lines]
  );
  const totalCharacters = useMemo(
    () => normalizedLines.reduce((sum, line) => sum + line.text.length, 0),
    [normalizedLines]
  );

  useEffect(() => {
    setVisibleCount(0);

    if (!totalCharacters) {
      return undefined;
    }

    let cancelled = false;
    let startTimer = null;
    let typingTimer = null;
    let index = 0;

    startTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }

      typingTimer = setInterval(() => {
        index += 1;
        setVisibleCount(index);

        if (index >= totalCharacters) {
          clearInterval(typingTimer);
        }
      }, stepDelay);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearInterval(typingTimer);
    };
  }, [animationKey, startDelay, stepDelay, totalCharacters]);

  let printedCharacters = 0;

  return (
    <div className={className}>
      <div className={styles.feedbackBubbleTextSizer} aria-hidden="true">
        {normalizedLines.map((line) => {
          const Tag = line.as;
          return <Tag key={`sizer-${line.key}`} className={line.className}>{line.text || " "}</Tag>;
        })}
      </div>

      <div className={styles.feedbackBubbleTextTypingLayer}>
        {normalizedLines.map((line) => {
          const availableCharacters = Math.max(0, visibleCount - printedCharacters);
          const visibleText = line.text.slice(0, availableCharacters);
          printedCharacters += line.text.length;

          if (!visibleText) {
            return null;
          }

          const Tag = line.as;
          return <Tag key={line.key} className={line.className}>{visibleText}</Tag>;
        })}
      </div>
    </div>
  );
}

function ExerciseImage({ exercise }) {
  const candidates = useMemo(
    () => buildMediaUrlCandidates(exercise?.rawImageUrl || exercise?.imageUrl),
    [exercise?.imageUrl, exercise?.rawImageUrl]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isImageUnavailable, setIsImageUnavailable] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setIsImageUnavailable(false);
  }, [candidates]);

  const currentSrc = candidates[candidateIndex] || "";

  if (!currentSrc || isImageUnavailable) {
    return <span className={styles.wordCardFrontFallback}>{exercise?.question}</span>;
  }

  return (
    <img
      className={styles.wordCardImage}
      src={currentSrc}
      alt=""
      onError={() => {
        setCandidateIndex((prev) => {
          if (prev >= candidates.length - 1) {
            setIsImageUnavailable(true);
            return prev;
          }

          return prev + 1;
        });
      }}
    />
  );
}

function MultipleChoiceExercise({ exercise, value, feedback, selectedFlipSide, onSelect, onFlipCard }) {
  const options = useMemo(() => getMultipleChoiceOptions(exercise), [exercise]);
  const isFeedback = Boolean(feedback);
  const isSentenceMode = useMemo(() => isSentenceMultipleChoice(exercise), [exercise]);
  const questionAnimationKey = `${exercise?.id || "exercise"}-choice-question-${exercise?.question || ""}`;
  const feedbackAnimationKey = `${exercise?.id || "exercise"}-choice-feedback-${feedback?.correct ? "correct" : "wrong"}-${exercise?.correctAnswer || ""}`;

  return (
    <div className={styles.multipleChoiceLayout}>
      {isFeedback ? (
        <div key={feedbackAnimationKey} className={`${styles.feedbackHeroRow} ${feedback.correct ? styles.feedbackHeroRowCorrect : styles.feedbackHeroRowWrong}`}>
          <div className={`${styles.mascotWrap} ${styles.sequenceMascot}`}>
            <img className={`${styles.feedbackStar} ${styles.feedbackStarOne}`} src={StarTwo} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarTwo}`} src={StarOne} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarThree}`} src={StarThree} alt="" />
            <img className={styles.feedbackMascot} src={Mascot} alt="" />
          </div>

          <div className={`${styles.feedbackBubbleWrap} ${feedback.correct ? styles.feedbackBubbleWrapCorrect : styles.feedbackBubbleWrapWrong} ${styles.sequenceBubble}`}>
            <div className={`${styles.feedbackBubbleShape} ${feedback.correct ? styles.feedbackBubbleShapeSingle : styles.feedbackBubbleShapeDouble}`}>
              <div className={styles.feedbackBubbleTail} />
              <BubbleTypingText
                className={`${styles.feedbackBubbleText} ${feedback.correct ? styles.feedbackBubbleTextSingle : styles.feedbackBubbleTextDouble}`}
                animationKey={`${exercise?.id || "exercise"}-choice-${feedback.correct ? "correct" : "wrong"}-${exercise?.correctAnswer || ""}`}
                lines={feedback.correct
                  ? [{ text: "Молодець!" }]
                  : [
                    { text: "Ой! Насправді тут має бути", className: styles.feedbackBubbleTextLine },
                    { text: exercise.correctAnswer, as: "strong" },
                  ]}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.exerciseTitle}>{getExerciseTitle(exercise)}</div>
          <div className={styles.exerciseSubtitle}>{getExerciseSubtitle(exercise)}</div>
        </>
      )}

      <div className={`${styles.exerciseAnswerZone} ${exercise.imageUrl ? styles.exerciseAnswerZoneWithImage : ""} ${isFeedback ? styles.exerciseAnswerZoneFeedback : ""}`}>
        {!isFeedback ? (
          isSentenceMode ? (
            <div key={questionAnimationKey} className={styles.sentenceHeroRow}>
              <img className={`${styles.sentenceMascot} ${styles.sequenceMascot}`} src={SentenceMascot} alt="" />
              <div className={`${styles.sentenceBubble} ${styles.sequenceBubble}`}>
                <StableTypingText
                  className={styles.sentenceBubbleText}
                  text={exercise.question}
                  animationKey={exercise.id}
                />
              </div>
            </div>
          ) : exercise.imageUrl ? (
            <button type="button" className={`${styles.wordCard} ${selectedFlipSide ? styles.wordCardFlipped : ""}`} onClick={onFlipCard}>
              <span className={styles.wordCardInner}>
                <span className={styles.wordCardFront}>
                  <ExerciseImage exercise={exercise} />
                </span>
                <span className={styles.wordCardBack}>{exercise.question}</span>
              </span>
            </button>
          ) : (
            <div className={styles.exercisePrompt}>{exercise.question}</div>
          )
        ) : null}


        <div className={styles.optionsGrid}>
          {options.map((option) => {
            const selected = normalizeText(value) === normalizeText(option);
            const correct = normalizeText(exercise.correctAnswer) === normalizeText(option);

            let optionClassName = styles.optionButton;

            if (!isFeedback && selected) {
              optionClassName = `${styles.optionButton} ${styles.optionButtonSelected}`;
            }

            if (isFeedback && feedback.correct && selected && correct) {
              optionClassName = `${styles.optionButton} ${styles.optionButtonCorrect}`;
            }

            if (isFeedback && !feedback.correct && selected) {
              optionClassName = `${styles.optionButton} ${styles.optionButtonWrong}`;
            }

            return (
              <button
                key={option}
                type="button"
                className={optionClassName}
                onClick={() => !isFeedback && onSelect(option)}
                disabled={isFeedback}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InputExercise({ exercise, value, feedback, onChange }) {
  const answerSlots = useMemo(() => buildInputSlots(exercise?.correctAnswer), [exercise?.correctAnswer]);
  const enteredSlots = useMemo(() => Array.from(String(value || "").replace(/[\r\n]/g, "")), [value]);
  const translation = useMemo(() => getInputAnswerTranslation(exercise), [exercise]);
  const isFeedback = Boolean(feedback);
  const questionAnimationKey = `${exercise?.id || "exercise"}-input-question-${exercise?.question || ""}`;
  const feedbackAnimationKey = `${exercise?.id || "exercise"}-input-feedback-${feedback?.correct ? "correct" : "wrong"}-${exercise?.correctAnswer || ""}-${translation || ""}`;

  return (
    <div className={styles.inputExerciseLayout}>
      {isFeedback ? (
        <div key={feedbackAnimationKey} className={`${styles.feedbackHeroRow} ${feedback.correct ? styles.feedbackHeroRowCorrect : styles.feedbackHeroRowWrong}`}>
          <div className={`${styles.mascotWrap} ${styles.sequenceMascot}`}>
            <img className={`${styles.feedbackStar} ${styles.feedbackStarOne}`} src={StarTwo} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarTwo}`} src={StarOne} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarThree}`} src={StarThree} alt="" />
            <img className={styles.feedbackMascot} src={Mascot} alt="" />
          </div>

          <div className={`${styles.feedbackBubbleWrap} ${feedback.correct ? styles.feedbackBubbleWrapCorrect : styles.feedbackBubbleWrapWrong} ${styles.sequenceBubble}`}>
            <div className={`${styles.feedbackBubbleShape} ${feedback.correct ? styles.feedbackBubbleShapeSingle : styles.feedbackBubbleShapeDouble}`}>
              <div className={styles.feedbackBubbleTail} />
              <BubbleTypingText
                className={`${styles.feedbackBubbleText} ${feedback.correct ? styles.feedbackBubbleTextSingle : styles.feedbackBubbleTextDouble}`}
                animationKey={`${exercise?.id || "exercise"}-input-${feedback.correct ? "correct" : "wrong"}-${exercise?.correctAnswer || ""}-${translation || ""}`}
                lines={feedback.correct
                  ? [{ text: "Молодець!" }]
                  : [
                    { text: "Не зовсім так, у тексті має бути", className: styles.feedbackBubbleTextLine },
                    { text: exercise.correctAnswer, as: "strong" },
                  ]}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.inputExerciseTitle}>{getExerciseTitle(exercise)}</div>

          <div key={questionAnimationKey} className={styles.inputHeroRow}>
            <img className={`${styles.inputMascot} ${styles.sequenceMascot}`} src={InputMascot} alt="" />
            <div className={`${styles.inputBubble} ${styles.sequenceBubble}`}>
              <StableTypingText
                className={styles.inputBubbleText}
                text={exercise.question}
                animationKey={exercise.id}
              />
            </div>
          </div>

          <div className={styles.inputAnswerWrap}>
            <div className={styles.inputAnswerSlots}>
              {answerSlots.map((symbol, index) => {
                const currentSymbol = enteredSlots[index] || "";
                const isSpace = symbol === " ";

                return (
                  <span
                    key={`${symbol}-${index}`}
                    className={`${styles.inputAnswerSlot} ${isSpace ? styles.inputAnswerSlotSpace : ""}`}
                  >
                    {!isSpace ? <span className={styles.inputAnswerUnderline} /> : null}
                    {!isSpace ? <span className={styles.inputAnswerLetter}>{currentSymbol}</span> : null}
                  </span>
                );
              })}
            </div>

            <input
              className={styles.inputAnswerField}
              value={value}
              onChange={(event) => onChange(event.target.value.replace(/[\r\n]/g, "").slice(0, answerSlots.length))}
              maxLength={answerSlots.length}
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  );
}

function MatchExercise({ exercise, value, feedback, onChange }) {
  const pairs = useMemo(() => {
    const parsed = parseJson(exercise.data, []);
    return Array.isArray(parsed) ? parsed : [];
  }, [exercise.data]);
  const [selectedLeftIndex, setSelectedLeftIndex] = useState(-1);
  const currentSelections = useMemo(() => parseMatchSelections(value, pairs), [pairs, value]);
  const currentSelectionsByLeftIndex = useMemo(() => currentSelections.reduce((acc, item) => {
    acc[item.leftIndex] = item;
    return acc;
  }, {}), [currentSelections]);
  const matchEvaluation = useMemo(() => evaluateMatchSelections(pairs, currentSelections), [currentSelections, pairs]);
  const isFeedback = Boolean(feedback);
  const feedbackAnimationKey = `${exercise?.id || "exercise"}-match-feedback-${feedback?.correct ? "correct" : "wrong"}-${formatMatchCorrectAnswer(exercise)}`;

  const rightItems = useMemo(
    () => createDeterministicShuffle(pairs.map((item, index) => ({ id: index, value: item.right })), `${exercise.id}-${exercise.data}`),
    [exercise.id, exercise.data, pairs]
  );

  useEffect(() => {
    setSelectedLeftIndex(-1);
  }, [exercise.id, isFeedback]);

  const usedRightIndexes = useMemo(
    () => currentSelections.reduce((acc, item) => {
      if (Number.isInteger(item?.rightIndex) && item.rightIndex >= 0) {
        acc[item.rightIndex] = item.leftIndex;
      }

      return acc;
    }, {}),
    [currentSelections]
  );

  const handleLeftClick = (leftIndex) => {
    if (isFeedback) {
      return;
    }

    if (currentSelectionsByLeftIndex[leftIndex]) {
      const next = currentSelections.filter((item) => item.leftIndex !== leftIndex);
      onChange(buildMatchAnswerValue(next));
      setSelectedLeftIndex(-1);
      return;
    }

    setSelectedLeftIndex((prev) => prev === leftIndex ? -1 : leftIndex);
  };

  const handleRightClick = (rightItem) => {
    if (selectedLeftIndex < 0 || isFeedback) {
      return;
    }

    const ownerLeftIndex = usedRightIndexes[rightItem.id];
    const next = currentSelections.filter((item) => item.leftIndex !== selectedLeftIndex && item.rightIndex !== rightItem.id);

    if (Number.isInteger(ownerLeftIndex) && ownerLeftIndex >= 0 && ownerLeftIndex !== selectedLeftIndex) {
      const ownerIndex = next.findIndex((item) => item.leftIndex === ownerLeftIndex);

      if (ownerIndex >= 0) {
        next.splice(ownerIndex, 1);
      }
    }

    next.push({
      leftIndex: selectedLeftIndex,
      rightIndex: rightItem.id,
      left: String(pairs[selectedLeftIndex]?.left || ""),
      right: String(rightItem.value || ""),
    });

    onChange(buildMatchAnswerValue(next));
    setSelectedLeftIndex(-1);
  };

  const getLeftClassName = (leftIndex) => {
    if (isFeedback) {
      const isCorrect = matchEvaluation.resultByLeftIndex[leftIndex] === true;
      return `${styles.matchOptionButton} ${isCorrect ? styles.matchOptionButtonCorrect : styles.matchOptionButtonWrong}`;
    }

    if (selectedLeftIndex === leftIndex) {
      return `${styles.matchOptionButton} ${styles.matchOptionButtonSelected}`;
    }

    if (currentSelectionsByLeftIndex[leftIndex]) {
      return `${styles.matchOptionButton} ${styles.matchOptionButtonPaired}`;
    }

    return styles.matchOptionButton;
  };

  const getRightClassName = (rightItem, leftIndex) => {
    if (isFeedback) {
      const isCorrect = matchEvaluation.resultByLeftIndex[leftIndex] === true;
      return `${styles.matchOptionButton} ${isCorrect ? styles.matchOptionButtonCorrect : styles.matchOptionButtonWrong}`;
    }

    const isAssigned = Number.isInteger(usedRightIndexes[rightItem.id]) && usedRightIndexes[rightItem.id] >= 0;
    const isCurrentSelection = selectedLeftIndex >= 0 && currentSelectionsByLeftIndex[selectedLeftIndex]?.rightIndex === rightItem.id;

    if (isCurrentSelection) {
      return `${styles.matchOptionButton} ${styles.matchOptionButtonSelected}`;
    }

    if (isAssigned) {
      return `${styles.matchOptionButton} ${styles.matchOptionButtonPaired}`;
    }

    return styles.matchOptionButton;
  };

  return (
    <div className={styles.matchLayout}>
      {isFeedback ? (
        <div key={feedbackAnimationKey} className={`${styles.feedbackHeroRow} ${feedback.correct ? styles.feedbackHeroRowCorrect : styles.feedbackHeroRowWrong}`}>
          <div className={`${styles.mascotWrap} ${styles.sequenceMascot}`}>
            <img className={`${styles.feedbackStar} ${styles.feedbackStarOne}`} src={StarTwo} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarTwo}`} src={StarOne} alt="" />
            <img className={`${styles.feedbackStar} ${styles.feedbackStarThree}`} src={StarThree} alt="" />
            <img className={styles.feedbackMascot} src={Mascot} alt="" />
          </div>

          <div className={`${styles.feedbackBubbleWrap} ${feedback.correct ? styles.feedbackBubbleWrapCorrect : `${styles.feedbackBubbleWrapWrong} ${styles.matchFeedbackBubbleWrapWrong}`} ${styles.sequenceBubble}`}>
            <div className={`${styles.feedbackBubbleShape} ${feedback.correct ? styles.feedbackBubbleShapeSingle : styles.feedbackBubbleShapeDouble}`}>
              <div className={styles.feedbackBubbleTail} />
              <BubbleTypingText
                className={`${styles.feedbackBubbleText} ${feedback.correct ? styles.feedbackBubbleTextSingle : styles.feedbackBubbleTextDouble}`}
                animationKey={`${exercise?.id || "exercise"}-match-${feedback.correct ? "correct" : "wrong"}-${formatMatchCorrectAnswer(exercise)}`}
                lines={feedback.correct
                  ? [{ text: "Молодець!" }]
                  : [
                    { text: "Тут щось збилось - правильний варіант:", className: styles.feedbackBubbleTextLine },
                    { text: formatMatchCorrectAnswer(exercise), as: "strong" },
                  ]}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.exerciseTitle}>З’єднайте слово з перекладом</div>
        </>
      )}

      <div className={`${styles.matchBoard} ${isFeedback ? styles.matchBoardFeedback : ""}`}>
        <div className={styles.matchColumn}>
          {pairs.map((item, index) => (
            <button
              key={`${item.left}-${index}`}
              type="button"
              className={getLeftClassName(index)}
              onClick={() => handleLeftClick(index)}
              disabled={isFeedback}
            >
              {item.left}
            </button>
          ))}
        </div>

        <div className={styles.matchColumn}>
          {isFeedback ? (
            pairs.map((item, index) => (
              <div key={`${item.left}-${index}-${currentSelectionsByLeftIndex[index]?.right || item.right}`} className={getRightClassName(currentSelectionsByLeftIndex[index]?.right || "", index)}>
                {currentSelectionsByLeftIndex[index]?.right || ""}
              </div>
            ))
          ) : (
            rightItems.map((rightItem) => {
              const ownerLeftIndex = usedRightIndexes[rightItem.id];
              const isDisabled = Number.isInteger(ownerLeftIndex) && ownerLeftIndex >= 0 && ownerLeftIndex !== selectedLeftIndex;

              return (
                <button
                  key={`${rightItem.id}-${rightItem.value}`}
                  type="button"
                  className={getRightClassName(rightItem)}
                  onClick={() => handleRightClick(rightItem)}
                  disabled={isDisabled || isFeedback}
                >
                  {rightItem.value}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const countEarnedAchievements = (items) => Array.isArray(items) ? items.filter((item) => Boolean(item?.isEarned)).length : 0;

const getNewlyEarnedAchievements = (previousItems, nextItems) => {
  const previousEarnedIds = new Set(
    Array.isArray(previousItems)
      ? previousItems
        .filter((item) => Boolean(item?.isEarned))
        .map((item) => String(item?.id || item?.code || item?.title || "").trim())
        .filter(Boolean)
      : []
  );

  if (!Array.isArray(nextItems)) {
    return [];
  }

  return nextItems.filter((item) => {
    if (!item?.isEarned) {
      return false;
    }

    const key = String(item?.id || item?.code || item?.title || "").trim();

    if (!key) {
      return false;
    }

    return !previousEarnedIds.has(key);
  });
};

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);
  const isMistakesMode = location.state?.mode === "mistakes";
  const finalizedAttemptRef = useRef(false);
  const isDemoLesson = Boolean(location.state?.demoLesson);
  const demoLanguageCode = location.state?.demoLanguageCode || localStorage.getItem("targetLanguage") || "en";
  const demoLevel = location.state?.demoLevel || localStorage.getItem("lumino_course_level") || "a1";

  useStageScale(stageRef, { mode: "absolute" });

  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState({ hearts: 0, heartsMax: 5, crystals: 0, crystalCostPerHeart: 0 });
  const [answers, setAnswers] = useState({});
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [screen, setScreen] = useState("exercise");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "" });
  const [lessonModal, setLessonModal] = useState({ open: false, type: "" });
  const [restoringHearts, setRestoringHearts] = useState(false);
  const [startAchievementsCount, setStartAchievementsCount] = useState(0);
  const [startAchievements, setStartAchievements] = useState([]);
  const [sessionMistakesCount, setSessionMistakesCount] = useState(0);
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    if (location.state?.startIndex != null) {
      setExerciseIndex(Math.max(0, Number(location.state.startIndex || 0)));
    }
  }, [location.state]);

  const currentExercise = exercises[exerciseIndex] || null;
  const progressPercent = exercises.length ? Math.round(((exerciseIndex + 1) / exercises.length) * 100) : 0;

  useEffect(() => {
    let ignore = false;
    const lessonPackMode = isMistakesMode ? "mistakes" : "default";
    const cachedLessonPack = !isDemoLesson ? getCachedLessonPack(lessonId, { mode: lessonPackMode }) : null;
    const hasCachedLessonPack = Array.isArray(cachedLessonPack?.exercises) && cachedLessonPack.exercises.length > 0;
    const lessonFromState = location.state?.lesson || null;

    if (!isDemoLesson) {
      setLesson(lessonFromState || cachedLessonPack?.lesson || null);
      setExercises(hasCachedLessonPack ? cachedLessonPack.exercises.map(normalizeExercise) : []);
      setLoading(!hasCachedLessonPack);
    }

    const loadDemoLessonContent = async () => {
      const demoLessonFromState = location.state?.lesson || null;
      const demoExercisesFromState = Array.isArray(location.state?.demoExercises)
        ? location.state.demoExercises
        : [];

      if (demoLessonFromState) {
        setLesson(demoLessonFromState);
      }

      if (demoExercisesFromState.length > 0) {
        setExercises(demoExercisesFromState.map(normalizeExercise));
        setLoading(false);
        return;
      }

      const [lessonRes, exercisesRes] = await Promise.all([
        demoLessonService.getLessonById(lessonId, demoLanguageCode, demoLevel),
        demoLessonService.getExercises(lessonId, demoLanguageCode, demoLevel),
      ]);

      if (ignore) {
        return;
      }

      if (!lessonRes.ok) {
        setError(lessonRes.error || "Не вдалося завантажити демо-урок");
        setLoading(false);
        return;
      }

      if (!exercisesRes.ok) {
        setError(exercisesRes.error || "Не вдалося завантажити демо-вправи");
        setLoading(false);
        return;
      }

      setLesson(lessonRes.data || null);
      setExercises(exercisesRes.items.map(normalizeExercise));
      setLoading(false);
    };

    const loadLessonContent = async () => {
      const lessonPackRes = await preloadLessonPack(lessonId, { mode: lessonPackMode });

      if (ignore) {
        return;
      }

      if (!lessonPackRes.ok) {
        if (!hasCachedLessonPack) {
          setError(lessonPackRes.error || "Не вдалося завантажити урок");
          setLoading(false);
        }
        return;
      }

      setLesson(lessonPackRes.data?.lesson || lessonFromState || null);
      setExercises(Array.isArray(lessonPackRes.data?.exercises) ? lessonPackRes.data.exercises.map(normalizeExercise) : []);
      setLoading(false);
    };

    const load = async () => {
      setLoading(!hasCachedLessonPack);
      setError("");
      finalizedAttemptRef.current = false;
      setSessionMistakesCount(0);

      if (isDemoLesson) {
        setUser({ hearts: 5, heartsMax: 5, crystals: 0, crystalCostPerHeart: 0 });
        setStartAchievementsCount(0);
        setStartAchievements([]);
        await loadDemoLessonContent();
        return;
      }

      const userRequest = userService.getMe();

      if (!isMistakesMode) {
        achievementsService.getMine().then((achievementsRes) => {
          if (ignore || !achievementsRes?.ok) {
            return;
          }

          const earnedAchievements = Array.isArray(achievementsRes.data) ? achievementsRes.data : [];
          setStartAchievementsCount(countEarnedAchievements(earnedAchievements));
          setStartAchievements(earnedAchievements);
        });
      }

      await loadLessonContent();

      if (ignore) {
        return;
      }

      const userRes = await userRequest;

      if (ignore || !userRes?.ok) {
        return;
      }

      const nextUser = {
        hearts: Number(userRes.data?.hearts || userRes.data?.heartsCount || 0),
        heartsMax: Number(userRes.data?.heartsMax || userRes.data?.maxHearts || 5),
        crystals: Number(userRes.data?.crystals || userRes.data?.crystalsCount || 0),
        crystalCostPerHeart: Number(userRes.data?.crystalCostPerHeart || 0),
      };

      setUser(nextUser);
    };

    load();

    return () => {
      ignore = true;
    };
  }, [demoLanguageCode, demoLevel, isDemoLesson, isMistakesMode, lessonId, location.state]);

  const currentAnswer = currentExercise ? (answers[currentExercise.id] || "") : "";

  const canCheck = useMemo(() => {
    if (!currentExercise) {
      return false;
    }

    if (currentExercise.type === "Match") {
      const pairs = parseJson(currentExercise.data, []);
      const selections = parseMatchSelections(currentAnswer, pairs);
      return Array.isArray(pairs) && pairs.length > 0 && selections.length === pairs.length && selections.every((item) => Number.isInteger(item?.rightIndex) && item.rightIndex >= 0);
    }

    return String(currentAnswer || "").trim().length > 0;
  }, [currentAnswer, currentExercise]);

  const handleChangeAnswer = useCallback((value) => {
    if (!currentExercise) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [currentExercise.id]: value,
    }));
  }, [currentExercise]);

  const closeLessonModal = useCallback(() => {
    setLessonModal({ open: false, type: "" });
  }, []);

  useEffect(() => {
    if (!lessonModal.open) {
      return undefined;
    }

    const handleLessonModalEscape = (event) => {
      if (event.key === "Escape") {
        closeLessonModal();
      }
    };

    window.addEventListener("keydown", handleLessonModalEscape);

    return () => {
      window.removeEventListener("keydown", handleLessonModalEscape);
    };
  }, [closeLessonModal, lessonModal.open]);

  const handleOpenRestoreModal = useCallback(() => {
    setLessonModal({ open: true, type: "restoreEnergy" });
  }, []);

  const handleFullRestoreHearts = useCallback(async () => {
    const heartsToRestore = Math.max(0, Number(user.heartsMax || 5) - Number(user.hearts || 0));

    if (!heartsToRestore) {
      closeLessonModal();
      return;
    }

    const neededCrystals = heartsToRestore * Number(user.crystalCostPerHeart || 0);

    if (Number(user.crystals || 0) < neededCrystals) {
      setModal({ open: true, title: "Недостатньо кристалів", message: "У тебе недостатньо кристалів, щоб відновити енергію." });
      return;
    }

    setRestoringHearts(true);

    try {
      const res = await userService.restoreHearts(heartsToRestore);

      if (!res.ok) {
        setModal({ open: true, title: "Помилка", message: res.error || "Не вдалося відновити енергію" });
        return;
      }

      const restoredHearts = Number(res.data?.restoredHearts);
      const nextHeartsMax = Number(res.data?.heartsMax || res.data?.maxHearts || user.heartsMax || 5);
      const nextUser = {
        hearts: Number.isFinite(restoredHearts)
          ? Math.min(nextHeartsMax, Math.max(0, Number(user.hearts || 0) + Math.max(0, restoredHearts)))
          : Number(res.data?.hearts || res.data?.heartsCount || user.hearts || 0),
        heartsMax: nextHeartsMax,
        crystals: Number(res.data?.crystals || res.data?.crystalsCount || user.crystals || 0),
        crystalCostPerHeart: Number(res.data?.crystalCostPerHeart || user.crystalCostPerHeart || 0),
      };

      setUser((prev) => ({
        ...prev,
        ...nextUser,
      }));

      if (!exercises.length && nextUser.hearts > 0) {
        if (!lesson?.id) {
          const lessonRes = await lessonsService.getById(lessonId);

          if (!lessonRes.ok) {
            setModal({ open: true, title: "Помилка", message: lessonRes.error || "Не вдалося завантажити урок" });
            return;
          }

          setLesson(lessonRes.data || null);
        }

        const exercisesRes = await lessonsService.getExercises(lessonId);

        if (!exercisesRes.ok) {
          setModal({ open: true, title: "Помилка", message: exercisesRes.error || "Не вдалося завантажити урок" });
          return;
        }

        setExercises(Array.isArray(exercisesRes.data) ? exercisesRes.data.map(normalizeExercise) : []);
      }

      closeLessonModal();
    } finally {
      setRestoringHearts(false);
    }
  }, [closeLessonModal, exercises.length, lesson?.id, lessonId, user.crystalCostPerHeart, user.crystals, user.hearts, user.heartsMax]);

  const handleRestoreOneHeart = useCallback(async () => {
    if (Number(user.hearts || 0) >= Number(user.heartsMax || 5)) {
      closeLessonModal();
      return;
    }

    const neededCrystals = Number(user.crystalCostPerHeart || 0);

    if (Number(user.crystals || 0) < neededCrystals) {
      setModal({ open: true, title: "Недостатньо кристалів", message: "У тебе недостатньо кристалів, щоб додати ще одну енергію." });
      return;
    }

    setRestoringHearts(true);

    try {
      const res = await userService.restoreHearts(1);

      if (!res.ok) {
        setModal({ open: true, title: "Помилка", message: res.error || "Не вдалося відновити енергію" });
        return;
      }

      const restoredHearts = Number(res.data?.restoredHearts);
      const nextHeartsMax = Number(res.data?.heartsMax || res.data?.maxHearts || user.heartsMax || 5);
      const nextUser = {
        hearts: Number.isFinite(restoredHearts)
          ? Math.min(nextHeartsMax, Math.max(0, Number(user.hearts || 0) + Math.max(0, restoredHearts)))
          : Number(res.data?.hearts || res.data?.heartsCount || user.hearts || 0),
        heartsMax: nextHeartsMax,
        crystals: Number(res.data?.crystals || res.data?.crystalsCount || user.crystals || 0),
        crystalCostPerHeart: Number(res.data?.crystalCostPerHeart || user.crystalCostPerHeart || 0),
      };

      setUser((prev) => ({
        ...prev,
        ...nextUser,
      }));

      if (!exercises.length && nextUser.hearts > 0) {
        if (!lesson?.id) {
          const lessonRes = await lessonsService.getById(lessonId);

          if (!lessonRes.ok) {
            setModal({ open: true, title: "Помилка", message: lessonRes.error || "Не вдалося завантажити урок" });
            return;
          }

          setLesson(lessonRes.data || null);
        }

        const exercisesRes = await lessonsService.getExercises(lessonId);

        if (!exercisesRes.ok) {
          setModal({ open: true, title: "Помилка", message: exercisesRes.error || "Не вдалося завантажити урок" });
          return;
        }

        setExercises(Array.isArray(exercisesRes.data) ? exercisesRes.data.map(normalizeExercise) : []);
      }

      closeLessonModal();
    } finally {
      setRestoringHearts(false);
    }
  }, [closeLessonModal, exercises.length, lesson?.id, lessonId, user.crystalCostPerHeart, user.crystals, user.hearts, user.heartsMax]);

  const handleCheck = useCallback(() => {
    if (!currentExercise) {
      return;
    }

    const correct = isCorrectAnswer(currentExercise, currentAnswer);
    let nextHearts = Number(user.hearts || 0);

    if (!correct && !isMistakesMode && !isDemoLesson) {
      nextHearts = Math.max(0, Number(user.hearts || 0) - 1);

      setUser((prev) => ({
        ...prev,
        hearts: nextHearts,
      }));

      setSessionMistakesCount((prev) => prev + 1);
    }

    setFeedback({
      correct,
      correctAnswer: currentExercise.correctAnswer,
      userAnswer: currentAnswer,
    });
    setScreen("feedback");

    if (!correct && !isMistakesMode && !isDemoLesson && nextHearts <= 0) {
      setLessonModal({ open: true, type: "emptyEnergy" });
    }
  }, [currentAnswer, currentExercise, isDemoLesson, isMistakesMode, user.hearts]);

  const handleContinue = useCallback(async () => {
    if (!currentExercise) {
      return;
    }

    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((prev) => prev + 1);
      setScreen("exercise");
      setFeedback(null);
      return;
    }

    setSubmitting(true);

    const answersDto = exercises.map((exercise) => {
      const answer = answers[exercise.id] || "";

      if (exercise.type === "Match") {
        const pairs = parseJson(exercise.data, []);
        const matchPairs = buildMatchSubmitPairs(answer, pairs);

        return {
          exerciseId: exercise.id,
          answer: JSON.stringify(matchPairs),
        };
      }

      return {
        exerciseId: exercise.id,
        answer,
      };
    });

    if (isMistakesMode) {
      const submitRes = await lessonService.submitMistakes(lessonId, {
        lessonId: Number(lessonId),
        idempotencyKey: makeIdempotencyKey(`lesson-mistakes-${lessonId}`),
        answers: answersDto,
      });
      const userRes = await userService.getMe();

      setSubmitting(false);

      if (!submitRes.ok) {
        setModal({ open: true, title: "Помилка", message: submitRes.error || "Не вдалося завершити повторення" });
        return;
      }

      finalizedAttemptRef.current = true;

      const nextUser = userRes.data || null;
      const restoredHearts = Math.max(0, Number(submitRes.data?.restoredHearts || 0));

      navigate(PATHS.lessonResult(lessonId), {
        replace: true,
        state: {
          lesson,
          user: nextUser,
          mode: "mistakes",
          result: {
            totalExercises: Number(submitRes.data?.totalExercises || exercises.length || 0),
            correctAnswers: Number(submitRes.data?.correctAnswers || 0),
            mistakeExerciseIds: Array.isArray(submitRes.data?.mistakeExerciseIds) ? submitRes.data.mistakeExerciseIds : [],
            restoredHearts,
            isCompleted: Boolean(submitRes.data?.isCompleted),
          },
        },
      });

      return;
    }

    const submitDto = {
      lessonId: Number(lessonId),
      idempotencyKey: makeIdempotencyKey(`lesson-${lessonId}`),
      answers: answersDto,
    };

    if (isDemoLesson) {
      const submitRes = await demoLessonService.submit(lessonId, submitDto, demoLanguageCode, demoLevel);

      setSubmitting(false);

      if (!submitRes.ok) {
        setModal({ open: true, title: "Помилка", message: submitRes.error || "Не вдалося завершити демо-урок" });
        return;
      }

      finalizedAttemptRef.current = true;

      navigate(PATHS.lessonResult(lessonId), {
        replace: true,
        state: {
          lesson,
          result: submitRes.data,
          demoLesson: true,
          demoLanguageCode,
          demoLevel,
        },
      });

      return;
    }

    const submitRes = await lessonsService.submit(lessonId, submitDto);
    const [userRes, achievementsRes] = await Promise.all([userService.getMe(), achievementsService.getMine()]);

    setSubmitting(false);

    if (!submitRes.ok) {
      setModal({ open: true, title: "Помилка", message: submitRes.error || "Не вдалося завершити урок" });
      return;
    }

    finalizedAttemptRef.current = true;

    const latestAchievements = Array.isArray(achievementsRes?.data) ? achievementsRes.data : [];
    const achievementsCount = countEarnedAchievements(latestAchievements);
    const hasNewAchievement = achievementsCount > startAchievementsCount;
    const newlyEarnedAchievements = getNewlyEarnedAchievements(startAchievements, latestAchievements);

    navigate(PATHS.lessonResult(lessonId), {
      replace: true,
      state: {
        lesson,
        result: submitRes.data,
        user: userRes.data || null,
        hasNewAchievement,
        newlyEarnedAchievements,
      },
    });
  }, [answers, currentExercise, demoLanguageCode, demoLevel, exerciseIndex, exercises, isDemoLesson, isMistakesMode, lesson, lessonId, navigate, startAchievements, startAchievementsCount, user.hearts]);

  const handleClose = useCallback(() => {
    setLessonModal({ open: true, type: "leaveLesson" });
  }, []);

  const leaveLesson = useCallback(async () => {
    if (isDemoLesson) {
      navigate(PATHS.onboardingRunLesson, { replace: true });
      return;
    }

    if (!finalizedAttemptRef.current && !isMistakesMode && Number(sessionMistakesCount || 0) > 0) {
      const consumeRes = await userService.consumeMistakesHearts(Number(sessionMistakesCount || 0));

      if (!consumeRes.ok) {
        setModal({ open: true, title: "Помилка", message: consumeRes.error || "Не вдалося зберегти витрату енергії" });
        return;
      }
    }

    navigate(PATHS.home, { replace: true, state: { refreshLearning: true } });
  }, [isDemoLesson, isMistakesMode, navigate, sessionMistakesCount]);

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage} id="lesson-stage-root">
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        {loading ? (
          <div className={styles.loaderPage}>
            <div>Завантаження уроку...</div>
          </div>
        ) : error || !lesson || !currentExercise ? (
          <div className={styles.loaderPage}>
            <div>{error || "Урок не знайдено"}</div>
            <button type="button" className={styles.primaryButton} onClick={() => navigate(isDemoLesson ? PATHS.onboardingRunLesson : PATHS.home)}>Повернутися</button>
          </div>
        ) : (
          <>
            <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Закрити урок">
              ×
            </button>

            <div className={styles.topBar}>
              <div className={styles.progressTrack}><span style={{ width: `${progressPercent}%` }} /></div>
              <div className={styles.energyCounter}><img src={EnergyIcon} alt="" /><span>{Number(user.hearts || 0)}</span></div>
            </div>

            <div className={`${styles.contentCard} ${currentExercise.type === "MultipleChoice" ? styles.contentCardChoice : ""}`}>
              {currentExercise.type === "MultipleChoice" ? (
                <MultipleChoiceExercise
                  exercise={currentExercise}
                  value={currentAnswer}
                  feedback={screen === "feedback" ? feedback : null}
                  selectedFlipSide={Boolean(flippedCards[currentExercise.id])}
                  onSelect={handleChangeAnswer}
                  onFlipCard={() => setFlippedCards((prev) => ({ ...prev, [currentExercise.id]: !prev[currentExercise.id] }))}
                />
              ) : currentExercise.type === "Input" ? (
                <InputExercise
                  exercise={currentExercise}
                  value={currentAnswer}
                  feedback={screen === "feedback" ? feedback : null}
                  onChange={handleChangeAnswer}
                />
              ) : (
                <MatchExercise
                  exercise={currentExercise}
                  value={currentAnswer}
                  feedback={screen === "feedback" ? feedback : null}
                  onChange={handleChangeAnswer}
                />
              )}
            </div>

            <div className={`${styles.bottomBar} ${currentExercise.type === "MultipleChoice" ? styles.bottomBarChoice : ""}`}>
              {screen === "exercise" ? (
                <button type="button" className={styles.primaryButton} disabled={!canCheck} onClick={handleCheck}>ПЕРЕВІРИТИ</button>
              ) : (
                <button type="button" className={styles.primaryButton} disabled={submitting} onClick={handleContinue}>{submitting ? "ЗАВАНТАЖЕННЯ..." : "ДАЛІ"}</button>
              )}
            </div>

            {lessonModal.open ? (
              <div className={styles.lessonModalOverlay} role="presentation">
                {lessonModal.type === "leaveLesson" ? (
                  <div className={`${styles.lessonModalCard} ${styles.lessonLeaveModalCard}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={styles.lessonModalCloseButton} onClick={closeLessonModal} aria-label="Закрити" />
                    <div className={styles.lessonLeaveTitleBox}>
                      <div className={styles.lessonLeaveTitle}>Впевнені що хочете покинути урок?</div>
                    </div>
                    <div className={styles.lessonLeaveActions}>
                        <button type="button" className={`${styles.lessonModalButton} ${styles.lessonModalButtonSecondary}`} onClick={leaveLesson}>ТАК</button>
                        <button type="button" className={`${styles.lessonModalButton} ${styles.lessonModalButtonPrimary}`} onClick={closeLessonModal}>НІ</button>
                      </div>
                  </div>
                ) : null}

                {lessonModal.type === "restoreEnergy" ? (
                  <div className={`${styles.lessonModalCard} ${styles.lessonRestoreModalCard}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                    <div className={`${styles.lessonModalInner} ${styles.lessonRestoreModalInner}`}>
                      <button type="button" className={styles.lessonModalCloseButton} onClick={closeLessonModal} aria-label="Закрити" />
                      <div className={styles.lessonRestoreActions}>
                        <button type="button" className={styles.lessonRestoreAction} onClick={handleFullRestoreHearts} disabled={restoringHearts}>
                          <div className={styles.lessonRestoreActionLeft}>
                            <img className={`${styles.lessonRestoreActionSun} ${styles.lessonRestoreActionSunPrimary}`} src={EnergyIcon} alt="" aria-hidden="true" />
                            <span className={styles.lessonRestoreActionText}>Відновити енергію</span>
                          </div>
                          <div className={styles.lessonRestoreActionRight}>
                            <img className={styles.lessonRestoreActionCrystal} src={CrystalIcon} alt="" aria-hidden="true" />
                            <span>{Math.max(0, Math.max(0, Number(user.heartsMax || 5) - Number(user.hearts || 0)) * Number(user.crystalCostPerHeart || 0))}</span>
                          </div>
                        </button>

                        <button type="button" className={`${styles.lessonRestoreAction} ${styles.lessonRestoreActionSecondary}`} onClick={handleRestoreOneHeart} disabled={restoringHearts}>
                          <div className={styles.lessonRestoreActionLeft}>
                            <span className={styles.lessonRestoreActionSunBadge} aria-hidden="true">
                              <img className={styles.lessonRestoreActionSun} src={EnergySmallIcon} alt="" />
                              <span className={styles.lessonRestoreActionSunBadgeValue}>1</span>
                            </span>
                            <span className={styles.lessonRestoreActionText}>+1 одиниця енергії</span>
                          </div>
                          <div className={styles.lessonRestoreActionRight}>
                            <img className={styles.lessonRestoreActionCrystal} src={CrystalIcon} alt="" aria-hidden="true" />
                            <span>{Number(user.crystalCostPerHeart || 0)}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {lessonModal.type === "emptyEnergy" ? (
                  <div className={`${styles.lessonModalCard} ${styles.lessonEmptyEnergyModalCard}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                    <div className={`${styles.lessonModalInner} ${styles.lessonEmptyEnergyModalInner}`}>
                      <div className={styles.lessonEmptyEnergyTitle}>Закінчилась енергія для навчання</div>
                      <div className={styles.lessonEmptyEnergyActions}>
                        <button type="button" className={`${styles.lessonModalButton} ${styles.lessonEmptyEnergyPrimaryButton}`} onClick={handleOpenRestoreModal}>ВІДНОВИТИ</button>
                        <button type="button" className={`${styles.lessonModalButton} ${styles.lessonEmptyEnergySecondaryButton}`} onClick={leaveLesson}>ВИЙТИ</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <GlassModal
              open={modal.open}
              title={modal.title}
              message={modal.message}
              primaryText={modal.title === "Вийти з уроку?" ? "ВИЙТИ" : "ДОБРЕ"}
              secondaryText={modal.title === "Вийти з уроку?" ? "ЗАЛИШИТИСЬ" : ""}
              onPrimary={modal.title === "Вийти з уроку?" ? leaveLesson : () => setModal({ open: false, title: "", message: "" })}
              onSecondary={() => setModal({ open: false, title: "", message: "" })}
              onClose={() => setModal({ open: false, title: "", message: "" })}
              stageTargetId="lesson-stage-root"
            />
          </>
        )}
      </div>
    </div>
  );
}
