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

  return true;
});
