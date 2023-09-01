import { get_predicted_value_by_id, wasmFilename } from "./wrapper";
import init from "../pkg/predict_star_number_extension";

let star_predictor_init = false;

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
  else if (message.contentScriptQuery === 'predict_by_id') {
    if (!star_predictor_init) {
      init().then(() => {
        star_predictor_init = true;
        get_predicted_value_by_id(message.id, message.characteristic, message.difficulty).then((value) => {
          sendResponse({
            'status': true,
            'value': value,
          });
        }).catch((error) => {
          sendResponse({
            'status': false,
            'reason': error,
          });
        });
      }).catch((error) => {
        sendResponse({
          'status': false,
          'reason': error,
        });
      });
    }
    else {
      get_predicted_value_by_id(message.id, message.characteristic, message.difficulty).then((value) => {
        sendResponse({
          'status': true,
          'value': value,
        });
      }).catch((error) => {
        sendResponse({
          'status': false,
          'reason': error,
        });
      });
;    }
  }

  return true;
});