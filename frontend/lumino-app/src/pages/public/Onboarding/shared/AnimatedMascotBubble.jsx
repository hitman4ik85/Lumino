import { cloneElement, isValidElement, useEffect, useMemo, useState } from "react";
import sharedStyles from "./AnimatedMascotBubble.module.css";

function getTextLength(node) {
  if (node === null || node === undefined || typeof node === "boolean") {
    return 0;
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node).length;
  }

  if (Array.isArray(node)) {
    return node.reduce((sum, item) => sum + getTextLength(item), 0);
  }

  if (isValidElement(node)) {
    if (node.type === "br") {
      return 1;
    }

    return getTextLength(node.props.children);
  }

  return 0;
}

function getNodeSignature(node) {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => getNodeSignature(item)).join("");
  }

  if (isValidElement(node)) {
    if (node.type === "br") {
      return "\n";
    }

    const tagName = typeof node.type === "string" ? node.type : "component";
    return `<${tagName}>${getNodeSignature(node.props.children)}</${tagName}>`;
  }

  return "";
}

function sliceNode(node, visibleChars) {
  if (node === null || node === undefined || typeof node === "boolean") {
    return { node: null, rest: visibleChars };
  }

  if (typeof node === "string" || typeof node === "number") {
    const value = String(node);

    if (visibleChars <= 0) {
      return { node: null, rest: 0 };
    }

    const visibleValue = value.slice(0, visibleChars);
    const rest = Math.max(visibleChars - value.length, 0);

    return { node: visibleValue, rest };
  }

  if (Array.isArray(node)) {
    const items = [];
    let rest = visibleChars;

    node.forEach((item, index) => {
      const result = sliceNode(item, rest);

      if (result.node !== null && result.node !== "") {
        items.push(isValidElement(result.node)
          ? cloneElement(result.node, { key: result.node.key ?? index })
          : result.node);
      }

      rest = result.rest;
    });

    return { node: items, rest };
  }

  if (isValidElement(node)) {
    if (node.type === "br") {
      if (visibleChars <= 0) {
        return { node: null, rest: 0 };
      }

      return { node, rest: visibleChars - 1 };
    }

    const result = sliceNode(node.props.children, visibleChars);

    if (
      result.node === null
      || result.node === ""
      || (Array.isArray(result.node) && result.node.length === 0)
    ) {
      return { node: null, rest: result.rest };
    }

    return {
      node: cloneElement(node, undefined, result.node),
      rest: result.rest,
    };
  }

  return { node: null, rest: visibleChars };
}

export default function AnimatedMascotBubble({
  mascotSrc,
  bubbleSrc,
  mascotClassName,
  bubbleClassName,
  textClassName,
  children,
  decorationSrc,
  decorationClassName,
  bubbleFirst = false,
  mascotAnimation = "default",
}) {
  const typingSteps = Math.min(Math.max(getTextLength(children), 18), 120);
  const childrenSignature = useMemo(() => getNodeSignature(children), [children]);
  const isUfoAnimation = mascotAnimation === "ufo";
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const mediaQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    if (mediaQuery?.matches) {
      setVisibleChars(typingSteps);
      return undefined;
    }

    setVisibleChars(0);

    const typingStartDelay = isUfoAnimation ? 2280 : 1320;
    const typingDuration = Math.max(typingSteps * 34, 1000);
    const typingInterval = typingDuration / typingSteps;

    let typingTimer = null;
    let completeTimeout = null;

    const startTimeout = window.setTimeout(() => {
      typingTimer = window.setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= typingSteps) {
            window.clearInterval(typingTimer);
            return prev;
          }

          return prev + 1;
        });
      }, typingInterval);

      completeTimeout = window.setTimeout(() => {
        window.clearInterval(typingTimer);
        setVisibleChars(typingSteps);
      }, typingDuration + typingInterval);
    }, typingStartDelay);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(completeTimeout);
      window.clearInterval(typingTimer);
    };
  }, [typingSteps, childrenSignature, isUfoAnimation]);

  const visibleText = useMemo(() => sliceNode(children, visibleChars).node, [children, visibleChars]);

  const mascotImageClassName = [
    sharedStyles.mascotImage,
    isUfoAnimation ? sharedStyles.mascotImageUfo : "",
  ].filter(Boolean).join(" ");

  const bubbleImageClassName = [
    sharedStyles.bubbleImage,
    isUfoAnimation ? sharedStyles.bubbleImageAfterUfo : "",
  ].filter(Boolean).join(" ");

  const bubbleTextClassName = [
    textClassName,
    sharedStyles.bubbleTextReveal,
    isUfoAnimation ? sharedStyles.bubbleTextRevealAfterUfo : "",
  ].filter(Boolean).join(" ");

  const bubbleNode = (
    <>
      <div className={bubbleClassName} aria-hidden="true">
        <img className={bubbleImageClassName} src={bubbleSrc} alt="" />
      </div>

      <p className={bubbleTextClassName}>
        {visibleText}
      </p>
    </>
  );

  const mascotNode = (
    <>
      {decorationSrc ? (
        <div className={decorationClassName} aria-hidden="true">
          <img className={sharedStyles.mascotImage} src={decorationSrc} alt="" />
        </div>
      ) : null}

      <div className={mascotClassName} aria-hidden="true">
        <img className={mascotImageClassName} src={mascotSrc} alt="" />
      </div>
    </>
  );

  return <>{bubbleFirst ? <>{bubbleNode}{mascotNode}</> : <>{mascotNode}{bubbleNode}</>}</>;
}
