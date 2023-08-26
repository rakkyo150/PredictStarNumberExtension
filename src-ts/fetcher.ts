import JSZip from 'jszip';

export async function makeHalfBakedData() {
  const endpoint = "https://raw.githubusercontent.com/andruzzzhka/BeatSaberScrappedData/master/combinedScrappedData.zip";
  const response = await fetch(endpoint);
  const buf = await response.arrayBuffer();
  console.log("buf.length: ", buf.byteLength);
  const zip = new JSZip();
  const zipFile = await zip.loadAsync(buf);
  const jsonStr = await zipFile.file("combinedScrappedData.json")!.async("text");

  return jsonStr;
}

export async function loadModel() {
  const modelAssetEndpoint = "https://raw.githubusercontent.com/rakkyo150/PredictStarNumberHelper/master/model.onnx";
  const response = await fetch(modelAssetEndpoint);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
