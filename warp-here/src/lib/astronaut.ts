export type AstronautPalette = {
  id: string;
  name: string;
  colors: {
    helmet: string;
    visor: string;
    suit: string;
    gloves: string;
    boots: string;
    belt: string;
    backpack: string;
    accents: string;
  };
};

export const astronautPalettes: AstronautPalette[] = [
  {
    id: "classic",
    name: "Classic",
    colors: {
      helmet: "#f4c13c",
      visor: "#d7ecff",
      suit: "#f4c13c",
      gloves: "#f7f1ea",
      boots: "#5a3ad1",
      belt: "#5a3ad1",
      backpack: "#e1e6ef",
      accents: "#5a3ad1",
    },
  },
  {
    id: "arctic",
    name: "Arctic",
    colors: {
      helmet: "#d9f1ff",
      visor: "#b6d9ff",
      suit: "#d9f1ff",
      gloves: "#eef6ff",
      boots: "#2b6dff",
      belt: "#2b6dff",
      backpack: "#cfe4ff",
      accents: "#2b6dff",
    },
  },
  {
    id: "ember",
    name: "Ember",
    colors: {
      helmet: "#ff6b4a",
      visor: "#ffd0b6",
      suit: "#ff6b4a",
      gloves: "#ffe1d6",
      boots: "#1b1b24",
      belt: "#1b1b24",
      backpack: "#f7b29a",
      accents: "#1b1b24",
    },
  },
  {
    id: "jade",
    name: "Jade",
    colors: {
      helmet: "#4dd6a5",
      visor: "#c7f8e6",
      suit: "#4dd6a5",
      gloves: "#e1fbf1",
      boots: "#0f1f2b",
      belt: "#0f1f2b",
      backpack: "#a9f1d4",
      accents: "#0f1f2b",
    },
  },
];
