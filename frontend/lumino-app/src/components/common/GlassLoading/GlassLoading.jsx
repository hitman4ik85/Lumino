import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SolarLoading from "../SolarLoading/SolarLoading.jsx";
import styles from "./GlassLoading.module.css";
import { getStageViewportMetrics } from "../../../hooks/useStageScale.js";

export default function GlassLoading({ open, text = "Завантаження...", stageTargetId = "" }) {
  const [stageMetrics, setStageMetrics] = useState(() => getStageViewportMetrics(window.innerWidth, window.innerHeight));
  const [stageTargetNode, setStageTargetNode] = useState(null);

  useEffect(() => {
    const updateStageMetrics = () => {
      setStageMetrics(getStageViewportMetrics(window.innerWidth, window.innerHeight));
    };

    updateStageMetrics();
    window.addEventListener("resize", updateStageMetrics);

    return () => {
      window.removeEventListener("resize", updateStageMetrics);
    };
  }, []);

  useEffect(() => {
    if (!stageTargetId) {
      setStageTargetNode(null);
      return;
    }

    const updateStageTarget = () => {
      setStageTargetNode(document.getElementById(stageTargetId));
    };

    updateStageTarget();

    const frameId = window.requestAnimationFrame(updateStageTarget);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [stageTargetId, open]);

  if (!open) return null;

  const content = (
    <>
      <div className={styles.backdrop} />

      <div className={styles.box} role="status" aria-live="polite">
        <SolarLoading />
        <p className={styles.text}>{text}</p>
      </div>
    </>
  );

  if (stageTargetNode) {
    return createPortal(
      <div className={styles.stageOverlayRoot}>
        {content}
      </div>,
      stageTargetNode
    );
  }

  return (
    <div className={styles.overlayRoot}>
      <div
        className={styles.stageFrame}
        style={{
          left: `${stageMetrics.left}px`,
          top: `${stageMetrics.top}px`,
          width: `${stageMetrics.stageWidth}px`,
          height: `${stageMetrics.stageHeight}px`,
          transform: `scale(${stageMetrics.scale})`,
        }}
        role="presentation"
      >
        {content}
      </div>
    </div>
  );
}
