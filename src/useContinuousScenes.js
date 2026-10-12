import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionValue } from "motion/react";

export const clamp = (value, maximum) => Math.max(0, Math.min(value, maximum));

// The track stays RTL in both languages. Its scrollLeft is negative as it
// advances; pane content has its own independent reading direction.
export function wheelDistance(event, width) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
  return (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : -event.deltaX) * unit;
}

const interactive = "a,button,input,textarea,select,[contenteditable='true']";
const AUTO_SPEED = 16; // Pixels per second; never jumps back from the last pane.
const IDLE_DELAY = 7000;
const desktopQuery = "(min-width: 960px) and (orientation: landscape)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (notify) => {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const serverReducedMotion = () => true;

// Subscribe directly so a preference change also takes effect in an open page.
export function useLiveReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, serverReducedMotion);
}

export function useContinuousScenes({ stageRef, sceneRefs, count, desktop, reducedMotion, paused }) {
  const [activeScene, setActiveScene] = useState(0);
  const progress = useMotionValue(0);
  const activeRef = useRef(0);
  const controller = useRef(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);

  const goTo = useCallback((index) => {
    const bounded = clamp(index, count - 1);
    if (desktop) controller.current?.goTo(bounded);
    else sceneRefs.current[bounded]?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  }, [count, desktop, reducedMotion, sceneRefs]);

  const pauseInteraction = useCallback((kind, value) => {
    (kind === "hover" ? hoverRef : focusRef).current = value;
    controller.current?.activity();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const updateActive = (value) => {
      const next = clamp(Math.round(value), count - 1);
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActiveScene(next);
      }
    };

    if (!desktop) {
      let frame = 0;
      const sync = () => {
        frame = 0;
        if (window.matchMedia(desktopQuery).matches) return;
        const anchor = document.querySelector(".site-header").getBoundingClientRect().bottom + window.innerHeight * 0.2;
        let selected = 0;
        sceneRefs.current.forEach((node, index) => {
          if (node?.getBoundingClientRect().top <= anchor) selected = index;
        });
        progress.set(selected);
        updateActive(selected);
      };
      const onScroll = () => { if (!frame) frame = requestAnimationFrame(sync); };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      if (activeRef.current) sceneRefs.current[activeRef.current]?.scrollIntoView({ behavior: "instant", block: "start" });
      sync();
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    let width = stage.clientWidth;
    let maximum = Math.max(0, stage.scrollWidth - width);
    let target = clamp(progress.get() * width, maximum);
    let animatedPosition = target;
    let moving = false;
    let movementSource = "";
    let frame = 0;
    let idleTimer = 0;
    let previousTime = 0;
    let lastInteraction = performance.now();
    let drag = null;
    const heldPointers = new Set();
    let suppressClick = false;
    let disposed = false;
    const position = () => clamp(-stage.scrollLeft, maximum);
    const sync = () => {
      if (!window.matchMedia(desktopQuery).matches) return;
      const value = width ? position() / width : 0;
      progress.set(value);
      updateActive(value);
    };
    const canCruise = () => !paused && !reducedMotion && !heldPointers.size && !hoverRef.current && !focusRef.current && document.visibilityState === "visible" && position() < maximum - 0.5;
    const start = () => {
      if (!frame && !disposed) {
        previousTime = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const scheduleIdle = () => {
      clearTimeout(idleTimer);
      if (canCruise()) idleTimer = window.setTimeout(start, Math.max(0, IDLE_DELAY - (performance.now() - lastInteraction)));
    };
    const activity = () => {
      lastInteraction = performance.now();
      scheduleIdle();
    };
    function tick(time) {
      frame = 0;
      if (disposed) return;
      const elapsed = previousTime ? Math.min(50, time - previousTime) : 16;
      previousTime = time;
      const current = moving ? animatedPosition : position();
      if (moving) {
        const distance = target - current;
        const next = reducedMotion || Math.abs(distance) < 0.5 ? target : current + distance * (1 - Math.exp(-elapsed / 85));
        animatedPosition = next;
        stage.scrollLeft = -next;
        if (Math.abs(target - next) < 0.5) { stage.scrollLeft = -target; moving = false; }
      } else if (canCruise() && time - lastInteraction >= IDLE_DELAY) {
        target = clamp(target + AUTO_SPEED * elapsed / 1000, maximum);
        stage.scrollLeft = -target;
      }
      sync();
      if (moving || canCruise() && time - lastInteraction >= IDLE_DELAY) frame = requestAnimationFrame(tick);
      else scheduleIdle();
    }
    const moveTo = (value, source = "navigation") => {
      if (!moving || movementSource !== source) animatedPosition = position();
      target = clamp(value, maximum);
      moving = true;
      movementSource = source;
      activity();
      if (reducedMotion) {
        stage.scrollLeft = -target;
        moving = false;
        sync();
      } else start();
    };
    const onWheel = (event) => {
      if (event.ctrlKey || event.metaKey || !event.cancelable) return;
      const distance = wheelDistance(event, width);
      if (!distance) return;
      event.preventDefault();
      moveTo((moving && movementSource === "wheel" ? target : position()) + distance, "wheel");
    };
    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest(interactive)) return;
      const current = moving && movementSource === "keyboard" ? target : position();
      const destinations = { ArrowLeft: current + 80, ArrowRight: current - 80, PageDown: current + width * 0.8, PageUp: current - width * 0.8, Home: 0, End: maximum };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      moveTo(destinations[event.key], "keyboard");
    };
    const onScroll = () => {
      sync();
      // Native touch, focus scrolling and external scroll changes remain in
      // charge whenever our interruptible smoothing loop is not moving.
      if (!moving && !frame) target = position();
    };
    const onPointerDown = (event) => {
      heldPointers.add(event.pointerId);
      moving = false;
      target = position();
      activity();
      suppressClick = false;
      if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest(interactive)) return;
      drag = { id: event.pointerId, x: event.clientX, start: position(), lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false };
    };
    const onPointerMove = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
      }
      event.preventDefault();
      const now = performance.now();
      drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastTime);
      drag.lastX = event.clientX;
      drag.lastTime = now;
      target = clamp(drag.start + distance, maximum);
      stage.scrollLeft = -target;
      sync();
    };
    const finishDrag = (event) => {
      heldPointers.delete(event.pointerId);
      activity();
      if (!drag || event.pointerId !== drag.id) return;
      const previous = drag;
      drag = null;
      stage.classList.remove("is-dragging");
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      suppressClick = previous.moved;
      const velocity = performance.now() - previous.lastTime < 80 ? previous.velocity : 0;
      if (previous.moved && event.type === "pointerup" && !reducedMotion) moveTo(position() + Math.max(-240, Math.min(velocity * 110, 240)));
      else activity();
    };
    const onClick = (event) => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    };
    const onFocus = () => { moving = false; activity(); };
    const onResize = () => {
      // CSS changes layout before React's resize state update. Avoid treating
      // the temporary vertical layout as a zero-width horizontal journey.
      if (!window.matchMedia(desktopQuery).matches) return;
      const fraction = progress.get();
      width = stage.clientWidth;
      maximum = Math.max(0, stage.scrollWidth - width);
      moving = false;
      target = clamp(fraction * width, maximum);
      stage.scrollLeft = -target;
      sync();
      activity();
    };

    window.scrollTo({ top: 0, behavior: "instant" });
    stage.scrollLeft = -target;
    sync();
    controller.current = { goTo: (index) => moveTo(index * width), activity };
    const observer = new ResizeObserver(onResize);
    observer.observe(stage);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("scroll", onScroll, { passive: true });
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    stage.addEventListener("lostpointercapture", finishDrag);
    stage.addEventListener("click", onClick, true);
    stage.addEventListener("focusin", onFocus);
    stage.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", activity);
    scheduleIdle();

    return () => {
      disposed = true;
      controller.current = null;
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      observer.disconnect();
      stage.classList.remove("is-dragging");
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("scroll", onScroll);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      stage.removeEventListener("lostpointercapture", finishDrag);
      stage.removeEventListener("click", onClick, true);
      stage.removeEventListener("focusin", onFocus);
      stage.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", activity);
    };
  }, [count, desktop, paused, progress, reducedMotion, sceneRefs, stageRef]);

  return { activeScene, progress, goTo, pauseInteraction };
}
