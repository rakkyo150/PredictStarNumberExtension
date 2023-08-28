export const Difficulty = {
  Easy: 1,
  Normal: 3,
  Hard: 5,
  Expert: 7,
  ExpertPlus: 9,
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export function getDifficultyString(difficulty: Difficulty): string {
  switch (difficulty) {
      case Difficulty.Easy:
          return "Easy";
      case Difficulty.Normal:
          return "Normal";
      case Difficulty.Hard:
          return "Hard";
      case Difficulty.Expert:
          return "Expert";
      case Difficulty.ExpertPlus:
          return "ExpertPlus";
      default:
          throw new Error("Invalid difficulty");
  }
}

export async function loadModel() {
  const modelAssetEndpoint = "https://raw.githubusercontent.com/rakkyo150/PredictStarNumberHelper/master/model.onnx";
  const response = await fetch(modelAssetEndpoint);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
