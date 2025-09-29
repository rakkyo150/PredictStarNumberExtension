import { get_predicted_value_by_id, get_predicted_value_by_hash } from "./wrapper";
import initSync from "../pkg/predict_star_number_extension";

let star_predictor_init = false;

// https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#addlistener_%E3%81%AE%E6%A7%8B%E6%96%87
// asyncを使ったらずれる
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) {
    sendResponse({
      'status': false,
      'reason': 'message is missing'
    });
  }
  else if (message.contentScriptQuery === 'post') {
    try{
      fetch(message.endpoint).then((response)=>{
        if (response?.ok) {
          response.json().then((data)=>{
          sendResponse(data);
          })
        }
      })
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
        initSync();
        star_predictor_init = true;
      }
      catch(error) {
        sendResponse({
          'status': false,
          'reason': error,
        });
      }
    }
    try{
      get_predicted_value_by_id(message.id, message.characteristic, message.difficulty).then((predicted_value)=>{
        console.log(predicted_value);
        sendResponse({
          'status': true,
          'value': predicted_value,
        });
      });
    }
    catch(error) {
      sendResponse({
        'status': false,
        'reason': error,
      });
    }
  }
  else if (message.contentScriptQuery === 'predict_by_hash'){
    if (!star_predictor_init) {
      try{
        initSync();
        star_predictor_init = true;
      }
      catch(error) {
        sendResponse({
          'status': false,
          'reason': error,
        });
      }
    }
    try{
      console.log(message);
      get_predicted_value_by_hash(message.hash, message.characteristic, message.difficulty).then((predicted_value)=>{
        console.log(predicted_value);
        sendResponse({
          'status': true,
          'value': predicted_value,
        });
      });
    }
    catch(error) {
      sendResponse({
        'status': false,
        'reason': error,
      });
    }
  }
  else{
    sendResponse({
      'status': false,
      'reason': "no match contentScriptQuery",
    });
  }

  return true;
});