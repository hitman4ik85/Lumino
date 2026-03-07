import { useEffect } from "react";

export function useStageScale(stageRef, options = {}) {
  const { width = 1920, height = 1080, mode = "translate" } = options;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const resize = () => {
      const sx = window.innerWidth / width;
      const sy = window.innerHeight / height;
      const s = Math.min(sx, sy);

      if (mode === "absolute") {
        stage.style.transform = `scale(${s})`;
        stage.style.left = `${(window.innerWidth - width * s) / 2}px`;
        stage.style.top = `${(window.innerHeight - height * s) / 2}px`;
        stage.style.position = "absolute";
        return;
      }

      stage.style.transform = `
        translate(${Math.round((window.innerWidth - width * s) / 2)}px, ${Math.round((window.innerHeight - height * s) / 2)}px)
        scale(${s})
      `;
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [stageRef, width, height, mode]);
}
