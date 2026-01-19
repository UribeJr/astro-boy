"use client";

import { create } from "zustand";
import { anchors, clamp01 } from "./anchors";

export type WarpMode = "SCALING" | "SNAPPED" | "WARPING" | "ARRIVED";

export type EnvState = {
  gravity: number;
  temperatureC: number;
  radiation: number;
};

export type WarpState = {
  mode: WarpMode;
  scale: number;
  snappedAnchorId: string | null;
  env: EnvState;
  stress: number;
  hopToken: number;
  astronautColors: {
    helmet: string;
    visor: string;
    suit: string;
    gloves: string;
    boots: string;
    belt: string;
    backpack: string;
    accents: string;
  };
  setMode: (mode: WarpMode) => void;
  setScale: (scale: number) => void;
  setSnappedAnchorId: (id: string | null) => void;
  setEnv: (env: Partial<EnvState>) => void;
  setStress: (stress: number) => void;
  triggerHop: () => void;
  setAstronautColors: (colors: Partial<WarpState["astronautColors"]>) => void;
};

const initialAnchor = anchors[0];

export const useWarpStore = create<WarpState>((set) => ({
  mode: "SNAPPED",
  scale: initialAnchor.scalePosition,
  snappedAnchorId: initialAnchor.id,
  env: { ...initialAnchor.defaults },
  stress: 0,
  hopToken: 0,
  astronautColors: {
    helmet: "#f4c13c",
    visor: "#d7ecff",
    suit: "#f4c13c",
    gloves: "#f7f1ea",
    boots: "#5a3ad1",
    belt: "#5a3ad1",
    backpack: "#e1e6ef",
    accents: "#5a3ad1",
  },
  setMode: (mode) => set({ mode }),
  setScale: (scale) => set({ scale: clamp01(scale) }),
  setSnappedAnchorId: (id) => set({ snappedAnchorId: id }),
  setEnv: (env) => set((state) => ({ env: { ...state.env, ...env } })),
  setStress: (stress) => set({ stress: clamp01(stress) }),
  triggerHop: () => set((state) => ({ hopToken: state.hopToken + 1 })),
  setAstronautColors: (colors) =>
    set((state) => ({ astronautColors: { ...state.astronautColors, ...colors } })),
}));
