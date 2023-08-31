import { generateStarPredictor, wasmFilename } from "./wrapper";
import init, { StarPredictor } from "../pkg/predict_star_number_extension";

let star_predictor: StarPredictor = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) {
    sendResponse({
      'status': false,
      'reason': 'message is missing'
    });
  }
  else if (message.contentScriptQuery === 'post') {
    fetch(message.endpoint)
    .then((response) => {
      if (response?.ok) {
        response.json().then((data) => {
          sendResponse(data);
        });
      }
    })
    .catch((error) => {
      sendResponse({
        'status': false,
        'url': message.endpoint,
        'reason': `failed to fetch(${error})`,
      });
    });
  }
  else if (message.contentScriptQuery === 'test') {
    if (star_predictor == null) {
      init().then(() => {
        console.log("Finish loading wasm file");
        generateStarPredictor().then((response: StarPredictor) => {
          star_predictor = response;
          sendResponse({
            'status': true,
            'star_predictor': star_predictor.hashmap_to_string(),
          });
        });
      });
    }
    else {
      console.log(star_predictor.hashmap_to_string());
      sendResponse({
          'status': true,
          'star_predictor': star_predictor.hashmap_to_string(),
      });
    }
  }

  return true;
});