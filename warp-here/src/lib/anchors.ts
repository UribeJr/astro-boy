export type Anchor = {
  id: string;
  name: string;
  scalePosition: number; // 0..1
  defaults: {
    gravity: number; // m/s^2
    temperatureC: number;
    radiation: number; // 0..1
  };
  experience: {
    stageCopy: [string, string, string];
  };
  backgroundKey: string;
  description: string;
};

export const anchors: Anchor[] = [
  {
    id: "human-iss",
    name: "Human / ISS",
    scalePosition: 0.05,
    defaults: {
      gravity: 9.8,
      temperatureC: 22,
      radiation: 0.1,
    },
    experience: {
      stageCopy: [
        "Breathing feels steady. Systems nominal.",
        "Mild strain from rotation and noise.",
        "You steady yourself and recover.",
      ],
    },
    backgroundKey: "low-orbit",
    description: "A handspan from home. The ISS hums above the blue marble.",
  },
  {
    id: "earth",
    name: "Earth",
    scalePosition: 0.2,
    defaults: {
      gravity: 9.8,
      temperatureC: 15,
      radiation: 0.2,
    },
    experience: {
      stageCopy: [
        "Air feels familiar. Your pulse slows.",
        "Grounding returns. You feel stable.",
        "No immediate danger. You regain calm.",
      ],
    },
    backgroundKey: "earth",
    description: "Cloud swirls, ocean glow, a restless cradle.",
  },
  {
    id: "moon",
    name: "Moon",
    scalePosition: 0.35,
    defaults: {
      gravity: 1.62,
      temperatureC: -20,
      radiation: 0.45,
    },
    experience: {
      stageCopy: [
        "Breathing is controlled in the suit.",
        "Cold seeps in. Systems work harder.",
        "Consciousness fades in a few minutes.",
      ],
    },
    backgroundKey: "moon",
    description: "A gray sentinel with sharp shadows and silent dust.",
  },
  {
    id: "solar-system",
    name: "Solar System",
    scalePosition: 0.55,
    defaults: {
      gravity: 0.0,
      temperatureC: -150,
      radiation: 0.6,
    },
    experience: {
      stageCopy: [
        "No sound. Only your heartbeat.",
        "Radiation pings begin to rise.",
        "Unconsciousness in under a minute.",
      ],
    },
    backgroundKey: "solar",
    description: "Planets arc like beads on a vast gravitational string.",
  },
  {
    id: "nearby-stars",
    name: "Nearby Stars",
    scalePosition: 0.75,
    defaults: {
      gravity: 0.0,
      temperatureC: -230,
      radiation: 0.75,
    },
    experience: {
      stageCopy: [
        "Silence deepens. Vision narrows.",
        "Suit heaters strain to keep up.",
        "You black out within seconds.",
      ],
    },
    backgroundKey: "stars",
    description: "Sunlight fades into a quiet neighborhood of embers.",
  },
  {
    id: "milky-way",
    name: "Milky Way",
    scalePosition: 0.95,
    defaults: {
      gravity: 0.0,
      temperatureC: -270,
      radiation: 0.9,
    },
    experience: {
      stageCopy: [
        "Space stretches. You feel weightless.",
        "Systems scream in faint alarms.",
        "Consciousness slips almost instantly.",
      ],
    },
    backgroundKey: "galaxy",
    description: "A spiral city of stars, calm and unknowable.",
  },
];

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const findNearestAnchor = (scale: number) => {
  return anchors.reduce((nearest, anchor) => {
    const currentDist = Math.abs(anchor.scalePosition - scale);
    const nearestDist = Math.abs(nearest.scalePosition - scale);
    return currentDist < nearestDist ? anchor : nearest;
  }, anchors[0]);
};
