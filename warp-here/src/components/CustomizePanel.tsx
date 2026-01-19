"use client";

import clsx from "clsx";
import { astronautPalettes } from "@/lib/astronaut";
import { useWarpStore, type WarpState } from "@/lib/state";

type CustomizePanelProps = {
  open: boolean;
  onClose: () => void;
};

const colorFields: Array<{ key: keyof WarpState["astronautColors"]; label: string }> =
  [
    { key: "helmet", label: "Helmet" },
    { key: "visor", label: "Visor" },
    { key: "suit", label: "Suit" },
    { key: "gloves", label: "Gloves" },
    { key: "boots", label: "Boots" },
    { key: "belt", label: "Belt" },
    { key: "backpack", label: "Backpack" },
    { key: "accents", label: "Accents" },
  ];

export const CustomizePanel = ({ open, onClose }: CustomizePanelProps) => {
  const astronautColors = useWarpStore((state) => state.astronautColors);
  const setAstronautColors = useWarpStore((state) => state.setAstronautColors);

  return (
    <div
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-slate-950/85 p-5 text-white shadow-[0_-20px_60px_rgba(5,10,20,0.7)] backdrop-blur",
        open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        "transition duration-300"
      )}
      data-ui="true"
      aria-hidden={!open}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-300">
            Customize Astro Boy
          </div>
          <div className="text-sm text-slate-400">
            Pick colors for each suit part.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Close
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {astronautPalettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => setAstronautColors(palette.colors)}
              className="h-9 w-9 rounded-full border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${palette.colors.helmet}, ${palette.colors.accents})`,
              }}
              aria-label={`Apply ${palette.name} palette`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {colorFields.map((field) => (
          <label key={field.key} className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {field.label}
            </span>
            <input
              type="color"
              value={astronautColors[field.key]}
              onChange={(event) =>
                setAstronautColors({ [field.key]: event.target.value })
              }
              className="h-8 w-10 cursor-pointer rounded-md border border-white/20 bg-transparent"
              aria-label={`Set ${field.label} color`}
            />
          </label>
        ))}
      </div>
    </div>
  );
};
