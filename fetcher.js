import JSZip from 'jszip';

async function makeHalfBakedData() {
  const endpoint = "https://github.com/andruzzzhka/BeatSaberScrappedData/raw/master/combinedScrappedData.zip";
  const response = await fetch(endpoint);
  const buf = await response.arrayBuffer();
  console.log("buf.length: ", buf.byteLength);
  const zip = new JSZip();
  const zipFile = await zip.loadAsync(buf);
  const jsonStr = await zipFile.file("combinedScrappedData.json").async("text");

  return jsonStr;
}

async function loadModel() {
  const modelAssetEndpoint = "https://github.com/rakkyo150/PredictStarNumberHelper/releases/latest/download/model.onnx";
  const response = await fetch(modelAssetEndpoint);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
