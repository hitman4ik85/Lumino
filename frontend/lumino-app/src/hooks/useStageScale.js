import { useEffect } from "react";

export function getStageViewportMetrics(viewportWidth, viewportHeight, baseWidth = 1920, baseHeight = 1080) {
  const safeViewportWidth = Math.max(Number(viewportWidth) || 0, 1);
  const safeViewportHeight = Math.max(Number(viewportHeight) || 0, 1);
  const safeBaseHeight = Math.max(Number(baseHeight) || 0, 1);

  const scale = Math.max(safeViewportHeight / safeBaseHeight, 0.0001);
  const stageWidth = safeViewportWidth / scale;
  const stageHeight = safeViewportHeight / scale;
  const safeBaseWidth = Math.max(Number(baseWidth) || 0, 0);
  const extraX = Math.max((stageWidth - safeBaseWidth) / 2, 0);

  return {
    scale,
    stageWidth,
    stageHeight,
    left: 0,
    top: 0,
    extraX,
  };
}

export function useStageScale(stageRef, options = {}) {
  const { width = 1920, height = 1080 } = options;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const resize = () => {
      const metrics = getStageViewportMetrics(window.innerWidth, window.innerHeight, width, height);

      stage.style.position = "fixed";
      stage.style.left = `${metrics.left}px`;
      stage.style.top = `${metrics.top}px`;
      stage.style.width = `${metrics.stageWidth}px`;
      stage.style.height = `${metrics.stageHeight}px`;
      stage.style.transformOrigin = "0 0";
      stage.style.transform = `scale(${metrics.scale})`;
      stage.style.setProperty("--lumino-stage-width", `${metrics.stageWidth}px`);
      stage.style.setProperty("--lumino-stage-height", `${metrics.stageHeight}px`);
      stage.style.setProperty("--lumino-stage-scale", `${metrics.scale}`);
      stage.style.setProperty("--lumino-stage-left", `${metrics.left}px`);
      stage.style.setProperty("--lumino-stage-top", `${metrics.top}px`);
      stage.style.setProperty("--lumino-stage-extra-x", `${metrics.extraX}px`);
      stage.style.setProperty("--lumino-stage-base-width", `${width}px`);
      stage.style.setProperty("--lumino-stage-base-height", `${height}px`);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [stageRef, width, height]);
}
