"use client";

import { useWarpStore } from "@/lib/state";
import clsx from "clsx";

export const BottomSheet = ({ visible }: { visible: boolean }) => {
  const env = useWarpStore((state) => state.env);
  const setEnv = useWarpStore((state) => state.setEnv);

  return (
    <div
      className={clsx(
        "pointer-events-auto mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-slate-950/70 p-4 pb-6 text-white shadow-[0_-20px_60px_rgba(5,10,20,0.7)] backdrop-blur",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        "transition duration-300"
      )}
      data-ui="true"
    >
      <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-300">
        Arrival Controls
      </div>
      <div className="space-y-4">
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
            <span>Gravity</span>
            <span className="text-slate-400">{env.gravity.toFixed(1)} m/s²</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={env.gravity}
            onChange={(event) => setEnv({ gravity: Number(event.target.value) })}
            className="range-slider"
          />
        </label>
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
            <span>Temperature</span>
            <span className="text-slate-400">{env.temperatureC}°C</span>
          </div>
          <input
            type="range"
            min={-270}
            max={120}
            step={1}
            value={env.temperatureC}
            onChange={(event) => setEnv({ temperatureC: Number(event.target.value) })}
            className="range-slider"
          />
        </label>
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
            <span>Radiation</span>
            <span className="text-slate-400">{env.radiation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={env.radiation}
            onChange={(event) => setEnv({ radiation: Number(event.target.value) })}
            className="range-slider"
          />
        </label>
      </div>
    </div>
  );
};
