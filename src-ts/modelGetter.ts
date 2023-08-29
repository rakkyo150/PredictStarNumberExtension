export async function getModel() {
  const modelAssetEndpoint =
      "https://raw.githubusercontent.com/rakkyo150/PredictStarNumberHelper/master/model.onnx";
  const response = await fetch(modelAssetEndpoint);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
