import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { scenesService } from "../../../services/scenesService.js";
import { getCachedScenePack, preloadScenePack } from "../../../services/scenePackCache.js";
import { achievementsService } from "../../../services/achievementsService.js";
import { userService } from "../../../services/userService.js";
import { profileService } from "../../../services/profileService.js";
import { mergeCachedProfileSnapshot } from "../../../services/profileSnapshotCache.js";
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
  const startedAsCompletedRef = useRef(false);
  const submitSceneRequestRef = useRef(null);

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
  const [sceneModal, setSceneModal] = useState({ open: false, type: "" });
  const isMistakesMode = location.state?.mode === "mistakes";
  const stateScene = location.state?.scene || null;

  useEffect(() => {
    let ignore = false;
    const scenePackMode = isMistakesMode ? "mistakes" : "default";
    const cachedScenePack = getCachedScenePack(sceneId, { mode: scenePackMode });
    const hasCachedScenePack = Array.isArray(cachedScenePack?.steps) && cachedScenePack.steps.length > 0;

    startedAsCompletedRef.current = Boolean((!isMistakesMode ? cachedScenePack?.scene?.isCompleted : false) || stateScene?.isCompleted || cachedScenePack?.scene?.isCompleted);

    setScene((!isMistakesMode ? cachedScenePack?.scene : null) || stateScene || cachedScenePack?.scene || null);
    setSteps(hasCachedScenePack ? cachedScenePack.steps : []);
    setLoading(!hasCachedScenePack);

    const load = async () => {
      setError("");
      setShowIntro(true);
      setStepIndex(0);
      setScreen("content");
      setAnswers({});
      setFeedback(null);
      submitSceneRequestRef.current = null;

      const userRequest = userService.getMe();
      const weeklyRequest = profileService.getWeeklyProgress();
      const scenePackRes = await preloadScenePack(sceneId, {
        mode: scenePackMode,
        scene: stateScene,
      });

      if (ignore) {
        return;
      }

      if (!scenePackRes.ok) {
        if (!hasCachedScenePack) {
          setError(scenePackRes.error || "Не вдалося завантажити сцену");
          setLoading(false);
        }
      } else {
        setScene((!isMistakesMode ? scenePackRes.data?.scene : null) || stateScene || scenePackRes.data?.scene || null);
        setSteps(Array.isArray(scenePackRes.data?.steps) ? scenePackRes.data.steps : []);
        setLoading(false);
      }

      const [userRes, weeklyRes] = await Promise.all([userRequest, weeklyRequest]);

      if (ignore) {
        return;
      }

      setUser({
        hearts: Number(userRes?.data?.hearts || userRes?.data?.heartsCount || 0),
        crystals: Number(userRes?.data?.crystals || userRes?.data?.crystalsCount || 0),
        points: Number(weeklyRes?.data?.totalPoints || 0),
      });
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

  const closeSceneModal = useCallback(() => {
    setSceneModal({ open: false, type: "" });
  }, []);

  useEffect(() => {
    if (!sceneModal.open) {
      return undefined;
    }

    const handleSceneModalEscape = (event) => {
      if (event.key === "Escape") {
        closeSceneModal();
      }
    };

    window.addEventListener("keydown", handleSceneModalEscape);

    return () => {
      window.removeEventListener("keydown", handleSceneModalEscape);
    };
  }, [closeSceneModal, sceneModal.open]);

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
    setSceneModal({ open: true, type: "leaveScene" });
  }, []);

  const submitSceneAttempt = useCallback(async () => {
    if (submitSceneRequestRef.current?.promise) {
      return submitSceneRequestRef.current.promise;
    }

    const payload = {
      idempotencyKey: makeIdempotencyKey(`scene-${sceneId}`),
      answers: questionSteps.map((step) => ({
        stepId: step.id,
        answer: answers[step.id] || "",
      })),
    };

    const request = (async () => {
      try {
        const res = isMistakesMode ? await scenesService.submitMistakes(sceneId, payload) : await scenesService.submit(sceneId, payload);

        if (!res.ok) {
          return {
            ok: false,
            error: res.error || "Не вдалося завершити сцену",
          };
        }

        const startedAsCompleted = Boolean(startedAsCompletedRef.current);
        const completedForFirstTime = !startedAsCompleted && Boolean(res.data?.isCompleted);
        const sceneRewardFallback = completedForFirstTime ? 15 : 0;
        const earnedCrystals = Number(res.data?.earnedCrystals);
        const earnedPoints = Number(res.data?.earnedPoints);

        return {
          ok: true,
          result: {
            ...(res.data || {}),
            earnedCrystals: Number.isFinite(earnedCrystals) ? earnedCrystals : sceneRewardFallback,
            earnedPoints: Number.isFinite(earnedPoints) ? earnedPoints : sceneRewardFallback,
          },
        };
      } catch {
        return {
          ok: false,
          error: "Не вдалося завершити сцену",
        };
      }
    })();

    const requestState = { promise: request };
    submitSceneRequestRef.current = requestState;

    const requestResult = await request;

    if (submitSceneRequestRef.current === requestState) {
      submitSceneRequestRef.current = {
        promise: Promise.resolve(requestResult),
        result: requestResult,
      };
    }

    return requestResult;
  }, [answers, isMistakesMode, questionSteps, sceneId]);

  const leaveScene = useCallback(() => {
    navigate(PATHS.home, { replace: true, state: { refreshLearning: true, refreshScenes: true } });
  }, [navigate]);

  const handleContinueLine = useCallback(async () => {
    if (isLastStep) {
      setSubmitting(true);

      const submitResult = await submitSceneAttempt();

      setSubmitting(false);

      if (!submitResult.ok) {
        setError(submitResult.error || "Не вдалося завершити сцену");
        return;
      }

      Promise.all([
        userService.getMe({ force: true }),
        profileService.getWeeklyProgress({ force: true }),
        isMistakesMode ? Promise.resolve(null) : achievementsService.getMine({ force: true }),
      ]).then(([userRes, weeklyRes]) => {
        if (!userRes?.ok && !weeklyRes?.ok) {
          return;
        }

        mergeCachedProfileSnapshot({
          profile: userRes?.ok ? (userRes.data || null) : undefined,
          activeTargetLanguageCode: userRes?.ok ? String(userRes.data?.targetLanguageCode || "") : undefined,
          weeklyProgress: weeklyRes?.ok ? (weeklyRes.data || { currentWeek: [], previousWeek: [], totalPoints: 0 }) : undefined,
          myDataForm: userRes?.ok ? {
            username: String(userRes.data?.username || ""),
            email: String(userRes.data?.email || ""),
          } : undefined,
        });
      }).catch(() => {
      });

      navigate(PATHS.sceneResult(sceneId), {
        replace: true,
        state: {
          refreshLearning: true,
          refreshScenes: true,
          result: submitResult.result,
          scene,
          mode: isMistakesMode ? "mistakes" : undefined,
          newlyEarnedAchievements: [],
        },
      });
      return;
    }

    setStepIndex((prev) => prev + 1);
  }, [isLastStep, isMistakesMode, navigate, scene, sceneId, submitSceneAttempt]);

  const handleCheck = useCallback(() => {
    const correct = isCorrectStep(currentStep, currentAnswer);

    if (!correct && !isMistakesMode) {
      setUser((prev) => ({ ...prev, hearts: Math.max(0, Number(prev.hearts || 0) - 1) }));
    }

    setFeedback({ correct, correctAnswer: getStepCorrectAnswer(currentStep) });
    setScreen("feedback");

    if (isLastStep) {
      submitSceneAttempt().catch(() => {
      });
    }
  }, [currentAnswer, currentStep, isLastStep, isMistakesMode, submitSceneAttempt]);

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

        {loading && !scene ? (
          <div className={styles.loaderPage}>Завантаження сцени...</div>
        ) : error || !scene || (!loading && !currentStep) ? (
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
              {!showIntro && !loading ? <div className={styles.topCounter}><img src={EnergyIcon} alt="" /> {Number(user.hearts || 0)}</div> : null}
            </div>

            {showIntro || loading ? (
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

            {sceneModal.open ? (
              <div className={styles.sceneModalOverlay} role="presentation">
                {sceneModal.type === "leaveScene" ? (
                  <div className={`${styles.sceneModalCard} ${styles.sceneLeaveModalCard}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={styles.sceneModalCloseButton} onClick={closeSceneModal} aria-label="Закрити" />
                    <div className={styles.sceneLeaveTitleBox}>
                      <div className={styles.sceneLeaveTitle}>Впевнені що хочете покинути сцену?</div>
                    </div>
                    <div className={styles.sceneLeaveActions}>
                      <button type="button" className={`${styles.sceneModalButton} ${styles.sceneModalButtonSecondary}`} onClick={leaveScene}>ТАК</button>
                      <button type="button" className={`${styles.sceneModalButton} ${styles.sceneModalButtonPrimary}`} onClick={closeSceneModal}>НІ</button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
