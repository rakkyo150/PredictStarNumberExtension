export async function getModel() {
  const modelAssetEndpoint =
      "https://github.com/rakkyo150/PredictStarNumberHelper/releases/latest/download/model.onnx";
  const response = await fetch(modelAssetEndpoint);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
