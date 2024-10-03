// background.js

// 函數用於執行POST請求
function performPost(url, data, cookieString) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString
    },
    body: data,
    credentials: 'include'
  })
    .then(response => response.json());
}

// 函數用於執行GET請求
function performGet(url, cookieString) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': cookieString
    },
    credentials: 'include'
  })
    .then(response => {
      return response.json()
    });
}


function sendMsgToContentScript(request) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getToParam", data: request }, function (response) {
      // console.log("response: " + JSON.stringify(response))
    });
  });
  // const ret = chrome.tabs.sendMessage(tabs[0].id, {from: 'ping-ping from background'});
  // console.log('receive', ret);
}


// 監聽來自popup或content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("request: " + JSON.stringify(request))
  if (request.action === "performRequests") {
    shouldAbort = false;
    const { url, data, pageUrl } = request;

    if (!pageUrl) {
      sendResponse({ success: false, error: "Page URL not provided" });
      return;
    }

    let parsedPageUrl;
    try {
      parsedPageUrl = new URL(pageUrl);
    } catch (error) {
      sendResponse({ success: false, error: "Invalid page URL provided" });
      return;
    }

    // 獲取當前域名的cookies
    chrome.cookies.getAll({ domain: parsedPageUrl.hostname }, function (cookies) {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: "Error getting cookies: " + chrome.runtime.lastError.message });
        return;
      }

      const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
      // console.log("performRequests : url: " + url + " data: " + data)

      function recursivePost(url, data, cookieString, attemptCount = 1) {
        console.log("recursivePost : attemptCount: " + attemptCount)

        if (shouldAbort) {
          sendResponse({ success: false, error: "Operation aborted, attemptCount: " + attemptCount});
          return;
        }

        // 執行POST請求
        performPost(url, data, cookieString)
          .then(postData => {
            if (shouldAbort) {
              throw new Error("Operation aborted");
            }
            // 在錯誤響應中包含嘗試次數
            var log = "recursivePost : attemptCount: " + attemptCount + ", postData: " + JSON.stringify(postData)
            console.log(log)

            sendMessageToPopup({
              type: "postUpdate",
              data: log
            });
            // sendResponse({ success: false, error: JSON.stringify(postData) + " attemptCount: " + attemptCount });
            if (postData && typeof postData === 'object' && 'token' in postData) {
              const token = postData.token;
              // 執行GET請求
              const getUrl = `https://queue.kktix.com/queue/token/${token}`;
              return performGet(getUrl, cookieString).then(getData => ({ postData, getData }));
            } else if (postData && typeof postData === 'object' && 'result' in postData && (postData.result === 'event_not_yet_start' || postData.result === 'TICKET_SOLD_OUT')) {
              // Wait for a short time before retrying
              return new Promise(resolve => setTimeout(resolve, 500))
              .then(() => recursivePost(url, data, cookieString, attemptCount + 1));
            } else {
              throw new Error('No token found in the response. ' + JSON.stringify(postData));
            }
          })
          .then(({ postData, getData }) => {
            // Define a recursive function to perform GET requests
            function recursiveGet(token, cookieString, retryCount = 0, maxRetries = 100) {
              if (retryCount >= maxRetries) {
                throw new Error('Max retries reached without finding to_param');
              }

              if (shouldAbort) {
                throw new Error("Operation aborted");
              }
              const getUrl = `https://queue.kktix.com/queue/token/${token}`;
              return performGet(getUrl, cookieString)
                .then(newGetData => {
                  if ('to_param' in newGetData) {
                    return newGetData;
                  } else if ('result' in newGetData && newGetData.result === 'not_found') {
                    // Wait for a short time before retrying
                    return new Promise(resolve => setTimeout(resolve, 500))
                      .then(() => recursiveGet(token, cookieString, retryCount + 1, maxRetries));
                  } else {
                    throw new Error('Unexpected response format');
                  }
                });
            }

            // Start the recursive GET process
            return recursiveGet(postData.token, cookieString)
              .then(finalGetData => {
                console.log("finalGetData: " + JSON.stringify(finalGetData))
                sendResponse({ success: true, postData: postData, getData: finalGetData });
                sendMsgToContentScript(finalGetData)
              })
              .catch(error => {
                sendResponse({ success: false, error: error.toString() + " attemptCount: " + attemptCount });
              });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.toString() + " attemptCount: " + attemptCount });
          });
      }

      // 初始調用時使用默認的嘗試次數 1
      recursivePost(url, data, cookieString);

    });

    // 表示我們將異步發送回應
    return true;
  } else if (request.action === "abortOperation") {
    console.log("abortOperation")
    shouldAbort = true;
    sendResponse({ success: true, message: "Abort signal received" });
  }
});

let popupPort;

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "popup") {
    popupPort = port;
    port.onDisconnect.addListener(function() {
      popupPort = null;
    });
  }
});

// 用於向popup發送消息的函數
function sendMessageToPopup(message) {
  if (popupPort) {
    popupPort.postMessage(message);
  }
}