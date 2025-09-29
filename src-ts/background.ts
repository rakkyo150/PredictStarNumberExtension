import { get_predicted_value_by_id } from "./wrapper";
import init from "../pkg/predict_star_number_extension";

let star_predictor_init = false;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!message) {
    sendResponse({
      'status': false,
      'reason': 'message is missing'
    });
  }
  else if (message.contentScriptQuery === 'post') {
    try{
      let response = await fetch(message.endpoint)
      if (response?.ok) {
        const data = await response.json()
        sendResponse(data);
      }
    }
    catch(error) {
      sendResponse({
        'status': false,
        'url': message.endpoint,
        'reason': `failed to fetch(${error})`,
      });
    };
  }
  else if (message.contentScriptQuery === 'predict_by_id') {
    if (!star_predictor_init) {
      try{
        await init();
        star_predictor_init = true;
        const predicted_value = await get_predicted_value_by_id(message.id, message.characteristic, message.difficulty);
        sendResponse({
          'status': true,
          'value': predicted_value,
        });
      }
      catch(error) {
        sendResponse({
          'status': false,
          'reason': error,
        });
      }
    }
    else {
      try{
        const predicted_value = await get_predicted_value_by_id(message.id, message.characteristic, message.difficulty);
        sendResponse({
          'status': true,
          'value': predicted_value,
        });
      }
      catch(error) {
        sendResponse({
          'status': false,
          'reason': error,
        });
      }
    }
  }

  return true;
});