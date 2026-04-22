import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { authStorage } from "../../../services/authStorage.js";
import { preloadAchievementsCache, readAchievementsCache } from "../../../services/achievementsCache.js";
import styles from "./AchievementsPage.module.css";
import AwardCardLocked from "../../../assets/lesson/achievement/award_card_locked.svg";

const PLACEHOLDER_COUNT = 12;

export default function AchievementsContent() {
  const navigate = useNavigate();
  const initialCacheRef = useRef(readAchievementsCache());
  const [achievements, setAchievements] = useState(initialCacheRef.current || []);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadAchievements = async () => {
      const res = await preloadAchievementsCache();

      if (!res.ok) {
        if (res.shouldClearTokens) {
          authStorage.clearTokens();
          navigate(PATHS.login, { replace: true });
        }

        return;
      }

      if (cancelled) {
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];

      setAchievements(list);
    };

    loadAchievements();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const displayItems = useMemo(() => {
    const filled = [...achievements];
    const targetCount = Math.max(PLACEHOLDER_COUNT, filled.length);

    while (filled.length < targetCount) {
      filled.push(null);
    }

    return filled;
  }, [achievements]);

  const handleImageError = (key) => {
    setImageErrors((prev) => {
      if (prev[key]) {
        return prev;
      }

      return { ...prev, [key]: true };
    });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.mobileHeader}>
        <div className={styles.mobileTitle}>Нагороди</div>
      </div>

      <div className={styles.topDivider} />

      <div className={styles.achievementsBody}>
        <div className={styles.grid}>
          {displayItems.map((item, index) => {
            if (!item) {
              return (
                <div key={`placeholder-${index}`} className={styles.cardLocked}>
                  <div className={styles.cardVisual}>
                    <img
                      className={`${styles.cardImage} ${styles.cardImageLocked}`}
                      src={AwardCardLocked}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>

                  <div className={styles.cardTitleLocked}>&nbsp;</div>
                  <div className={styles.cardDescriptionLocked}>&nbsp;</div>
                </div>
              );
            }

            const key = item.id || `achievement-${index}`;
            const hasImage = item.isEarned && item.imageUrl && !imageErrors[key];
            const cardClassName = item.isEarned ? styles.card : styles.cardLocked;
            const titleClassName = item.isEarned ? styles.cardTitle : styles.cardTitleLocked;
            const descriptionClassName = item.isEarned ? styles.cardDescription : styles.cardDescriptionLocked;
            const lockedTitle = item.isEarned ? item.title : "";
            const lockedDescription = item.isEarned ? item.description : "";

            return (
              <div key={key} className={cardClassName}>
                <div className={styles.cardVisual}>
                  {item.isEarned ? (
                    hasImage ? (
                      <img
                        className={styles.cardImage}
                        src={item.imageUrl}
                        alt={item.title}
                        onError={() => handleImageError(key)}
                      />
                    ) : (
                      <div className={styles.cardImagePlaceholderEarned} />
                    )
                  ) : (
                    <img
                      className={`${styles.cardImage} ${styles.cardImageLocked}`}
                      src={AwardCardLocked}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={titleClassName}>{lockedTitle || " "}</div>
                <div className={descriptionClassName}>{lockedDescription || " "}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.bottomDivider} />
      <div className={styles.footerNote}>*більше нагород попереду</div>
    </div>
  );
}
