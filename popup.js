
document.getElementById('postForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const url = document.getElementById('url').value;
    const data = document.getElementById('data').value;
  
    // 獲取當前標籤頁的URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const pageUrl = tabs[0].url;
      
      // 發送消息到background script
      chrome.runtime.sendMessage({
        action: "performRequests",
        url: url,
        data: data,
        pageUrl: pageUrl
      }, function(response) {
        console.log("response.getData : " + JSON.stringify(response.getData))
        if (response.success) {
          document.getElementById('result').innerText = 'POST response: ' + JSON.stringify(response.postData) + '\n\nGET response: ' + JSON.stringify(response.getData);
        } else {
          document.getElementById('result').innerText = 'Error: ' + response.error;
        }
      });
    });
  });
