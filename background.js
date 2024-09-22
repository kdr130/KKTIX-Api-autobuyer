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
    .then(response => response.json());
  }
  
  // 監聽來自popup或content script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "performRequests") {
      const { url, data, pageUrl } = request;
  
      if (!pageUrl) {
        sendResponse({success: false, error: "Page URL not provided"});
        return;
      }
  
      let parsedPageUrl;
      try {
        parsedPageUrl = new URL(pageUrl);
      } catch (error) {
        sendResponse({success: false, error: "Invalid page URL provided"});
        return;
      }
  
      // 獲取當前域名的cookies
      chrome.cookies.getAll({domain: parsedPageUrl.hostname}, function(cookies) {
        if (chrome.runtime.lastError) {
          sendResponse({success: false, error: "Error getting cookies: " + chrome.runtime.lastError.message});
          return;
        }
  
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  
        // 執行POST請求
        performPost(url, data, cookieString)
          .then(postData => {
            if (postData && typeof postData === 'object' && 'token' in postData) {
              const token = postData.token;
              // 執行GET請求
              const getUrl = `https://queue.kktix.com/queue/token/${token}`;
              return performGet(getUrl, cookieString).then(getData => ({postData, getData}));
            } else {
              throw new Error('No token found in the response.');
            }
          })
          .then(({postData, getData}) => {
            // 將結果發送回popup或content script
            sendResponse({success: true, postData: postData, getData: getData});
          })
          .catch(error => {
            sendResponse({success: false, error: error.toString()});
          });
      });
  
      // 表示我們將異步發送回應
      return true;
    }
  });