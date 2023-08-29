export const Characteristic = {
  Standard: "Standard",
  Lawless: "Lawless",
  Lightshow: "Lightshow",
  NoArrows: "NoArrows",
  OneSaber: "OneSaber",
  "90Degree": "90Degree",
  "360Degree": "360Degree",
} as const;

export type Characteristic = (typeof Characteristic)[keyof typeof Characteristic];