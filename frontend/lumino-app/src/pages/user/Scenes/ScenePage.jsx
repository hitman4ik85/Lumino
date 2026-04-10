import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { scenesService } from "../../../services/scenesService.js";
import { achievementsService } from "../../../services/achievementsService.js";
import { userService } from "../../../services/userService.js";
import { profileService } from "../../../services/profileService.js";
import { PATHS } from "../../../routes/paths.js";
import styles from "./ScenePage.module.css";

import BgLoad from "../../../assets/lesson/backgrounds/bg5_scene_load.webp";
import BgRun from "../../../assets/lesson/backgrounds/bg5_scene_run.webp";
import MascotInterviewer from "../../../assets/mascot/mascot9.svg";
import MascotUser from "../../../assets/mascot/mascot3.svg";
import EnergyIcon from "../../../assets/home/header/energy.svg";

function normalizeApostrophes(value) {
  return String(value || "").replace(/[’‘ʼ＇']/g, "'");
}

function normalizeText(value) {
  return normalizeApostrophes(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function makeIdempotencyKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isQuestionStep(step) {
  return step?.stepType === "Choice" || step?.stepType === "Input";
}

function getStepCorrectAnswer(step) {
  if (step?.stepType === "Choice") {
    const parsed = parseJson(step.choicesJson, []);
    const correct = Array.isArray(parsed) ? parsed.find((item) => item?.isCorrect) : null;
    return String(correct?.text || "");
  }

  if (step?.stepType === "Input") {
    const parsed = parseJson(step.choicesJson, {});
    return String(parsed?.correctAnswer || "");
  }

  return "";
}

function isCorrectStep(step, answer) {
  return normalizeText(answer) === normalizeText(getStepCorrectAnswer(step));
}

function getSceneTitle(scene) {
  return String(scene?.title || scene?.name || scene?.Title || "Scene").trim();
}

function isUserDialogue(step, index) {
  const speaker = normalizeText(step?.speaker);

  if (speaker) {
    return speaker === "you" || speaker === "user" || speaker === "learner";
  }

  return index % 2 === 1;
}

function buildInputSlots(answer) {
  return Array.from(String(answer || ""));
}

function getAchievementKey(item) {
  return String(item?.id || item?.code || item?.title || "").trim();
}

function getNewlyEarnedAchievements(previousItems, nextItems) {
  const previousEarnedKeys = new Set(
    Array.isArray(previousItems)
      ? previousItems
        .filter((item) => Boolean(item?.isEarned))
        .map(getAchievementKey)
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

    const key = getAchievementKey(item);

    if (!key) {
      return false;
    }

    return !previousEarnedKeys.has(key);
  });
}

function getVisibleDialogueSteps(steps, currentStep, stepIndex) {
  const maxIndex = isQuestionStep(currentStep) ? stepIndex : stepIndex + 1;
  const previousDialogueSteps = steps
    .slice(0, Math.max(0, maxIndex))
    .filter((step) => !isQuestionStep(step));

  const lastDialogueStep = previousDialogueSteps[previousDialogueSteps.length - 1] || null;

  if (!lastDialogueStep) {
    return [];
  }

  if (!isUserDialogue(lastDialogueStep, previousDialogueSteps.length - 1)) {
    return [
      {
        ...lastDialogueStep,
        side: "left",
      },
    ];
  }

  let previousInterviewerStep = null;

  for (let index = previousDialogueSteps.length - 2; index >= 0; index -= 1) {
    if (!isUserDialogue(previousDialogueSteps[index], index)) {
      previousInterviewerStep = previousDialogueSteps[index];
      break;
    }
  }

  const visibleSteps = previousInterviewerStep
    ? [previousInterviewerStep, lastDialogueStep]
    : [lastDialogueStep];

  return visibleSteps.map((step, index) => ({
    ...step,
    side: isUserDialogue(step, index) ? "right" : "left",
  }));
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

export default function ScenePage() {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);
  const introTimerRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [scene, setScene] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [screen, setScreen] = useState("content");
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [user, setUser] = useState({ hearts: 0, crystals: 0, points: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [startAchievements, setStartAchievements] = useState([]);
  const isMistakesMode = location.state?.mode === "mistakes";
  const stateScene = location.state?.scene || null;

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setShowIntro(true);
      const [detailsRes, payloadRes, userRes, weeklyRes] = await Promise.all([
        scenesService.getById(sceneId),
        isMistakesMode ? scenesService.getMistakes(sceneId) : scenesService.getContent(sceneId),
        userService.getMe(),
        profileService.getWeeklyProgress(),
      ]);

      if (ignore) {
        return;
      }

      if (!detailsRes.ok || !payloadRes.ok) {
        setError(detailsRes.error || payloadRes.error || "Не вдалося завантажити сцену");
        setLoading(false);
        return;
      }

      setScene((!isMistakesMode ? payloadRes.data : null) || stateScene || detailsRes.data || null);
      setSteps(Array.isArray(payloadRes.data?.steps) ? payloadRes.data.steps : []);
      setStepIndex(0);
      setScreen("content");
      setAnswers({});
      setFeedback(null);
      setUser({
        hearts: Number(userRes.data?.hearts || userRes.data?.heartsCount || 0),
        crystals: Number(userRes.data?.crystals || userRes.data?.crystalsCount || 0),
        points: Number(weeklyRes.data?.totalPoints || 0),
      });
      setLoading(false);
    };

    load();

    return () => {
      ignore = true;
    };
  }, [isMistakesMode, sceneId, stateScene]);

  useEffect(() => {
    if (isMistakesMode) {
      setStartAchievements([]);
      return undefined;
    }

    let ignore = false;

    achievementsService.getMine().then((res) => {
      if (ignore) {
        return;
      }

      if (res.ok) {
        setStartAchievements(Array.isArray(res.data) ? res.data : []);
      }
    });

    return () => {
      ignore = true;
    };
  }, [isMistakesMode, sceneId]);

  useEffect(() => {
    if (loading || error || !scene || steps.length === 0) {
      return undefined;
    }

    clearTimeout(introTimerRef.current);
    introTimerRef.current = setTimeout(() => {
      setShowIntro(false);
    }, 2200);

    return () => {
      clearTimeout(introTimerRef.current);
    };
  }, [error, loading, scene, steps.length]);

  const questionSteps = useMemo(() => steps.filter(isQuestionStep), [steps]);
  const currentStep = steps[stepIndex] || null;
  const isLastStep = stepIndex >= steps.length - 1;
  const currentAnswer = currentStep ? answers[currentStep.id] || "" : "";
  const progressPercent = steps.length ? Math.max(4, Math.round(((stepIndex + (screen === "feedback" ? 1 : 0)) / steps.length) * 100)) : 4;
  const sceneTitle = useMemo(() => getSceneTitle(scene), [scene]);

  const dialogueSteps = useMemo(
    () => getVisibleDialogueSteps(steps, currentStep, stepIndex),
    [currentStep, stepIndex, steps]
  );

  const choiceOptions = currentStep?.stepType === "Choice" ? parseJson(currentStep.choicesJson, []) : [];
  const inputSlots = useMemo(() => {
    const correctAnswer = getStepCorrectAnswer(currentStep);
    const slotsBase = correctAnswer || currentAnswer || " ";

    return buildInputSlots(slotsBase);
  }, [currentAnswer, currentStep]);
  const enteredInputSlots = useMemo(
    () => Array.from(String(currentAnswer || "").replace(/[\r\n]/g, "")),
    [currentAnswer]
  );

  const handleClose = useCallback(() => {
    navigate(PATHS.home, { replace: true, state: { refreshLearning: true, refreshScenes: true } });
  }, [navigate]);

  const handleContinueLine = useCallback(() => {
    if (isLastStep) {
      setSubmitting(true);
      const payload = {
        idempotencyKey: makeIdempotencyKey(`scene-${sceneId}`),
        answers: questionSteps.map((step) => ({
          stepId: step.id,
          answer: answers[step.id] || "",
        })),
      };

      const startUser = { ...user };
      const submitRequest = isMistakesMode ? scenesService.submitMistakes(sceneId, payload) : scenesService.submit(sceneId, payload);

      submitRequest.then(async (res) => {
        const extraRequests = [
          userService.getMe(),
          profileService.getWeeklyProgress(),
        ];

        if (!isMistakesMode) {
          extraRequests.push(achievementsService.getMine());
        }

        const [userRes, weeklyRes, achievementsRes] = await Promise.all(extraRequests);
        setSubmitting(false);

        if (!res.ok) {
          setError(res.error || "Не вдалося завершити сцену");
          return;
        }

        const nextUser = {
          ...(userRes.data || {}),
          points: Number(weeklyRes.data?.totalPoints || 0),
        };
        const result = {
          ...(res.data || {}),
          earnedCrystals: Math.max(0, Number(nextUser?.crystals ?? nextUser?.crystalsCount ?? 0) - Number(startUser.crystals || 0)),
          earnedPoints: Math.max(0, Number(nextUser?.points || 0) - Number(startUser.points || 0)),
        };
        const latestAchievements = Array.isArray(achievementsRes?.data) ? achievementsRes.data : [];
        const newlyEarnedAchievements = isMistakesMode
          ? []
          : getNewlyEarnedAchievements(startAchievements, latestAchievements);

        navigate(PATHS.sceneResult(sceneId), {
          replace: true,
          state: {
            refreshLearning: true,
            refreshScenes: true,
            result,
            user: nextUser,
            scene,
            mode: isMistakesMode ? "mistakes" : undefined,
            newlyEarnedAchievements,
          },
        });
      });
      return;
    }

    setStepIndex((prev) => prev + 1);
  }, [answers, isLastStep, isMistakesMode, navigate, questionSteps, scene, sceneId, startAchievements, user]);

  const handleCheck = useCallback(() => {
    const correct = isCorrectStep(currentStep, currentAnswer);

    if (!correct && !isMistakesMode) {
      setUser((prev) => ({ ...prev, hearts: Math.max(0, Number(prev.hearts || 0) - 1) }));
    }

    setFeedback({ correct, correctAnswer: getStepCorrectAnswer(currentStep) });
    setScreen("feedback");
  }, [currentAnswer, currentStep, isMistakesMode]);

  const handleFeedbackContinue = useCallback(() => {
    if (isLastStep) {
      handleContinueLine();
      return;
    }

    setScreen("content");
    setFeedback(null);
    handleContinueLine();
  }, [handleContinueLine, isLastStep]);

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bg} src={showIntro ? BgLoad : BgRun} alt="" />

        {loading ? (
          <div className={styles.loaderPage}>Завантаження сцени...</div>
        ) : error || !scene || !currentStep ? (
          <div className={styles.loaderPage}>
            <div>{error || "Сцену не знайдено"}</div>
            <button type="button" className={styles.primaryButton} onClick={() => navigate(PATHS.home)}>Повернутися</button>
          </div>
        ) : (
          <>
            <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Закрити сцену">
              ×
            </button>

            <div className={styles.topBar}>
              <div className={styles.progressTrack}><span style={{ width: `${progressPercent}%` }} /></div>
              {!showIntro ? <div className={styles.topCounter}><img src={EnergyIcon} alt="" /> {Number(user.hearts || 0)}</div> : null}
            </div>

            {showIntro ? (
              <div className={styles.titleScreen}>
                <div className={styles.sceneTitle}>{sceneTitle}</div>
              </div>
            ) : (
              <>
                <div className={styles.panel}>
                  {dialogueSteps.map((step, index) => {
                    const isRight = step.side === "right";

                    return (
                      <div
                        key={`${step.id || index}-${step.order || index}`}
                        className={`${styles.heroRow} ${isRight ? styles.heroRowRight : styles.heroRowLeft}`}
                      >
                        {!isRight ? <img className={`${styles.mascot} ${styles.mascotLeft} ${styles.dialogueMascotEnter}`} src={MascotInterviewer} alt="" /> : null}
                        <div className={`${styles.textBubble} ${isRight ? styles.textBubbleRight : styles.textBubbleLeft} ${styles.dialogueBubbleEnter}`}>
                          {step?.speaker ? <div className={styles.speaker}>{step.speaker}</div> : null}
                          <TypingText
                            className={styles.text}
                            text={step.text}
                            animationKey={`${step.id || index}-${step.order || index}`}
                          />
                        </div>
                        {isRight ? <img className={`${styles.mascot} ${styles.mascotRight} ${styles.dialogueMascotEnter}`} src={MascotUser} alt="" /> : null}
                      </div>
                    );
                  })}

                  {isQuestionStep(currentStep) ? <div className={styles.questionTitle}>{currentStep.text}</div> : null}

                  {screen === "feedback" ? (
                    <div className={styles.feedbackWrap}>
                      <div className={`${styles.feedbackBox} ${feedback?.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                        {feedback?.correct ? "Правильно" : "Неправильно"}
                      </div>
                      {!feedback?.correct ? <div className={styles.feedbackAnswer}>Правильна відповідь: {feedback?.correctAnswer}</div> : null}
                    </div>
                  ) : currentStep.stepType === "Choice" ? (
                    <div className={styles.optionsGrid}>
                      {choiceOptions.map((item) => (
                        <button
                          key={item.text}
                          type="button"
                          className={`${styles.optionButton} ${normalizeText(currentAnswer) === normalizeText(item.text) ? styles.optionButtonActive : ""}`}
                          onClick={() => setAnswers((prev) => ({ ...prev, [currentStep.id]: item.text }))}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  ) : currentStep.stepType === "Input" ? (
                    <div className={styles.inputWrap}>
                      <div className={styles.inputAnswerSlots}>
                        {inputSlots.map((symbol, index) => {
                          const currentSymbol = enteredInputSlots[index] || "";
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
                        value={currentAnswer}
                        onChange={(event) => setAnswers((prev) => ({
                          ...prev,
                          [currentStep.id]: event.target.value.replace(/[\r\n]/g, "").slice(0, inputSlots.length),
                        }))}
                        maxLength={inputSlots.length}
                        autoFocus
                      />
                    </div>
                  ) : null}
                </div>

                <div className={styles.bottomBar}>
                  {screen === "feedback" ? (
                    <button type="button" className={styles.primaryButton} disabled={submitting} onClick={handleFeedbackContinue}>{submitting ? "ЗАВАНТАЖЕННЯ..." : "ДАЛІ"}</button>
                  ) : isQuestionStep(currentStep) ? (
                    <button type="button" className={styles.primaryButton} disabled={!String(currentAnswer || "").trim()} onClick={handleCheck}>ПЕРЕВІРИТИ</button>
                  ) : (
                    <button type="button" className={styles.primaryButton} disabled={submitting} onClick={handleContinueLine}>{isLastStep ? "ЗАВЕРШИТИ" : "ПРОДОВЖИТИ"}</button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
