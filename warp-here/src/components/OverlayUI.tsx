"use client";

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { anchors, findNearestAnchor } from "@/lib/anchors";
import { useWarpStore } from "@/lib/state";
import { BottomSheet } from "@/components/BottomSheet";
import { CustomizePanel } from "@/components/CustomizePanel";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const getStageCopy = (stress: number, stageCopy?: [string, string, string]) => {
  if (!stageCopy) {
    if (stress >= 0.66) return "You lose consciousness in 12 seconds.";
    if (stress >= 0.33) return "Your suit systems strain...";
    return "Breathing feels normal...";
  }

  if (stress >= 0.66) return stageCopy[2];
  if (stress >= 0.33) return stageCopy[1];
  return stageCopy[0];
};

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('[data-ui="true"]'));
};

export const OverlayUI = () => {
  const {
    mode,
    scale,
    snappedAnchorId,
    env,
    setScale,
    setMode,
    setSnappedAnchorId,
    setEnv,
    stress,
    setStress,
    triggerHop,
  } = useWarpStore();

  const [isHolding, setIsHolding] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const dragStateRef = useRef({ active: false, lastY: 0 });
  const tapStateRef = useRef({ startX: 0, startY: 0, startTime: 0, moved: false });
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const releaseRafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdActiveRef = useRef(false);
  const [snapPulse, setSnapPulse] = useState(0);

  const snappedAnchor = useMemo(
    () => anchors.find((anchor) => anchor.id === snappedAnchorId) ?? null,
    [snappedAnchorId]
  );
  const nearestAnchor = useMemo(() => findNearestAnchor(scale), [scale]);
  const activeAnchor = snappedAnchor ?? nearestAnchor;

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      if (warpTimerRef.current) clearTimeout(warpTimerRef.current);
      if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
      if (releaseRafRef.current) cancelAnimationFrame(releaseRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode === "SNAPPED" && snappedAnchorId) {
      setSnapPulse((value) => value + 1);
    }
  }, [mode, snappedAnchorId]);

  useEffect(() => {
    if (mode !== "ARRIVED" && isCustomizing) {
      setIsCustomizing(false);
    }
  }, [mode, isCustomizing]);


  const scheduleSnap = () => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(() => {
      const nearest = findNearestAnchor(useWarpStore.getState().scale);
      setScale(nearest.scalePosition);
      setSnappedAnchorId(nearest.id);
      setMode("SNAPPED");
    }, 180);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return;
    // Pointer-driven scaling keeps the interaction one-handed and mobile friendly.
    dragStateRef.current.active = true;
    dragStateRef.current.lastY = event.clientY;
    tapStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      moved: false,
    };
    if (mode !== "ARRIVED") {
      setMode("SCALING");
      setSnappedAnchorId(null);
    }
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    if (!tapStateRef.current.moved) {
      if (
        Math.abs(event.clientX - tapStateRef.current.startX) > 8 ||
        Math.abs(event.clientY - tapStateRef.current.startY) > 8
      ) {
        tapStateRef.current.moved = true;
        setMode("SCALING");
        setSnappedAnchorId(null);
      } else {
        return;
      }
    }

    const delta = event.clientY - dragStateRef.current.lastY;
    dragStateRef.current.lastY = event.clientY;
    const currentScale = useWarpStore.getState().scale;
    const nextScale = currentScale - delta / window.innerHeight;
    setScale(nextScale);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    dragStateRef.current.active = false;
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    const tapDuration = performance.now() - tapStateRef.current.startTime;
    const isTap = !tapStateRef.current.moved && tapDuration < 260;

    if (mode === "ARRIVED" && isTap) {
      triggerHop();
      return;
    }

    scheduleSnap();
  };

  const handleWarp = () => {
    if (!snappedAnchor) return;
    setMode("WARPING");
    if (warpTimerRef.current) clearTimeout(warpTimerRef.current);
    warpTimerRef.current = setTimeout(() => {
      setMode("ARRIVED");
      setEnv({ ...snappedAnchor.defaults });
      setStress(0);
    }, 600);
  };

  const startHold = () => {
    setIsHolding(true);
    holdActiveRef.current = true;
    if (releaseRafRef.current) cancelAnimationFrame(releaseRafRef.current);
    holdStartRef.current = null;

    const step = (time: number) => {
      if (!holdStartRef.current) holdStartRef.current = time;
      const elapsed = time - holdStartRef.current;
      const next = Math.min(1, elapsed / 6000);
      setStress(next);
      if (next < 1 && holdActiveRef.current) {
        holdRafRef.current = requestAnimationFrame(step);
      }
    };

    holdRafRef.current = requestAnimationFrame(step);
  };

  const stopHold = () => {
    setIsHolding(false);
    holdActiveRef.current = false;
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);

    const startStress = stress;
    const startTime = performance.now();

    const releaseStep = (time: number) => {
      const t = Math.min((time - startTime) / 400, 1);
      const eased = easeOutCubic(t);
      setStress(startStress * (1 - eased));
      if (t < 1) {
        releaseRafRef.current = requestAnimationFrame(releaseStep);
      }
    };

    releaseRafRef.current = requestAnimationFrame(releaseStep);
  };

  const statusLabel =
    mode === "SCALING"
      ? "Zooming..."
      : mode === "WARPING"
      ? "Warping..."
      : mode === "ARRIVED"
      ? "Arrived"
      : "Locked";

  return (
    <div
      className="absolute inset-0 z-20 text-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(110,160,255,0.2),_transparent_60%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(8,8,16,0) 40%, rgba(2,2,8,0.7) 80%)",
          opacity: 0.2 + env.radiation * 0.5 + stress * 0.15,
        }}
      />

      <div className="pointer-events-none absolute left-5 right-5 top-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-slate-300">
            Warp Here
          </div>
          <motion.div
            key={`anchor-${snapPulse}`}
            className="mt-1 text-2xl font-semibold"
            initial={{ scale: 1, textShadow: "0 0 0 rgba(120,190,255,0)" }}
            animate={{
              scale: [1, 1.04, 1],
              textShadow: [
                "0 0 0 rgba(120,190,255,0)",
                "0 0 18px rgba(120,190,255,0.7)",
                "0 0 0 rgba(120,190,255,0)",
              ],
            }}
            transition={{ duration: 0.5 }}
          >
            {activeAnchor.name}
          </motion.div>
          <div className="text-sm text-slate-300">{statusLabel}</div>
        </div>
        <div className="text-xs text-slate-400">{activeAnchor.description}</div>
      </div>

      <div className="pointer-events-none absolute right-5 top-20 flex h-[70%] w-8 flex-col items-center">
        <div className="h-full w-[2px] rounded-full bg-white/20" />
        <motion.div
          key={`scrubber-${snapPulse}`}
          className="absolute -right-[6px] h-4 w-4 rounded-full border border-white/60 bg-white/20 shadow-[0_0_12px_rgba(145,190,255,0.7)]"
          style={{ top: `${(1 - scale) * 100}%` }}
          initial={{ scale: 1, boxShadow: "0 0 12px rgba(145,190,255,0.7)" }}
          animate={{
            scale: [1, 1.25, 1],
            boxShadow: [
              "0 0 10px rgba(145,190,255,0.4)",
              "0 0 22px rgba(145,190,255,0.9)",
              "0 0 10px rgba(145,190,255,0.4)",
            ],
          }}
          transition={{ duration: 0.45 }}
        />
      </div>

      <AnimatePresence>
        {mode === "SNAPPED" && snappedAnchor && (
          <motion.button
            key="warp"
            data-ui="true"
            onClick={handleWarp}
            className="pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.3em] text-white shadow-[0_0_20px_rgba(110,170,255,0.35)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            Warp Here
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === "WARPING" && (
          <motion.div
            key="warp-overlay"
            className="pointer-events-none absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(120,200,255,0.35),_transparent_60%)] blur-2xl" />
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0),_rgba(110,200,255,0.4),_rgba(255,255,255,0))]"
              animate={{ x: ["-60%", "60%"] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ mixBlendMode: "screen", filter: "blur(8px)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-5 pb-5">
        {mode === "ARRIVED" && (
          <div
            className={clsx(
              "pointer-events-auto w-full max-w-md rounded-full border border-white/20 bg-white/10 px-4 py-3 text-center text-sm text-white/90",
              isHolding && "bg-white/20"
            )}
            data-ui="true"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
          >
            <div className="text-xs uppercase tracking-[0.3em] text-slate-300">
              Hold to Experience Time
            </div>
            <div className="mt-1 text-sm text-white">
              {getStageCopy(stress, activeAnchor.experience.stageCopy)}
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-200"
                style={{ width: `${Math.round(stress * 100)}%` }}
              />
            </div>
          </div>
        )}
        {mode === "ARRIVED" && (
          <button
            type="button"
            data-ui="true"
            onClick={() => setIsCustomizing((value) => !value)}
            className="pointer-events-auto w-full max-w-md rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200"
          >
            {isCustomizing ? "Close Customize" : "Customize Astro Boy"}
          </button>
        )}
        <BottomSheet visible={mode === "ARRIVED"} />
      </div>
      <CustomizePanel open={isCustomizing && mode === "ARRIVED"} onClose={() => setIsCustomizing(false)} />
    </div>
  );
};
