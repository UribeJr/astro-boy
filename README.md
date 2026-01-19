# Warp Here

Scroll the space scale, snap to an anchor, and warp in.

**[Live demo](https://astro-boy.onrender.com)**

<!-- Add a screenshot: ![Warp Here](./screenshot.png) or ![Warp Here](./demo.gif) -->

## About

Warp Here is an interactive 3D space-scale experience that moves from Human/ISS to the Milky Way. Drag to zoom along the scale, snap to one of six locations, and warp to arrive. On arrival, a 3D astronaut reacts in real time to gravity, temperature, and radiation. You can "Hold to Experience Time" to simulate survival in that environment and use "Customize Astro Boy" to change suit colors.

## Features

- **Scroll-to-scale** — Six anchors: Human/ISS, Earth, Moon, Solar System, Nearby Stars, Milky Way. Drag to zoom; release to snap to the nearest anchor.
- **Warp and arrival** — Tap "Warp Here" when locked on an anchor to travel. Modes: SCALING, SNAPPED, WARPING, ARRIVED.
- **Hold to Experience Time** — After arrival, hold the control to raise a stress meter. Stage copy reflects survival (e.g. "Breathing feels normal...", "Your suit systems strain...", "You lose consciousness in 12 seconds.").
- **Arrival Controls** — Sliders for gravity (m/s²), temperature (°C), and radiation. The astronaut’s bob, drift, breath, cold shake, and hot droop respond to these values.
- **Customize Astro Boy** — Per-part suit colors (helmet, visor, suit, gloves, boots, belt, backpack, accents) and presets.
- **3D scene** — GLB astronaut, stars (Drei), far/near particle layers, fog planes, motion streaks during scaling, landing dust, and hop-on-tap.

## Tech stack

- **Next.js 16**, **React 19**, **TypeScript**
- **Three.js**, **React Three Fiber**, **@react-three/drei**
- **Framer Motion**, **Zustand**, **Tailwind CSS**

## Getting started

```bash
cd warp-here && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `warp-here/` — Next.js app (static export)
- `warp-here/src/components/` — `SpaceScene`, `OverlayUI`, `BottomSheet`, `CustomizePanel`
- `warp-here/src/lib/` — `anchors`, `state`, `astronaut`

## Deploy

Static export via `output: 'export'` in `warp-here/next.config.ts`, built and served on [Render](https://astro-boy.onrender.com).
